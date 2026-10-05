import { Router, Request, Response } from 'express';
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
import { authenticate, authorize } from '../../../infrastructure/middleware/auth.middleware.js';
import { withTransaction } from '../../../infrastructure/database/connection.js';
import { ConflictError } from '../../sales/domain/sale.rules.js';
import { requireUserId } from '../../../infrastructure/utils/pagination.js';

const router = Router();

router.use(authenticate);

router.post('/purchases', authorize('purchases.create'), createPurchase);
router.get('/purchases', authorize('purchases.view'), getAllPurchases);
router.get('/purchases/daily', authorize('purchases.view'), getDailyPurchases);
router.get('/purchases/summary', authorize('purchases.view'), getPurchasesSummary);

router.post('/purchases/returns', authorize('purchases.return.create'), createPurchaseReturn);
router.get('/purchases/returns', authorize('purchases.view'), getAllPurchaseReturns);
router.get(
  '/purchases/returns/purchase/:purchaseId',
  authorize('purchases.view'),
  getPurchaseReturnsByPurchaseId
);
router.get('/purchases/returns/:id', authorize('purchases.view'), getPurchaseReturnById);

router.get('/purchases/:id', authorize('purchases.view'), getPurchaseById);
router.get('/purchases/number/:purchaseNumber', authorize('purchases.view'), getPurchaseByNumber);

router.put('/purchases/:id/receive', authorize('purchases.update'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ status: 'error', message: 'Invalid purchase id' });
    return;
  }

  try {
    const userId = requireUserId(req);
    await withTransaction(async (tx) => {
      const purchase = await tx.queryOne<{
        id: number;
        supplier_id: number;
        status: string;
      }>('SELECT id, supplier_id, status FROM purchases WHERE id = ? FOR UPDATE', [id]);

      if (!purchase) {
        throw Object.assign(new Error('Purchase not found'), { statusCode: 404 });
      }

      // createPurchase already receives stock and stamps status='received'.
      // Re-adding the quantities here inflated stock on every retry.
      if (purchase.status === 'received') {
        throw new ConflictError(`Purchase ${id} has already been received`);
      }

      if (purchase.status === 'cancelled') {
        throw new ConflictError(`Purchase ${id} is cancelled and cannot be received`);
      }

      await tx.execute("UPDATE purchases SET status = 'received', updated_at = NOW() WHERE id = ?", [id]);

      const items = await tx.query<any[]>(
        'SELECT * FROM purchase_items WHERE purchase_id = ?',
        [id]
      );

      for (const item of items) {
        let batchId: number | null = item.batch_id ?? null;

        if (!batchId) {
          const existingBatch = await tx.queryOne<{ id: number }>(
            'SELECT id FROM medicine_batches WHERE medicine_id = ? AND batch_number = ? FOR UPDATE',
            [item.medicine_id, item.batch_number]
          );

          if (existingBatch) {
            batchId = existingBatch.id;
            await tx.execute(
              'UPDATE medicine_batches SET quantity = quantity + ? WHERE id = ?',
              [item.quantity, batchId]
            );
          } else {
            if (!item.expiry_date) {
              throw new ConflictError(
                `Purchase item ${item.id} has no expiry date; refusing to receive stock`
              );
            }
            const created = await tx.execute(
              `INSERT INTO medicine_batches (medicine_id, batch_number, expiry_date, purchase_price, sale_price, quantity, supplier_id)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                item.medicine_id,
                item.batch_number,
                item.expiry_date,
                item.purchase_price,
                item.sale_price,
                item.quantity,
                purchase.supplier_id,
              ]
            );
            batchId = created.insertId;
          }

          await tx.execute(
            'UPDATE purchase_items SET batch_id = ? WHERE id = ?',
            [batchId, item.id]
          );
        }

        await tx.execute(
          `INSERT INTO stock_movements (medicine_id, batch_id, movement_type, quantity, reference_type, reference_id, user_id)
           VALUES (?, ?, 'purchase', ?, 'purchase', ?, ?)`,
          [item.medicine_id, batchId, item.quantity, id, userId]
        );
      }
    });

    res.json({ status: 'success', message: 'Purchase received successfully' });
  } catch (error) {
    const statusCode = (error as any)?.statusCode;
    if (statusCode === 404 || statusCode === 409 || (error as any)?.name === 'ConflictError') {
      res.status(statusCode || 409).json({ status: 'error', message: (error as Error).message });
      return;
    }
    console.error('Receive purchase error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to receive purchase' });
  }
});

router.put('/purchases/:id/cancel', authorize('purchases.update'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ status: 'error', message: 'Invalid purchase id' });
    return;
  }

  try {
    const result = await withTransaction(async (tx) => {
      const purchase = await tx.queryOne<{ status: string }>(
        'SELECT status FROM purchases WHERE id = ? FOR UPDATE',
        [id]
      );

      if (!purchase) {
        throw Object.assign(new Error('Purchase not found'), { statusCode: 404 });
      }

      if (purchase.status === 'cancelled') {
        throw new ConflictError(`Purchase ${id} is already cancelled`);
      }

      return tx.execute("UPDATE purchases SET status = 'cancelled', updated_at = NOW() WHERE id = ?", [id]);
    });

    res.json({ status: 'success', message: 'Purchase cancelled successfully' });
  } catch (error) {
    const statusCode = (error as any)?.statusCode;
    if (statusCode === 404 || (error as any)?.name === 'ConflictError') {
      res.status(statusCode || 409).json({ status: 'error', message: (error as Error).message });
      return;
    }
    console.error('Cancel purchase error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to cancel purchase' });
  }
});

export { router as purchasesRoutes };