import api from './api.service';

export type CustomerType = 'regular' | 'premium' | 'wholesale' | 'hospital' | 'clinic';

export interface Customer {
  id: number;
  name: string;
  type: CustomerType;
  phone: string | null;
  email: string | null;
  cnic: string | null;
  address: string | null;
  city: string | null;
  credit_limit: number;
  current_balance: number;
  total_purchases: number;
  loyalty_points: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerDTO {
  name: string;
  type?: CustomerType;
  phone?: string;
  email?: string;
  cnic?: string;
  address?: string;
  city?: string;
  credit_limit?: number;
  notes?: string;
}

class CustomerService {
  async getAll(params?: { search?: string; type?: string; limit?: number; offset?: number }): Promise<{ data: Customer[]; total: number }> {
    const response = await api.get<{ status: string; data: Customer[]; total: number }>('/customers', { params });
    return { data: response.data.data, total: response.data.total };
  }

  async getById(id: number): Promise<Customer> {
    const response = await api.get<{ status: string; data: Customer }>(`/customers/${id}`);
    return response.data.data;
  }

  async create(data: CreateCustomerDTO): Promise<Customer> {
    const response = await api.post<{ status: string; data: Customer }>('/customers', data);
    return response.data.data;
  }

  async update(id: number, data: Partial<CreateCustomerDTO>): Promise<Customer> {
    const response = await api.put<{ status: string; data: Customer }>(`/customers/${id}`, data);
    return response.data.data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`/customers/${id}`);
  }

  async getTop(limit: number = 10): Promise<Customer[]> {
    const response = await api.get<{ status: string; data: Customer[] }>('/customers/top', { params: { limit } });
    return response.data.data;
  }

  async getStats(): Promise<{
    total: number;
    regular: number;
    premium: number;
    wholesale: number;
    hospital: number;
    clinic: number;
    total_receivable: number;
  }> {
    const response = await api.get<{ status: string; data: any }>('/customers/stats');
    return response.data.data;
  }
}

export const customerService = new CustomerService();
