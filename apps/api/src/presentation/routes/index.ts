import { Router } from 'express';
import { healthRoutes } from './health.routes.js';
import { accountingRoutes } from '../../modules/accounting/presentation/accounting.routes.js';
import { salesRoutes } from '../../modules/sales/presentation/sale.routes.js';
import { purchasesRoutes } from '../../modules/purchases/presentation/purchase.routes.js';
import { expensesRoutes } from '../../modules/expenses/presentation/expense.routes.js';
import { authRoutes } from '../../modules/users/presentation/auth.routes.js';
import { medicinesRoutes } from '../../modules/medicines/presentation/medicine.routes.js';
import { customersRoutes } from '../../modules/customers/presentation/customer.routes.js';
import { suppliersRoutes } from '../../modules/suppliers/presentation/supplier.routes.js';
import { backupRoutes } from '../../modules/backup/presentation/backup.routes.js';
import { notificationRoutes } from '../../modules/notifications/presentation/notification.routes.js';
import { demoRoutes } from './demo.routes.js';

const routes = Router();

routes.use(healthRoutes);
routes.use('/demo', demoRoutes);
routes.use('/auth', authRoutes);
routes.use('/medicines', medicinesRoutes);
routes.use('/customers', customersRoutes);
routes.use('/suppliers', suppliersRoutes);
routes.use('/accounting', accountingRoutes);
routes.use('/transactions', salesRoutes);
routes.use('/transactions', purchasesRoutes);
routes.use('/transactions', expensesRoutes);
routes.use('/backup', backupRoutes);
routes.use('/notifications', notificationRoutes);

export { routes };
