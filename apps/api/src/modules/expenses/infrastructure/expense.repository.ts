import { Expense, ExpenseCategory, CreateExpenseDTO, CreateExpenseCategoryDTO, ExpenseWithCategory } from '../domain/expense.entity.js';
import { query, queryOne, execute, beginTransaction, commitTransaction, rollbackTransaction } from '../../../infrastructure/database/connection.js';

export class ExpenseRepository {
  async findById(id: number): Promise<ExpenseWithCategory | null> {
    const expense = await queryOne<any>(
      `SELECT e.*, ec.name as category_name
       FROM expenses e
       LEFT JOIN expense_categories ec ON e.category_id = ec.id
       WHERE e.id = ?`,
      [id]
    );
    return expense || null;
  }

  async findByExpenseNumber(expenseNumber: string): Promise<ExpenseWithCategory | null> {
    const expense = await queryOne<any>(
      `SELECT e.*, ec.name as category_name
       FROM expenses e
       LEFT JOIN expense_categories ec ON e.category_id = ec.id
       WHERE e.expense_number = ?`,
      [expenseNumber]
    );
    return expense || null;
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<ExpenseWithCategory[]> {
    return query<any[]>(
      `SELECT e.*, ec.name as category_name
       FROM expenses e
       LEFT JOIN expense_categories ec ON e.category_id = ec.id
       ORDER BY e.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<ExpenseWithCategory[]> {
    return query<any[]>(
      `SELECT e.*, ec.name as category_name
       FROM expenses e
       LEFT JOIN expense_categories ec ON e.category_id = ec.id
       WHERE e.expense_date BETWEEN ? AND ? ORDER BY e.expense_date DESC`,
      [startDate, endDate]
    );
  }

  async findByCategory(categoryId: number): Promise<ExpenseWithCategory[]> {
    return query<any[]>(
      `SELECT e.*, ec.name as category_name
       FROM expenses e
       LEFT JOIN expense_categories ec ON e.category_id = ec.id
       WHERE e.category_id = ? ORDER BY e.created_at DESC`,
      [categoryId]
    );
  }

  async count(): Promise<number> {
    const result = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM expenses');
    return result?.count || 0;
  }

  async create(data: CreateExpenseDTO, userId: number): Promise<ExpenseWithCategory> {
    const expenseNumber = await this.getNextExpenseNumber();

    const result = await execute(
      `INSERT INTO expenses (expense_number, category_id, user_id, amount, description, expense_date, payment_method, reference_number, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?)`,
      [
        expenseNumber,
        data.category_id,
        userId,
        data.amount,
        data.description,
        data.expense_date,
        data.payment_method,
        data.receipt_number || null,
        data.notes || null,
      ]
    );

    return this.findById(result.insertId) as Promise<ExpenseWithCategory>;
  }

  async updateStatus(id: number, status: string): Promise<Expense | null> {
    await execute('UPDATE expenses SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
    return queryOne<Expense>('SELECT * FROM expenses WHERE id = ?', [id]);
  }

  async getNextExpenseNumber(): Promise<string> {
    const last = await queryOne<{ expense_number: string }>(
      "SELECT expense_number FROM expenses ORDER BY id DESC LIMIT 1"
    );

    if (!last) {
      return 'EXP-2026-000001';
    }

    const parts = last.expense_number.split('-');
    const year = parts[1];
    const seq = parseInt(parts[2]) + 1;
    return `EXP-${year}-${String(seq).padStart(6, '0')}`;
  }

  async getDailyExpenses(date: Date): Promise<{ total_expenses: number; total_amount: number }> {
    const result = await queryOne<{ total_expenses: number; total_amount: number }>(
      `SELECT COUNT(*) as total_expenses, COALESCE(SUM(amount), 0) as total_amount 
       FROM expenses WHERE DATE(expense_date) = ? AND status = 'approved'`,
      [date]
    );
    return result || { total_expenses: 0, total_amount: 0 };
  }

  async getExpensesSummary(startDate: Date, endDate: Date): Promise<{
    total_expenses: number;
    total_amount: number;
    by_category: { category_name: string; amount: number }[];
  }> {
    const result = await queryOne<{
      total_expenses: number;
      total_amount: number;
    }>(
      `SELECT 
        COUNT(*) as total_expenses,
        COALESCE(SUM(amount), 0) as total_amount
       FROM expenses 
       WHERE expense_date BETWEEN ? AND ? AND status = 'approved'`,
      [startDate, endDate]
    );

    const byCategory = await query<{ category_name: string; amount: number }[]>(
      `SELECT 
        ec.name as category_name,
        COALESCE(SUM(e.amount), 0) as amount
       FROM expense_categories ec
       LEFT JOIN expenses e ON ec.id = e.category_id 
         AND e.expense_date BETWEEN ? AND ? 
         AND e.status = 'approved'
       GROUP BY ec.id, ec.name
       HAVING amount > 0
       ORDER BY amount DESC`,
      [startDate, endDate]
    );

    return {
      total_expenses: result?.total_expenses || 0,
      total_amount: result?.total_amount || 0,
      by_category: byCategory,
    };
  }

  async getAllCategories(): Promise<ExpenseCategory[]> {
    return query<ExpenseCategory[]>('SELECT * FROM expense_categories ORDER BY name');
  }

  async createCategory(data: CreateExpenseCategoryDTO): Promise<ExpenseCategory> {
    const result = await execute(
      'INSERT INTO expense_categories (name, description) VALUES (?, ?)',
      [data.name, data.description || null]
    );
    const category = await queryOne<ExpenseCategory>('SELECT * FROM expense_categories WHERE id = ?', [result.insertId]);
    if (!category) {
      throw new Error('Failed to create expense category');
    }
    return category;
  }
}
