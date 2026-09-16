-- Expenses Migration
-- Expense tracking and categories

-- Expense Categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  budget_limit DECIMAL(12,2) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expense_number VARCHAR(50) NOT NULL UNIQUE,
  category_id INT NOT NULL,
  user_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  vendor VARCHAR(150) NULL,
  payment_method ENUM('cash', 'card', 'bank_transfer', 'online', 'cheque') DEFAULT 'cash',
  expense_date DATE NOT NULL,
  reference_number VARCHAR(100) NULL,
  receipt_path VARCHAR(255) NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_expenses_date (expense_date),
  INDEX idx_expenses_category (category_id),
  INDEX idx_expenses_number (expense_number),
  INDEX idx_expenses_status (status)
);
