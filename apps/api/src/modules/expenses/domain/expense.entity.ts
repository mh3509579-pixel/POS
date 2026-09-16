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
  receipt_number: string | null;
  status: ExpenseStatus;
  approved_by: number | null;
  approved_at: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  description: string | null;
  account_id: number | null;
  is_active: boolean;
  created_at: Date;
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
  account_id?: number;
}

export interface ExpenseWithCategory extends Expense {
  category_name?: string;
  user_name?: string;
}
