// Sales Domain Entities

export type SaleStatus = 'pending' | 'completed' | 'cancelled' | 'returned';

export interface Sale {
  id: number;
  invoice_number: string;
  customer_id: number | null;
  user_id: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: 'cash' | 'card' | 'credit';
  amount_paid: number;
  change_amount: number;
  status: SaleStatus;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  medicine_id: number;
  batch_number: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  created_at: Date;
}

export interface CreateSaleDTO {
  customer_id?: number | null;
  items: CreateSaleItemDTO[];
  discount?: number;
  tax_rate?: number;
  payment_method: 'cash' | 'card' | 'credit';
  amount_paid: number;
  notes?: string;
}

export interface CreateSaleItemDTO {
  medicine_id: number;
  batch_number: string;
  quantity: number;
  unit_price: number;
  discount?: number;
}

export interface SaleWithItems extends Sale {
  items: SaleItem[];
  customer_name?: string;
  user_name?: string;
}
