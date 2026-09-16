import { Router } from 'express';
import {
  createSale,
  getSaleById,
  getSaleByInvoice,
  getAllSales,
  getDailySales,
  getSalesSummary,
} from './sale.controller.js';

const router = Router();

router.post('/sales', createSale);
router.get('/sales', getAllSales);
router.get('/sales/daily', getDailySales);
router.get('/sales/summary', getSalesSummary);
router.get('/sales/:id', getSaleById);
router.get('/sales/invoice/:invoiceNumber', getSaleByInvoice);

export { router as salesRoutes };
