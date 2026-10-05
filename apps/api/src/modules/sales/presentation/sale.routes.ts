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
import { authenticate, authorize } from '../../../infrastructure/middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/sales', authorize('sales.create', 'pos.sale.create'), createSale);
router.get('/sales', authorize('sales.view'), getAllSales);
router.get('/sales/daily', authorize('sales.view'), getDailySales);
router.get('/sales/summary', authorize('sales.view'), getSalesSummary);
router.get('/sales/invoice/:invoiceNumber', authorize('sales.view'), getSaleByInvoice);

router.post('/sales/returns', authorize('sales.return.create', 'pos.return.create'), createSaleReturn);
router.get('/sales/returns', authorize('sales.view'), getAllSaleReturns);
router.get('/sales/returns/sale/:saleId', authorize('sales.view'), getSaleReturnsBySaleId);
router.get('/sales/returns/:id', authorize('sales.view'), getSaleReturnById);

router.get('/sales/:id', authorize('sales.view'), getSaleById);

export { router as salesRoutes };
