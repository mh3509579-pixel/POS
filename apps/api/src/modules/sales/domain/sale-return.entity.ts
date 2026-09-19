export interface SaleReturn {
  id: number;
  return_number: string;
  sale_id: number;
  customer_id: number | null;
  user_id: number;
  subtotal: number;
  total_amount: number;
  refund_method: 'cash' | 'card' | 'credit';
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
}

export interface SaleReturnItem {
  id: number;
  sale_return_id: number;
  sale_item_id: number;
  medicine_id: number;
  batch_id: number | null;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface CreateSaleReturnDTO {
  sale_id: number;
  customer_id?: number | null;
  items: {
    sale_item_id: number;
    medicine_id: number;
    batch_id?: number | null;
    quantity: number;
    unit_price: number;
  }[];
  refund_method: 'cash' | 'card' | 'credit';
  reason?: string;
}

export interface SaleReturnWithItems extends SaleReturn {
  items: (SaleReturnItem & { medicine_name?: string })[];
  user_name?: string;
  customer_name?: string;
  invoice_number?: string;
}
