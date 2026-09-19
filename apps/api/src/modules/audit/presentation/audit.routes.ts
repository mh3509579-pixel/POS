import { Router, Request, Response } from 'express';
import { authenticate } from '../../../infrastructure/middleware/auth.middleware.js';
import { getPool } from '../../../infrastructure/database/connection.js';

const router = Router();
router.use(authenticate);

router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const { limit = 50, offset = 0, action, entity_type, user_id, start_date, end_date } = req.query;

    let query = `
      SELECT al.*, u.full_name as user_name, u.username
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (action) { query += ' AND al.action = ?'; params.push(action); }
    if (entity_type) { query += ' AND al.entity_type = ?'; params.push(entity_type); }
    if (user_id) { query += ' AND al.user_id = ?'; params.push(user_id); }
    if (start_date) { query += ' AND al.created_at >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND al.created_at <= ?'; params.push(end_date); }

    const countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await pool.query(countQuery, params) as any[];
    const total = countResult[0]?.total || 0;

    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params) as any[];
    res.json({ status: 'success', data: rows, total });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch audit logs' });
  }
});

router.get('/audit-logs/stats', async (_req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const [totalResult] = await pool.query('SELECT COUNT(*) as total FROM audit_logs') as any[];
    const [todayResult] = await pool.query(
      "SELECT COUNT(*) as count FROM audit_logs WHERE DATE(created_at) = CURDATE()"
    ) as any[];
    const [failedResult] = await pool.query(
      "SELECT COUNT(*) as count FROM audit_logs WHERE action IN ('FAILED_LOGIN', 'ERROR', 'DELETE')"
    ) as any[];

    res.json({
      status: 'success',
      data: {
        total: totalResult[0]?.total || 0,
        today: todayResult[0]?.count || 0,
        failed: failedResult[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch audit stats' });
  }
});

export { router as auditRoutes };
