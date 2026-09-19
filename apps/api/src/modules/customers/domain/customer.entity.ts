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
  created_at: Date;
  updated_at: Date;
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

export interface UpdateCustomerDTO {
  name?: string;
  type?: CustomerType;
  phone?: string;
  email?: string;
  cnic?: string;
  address?: string;
  city?: string;
  credit_limit?: number;
  notes?: string;
  is_active?: boolean;
}
