import { Request, Response, NextFunction } from 'express';
import { PurchaseService } from '../application/purchase.service.js';

const purchaseService = new PurchaseService();

export async function createPurchase(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.id || 1; // Default to 1 for now
    const purchase = await purchaseService.createPurchase(req.body, userId);
    res.status(201).json({ status: 'success', data: purchase });
  } catch (error) {
    next(error);
  }
}

export async function getPurchaseById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const purchase = await purchaseService.getPurchaseById(parseInt(req.params.id));
    if (!purchase) {
      res.status(404).json({ status: 'error', message: 'Purchase not found' });
      return;
    }
    res.json({ status: 'success', data: purchase });
  } catch (error) {
    next(error);
  }
}

export async function getPurchaseByNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const purchase = await purchaseService.getPurchaseByNumber(req.params.purchaseNumber);
    if (!purchase) {
      res.status(404).json({ status: 'error', message: 'Purchase not found' });
      return;
    }
    res.json({ status: 'success', data: purchase });
  } catch (error) {
    next(error);
  }
}

export async function getAllPurchases(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const purchases = await purchaseService.getAllPurchases(limit, offset);
    res.json({ status: 'success', data: purchases });
  } catch (error) {
    next(error);
  }
}

export async function getDailyPurchases(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = req.query.date ? new Date(req.query.date as string) : new Date();
    const summary = await purchaseService.getDailyPurchases(date);
    res.json({ status: 'success', data: summary });
  } catch (error) {
    next(error);
  }
}

export async function getPurchasesSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { start_date, end_date } = req.query;
    const startDate = start_date ? new Date(start_date as string) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = end_date ? new Date(end_date as string) : new Date();
    const summary = await purchaseService.getPurchasesSummary(startDate, endDate);
    res.json({ status: 'success', data: summary });
  } catch (error) {
    next(error);
  }
}
