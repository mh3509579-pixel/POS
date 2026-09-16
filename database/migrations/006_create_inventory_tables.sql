-- Stock Movements and Payments Migration
-- Inventory tracking and payment records

-- Stock Movements (every stock change is recorded here)
CREATE TABLE IF NOT EXISTS stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  medicine_id INT NOT NULL,
  batch_id INT NOT NULL,
  movement_type ENUM('purchase', 'sale', 'sale_return', 'purchase_return', 'adjustment', 'transfer') NOT NULL,
  quantity INT NOT NULL,
  reference_type VARCHAR(50) NULL,
  reference_id INT NULL,
  movement_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id INT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE RESTRICT,
  FOREIGN KEY (batch_id) REFERENCES medicine_batches(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_stock_movements_medicine (medicine_id),
  INDEX idx_stock_movements_batch (batch_id),
  INDEX idx_stock_movements_type (movement_type),
  INDEX idx_stock_movements_date (movement_date),
  INDEX idx_stock_movements_reference (reference_type, reference_id)
);

-- Payments (tracks all money movements)
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_number VARCHAR(50) NOT NULL UNIQUE,
  payment_type ENUM('receivable', 'payable') NOT NULL,
  entity_type ENUM('customer', 'supplier') NOT NULL,
  entity_id INT NOT NULL,
  reference_type VARCHAR(50) NULL,
  reference_id INT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_method ENUM('cash', 'card', 'bank_transfer', 'online', 'cheque') NOT NULL,
  payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT NULL,
  user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_payments_type (payment_type),
  INDEX idx_payments_entity (entity_type, entity_id),
  INDEX idx_payments_date (payment_date),
  INDEX idx_payments_reference (reference_type, reference_id)
);
