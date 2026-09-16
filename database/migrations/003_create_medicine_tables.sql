-- Medicines, Categories, Manufacturers, Units, Batches Migration
-- Core medicine catalog and batch tracking

-- Medicine Categories
CREATE TABLE IF NOT EXISTS medicine_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Manufacturers
CREATE TABLE IF NOT EXISTS manufacturers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  country VARCHAR(100) NULL,
  contact_info VARCHAR(255) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Medicine Units (tablets, capsules, bottles, etc.)
CREATE TABLE IF NOT EXISTS medicine_units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  short_name VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medicines (the product definition, NOT batch-specific)
CREATE TABLE IF NOT EXISTS medicines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  generic_name VARCHAR(200) NULL,
  category_id INT NULL,
  manufacturer_id INT NULL,
  unit_id INT NULL,
  barcode VARCHAR(50) UNIQUE,
  description TEXT NULL,
  strength VARCHAR(100) NULL,
  form VARCHAR(50) NULL,
  reorder_level INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES medicine_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id) ON DELETE SET NULL,
  FOREIGN KEY (unit_id) REFERENCES medicine_units(id) ON DELETE SET NULL,
  INDEX idx_medicines_name (name),
  INDEX idx_medicines_generic (generic_name),
  INDEX idx_medicines_barcode (barcode),
  INDEX idx_medicines_category (category_id)
);

-- Medicine Batches (stock is tracked per batch)
CREATE TABLE IF NOT EXISTS medicine_batches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  medicine_id INT NOT NULL,
  batch_number VARCHAR(100) NOT NULL,
  expiry_date DATE NOT NULL,
  purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  sale_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  quantity INT NOT NULL DEFAULT 0,
  reserved_quantity INT NOT NULL DEFAULT 0,
  manufacturing_date DATE NULL,
  supplier_id INT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE RESTRICT,
  INDEX idx_batches_medicine (medicine_id),
  INDEX idx_batches_number (batch_number),
  INDEX idx_batches_expiry (expiry_date),
  UNIQUE KEY unique_batch_per_medicine (medicine_id, batch_number)
);
