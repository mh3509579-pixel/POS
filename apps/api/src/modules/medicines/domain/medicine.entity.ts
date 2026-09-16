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
  created_at: Date;
  updated_at: Date;
}

export interface MedicineWithDetails extends Medicine {
  category_name: string | null;
  manufacturer_name: string | null;
  unit_name: string | null;
  total_stock: number;
  batches: MedicineBatch[];
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

export interface UpdateMedicineDTO {
  name?: string;
  generic_name?: string;
  category_id?: number;
  manufacturer_id?: number;
  unit_id?: number;
  barcode?: string;
  description?: string;
  strength?: string;
  form?: string;
  reorder_level?: number;
  is_active?: boolean;
}

export interface MedicineBatch {
  id: number;
  medicine_id: number;
  batch_number: string;
  expiry_date: Date;
  purchase_price: number;
  sale_price: number;
  quantity: number;
  reserved_quantity: number;
  manufacturing_date: Date | null;
  supplier_id: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBatchDTO {
  batch_number: string;
  expiry_date: string;
  purchase_price: number;
  sale_price: number;
  quantity: number;
  manufacturing_date?: string;
  supplier_id?: number;
}

export interface UpdateBatchDTO {
  expiry_date?: string;
  purchase_price?: number;
  sale_price?: number;
  quantity?: number;
}

export interface MedicineCategory {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Manufacturer {
  id: number;
  name: string;
  country: string | null;
  contact_info: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MedicineUnit {
  id: number;
  name: string;
  short_name: string;
  created_at: Date;
}
