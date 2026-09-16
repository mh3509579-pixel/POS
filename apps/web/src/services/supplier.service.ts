import api from './api.service';

export type SupplierType = 'local' | 'national' | 'international';

export interface Supplier {
  id: number;
  name: string;
  type: SupplierType;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  contact_person: string | null;
  tax_number: string | null;
  payment_terms_days: number;
  current_balance: number;
  total_purchases: number;
  rating: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierDTO {
  name: string;
  type?: SupplierType;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  contact_person?: string;
  tax_number?: string;
  payment_terms_days?: number;
  notes?: string;
}

class SupplierService {
  async getAll(params?: { search?: string; type?: string; limit?: number; offset?: number }): Promise<{ data: Supplier[]; total: number }> {
    const response = await api.get<{ status: string; data: Supplier[]; total: number }>('/suppliers', { params });
    return { data: response.data.data, total: response.data.total };
  }

  async getById(id: number): Promise<Supplier> {
    const response = await api.get<{ status: string; data: Supplier }>(`/suppliers/${id}`);
    return response.data.data;
  }

  async create(data: CreateSupplierDTO): Promise<Supplier> {
    const response = await api.post<{ status: string; data: Supplier }>('/suppliers', data);
    return response.data.data;
  }

  async update(id: number, data: Partial<CreateSupplierDTO>): Promise<Supplier> {
    const response = await api.put<{ status: string; data: Supplier }>(`/suppliers/${id}`, data);
    return response.data.data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`/suppliers/${id}`);
  }

  async getTop(limit: number = 10): Promise<Supplier[]> {
    const response = await api.get<{ status: string; data: Supplier[] }>('/suppliers/top', { params: { limit } });
    return response.data.data;
  }

  async getStats(): Promise<{
    total: number;
    local: number;
    national: number;
    international: number;
    total_payable: number;
    avg_rating: number;
  }> {
    const response = await api.get<{ status: string; data: any }>('/suppliers/stats');
    return response.data.data;
  }
}

export const supplierService = new SupplierService();
