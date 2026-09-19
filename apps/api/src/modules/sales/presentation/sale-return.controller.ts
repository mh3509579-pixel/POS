import { Request, Response, NextFunction } from 'express';
import { SaleReturnRepository } from '../infrastructure/sale-return.repository.js';
import { SaleRepository } from '../infrastructure/sale.repository.js';

const saleReturnRepo = new SaleReturnRepository();
const saleRepo = new SaleRepository();

export async function createSaleReturn(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.userId || 1;
    const { sale_id, items, refund_method, reason, customer_id } = req.body;

    if (!sale_id || !items || !items.length || !refund_method) {
      res.status(400).json({
        status: 'error',
        message: 'sale_id, items, and refund_method are required',
      });
      return;
    }

    const sale = await saleRepo.findById(sale_id);
    if (!sale) {
      res.status(404).json({ status: 'error', message: 'Sale not found' });
      return;
    }

    for (const item of items) {
      const saleItem = sale.items.find(
        (si: any) => si.id === item.sale_item_id
      );
      if (!saleItem) {
        res.status(400).json({
          status: 'error',
          message: `Sale item ${item.sale_item_id} not found in sale`,
        });
        return;
      }
      if (item.quantity > saleItem.quantity) {
        res.status(400).json({
          status: 'error',
          message: `Return quantity exceeds original quantity for item ${item.sale_item_id}`,
        });
        return;
      }
    }

    const saleReturn = await saleReturnRepo.create(
      {
        sale_id,
        customer_id: customer_id ?? sale.customer_id,
        items,
        refund_method,
        reason,
      },
      userId
    );

    res.status(201).json({ status: 'success', data: saleReturn });
  } catch (error) {
    next(error);
  }
}

export async function getAllSaleReturns(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
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
