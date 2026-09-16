import { Router } from 'express';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getTopCustomers,
  getCustomerStats,
} from './customer.controller.js';
import { authenticate, authorize } from '../../../infrastructure/middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, authorize('customers.view'), getAllCustomers);
router.get('/stats', authenticate, authorize('customers.view'), getCustomerStats);
router.get('/top', authenticate, authorize('customers.view'), getTopCustomers);
router.get('/:id', authenticate, authorize('customers.view'), getCustomerById);
router.post('/', authenticate, authorize('customers.create'), createCustomer);
router.put('/:id', authenticate, authorize('customers.update'), updateCustomer);
router.delete('/:id', authenticate, authorize('customers.delete'), deleteCustomer);

export { router as customersRoutes };
