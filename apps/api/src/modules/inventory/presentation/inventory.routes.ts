import { Router, Request, Response } from 'express';
import { authenticate } from '../../../infrastructure/middleware/auth.middleware.js';
import { getPool } from '../../../infrastructure/database/connection.js';

const router = Router();
router.use(authenticate);

router.get('/movements', async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const { limit = 50, offset = 0, medicine_id, batch_id, movement_type, start_date, end_date } = req.query;
    let query = `
      SELECT sm.*, m.name as medicine_name, mb.batch_number,
             u.full_name as user_name
      FROM stock_movements sm
      JOIN medicines m ON sm.medicine_id = m.id
      JOIN medicine_batches mb ON sm.batch_id = mb.id
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (medicine_id) { query += ' AND sm.medicine_id = ?'; params.push(medicine_id); }
    if (batch_id) { query += ' AND sm.batch_id = ?'; params.push(batch_id); }
    if (movement_type) { query += ' AND sm.movement_type = ?'; params.push(movement_type); }
    if (start_date) { query += ' AND sm.movement_date >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND sm.movement_date <= ?'; params.push(end_date); }

    const countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await pool.query(countQuery, params) as any[];
    const total = countResult[0]?.total || 0;

    query += ' ORDER BY sm.movement_date DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params) as any[];
    res.json({ status: 'success', data: rows, total });
  } catch (error) {
    console.error('Get stock movements error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch stock movements' });
  }
});

router.get('/batches', async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const { medicine_id } = req.query;
    let query = `
      SELECT mb.*, m.name as medicine_name
      FROM medicine_batches mb
      JOIN medicines m ON mb.medicine_id = m.id
      WHERE mb.is_active = TRUE
    `;
    const params: any[] = [];

    if (medicine_id) { query += ' AND mb.medicine_id = ?'; params.push(medicine_id); }

    query += ' ORDER BY mb.expiry_date ASC';

    const [rows] = await pool.query(query, params) as any[];
    res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch batches' });
  }
});

router.post('/adjustments', async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const { medicine_id, batch_id, adjustment_type, quantity, reason } = req.body;
    const userId = (req as any).user?.userId;

    if (!medicine_id || !batch_id || !adjustment_type || quantity === undefined) {
      res.status(400).json({ status: 'error', message: 'Missing required fields' });
      return;
    }

    const quantityChange = adjustment_type === 'increase' ? Math.abs(quantity) : -Math.abs(quantity);

    await pool.query(
      'UPDATE medicine_batches SET quantity = quantity + ? WHERE id = ?',
      [quantityChange, batch_id]
    );

    await pool.query(
      `INSERT INTO stock_movements (medicine_id, batch_id, movement_type, quantity, reference_type, user_id, notes)
       VALUES (?, ?, 'adjustment', ?, 'adjustment', ?, ?)`,
      [medicine_id, batch_id, quantityChange, userId, reason || 'Stock adjustment']
    );

    res.json({ status: 'success', message: 'Stock adjusted successfully' });
  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to adjust stock' });
  }
});

export { router as inventoryRoutes };
