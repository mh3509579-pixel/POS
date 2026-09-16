// Purchases Domain Entities

export type PurchaseStatus = 'pending' | 'received' | 'cancelled' | 'returned';

export interface Purchase {
  id: number;
  purchase_number: string;
  supplier_id: number;
  user_id: number;
  invoice_number: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: PurchaseStatus;
  received_date: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PurchaseItem {
  id: number;
  purchase_id: number;
  medicine_id: number;
  batch_number: string;
  expiry_date: Date;
  quantity: number;
  unit_price: number;
  sale_price: number;
  discount: number;
  total: number;
  created_at: Date;
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
  expiry_date: Date;
  quantity: number;
  unit_price: number;
  sale_price: number;
  discount?: number;
}

export interface PurchaseWithItems extends Purchase {
  items: PurchaseItem[];
  supplier_name?: string;
  user_name?: string;
}
