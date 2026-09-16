import api from './api.service';

export interface Purchase {
  id: number;
  purchase_number: string;
  supplier_id: number;
  user_id: number;
  invoice_ref: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  payment_method: string;
  payment_status: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface PurchaseItem {
  id: number;
  purchase_id: number;
  medicine_id: number;
  batch_id: number | null;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  purchase_price: number;
  sale_price: number;
  total: number;
}

export interface PurchaseWithItems extends Purchase {
  items: PurchaseItem[];
  supplier_name?: string;
  user_name?: string;
}

export interface CreatePurchaseDTO {
  supplier_id: number;
  invoice_number?: string;
  items: {
    medicine_id: number;
    batch_number: string;
    expiry_date: string;
    quantity: number;
    unit_price: number;
    sale_price: number;
    discount?: number;
  }[];
  discount?: number;
  tax_rate?: number;
  notes?: string;
}

class PurchaseService {
  async getAll(limit = 50, offset = 0): Promise<{ data: Purchase[]; total: number }> {
    const response = await api.get<{ status: string; data: Purchase[]; total: number }>(
      `/transactions/purchases?limit=${limit}&offset=${offset}`
    );
    return { data: response.data.data, total: response.data.total };
  }

  async getById(id: number): Promise<PurchaseWithItems> {
    const response = await api.get<{ status: string; data: PurchaseWithItems }>(
      `/transactions/purchases/${id}`
    );
    return response.data.data;
  }

  async create(data: CreatePurchaseDTO): Promise<PurchaseWithItems> {
    const response = await api.post<{ status: string; data: PurchaseWithItems }>(
      '/transactions/purchases',
      data
    );
    return response.data.data;
  }

  async receive(id: number): Promise<PurchaseWithItems> {
    const response = await api.put<{ status: string; data: PurchaseWithItems }>(
      `/transactions/purchases/${id}/receive`
    );
    return response.data.data;
  }

  async cancel(id: number): Promise<PurchaseWithItems> {
    const response = await api.put<{ status: string; data: PurchaseWithItems }>(
      `/transactions/purchases/${id}/cancel`
    );
    return response.data.data;
  }
}

export const purchaseService = new PurchaseService();
