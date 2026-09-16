import { Request, Response, NextFunction } from 'express';
import { ExpenseService } from '../application/expense.service.js';

const expenseService = new ExpenseService();

export async function createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.id || 1; // Default to 1 for now
    const expense = await expenseService.createExpense(req.body, userId);
    res.status(201).json({ status: 'success', data: expense });
  } catch (error) {
    next(error);
  }
}

export async function getExpenseById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const expense = await expenseService.getExpenseById(parseInt(req.params.id));
    if (!expense) {
      res.status(404).json({ status: 'error', message: 'Expense not found' });
      return;
    }
    res.json({ status: 'success', data: expense });
  } catch (error) {
    next(error);
  }
}

export async function getExpenseByNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const expense = await expenseService.getExpenseByNumber(req.params.expenseNumber);
    if (!expense) {
      res.status(404).json({ status: 'error', message: 'Expense not found' });
      return;
    }
    res.json({ status: 'success', data: expense });
  } catch (error) {
    next(error);
  }
}

export async function getAllExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const expenses = await expenseService.getAllExpenses(limit, offset);
    res.json({ status: 'success', data: expenses });
  } catch (error) {
    next(error);
  }
}

export async function getExpensesByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const expenses = await expenseService.getExpensesByCategory(parseInt(req.params.categoryId));
    res.json({ status: 'success', data: expenses });
  } catch (error) {
    next(error);
  }
}

export async function getDailyExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = req.query.date ? new Date(req.query.date as string) : new Date();
    const summary = await expenseService.getDailyExpenses(date);
    res.json({ status: 'success', data: summary });
  } catch (error) {
    next(error);
  }
}

export async function getExpensesSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { start_date, end_date } = req.query;
    const startDate = start_date ? new Date(start_date as string) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = end_date ? new Date(end_date as string) : new Date();
    const summary = await expenseService.getExpensesSummary(startDate, endDate);
    res.json({ status: 'success', data: summary });
  } catch (error) {
    next(error);
  }
}

export async function getAllCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await expenseService.getAllCategories();
    res.json({ status: 'success', data: categories });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = await expenseService.createCategory(req.body);
    res.status(201).json({ status: 'success', data: category });
  } catch (error) {
    next(error);
  }
}
