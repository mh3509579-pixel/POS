import api from './api.service';

export interface StockMovement {
  id: number;
  medicine_id: number;
  batch_id: number;
  movement_type: 'purchase' | 'sale' | 'sale_return' | 'purchase_return' | 'adjustment';
  quantity: number;
  reference_type: string | null;
  reference_id: number | null;
  notes: string | null;
  created_at: string;
  medicine_name?: string;
  batch_number?: string;
}

export interface Batch {
  id: number;
  medicine_id: number;
  batch_number: string;
  expiry_date: string;
  purchase_price: number;
  sale_price: number;
  quantity: number;
  reserved_quantity: number;
  manufacturing_date: string | null;
  supplier_id: number | null;
  is_active: boolean;
  medicine_name?: string;
}

export interface InventoryAdjustment {
  medicine_id: number;
  batch_id: number;
  adjustment_type: 'increase' | 'decrease';
  quantity: number;
  reason: string;
}

class InventoryService {
  async getStockMovements(limit = 50, offset = 0, filters?: {
    medicine_id?: number;
    batch_id?: number;
    movement_type?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{ data: StockMovement[]; total: number }> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    const response = await api.get<{ status: string; data: StockMovement[]; total: number }>(
      `/inventory/movements?${params.toString()}`
    );
    return { data: response.data.data, total: response.data.total };
  }

  async getBatches(medicineId?: number): Promise<Batch[]> {
    const params = medicineId ? `?medicine_id=${medicineId}` : '';
    const response = await api.get<{ status: string; data: Batch[] }>(
      `/inventory/batches${params}`
    );
    return response.data.data;
  }

  async getLowStock(): Promise<any[]> {
    const response = await api.get<{ status: string; data: any[] }>(
      '/medicines/low-stock'
    );
    return response.data.data;
  }

  async getExpiringSoon(days = 90): Promise<any[]> {
    const response = await api.get<{ status: string; data: any[] }>(
      `/medicines/expiring?days=${days}`
    );
    return response.data.data;
  }

  async adjustStock(data: InventoryAdjustment): Promise<void> {
    await api.post('/inventory/adjustments', data);
  }

  async getExpiringBatches(days = 90): Promise<any[]> {
    const response = await api.get<{ status: string; data: any[] }>(
      `/medicines/expiring?days=${days}`
    );
    return response.data.data;
  }
}

export const inventoryService = new InventoryService();
