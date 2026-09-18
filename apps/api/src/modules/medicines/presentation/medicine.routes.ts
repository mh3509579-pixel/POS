import { Router } from 'express';
import {
  getAllMedicines,
  getMedicineById,
  getMedicineByBarcode,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getMedicineBatches,
  createBatch,
  updateBatch,
  getExpiringBatches,
  getLowStockMedicines,
  getAllCategories,
  getAllManufacturers,
  getAllUnits,
  searchForPOS,
  updateStock,
} from './medicine.controller.js';
import { authenticate, authorize } from '../../../infrastructure/middleware/auth.middleware.js';

const router = Router();

// POS search (no auth needed for quick lookup)
router.get('/pos/search', searchForPOS);

// Static routes BEFORE /:id to avoid shadowing
router.get('/low-stock', authenticate, authorize('medicines.view'), getLowStockMedicines);
router.get('/expiring', authenticate, authorize('medicines.view'), getExpiringBatches);
router.get('/barcode/:barcode', authenticate, authorize('medicines.view'), getMedicineByBarcode);

// Lookup tables BEFORE /:id
router.get('/lookups/categories', authenticate, getAllCategories);
router.get('/lookups/manufacturers', authenticate, getAllManufacturers);
router.get('/lookups/units', authenticate, getAllUnits);

// Medicine CRUD
router.get('/', authenticate, authorize('medicines.view'), getAllMedicines);
router.get('/:id', authenticate, authorize('medicines.view'), getMedicineById);
router.post('/', authenticate, authorize('medicines.create'), createMedicine);
router.put('/:id', authenticate, authorize('medicines.update'), updateMedicine);
router.delete('/:id', authenticate, authorize('medicines.delete'), deleteMedicine);

// Stock update
router.post('/:id/stock-update', authenticate, updateStock);

// Batch management
router.get('/:id/batches', authenticate, authorize('medicines.view'), getMedicineBatches);
router.post('/:id/batches', authenticate, authorize('inventory.batch.manage'), createBatch);
router.put('/batches/:batchId', authenticate, authorize('inventory.batch.manage'), updateBatch);

export { router as medicinesRoutes };
