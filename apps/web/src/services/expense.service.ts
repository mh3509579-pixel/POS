import api from './api.service';

export interface Expense {
  id: number;
  expense_number: string;
  category_id: number;
  amount: number;
  description: string;
  expense_date: string;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'online';
  receipt_number: string | null;
  notes: string | null;
  created_by: number;
  created_at: string;
  category_name?: string;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface CreateExpenseDTO {
  category_id: number;
  amount: number;
  description: string;
  expense_date: string;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'online';
  receipt_number?: string;
  notes?: string;
}

class ExpenseService {
  async getAll(limit = 50, offset = 0, filters?: {
    category_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<{ data: Expense[]; total: number }> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    const response = await api.get<{ status: string; data: Expense[]; total: number }>(
      `/transactions/expenses?${params.toString()}`
    );
    return { data: response.data.data, total: response.data.total };
  }

  async getById(id: number): Promise<Expense> {
    const response = await api.get<{ status: string; data: Expense }>(
      `/transactions/expenses/${id}`
    );
    return response.data.data;
  }

  async create(data: CreateExpenseDTO): Promise<Expense> {
    const response = await api.post<{ status: string; data: Expense }>(
      '/transactions/expenses',
      data
    );
    return response.data.data;
  }

  async update(id: number, data: Partial<CreateExpenseDTO>): Promise<Expense> {
    const response = await api.put<{ status: string; data: Expense }>(
      `/transactions/expenses/${id}`,
      data
    );
    return response.data.data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`/transactions/expenses/${id}`);
  }

  async getCategories(): Promise<ExpenseCategory[]> {
    const response = await api.get<{ status: string; data: ExpenseCategory[] }>(
      '/transactions/expense-categories'
    );
    return response.data.data;
  }

  async getCategorySummary(startDate: string, endDate: string): Promise<any[]> {
    const response = await api.get<{ status: string; data: any[] }>(
      `/transactions/expenses/summary?start=${startDate}&end=${endDate}`
    );
    return response.data.data;
  }
}

export const expenseService = new ExpenseService();
