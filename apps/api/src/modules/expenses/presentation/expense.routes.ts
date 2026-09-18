import { Router } from 'express';
import {
  createExpense,
  getExpenseById,
  getExpenseByNumber,
  getAllExpenses,
  getExpensesByCategory,
  getDailyExpenses,
  getExpensesSummary,
  getAllCategories,
  createCategory,
} from './expense.controller.js';
import { authenticate } from '../../../infrastructure/middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Expense routes
router.post('/expenses', createExpense);
router.get('/expenses', getAllExpenses);
router.get('/expenses/daily', getDailyExpenses);
router.get('/expenses/summary', getExpensesSummary);
router.get('/expenses/:id', getExpenseById);
router.get('/expenses/number/:expenseNumber', getExpenseByNumber);
router.get('/expenses/category/:categoryId', getExpensesByCategory);

// Category routes
router.get('/expense-categories', getAllCategories);
router.post('/expense-categories', createCategory);

export { router as expensesRoutes };
