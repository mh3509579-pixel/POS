import { Request, Response, NextFunction } from 'express';
import { PurchaseReturnRepository } from '../infrastructure/purchase-return.repository.js';
import { PurchaseRepository } from '../infrastructure/purchase.repository.js';

const purchaseReturnRepo = new PurchaseReturnRepository();
const purchaseRepo = new PurchaseRepository();

export async function createPurchaseReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.userId || 1;
    const { purchase_id, supplier_id, items, refund_method, reason } = req.body;

    if (!purchase_id || !items || !items.length || !refund_method) {
      res.status(400).json({ status: 'error', message: 'purchase_id, items, and refund_method are required' });
      return;
    }

    const purchase = await purchaseRepo.findById(purchase_id);
    if (!purchase) {
      res.status(404).json({ status: 'error', message: 'Purchase not found' });
      return;
    }

    for (const item of items) {
      const purchaseItem = purchase.items.find((pi) => pi.id === item.purchase_item_id);
      if (!purchaseItem) {
        res.status(400).json({ status: 'error', message: `Purchase item ${item.purchase_item_id} not found in purchase` });
        return;
      }
      if (item.quantity > purchaseItem.quantity) {
        res.status(400).json({ status: 'error', message: `Return quantity ${item.quantity} exceeds original quantity ${purchaseItem.quantity} for item ${item.purchase_item_id}` });
        return;
      }
    }

    const purchaseReturn = await purchaseReturnRepo.create({ purchase_id, supplier_id: supplier_id ?? purchase.supplier_id, items, refund_method, reason }, userId);
    res.status(201).json({ status: 'success', data: purchaseReturn });
  } catch (error) {
    next(error);
  }
}

export async function getAllPurchaseReturns(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const returns = await purchaseReturnRepo.findAll(limit, offset);
    res.json({ status: 'success', data: returns });
  } catch (error) {
    next(error);
  }
}

export async function getPurchaseReturnById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const purchaseReturn = await purchaseReturnRepo.findById(parseInt(req.params.id));
    if (!purchaseReturn) {
      res.status(404).json({ status: 'error', message: 'Purchase return not found' });
      return;
    }
    res.json({ status: 'success', data: purchaseReturn });
  } catch (error) {
    next(error);
  }
}

export async function getPurchaseReturnsByPurchaseId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const returns = await purchaseReturnRepo.findByPurchaseId(parseInt(req.params.purchaseId));
    res.json({ status: 'success', data: returns });
  } catch (error) {
    next(error);
  }
}
