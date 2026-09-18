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
import { getPool } from '../../../infrastructure/database/connection.js';
import { Request, Response } from 'express';

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

router.put('/expenses/:id', async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const { category_id, amount, description, expense_date, payment_method, notes } = req.body;

    const [existing] = await pool.query('SELECT * FROM expenses WHERE id = ?', [id]) as any[];
    if (!existing.length) {
      res.status(404).json({ status: 'error', message: 'Expense not found' });
      return;
    }

    await pool.query(
      `UPDATE expenses SET category_id = ?, amount = ?, description = ?, expense_date = ?, payment_method = ?, notes = ?, updated_at = NOW() WHERE id = ?`,
      [category_id || existing[0].category_id, amount || existing[0].amount, description || existing[0].description, expense_date || existing[0].expense_date, payment_method || existing[0].payment_method, notes || existing[0].notes, id]
    );

    res.json({ status: 'success', message: 'Expense updated successfully' });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update expense' });
  }
});

router.delete('/expenses/:id', async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM expenses WHERE id = ?', [id]) as any[];
    if (!existing.length) {
      res.status(404).json({ status: 'error', message: 'Expense not found' });
      return;
    }

    await pool.query('DELETE FROM expenses WHERE id = ?', [id]);
    res.json({ status: 'success', message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete expense' });
  }
});

// Category routes
router.get('/expense-categories', getAllCategories);
router.post('/expense-categories', createCategory);

export { router as expensesRoutes };
