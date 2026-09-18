-- Backups Migration
-- System backup records

CREATE TABLE IF NOT EXISTS backups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  backup_number VARCHAR(50) NOT NULL UNIQUE,
  backup_type ENUM('full', 'partial', 'data') NOT NULL DEFAULT 'full',
  status ENUM('pending', 'in_progress', 'completed', 'failed') DEFAULT 'pending',
  file_path VARCHAR(500) NULL,
  file_size BIGINT NULL,
  notes TEXT NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_backups_status (status),
  INDEX idx_backups_date (created_at)
);
