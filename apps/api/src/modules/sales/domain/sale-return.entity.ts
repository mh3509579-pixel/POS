/** Mirrors sale_returns.status ENUM('completed','cancelled') in 005_create_transaction_tables.sql */
export type SaleReturnStatus = 'completed' | 'cancelled';

/** Mirrors sale_returns.refund_method ENUM('cash','card','credit','exchange') */
export type RefundMethod = 'cash' | 'card' | 'credit' | 'exchange';

export const VALID_REFUND_METHODS: RefundMethod[] = ['cash', 'card', 'credit', 'exchange'];

export interface SaleReturn {
  id: number;
  return_number: string;
  sale_id: number;
  customer_id: number | null;
  user_id: number;
  subtotal: number;
  total_amount: number;
  refund_method: RefundMethod;
  reason: string | null;
  status: SaleReturnStatus;
  created_at: Date;
}

export interface SaleReturnItem {
  id: number;
  sale_return_id: number;
  sale_item_id: number;
  medicine_id: number;
  /** NOT NULL in the schema; always derived from the referenced sale_items row. */
  batch_id: number;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface CreateSaleReturnDTO {
  sale_id: number;
  customer_id?: number | null;
  /**
   * Only `sale_item_id` and `quantity` are trusted from the client.
   * `medicine_id`, `batch_id` and `unit_price` are always read from the
   * referenced `sale_items` row so a client cannot restock an unrelated batch
   * or choose its own refund amount.
   */
  items: {
    sale_item_id: number;
    quantity: number;
  }[];
  refund_method: RefundMethod;
  reason?: string;
}

export interface SaleReturnWithItems extends SaleReturn {
  items: (SaleReturnItem & { medicine_name?: string })[];
  user_name?: string;
  customer_name?: string;
  invoice_number?: string;
}