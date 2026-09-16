-- Customers and Suppliers Migration
-- Party management for sales and purchases

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type ENUM('regular', 'premium', 'wholesale', 'hospital', 'clinic') DEFAULT 'regular',
  phone VARCHAR(20) NULL,
  email VARCHAR(100) NULL,
  address TEXT NULL,
  city VARCHAR(100) NULL,
  credit_limit DECIMAL(12,2) DEFAULT 0.00,
  current_balance DECIMAL(12,2) DEFAULT 0.00,
  total_purchases DECIMAL(15,2) DEFAULT 0.00,
  loyalty_points INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customers_name (name),
  INDEX idx_customers_phone (phone),
  INDEX idx_customers_type (type)
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type ENUM('local', 'national', 'international') DEFAULT 'local',
  phone VARCHAR(20) NULL,
  email VARCHAR(100) NULL,
  address TEXT NULL,
  city VARCHAR(100) NULL,
  contact_person VARCHAR(100) NULL,
  tax_number VARCHAR(50) NULL,
  payment_terms_days INT DEFAULT 30,
  current_balance DECIMAL(12,2) DEFAULT 0.00,
  total_purchases DECIMAL(15,2) DEFAULT 0.00,
  rating INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_suppliers_name (name),
  INDEX idx_suppliers_phone (phone),
  INDEX idx_suppliers_type (type)
);
