// Purchases Domain Entities

export type PurchaseStatus = 'pending' | 'received' | 'cancelled' | 'returned';

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
  status: PurchaseStatus;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PurchaseItem {
  id: number;
  purchase_id: number;
  medicine_id: number;
  batch_id: number | null;
  batch_number: string;
  expiry_date: Date;
  quantity: number;
  purchase_price: number;
  sale_price: number;
  total: number;
  created_at: Date;
  medicine_name?: string;
}

export interface CreatePurchaseDTO {
  supplier_id: number;
  invoice_number?: string;
  items: CreatePurchaseItemDTO[];
  discount?: number;
  tax_rate?: number;
  notes?: string;
}

export interface CreatePurchaseItemDTO {
  medicine_id: number;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  unit_price: number;
  sale_price: number;
}

export interface PurchaseWithItems extends Purchase {
  items: PurchaseItem[];
  supplier_name?: string;
  user_name?: string;
}
