import { Router } from 'express';
import {
  createSale,
  getSaleById,
  getSaleByInvoice,
  getAllSales,
  getDailySales,
  getSalesSummary,
} from './sale.controller.js';
import {
  createSaleReturn,
  getAllSaleReturns,
  getSaleReturnById,
  getSaleReturnsBySaleId,
} from './sale-return.controller.js';
import { authenticate } from '../../../infrastructure/middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/sales', createSale);
router.get('/sales', getAllSales);
router.get('/sales/daily', getDailySales);
router.get('/sales/summary', getSalesSummary);
router.get('/sales/invoice/:invoiceNumber', getSaleByInvoice);

router.post('/sales/returns', createSaleReturn);
router.get('/sales/returns', getAllSaleReturns);
router.get('/sales/returns/sale/:saleId', getSaleReturnsBySaleId);
router.get('/sales/returns/:id', getSaleReturnById);

router.get('/sales/:id', getSaleById);

export { router as salesRoutes };
