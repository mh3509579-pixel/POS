import { Router } from 'express';
import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getTopSuppliers,
  getSupplierStats,
} from './supplier.controller.js';
import { authenticate, authorize } from '../../../infrastructure/middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, authorize('suppliers.view'), getAllSuppliers);
router.get('/stats', authenticate, authorize('suppliers.view'), getSupplierStats);
router.get('/top', authenticate, authorize('suppliers.view'), getTopSuppliers);
router.get('/:id', authenticate, authorize('suppliers.view'), getSupplierById);
router.post('/', authenticate, authorize('suppliers.create'), createSupplier);
router.put('/:id', authenticate, authorize('suppliers.update'), updateSupplier);
router.delete('/:id', authenticate, authorize('suppliers.delete'), deleteSupplier);

export { router as suppliersRoutes };
