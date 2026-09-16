import api from './api.service';

export interface Medicine {
  id: number;
  name: string;
  generic_name: string | null;
  category_id: number | null;
  manufacturer_id: number | null;
  unit_id: number | null;
  barcode: string | null;
  description: string | null;
  strength: string | null;
  form: string | null;
  reorder_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category_name: string | null;
  manufacturer_name: string | null;
  unit_name: string | null;
  total_stock: number;
  batches: MedicineBatch[];
}

export interface MedicineBatch {
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
}

export interface CreateMedicineDTO {
  name: string;
  generic_name?: string;
  category_id?: number;
  manufacturer_id?: number;
  unit_id?: number;
  barcode?: string;
  description?: string;
  strength?: string;
  form?: string;
  reorder_level?: number;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
}

export interface Manufacturer {
  id: number;
  name: string;
  country: string | null;
}

export interface MedicineUnit {
  id: number;
  name: string;
  short_name: string;
}

class MedicineService {
  async getAll(params?: { search?: string; category_id?: number; limit?: number; offset?: number }): Promise<{ data: Medicine[]; total: number }> {
    const response = await api.get<{ status: string; data: Medicine[]; total: number }>('/medicines', { params });
    return { data: response.data.data, total: response.data.total };
  }

  async getById(id: number): Promise<Medicine> {
    const response = await api.get<{ status: string; data: Medicine }>(`/medicines/${id}`);
    return response.data.data;
  }

  async getByBarcode(barcode: string): Promise<Medicine> {
    const response = await api.get<{ status: string; data: Medicine }>(`/medicines/barcode/${barcode}`);
    return response.data.data;
  }

  async search(term: string): Promise<Medicine[]> {
    const response = await api.get<{ status: string; data: Medicine[] }>('/medicines/pos/search', { params: { q: term } });
    return response.data.data;
  }

  async create(data: CreateMedicineDTO): Promise<Medicine> {
    const response = await api.post<{ status: string; data: Medicine }>('/medicines', data);
    return response.data.data;
  }

  async update(id: number, data: Partial<CreateMedicineDTO>): Promise<Medicine> {
    const response = await api.put<{ status: string; data: Medicine }>(`/medicines/${id}`, data);
    return response.data.data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`/medicines/${id}`);
  }

  async getBatches(medicineId: number): Promise<MedicineBatch[]> {
    const response = await api.get<{ status: string; data: MedicineBatch[] }>(`/medicines/${medicineId}/batches`);
    return response.data.data;
  }

  async createBatch(medicineId: number, data: {
    batch_number: string;
    expiry_date: string;
    purchase_price: number;
    sale_price: number;
    quantity: number;
    supplier_id?: number;
  }): Promise<MedicineBatch> {
    const response = await api.post<{ status: string; data: MedicineBatch }>(`/medicines/${medicineId}/batches`, data);
    return response.data.data;
  }

  async getLowStock(): Promise<Medicine[]> {
    const response = await api.get<{ status: string; data: Medicine[] }>('/medicines/low-stock');
    return response.data.data;
  }

  async getExpiring(days: number = 90): Promise<(MedicineBatch & { medicine_name: string })[]> {
    const response = await api.get<{ status: string; data: (MedicineBatch & { medicine_name: string })[] }>('/medicines/expiring', { params: { days } });
    return response.data.data;
  }

  async getCategories(): Promise<Category[]> {
    const response = await api.get<{ status: string; data: Category[] }>('/medicines/lookups/categories');
    return response.data.data;
  }

  async getManufacturers(): Promise<Manufacturer[]> {
    const response = await api.get<{ status: string; data: Manufacturer[] }>('/medicines/lookups/manufacturers');
    return response.data.data;
  }

  async getUnits(): Promise<MedicineUnit[]> {
    const response = await api.get<{ status: string; data: MedicineUnit[] }>('/medicines/lookups/units');
    return response.data.data;
  }
}

export const medicineService = new MedicineService();
