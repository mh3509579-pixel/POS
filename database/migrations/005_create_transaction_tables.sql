-- Sales, Purchases, and Returns Migration
-- Core transaction tables

-- ============================================================
-- SALES
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id INT NULL,
  user_id INT NOT NULL,
  sale_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(12,2) DEFAULT 0.00,
  tax_amount DECIMAL(12,2) DEFAULT 0.00,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  paid_amount DECIMAL(15,2) DEFAULT 0.00,
  change_amount DECIMAL(12,2) DEFAULT 0.00,
  payment_method ENUM('cash', 'card', 'credit', 'bank_transfer', 'online') DEFAULT 'cash',
  payment_status ENUM('paid', 'partial', 'unpaid') DEFAULT 'paid',
  status ENUM('completed', 'voided', 'returned') DEFAULT 'completed',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_sales_date (sale_date),
  INDEX idx_sales_invoice (invoice_number),
  INDEX idx_sales_customer (customer_id),
  INDEX idx_sales_status (status),
  INDEX idx_sales_payment_status (payment_status)
);

-- Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  medicine_id INT NOT NULL,
  batch_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0.00,
  tax_rate DECIMAL(5,2) DEFAULT 0.00,
  total DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE RESTRICT,
  FOREIGN KEY (batch_id) REFERENCES medicine_batches(id) ON DELETE RESTRICT,
  INDEX idx_sale_items_sale (sale_id),
  INDEX idx_sale_items_medicine (medicine_id)
);

-- ============================================================
-- PURCHASES
-- ============================================================
CREATE TABLE IF NOT EXISTS purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_number VARCHAR(50) NOT NULL UNIQUE,
  supplier_id INT NOT NULL,
  user_id INT NOT NULL,
  purchase_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  invoice_ref VARCHAR(100) NULL,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(12,2) DEFAULT 0.00,
  tax_amount DECIMAL(12,2) DEFAULT 0.00,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  paid_amount DECIMAL(15,2) DEFAULT 0.00,
  payment_method ENUM('cash', 'card', 'bank_transfer', 'online', 'credit') DEFAULT 'credit',
  payment_status ENUM('paid', 'partial', 'unpaid') DEFAULT 'unpaid',
  status ENUM('received', 'partial', 'cancelled') DEFAULT 'received',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_purchases_date (purchase_date),
  INDEX idx_purchases_number (purchase_number),
  INDEX idx_purchases_supplier (supplier_id),
  INDEX idx_purchases_status (status)
);

-- Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_id INT NOT NULL,
  medicine_id INT NOT NULL,
  batch_id INT NULL,
  batch_number VARCHAR(100) NOT NULL,
  expiry_date DATE NOT NULL,
  quantity INT NOT NULL,
  purchase_price DECIMAL(12,2) NOT NULL,
  sale_price DECIMAL(12,2) NOT NULL,
  total DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE RESTRICT,
  FOREIGN KEY (batch_id) REFERENCES medicine_batches(id) ON DELETE SET NULL,
  INDEX idx_purchase_items_purchase (purchase_id),
  INDEX idx_purchase_items_medicine (medicine_id)
);

-- ============================================================
-- SALE RETURNS
-- ============================================================
CREATE TABLE IF NOT EXISTS sale_returns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  return_number VARCHAR(50) NOT NULL UNIQUE,
  sale_id INT NOT NULL,
  customer_id INT NULL,
  user_id INT NOT NULL,
  return_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(12,2) DEFAULT 0.00,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  refund_method ENUM('cash', 'card', 'credit', 'exchange') DEFAULT 'cash',
  status ENUM('completed', 'cancelled') DEFAULT 'completed',
  reason TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE RESTRICT,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_sale_returns_date (return_date),
  INDEX idx_sale_returns_number (return_number),
  INDEX idx_sale_returns_sale (sale_id)
);

-- Sale Return Items
CREATE TABLE IF NOT EXISTS sale_return_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_return_id INT NOT NULL,
  sale_item_id INT NOT NULL,
  medicine_id INT NOT NULL,
  batch_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_return_id) REFERENCES sale_returns(id) ON DELETE CASCADE,
  FOREIGN KEY (sale_item_id) REFERENCES sale_items(id) ON DELETE RESTRICT,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE RESTRICT,
  FOREIGN KEY (batch_id) REFERENCES medicine_batches(id) ON DELETE RESTRICT,
  INDEX idx_sale_return_items_return (sale_return_id)
);

-- ============================================================
-- PURCHASE RETURNS
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_returns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  return_number VARCHAR(50) NOT NULL UNIQUE,
  purchase_id INT NOT NULL,
  supplier_id INT NOT NULL,
  user_id INT NOT NULL,
  return_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(12,2) DEFAULT 0.00,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  refund_method ENUM('cash', 'card', 'credit', 'exchange') DEFAULT 'credit',
  status ENUM('completed', 'cancelled') DEFAULT 'completed',
  reason TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE RESTRICT,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_purchase_returns_date (return_date),
  INDEX idx_purchase_returns_number (return_number),
  INDEX idx_purchase_returns_purchase (purchase_id)
);

-- Purchase Return Items
CREATE TABLE IF NOT EXISTS purchase_return_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_return_id INT NOT NULL,
  purchase_item_id INT NOT NULL,
  medicine_id INT NOT NULL,
  batch_id INT NOT NULL,
  quantity INT NOT NULL,
  purchase_price DECIMAL(12,2) NOT NULL,
  total DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_return_id) REFERENCES purchase_returns(id) ON DELETE CASCADE,
  FOREIGN KEY (purchase_item_id) REFERENCES purchase_items(id) ON DELETE RESTRICT,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE RESTRICT,
  FOREIGN KEY (batch_id) REFERENCES medicine_batches(id) ON DELETE RESTRICT,
  INDEX idx_purchase_return_items_return (purchase_return_id)
);
