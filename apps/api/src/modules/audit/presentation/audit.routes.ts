import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../../../infrastructure/middleware/auth.middleware.js';
import { getPool } from '../../../infrastructure/database/connection.js';

const router = Router();
router.use(authenticate);
router.use(authorize('audit.view'));

const MAX_PAGE_SIZE = 200;

function clampPaging(rawLimit: unknown, rawOffset: unknown): { limit: number; offset: number } {
  const parsedLimit = Number.parseInt(String(rawLimit ?? '50'), 10);
  const parsedOffset = Number.parseInt(String(rawOffset ?? '0'), 10);
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, MAX_PAGE_SIZE) : 50;
  const offset = Number.isFinite(parsedOffset) && parsedOffset > 0 ? parsedOffset : 0;
  return { limit, offset };
}

router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const { action, entity_type, user_id, start_date, end_date } = req.query;
    const { limit, offset } = clampPaging(req.query.limit, req.query.offset);

    const conditions: string[] = [];
    const params: any[] = [];

    if (action) { conditions.push('al.action = ?'); params.push(action); }
    if (entity_type) { conditions.push('al.entity_type = ?'); params.push(entity_type); }
    if (user_id) { conditions.push('al.user_id = ?'); params.push(user_id); }
    if (start_date) { conditions.push('al.created_at >= ?'); params.push(start_date); }
    if (end_date) { conditions.push('al.created_at <= ?'); params.push(end_date); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Built explicitly rather than by rewriting the SELECT list with a regex:
    // the original `query.replace(/SELECT .* FROM/, ...)` never matched because
    // the select list spans multiple lines, so `total` was always 0.
    const countSql = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${where}
    `;

    const dataSql = `
      SELECT al.*, u.full_name as user_name, u.username
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${where}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [countResult] = (await pool.query(countSql, params)) as any[];
    const total = Number(countResult?.[0]?.total ?? 0);

    const [rows] = (await pool.query(dataSql, [...params, limit, offset])) as any[];
    res.json({ status: 'success', data: rows, total, limit, offset });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch audit logs' });
  }
});

router.get('/audit-logs/stats', async (_req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const [totalResult] = (await pool.query('SELECT COUNT(*) as total FROM audit_logs')) as any[];
    const [todayResult] = (await pool.query(
      'SELECT COUNT(*) as count FROM audit_logs WHERE DATE(created_at) = CURDATE()'
    )) as any[];
    // logAudit always writes lowercase actions, and login failures were never
    // recorded at all, so the previous uppercase list never matched anything.
    const [failedResult] = (await pool.query(
      "SELECT COUNT(*) as count FROM audit_logs WHERE LOWER(action) IN ('failed_login', 'error', 'delete')"
    )) as any[];

    res.json({
      status: 'success',
      data: {
        total: Number(totalResult?.[0]?.total ?? 0),
        today: Number(todayResult?.[0]?.count ?? 0),
        failed: Number(failedResult?.[0]?.count ?? 0),
      },
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch audit stats' });
  }
});

export { router as auditRoutes };