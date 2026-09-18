// Expenses Domain Entities

export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface Expense {
  id: number;
  expense_number: string;
  category_id: number;
  user_id: number;
  amount: number;
  description: string;
  expense_date: Date;
  payment_method: 'cash' | 'card' | 'bank_transfer';
  reference_number: string | null;
  receipt_path: string | null;
  status: ExpenseStatus;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  description: string | null;
  budget_limit: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateExpenseDTO {
  category_id: number;
  amount: number;
  description: string;
  expense_date: Date;
  payment_method: 'cash' | 'card' | 'bank_transfer';
  receipt_number?: string;
  notes?: string;
}

export interface CreateExpenseCategoryDTO {
  name: string;
  description?: string;
}

export interface ExpenseWithCategory extends Expense {
  category_name?: string;
  user_name?: string;
}
