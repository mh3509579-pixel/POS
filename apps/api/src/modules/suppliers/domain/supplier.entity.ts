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
  created_at: Date;
  updated_at: Date;
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

export interface UpdateSupplierDTO {
  name?: string;
  type?: SupplierType;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  contact_person?: string;
  tax_number?: string;
  payment_terms_days?: number;
  rating?: number;
  notes?: string;
  is_active?: boolean;
}
