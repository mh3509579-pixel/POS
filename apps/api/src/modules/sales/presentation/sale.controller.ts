import { Request, Response, NextFunction } from 'express';
import { SaleService } from '../application/sale.service.js';

const saleService = new SaleService();

export async function createSale(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.userId || 1;
    const sale = await saleService.createSale(req.body, userId);
    res.status(201).json({ status: 'success', data: sale });
  } catch (error) {
    next(error);
  }
}

export async function getSaleById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sale = await saleService.getSaleById(parseInt(req.params.id));
    if (!sale) {
      res.status(404).json({ status: 'error', message: 'Sale not found' });
      return;
    }
    res.json({ status: 'success', data: sale });
  } catch (error) {
    next(error);
  }
}

export async function getSaleByInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sale = await saleService.getSaleByInvoice(req.params.invoiceNumber);
    if (!sale) {
      res.status(404).json({ status: 'error', message: 'Sale not found' });
      return;
    }
    res.json({ status: 'success', data: sale });
  } catch (error) {
    next(error);
  }
}

export async function getAllSales(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const sales = await saleService.getAllSales(limit, offset);
    res.json({ status: 'success', data: sales });
  } catch (error) {
    next(error);
  }
}

export async function getDailySales(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = req.query.date ? new Date(req.query.date as string) : new Date();
    const summary = await saleService.getDailySales(date);
    res.json({ status: 'success', data: summary });
  } catch (error) {
    next(error);
  }
}

export async function getSalesSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { start_date, end_date } = req.query;
    const startDate = start_date ? new Date(start_date as string) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = end_date ? new Date(end_date as string) : new Date();
    const summary = await saleService.getSalesSummary(startDate, endDate);
    res.json({ status: 'success', data: summary });
  } catch (error) {
    next(error);
  }
}
