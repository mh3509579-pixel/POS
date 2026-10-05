import { Request, Response, NextFunction } from 'express';
import { SaleReturnRepository } from '../infrastructure/sale-return.repository.js';
import { SaleRepository } from '../infrastructure/sale.repository.js';
import { VALID_REFUND_METHODS, RefundMethod } from '../domain/sale-return.entity.js';
import { ValidationError } from '../domain/sale.rules.js';
import { parsePagination, requireUserId } from '../../../infrastructure/utils/pagination.js';

const saleReturnRepo = new SaleReturnRepository();
const saleRepo = new SaleRepository();

export async function createSaleReturn(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = requireUserId(req as any);
    const { sale_id, items, refund_method, reason, customer_id } = req.body;

    if (!sale_id || !Array.isArray(items) || !items.length || !refund_method) {
      res.status(400).json({
        status: 'error',
        message: 'sale_id, items, and refund_method are required',
      });
      return;
    }

    if (!VALID_REFUND_METHODS.includes(refund_method as RefundMethod)) {
      res.status(400).json({
        status: 'error',
        message: `refund_method must be one of: ${VALID_REFUND_METHODS.join(', ')}`,
      });
      return;
    }

    const sale = await saleRepo.findById(sale_id);
    if (!sale) {
      res.status(404).json({ status: 'error', message: 'Sale not found' });
      return;
    }

    // medicine_id / batch_id / unit_price are intentionally ignored here: the
    // repository re-reads them from sale_items so they cannot be spoofed.
    for (const item of items) {
      const saleItem = sale.items.find((si: any) => si.id === item.sale_item_id);
      if (!saleItem) {
        res.status(400).json({
          status: 'error',
          message: `Sale item ${item.sale_item_id} not found in sale`,
        });
        return;
      }
    }

    const saleReturn = await saleReturnRepo.create(
      {
        sale_id,
        customer_id: customer_id ?? sale.customer_id,
        items: items.map((item: any) => ({
          sale_item_id: item.sale_item_id,
          quantity: item.quantity,
        })),
        refund_method,
        reason,
      },
      userId
    );

    res.status(201).json({ status: 'success', data: saleReturn });
  } catch (error) {
    if (error instanceof ValidationError || (error as any)?.statusCode === 400) {
      res.status(400).json({ status: 'error', message: (error as Error).message });
      return;
    }
    next(error);
  }
}

export async function getAllSaleReturns(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { limit, offset } = parsePagination(req.query.limit, req.query.offset);
    const returns = await saleReturnRepo.findAll(limit, offset);
    res.json({ status: 'success', data: returns });
  } catch (error) {
    next(error);
  }
}

export async function getSaleReturnById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const saleReturn = await saleReturnRepo.findById(parseInt(req.params.id));
    if (!saleReturn) {
      res
        .status(404)
        .json({ status: 'error', message: 'Sale return not found' });
      return;
    }
    res.json({ status: 'success', data: saleReturn });
  } catch (error) {
    next(error);
  }
}

export async function getSaleReturnsBySaleId(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const saleId = parseInt(req.params.saleId);
    const returns = await saleReturnRepo.findBySaleId(saleId);
    res.json({ status: 'success', data: returns });
  } catch (error) {
    next(error);
  }
}
