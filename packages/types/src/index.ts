export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string | null;
  role_id: number;
  role_name: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface Medicine {
  id: number;
  name: string;
  generic_name: string | null;
  category_id: number | null;
  category_name: string | null;
  manufacturer_id: number | null;
  manufacturer_name: string | null;
  unit_id: number | null;
  unit_name: string | null;
  barcode: string | null;
  description: string | null;
  strength: string | null;
  form: string | null;
  reorder_level: number;
  is_active: boolean;
  total_stock: number;
  batches: MedicineBatch[];
}

export interface MedicineBatch {
  id: number;
  medicine_id: number;
  batch_number: string;
  expiry_date: string;
  purchase_price: number;
  sale_price: number;
  quantity: number;
  reserved_quantity: number;
  manufacturing_date: string | null;
  supplier_id: number | null;
  is_active: boolean;
}

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  customer_type: 'regular' | 'wholesale' | 'premium';
  balance: number;
  credit_limit: number;
  is_active: boolean;
  created_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  contact_person: string | null;
  balance: number;
  is_active: boolean;
  created_at: string;
}

export interface Sale {
  id: number;
  invoice_number: string;
  customer_id: number | null;
  customer_name: string | null;
  user_id: number;
  user_name: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  payment_method: 'cash' | 'card' | 'credit' | 'bank_transfer' | 'online';
  payment_status: 'paid' | 'partial' | 'unpaid';
  status: 'completed' | 'voided' | 'returned';
  notes: string | null;
  created_at: string;
  items: SaleItem[];
}

export interface SaleItem {
  id: number;
  sale_id: number;
  medicine_id: number;
  medicine_name?: string;
  batch_id: number;
  batch_number?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export interface Purchase {
  id: number;
  purchase_number: string;
  supplier_id: number;
  supplier_name: string | null;
  user_id: number;
  user_name: string | null;
  invoice_ref: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  payment_method: string;
  payment_status: string;
  status: string;
  notes: string | null;
  created_at: string;
  items: PurchaseItem[];
}

export interface PurchaseItem {
  id: number;
  purchase_id: number;
  medicine_id: number;
  medicine_name?: string;
  batch_id: number | null;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  purchase_price: number;
  sale_price: number;
  total: number;
}

export interface Expense {
  id: number;
  expense_number: string;
  category_id: number;
  category_name?: string;
  amount: number;
  description: string;
  expense_date: string;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'online';
  receipt_number: string | null;
  notes: string | null;
  created_by: number;
  created_at: string;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface StockMovement {
  id: number;
  medicine_id: number;
  medicine_name?: string;
  batch_id: number;
  batch_number?: string;
  movement_type: 'purchase' | 'sale' | 'sale_return' | 'purchase_return' | 'adjustment';
  quantity: number;
  reference_type: string | null;
  reference_id: number | null;
  notes: string | null;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  reference_type: string | null;
  reference_id: number | null;
  created_at: string;
}

export interface Backup {
  id: number;
  backup_number: string;
  backup_type: 'full' | 'partial';
  status: 'pending' | 'completed' | 'failed';
  file_path: string | null;
  file_size: number | null;
  notes: string | null;
  created_by: number;
  created_at: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
  total?: number;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  status: 'success';
  data: T[];
  total: number;
  page: number;
  limit: number;
}
