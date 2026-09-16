import { Router } from 'express';
import {
  createPurchase,
  getPurchaseById,
  getPurchaseByNumber,
  getAllPurchases,
  getDailyPurchases,
  getPurchasesSummary,
} from './purchase.controller.js';

const router = Router();

router.post('/purchases', createPurchase);
router.get('/purchases', getAllPurchases);
router.get('/purchases/daily', getDailyPurchases);
router.get('/purchases/summary', getPurchasesSummary);
router.get('/purchases/:id', getPurchaseById);
router.get('/purchases/number/:purchaseNumber', getPurchaseByNumber);

export { router as purchasesRoutes };
