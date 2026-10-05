import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../../../infrastructure/middleware/auth.middleware.js';
import { getPool, withTransaction } from '../../../infrastructure/database/connection.js';
import { logAudit } from '../../../infrastructure/utils/audit-logger.js';
import { ValidationError, ConflictError } from '../../sales/domain/sale.rules.js';
import { requireUserId } from '../../../infrastructure/utils/pagination.js';

const router = Router();
router.use(authenticate);

const MAX_PAGE_SIZE = 200;

function clampPaging(rawLimit: unknown, rawOffset: unknown): { limit: number; offset: number } {
  const parsedLimit = Number.parseInt(String(rawLimit ?? '50'), 10);
  const parsedOffset = Number.parseInt(String(rawOffset ?? '0'), 10);

  // Number('abc') is NaN, and `LIMIT NaN` is a MySQL syntax error (500).
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, MAX_PAGE_SIZE) : 50;
  const offset = Number.isFinite(parsedOffset) && parsedOffset > 0 ? parsedOffset : 0;

  return { limit, offset };
}

router.get('/movements', authorize('inventory.view'), async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const { medicine_id, batch_id, movement_type, start_date, end_date } = req.query;
    const { limit, offset } = clampPaging(req.query.limit, req.query.offset);

    const conditions: string[] = [];
    const params: any[] = [];

    if (medicine_id) { conditions.push('sm.medicine_id = ?'); params.push(medicine_id); }
    if (batch_id) { conditions.push('sm.batch_id = ?'); params.push(batch_id); }
    if (movement_type) { conditions.push('sm.movement_type = ?'); params.push(movement_type); }
    if (start_date) { conditions.push('sm.movement_date >= ?'); params.push(start_date); }
    if (end_date) { conditions.push('sm.movement_date <= ?'); params.push(end_date); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // The count is built from its own FROM/WHERE rather than derived by
    // rewriting the SELECT list with a regex: the original
    // `query.replace(/SELECT .* FROM/, ...)` never matched because the select
    // list spans multiple lines and `.` does not match `\n`, so `total` was
    // always 0.
    const countSql = `
      SELECT COUNT(*) as total
      FROM stock_movements sm
      JOIN medicines m ON sm.medicine_id = m.id
      JOIN medicine_batches mb ON sm.batch_id = mb.id
      LEFT JOIN users u ON sm.user_id = u.id
      ${where}
    `;

    const dataSql = `
      SELECT sm.*, m.name as medicine_name, mb.batch_number,
             u.full_name as user_name
      FROM stock_movements sm
      JOIN medicines m ON sm.medicine_id = m.id
      JOIN medicine_batches mb ON sm.batch_id = mb.id
      LEFT JOIN users u ON sm.user_id = u.id
      ${where}
      ORDER BY sm.movement_date DESC
      LIMIT ? OFFSET ?
    `;

    const [countResult] = (await pool.query(countSql, params)) as any[];
    const total = Number(countResult?.[0]?.total ?? 0);

    const [rows] = (await pool.query(dataSql, [...params, limit, offset])) as any[];
    res.json({ status: 'success', data: rows, total, limit, offset });
  } catch (error) {
    console.error('Get stock movements error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch stock movements' });
  }
});

router.get('/batches', authorize('inventory.view'), async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const { medicine_id } = req.query;

    let sql = `
      SELECT mb.*, m.name as medicine_name
      FROM medicine_batches mb
      JOIN medicines m ON mb.medicine_id = m.id
      WHERE mb.is_active = TRUE
    `;
    const params: any[] = [];

    if (medicine_id) { sql += ' AND mb.medicine_id = ?'; params.push(medicine_id); }

    sql += ' ORDER BY mb.expiry_date ASC';

    const [rows] = (await pool.query(sql, params)) as any[];
    res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch batches' });
  }
});

router.post('/adjustments', authorize('inventory.adjust'), async (req: Request, res: Response) => {
  const ip = req.ip;
  const userAgent = req.get('user-agent');

  try {
    const userId = requireUserId(req);
    const { medicine_id, batch_id, adjustment_type, quantity, reason } = req.body;

    if (medicine_id === undefined || batch_id === undefined || quantity === undefined) {
      res.status(400).json({ status: 'error', message: 'medicine_id, batch_id, and quantity are required' });
      return;
    }

    // Previously anything that was not exactly the string 'increase' silently
    // *decreased* stock, including typos and empty values.
    const VALID_TYPES = ['increase', 'decrease'];
    if (!VALID_TYPES.includes(adjustment_type)) {
      res.status(400).json({
        status: 'error',
        message: `adjustment_type must be one of: ${VALID_TYPES.join(', ')}`,
      });
      return;
    }

    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      res.status(400).json({ status: 'error', message: 'quantity must be a number greater than zero' });
      return;
    }

    const medicineId = Number(medicine_id);
    const batchId = Number(batch_id);

    const quantityChange = adjustment_type === 'increase' ? parsedQuantity : -parsedQuantity;

    const batchIdResult = await withTransaction(async (tx) => {
      const batch = await tx.queryOne<{ id: number; medicine_id: number; quantity: number }>(
        'SELECT id, medicine_id, quantity FROM medicine_batches WHERE id = ? FOR UPDATE',
        [batchId]
      );

      if (!batch) {
        throw new ValidationError(`Batch ${batchId} not found`);
      }

      if (Number(batch.medicine_id) !== medicineId) {
        throw new ValidationError(`Batch ${batchId} does not belong to medicine ${medicineId}`);
      }

      // `quantity >= ?` prevents a decrease from driving stock negative, and
      // makes the guard atomic with respect to concurrent adjustments.
      const result = await tx.execute(
        'UPDATE medicine_batches SET quantity = quantity + ? WHERE id = ? AND quantity >= ?',
        [quantityChange, batchId, quantityChange < 0 ? -quantityChange : 0]
      );

      if (result.affectedRows === 0) {
        throw new ConflictError(
          `Cannot decrease stock for batch ${batchId}: only ${batch.quantity} in stock`
        );
      }

      await tx.execute(
        `INSERT INTO stock_movements (medicine_id, batch_id, movement_type, quantity, reference_type, user_id, notes)
         VALUES (?, ?, 'adjustment', ?, 'adjustment', ?, ?)`,
        [medicineId, batchId, quantityChange, userId, reason || 'Stock adjustment']
      );

      return batchId;
    });

    try {
      await logAudit({
        action: 'update',
        entity_type: 'medicine_batch',
        entity_id: batchIdResult,
        user_id: userId,
        new_values: { adjustment_type, quantity: quantityChange, reason },
        ip_address: ip,
        user_agent: userAgent,
      });
    } catch (auditError) {
      console.warn('[Stock adjustment] audit log failed:', auditError);
    }

    res.json({ status: 'success', message: 'Stock adjusted successfully' });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ status: 'error', message: error.message });
      return;
    }
    if (error instanceof ConflictError) {
      res.status(409).json({ status: 'error', message: error.message });
      return;
    }
    console.error('Adjust stock error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to adjust stock' });
  }
});

export { router as inventoryRoutes };