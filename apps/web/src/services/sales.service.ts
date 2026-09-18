import api from './api.service';

export interface Sale {
  id: number;
  invoice_number: string;
  customer_id: number | null;
  user_id: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  payment_method: string;
  payment_status: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  medicine_id: number;
  batch_id: number;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export interface SaleWithItems extends Sale {
  items: SaleItem[];
  customer_name?: string;
  user_name?: string;
}

export interface CreateSaleDTO {
  customer_id?: number | null;
  items: {
    medicine_id: number;
    batch_number: string;
    quantity: number;
    unit_price: number;
    discount?: number;
  }[];
  discount?: number;
  tax_rate?: number;
  payment_method: 'cash' | 'card' | 'credit';
  amount_paid: number;
  notes?: string;
}

class SalesService {
  async getAll(limit = 50, offset = 0): Promise<{ data: Sale[]; total: number }> {
    const response = await api.get<{ status: string; data: Sale[]; total: number }>(
      `/transactions/sales?limit=${limit}&offset=${offset}`
    );
    return { data: response.data.data, total: response.data.total };
  }

  async getById(id: number): Promise<SaleWithItems> {
    const response = await api.get<{ status: string; data: SaleWithItems }>(
      `/transactions/sales/${id}`
    );
    return response.data.data;
  }

  async create(data: CreateSaleDTO): Promise<SaleWithItems> {
    const response = await api.post<{ status: string; data: SaleWithItems }>(
      '/transactions/sales',
      data
    );
    return response.data.data;
  }

  async getDailySales(date: string): Promise<{ total_sales: number; total_amount: number }> {
    const response = await api.get<{ status: string; data: { total_sales: number; total_amount: number } }>(
      `/transactions/sales/daily?date=${date}`
    );
    return response.data.data;
  }

  async getSalesSummary(startDate: string, endDate: string): Promise<any> {
    const response = await api.get<{ status: string; data: any }>(
      `/transactions/sales/summary?start=${startDate}&end=${endDate}`
    );
    return response.data.data;
  }
}

export const salesService = new SalesService();
