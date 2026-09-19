import { Router, Request, Response } from 'express';
import { authenticate } from '../../../infrastructure/middleware/auth.middleware.js';
import { getPool } from '../../../infrastructure/database/connection.js';

const router = Router();
router.use(authenticate);

router.get('/reports/sales', async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const { start_date, end_date } = req.query;
    const startDate = start_date ? new Date(start_date as string) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = end_date ? new Date(end_date as string) : new Date();

    const [summary] = await pool.query(
      `SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(discount_amount), 0) as total_discount,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(AVG(total_amount), 0) as avg_sale_value
       FROM sales WHERE created_at BETWEEN ? AND ? AND status = 'completed'`,
      [startDate, endDate]
    ) as any[];

    const [dailySales] = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count, SUM(total_amount) as amount
       FROM sales WHERE created_at BETWEEN ? AND ? AND status = 'completed'
       GROUP BY DATE(created_at) ORDER BY date`,
      [startDate, endDate]
    ) as any[];

    const [topMedicines] = await pool.query(
      `SELECT m.name, SUM(si.quantity) as total_qty, SUM(si.total) as total_amount
       FROM sale_items si
       JOIN medicines m ON si.medicine_id = m.id
       JOIN sales s ON si.sale_id = s.id
       WHERE s.created_at BETWEEN ? AND ? AND s.status = 'completed'
       GROUP BY si.medicine_id, m.name
       ORDER BY total_amount DESC LIMIT 10`,
      [startDate, endDate]
    ) as any[];

    const [paymentMethods] = await pool.query(
      `SELECT payment_method, COUNT(*) as count, SUM(total_amount) as amount
       FROM sales WHERE created_at BETWEEN ? AND ? AND status = 'completed'
       GROUP BY payment_method`,
      [startDate, endDate]
    ) as any[];

    res.json({
      status: 'success',
      data: {
        summary: summary[0],
        daily: dailySales,
        topMedicines,
        paymentMethods,
      },
    });
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to generate sales report' });
  }
});

router.get('/reports/purchases', async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const { start_date, end_date } = req.query;
    const startDate = start_date ? new Date(start_date as string) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = end_date ? new Date(end_date as string) : new Date();

    const [summary] = await pool.query(
      `SELECT 
        COUNT(*) as total_purchases,
        COALESCE(SUM(total_amount), 0) as total_cost,
        COALESCE(SUM(discount_amount), 0) as total_discount,
        COALESCE(SUM(tax_amount), 0) as total_tax
       FROM purchases WHERE created_at BETWEEN ? AND ? AND status = 'received'`,
      [startDate, endDate]
    ) as any[];

    const [dailyPurchases] = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count, SUM(total_amount) as amount
       FROM purchases WHERE created_at BETWEEN ? AND ? AND status = 'received'
       GROUP BY DATE(created_at) ORDER BY date`,
      [startDate, endDate]
    ) as any[];

    const [topSuppliers] = await pool.query(
      `SELECT s.name, COUNT(*) as order_count, SUM(p.total_amount) as total_amount
       FROM purchases p
       JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.created_at BETWEEN ? AND ? AND p.status = 'received'
       GROUP BY p.supplier_id, s.name
       ORDER BY total_amount DESC LIMIT 10`,
      [startDate, endDate]
    ) as any[];

    res.json({
      status: 'success',
      data: {
        summary: summary[0],
        daily: dailyPurchases,
        topSuppliers,
      },
    });
  } catch (error) {
    console.error('Purchase report error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to generate purchase report' });
  }
});

router.get('/reports/expenses', async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const { start_date, end_date } = req.query;
    const startDate = start_date ? new Date(start_date as string) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = end_date ? new Date(end_date as string) : new Date();

    const [summary] = await pool.query(
      `SELECT 
        COUNT(*) as total_expenses,
        COALESCE(SUM(amount), 0) as total_amount
       FROM expenses WHERE expense_date BETWEEN ? AND ? AND status = 'approved'`,
      [startDate, endDate]
    ) as any[];

    const [byCategory] = await pool.query(
      `SELECT ec.name as category_name, COALESCE(SUM(e.amount), 0) as amount, COUNT(*) as count
       FROM expenses e
       JOIN expense_categories ec ON e.category_id = ec.id
       WHERE e.expense_date BETWEEN ? AND ? AND e.status = 'approved'
       GROUP BY ec.id, ec.name ORDER BY amount DESC`,
      [startDate, endDate]
    ) as any[];

    const [dailyExpenses] = await pool.query(
      `SELECT DATE(expense_date) as date, SUM(amount) as amount
       FROM expenses WHERE expense_date BETWEEN ? AND ? AND status = 'approved'
       GROUP BY DATE(expense_date) ORDER BY date`,
      [startDate, endDate]
    ) as any[];

    res.json({
      status: 'success',
      data: {
        summary: summary[0],
        byCategory,
        daily: dailyExpenses,
      },
    });
  } catch (error) {
    console.error('Expense report error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to generate expense report' });
  }
});

router.get('/reports/profit-loss', async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const { start_date, end_date } = req.query;
    const startDate = start_date ? new Date(start_date as string) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = end_date ? new Date(end_date as string) : new Date();

    const [salesTotal] = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as revenue
       FROM sales WHERE created_at BETWEEN ? AND ? AND status = 'completed'`,
      [startDate, endDate]
    ) as any[];

    const [cogsResult] = await pool.query(
      `SELECT COALESCE(SUM(si.quantity * mb.purchase_price), 0) as cogs
       FROM sale_items si
       JOIN medicine_batches mb ON si.batch_id = mb.id
       JOIN sales s ON si.sale_id = s.id
       WHERE s.created_at BETWEEN ? AND ? AND s.status = 'completed'`,
      [startDate, endDate]
    ) as any[];

    const [expensesTotal] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_expenses
       FROM expenses WHERE expense_date BETWEEN ? AND ? AND status = 'approved'`,
      [startDate, endDate]
    ) as any[];

    const revenue = Number((salesTotal as any[])[0]?.revenue || 0);
    const cogs = Number((cogsResult as any[])[0]?.cogs || 0);
    const totalExpenses = Number((expensesTotal as any[])[0]?.total_expenses || 0);
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    res.json({
      status: 'success',
      data: {
        revenue,
        cogs,
        grossProfit,
        totalExpenses,
        netProfit,
        profitMargin,
      },
    });
  } catch (error) {
    console.error('P&L report error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to generate P&L report' });
  }
});

export { router as reportsRoutes };
