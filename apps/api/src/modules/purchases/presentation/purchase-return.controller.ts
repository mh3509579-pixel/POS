import { Request, Response, NextFunction } from 'express';
import { PurchaseReturnRepository } from '../infrastructure/purchase-return.repository.js';
import { PurchaseRepository } from '../infrastructure/purchase.repository.js';
import { VALID_REFUND_METHODS, RefundMethod } from '../domain/purchase-return.entity.js';
import { parsePagination, requireUserId } from '../../../infrastructure/utils/pagination.js';

const purchaseReturnRepo = new PurchaseReturnRepository();
const purchaseRepo = new PurchaseRepository();

export async function createPurchaseReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = requireUserId(req as any);
    const { purchase_id, supplier_id, items, refund_method, reason } = req.body;

    if (!purchase_id || !Array.isArray(items) || !items.length || !refund_method) {
      res.status(400).json({ status: 'error', message: 'purchase_id, items, and refund_method are required' });
      return;
    }

    if (!VALID_REFUND_METHODS.includes(refund_method as RefundMethod)) {
      res.status(400).json({
        status: 'error',
        message: `refund_method must be one of: ${VALID_REFUND_METHODS.join(', ')}`,
      });
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
    }

    const purchaseReturn = await purchaseReturnRepo.create(
      {
        purchase_id,
        supplier_id: supplier_id ?? purchase.supplier_id,
        items: items.map((item: any) => ({
          purchase_item_id: item.purchase_item_id,
          quantity: item.quantity,
        })),
        refund_method,
        reason,
      },
      userId
    );

    res.status(201).json({ status: 'success', data: purchaseReturn });
  } catch (error) {
    next(error);
  }
}

export async function getAllPurchaseReturns(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { limit, offset } = parsePagination(req.query.limit, req.query.offset);
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
