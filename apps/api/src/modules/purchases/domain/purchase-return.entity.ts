export interface PurchaseReturn {
  id: number;
  return_number: string;
  purchase_id: number;
  supplier_id: number | null;
  user_id: number;
  total_amount: number;
  refund_method: 'cash' | 'card' | 'credit';
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
}

export interface PurchaseReturnItem {
  id: number;
  purchase_return_id: number;
  purchase_item_id: number;
  medicine_id: number;
  batch_id: number | null;
  quantity: number;
  purchase_price: number;
  total: number;
}

export interface CreatePurchaseReturnDTO {
  purchase_id: number;
  supplier_id?: number | null;
  items: { purchase_item_id: number; medicine_id: number; batch_id?: number | null; quantity: number; purchase_price: number }[];
  refund_method: 'cash' | 'card' | 'credit';
  reason?: string;
}

export interface PurchaseReturnWithItems extends PurchaseReturn {
  items: PurchaseReturnItem[];
  supplier_name?: string;
  user_name?: string;
  purchase_number?: string;
}
