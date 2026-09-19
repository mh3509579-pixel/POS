import { Router } from 'express';
import {
  createPurchase,
  getPurchaseById,
  getPurchaseByNumber,
  getAllPurchases,
  getDailyPurchases,
  getPurchasesSummary,
} from './purchase.controller.js';
import {
  createPurchaseReturn,
  getAllPurchaseReturns,
  getPurchaseReturnById,
  getPurchaseReturnsByPurchaseId,
} from './purchase-return.controller.js';
import { authenticate } from '../../../infrastructure/middleware/auth.middleware.js';
import { getPool } from '../../../infrastructure/database/connection.js';
import { Request, Response } from 'express';

const router = Router();

router.use(authenticate);

router.post('/purchases', createPurchase);
router.get('/purchases', getAllPurchases);
router.get('/purchases/daily', getDailyPurchases);
router.get('/purchases/summary', getPurchasesSummary);

router.post('/purchases/returns', createPurchaseReturn);
router.get('/purchases/returns', getAllPurchaseReturns);
router.get('/purchases/returns/purchase/:purchaseId', getPurchaseReturnsByPurchaseId);
router.get('/purchases/returns/:id', getPurchaseReturnById);

router.get('/purchases/:id', getPurchaseById);
router.get('/purchases/number/:purchaseNumber', getPurchaseByNumber);

router.put('/purchases/:id/receive', async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    const [purchase] = await pool.query('SELECT * FROM purchases WHERE id = ?', [id]) as any[];
    if (!purchase.length) {
      res.status(404).json({ status: 'error', message: 'Purchase not found' });
      return;
    }

    await pool.query("UPDATE purchases SET status = 'received', updated_at = NOW() WHERE id = ?", [id]);

    const [items] = await pool.query('SELECT * FROM purchase_items WHERE purchase_id = ?', [id]) as any[];
    for (const item of items) {
      let [existingBatch] = await pool.query(
        'SELECT id FROM medicine_batches WHERE medicine_id = ? AND batch_number = ?',
        [item.medicine_id, item.batch_number || `PO-${id}`]
      ) as any[];

      let batchId: number;
      if (existingBatch.length) {
        await pool.query('UPDATE medicine_batches SET quantity = quantity + ? WHERE id = ?', [item.quantity, existingBatch[0].id]);
        batchId = existingBatch[0].id;
      } else {
        const [newBatch] = await pool.query(
          'INSERT INTO medicine_batches (medicine_id, batch_number, expiry_date, purchase_price, sale_price, quantity, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [item.medicine_id, item.batch_number || `PO-${id}`, item.expiry_date || '2027-12-31', item.purchase_price, item.sale_price, item.quantity, purchase[0].supplier_id]
        ) as any[];
        batchId = newBatch.insertId;
      }

      await pool.query(
        `INSERT INTO stock_movements (medicine_id, batch_id, movement_type, quantity, reference_type, reference_id, user_id)
         VALUES (?, ?, 'purchase', ?, 'purchase', ?, ?)`,
        [item.medicine_id, batchId, item.quantity, id, userId]
      );
    }

    res.json({ status: 'success', message: 'Purchase received successfully' });
  } catch (error) {
    console.error('Receive purchase error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to receive purchase' });
  }
});

router.put('/purchases/:id/cancel', async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const [purchase] = await pool.query('SELECT * FROM purchases WHERE id = ?', [id]) as any[];
    if (!purchase.length) {
      res.status(404).json({ status: 'error', message: 'Purchase not found' });
      return;
    }

    await pool.query("UPDATE purchases SET status = 'cancelled', updated_at = NOW() WHERE id = ?", [id]);
    res.json({ status: 'success', message: 'Purchase cancelled successfully' });
  } catch (error) {
    console.error('Cancel purchase error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to cancel purchase' });
  }
});

export { router as purchasesRoutes };
