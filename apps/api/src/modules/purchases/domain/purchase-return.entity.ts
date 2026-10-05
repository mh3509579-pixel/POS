/** Mirrors purchase_returns.status ENUM('completed','cancelled') in 005_create_transaction_tables.sql */
export type PurchaseReturnStatus = 'completed' | 'cancelled';

/** Mirrors purchase_returns.refund_method ENUM('cash','card','credit','exchange') */
export type RefundMethod = 'cash' | 'card' | 'credit' | 'exchange';

export const VALID_REFUND_METHODS: RefundMethod[] = ['cash', 'card', 'credit', 'exchange'];

export interface PurchaseReturn {
  id: number;
  return_number: string;
  purchase_id: number;
  supplier_id: number | null;
  user_id: number;
  total_amount: number;
  refund_method: RefundMethod;
  reason: string | null;
  status: PurchaseReturnStatus;
  created_at: Date;
}

export interface PurchaseReturnItem {
  id: number;
  purchase_return_id: number;
  purchase_item_id: number;
  medicine_id: number;
  /** NOT NULL in the schema; always resolved from the referenced purchase_items row. */
  batch_id: number;
  quantity: number;
  purchase_price: number;
  total: number;
  medicine_name?: string;
}

export interface CreatePurchaseReturnDTO {
  purchase_id: number;
  supplier_id?: number | null;
  /**
   * Only `purchase_item_id` and `quantity` are trusted from the client.
   * `medicine_id`, `batch_id` and `purchase_price` are always read from the
   * referenced `purchase_items` row.
   */
  items: { purchase_item_id: number; quantity: number }[];
  refund_method: RefundMethod;
  reason?: string;
}

export interface PurchaseReturnWithItems extends PurchaseReturn {
  items: PurchaseReturnItem[];
  supplier_name?: string;
  user_name?: string;
  purchase_number?: string;
}