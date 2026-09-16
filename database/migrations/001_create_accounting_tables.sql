-- Double Entry Accounting System Migration
-- Creates Chart of Accounts, Journal Entries, General Ledger

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  type ENUM('asset', 'liability', 'equity', 'income', 'expense') NOT NULL,
  parent_id INT NULL,
  description VARCHAR(255) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES accounts(id) ON DELETE SET NULL,
  INDEX idx_accounts_code (code),
  INDEX idx_accounts_type (type)
);

-- Journal Entry Headers
CREATE TABLE IF NOT EXISTS journal_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entry_number VARCHAR(50) NOT NULL UNIQUE,
  entry_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference_type VARCHAR(50) NULL,
  reference_id INT NULL,
  status ENUM('draft', 'posted', 'voided') DEFAULT 'draft',
  created_by INT NULL,
  posted_at TIMESTAMP NULL,
  voided_at TIMESTAMP NULL,
  void_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_journal_entries_date (entry_date),
  INDEX idx_journal_entries_status (status),
  INDEX idx_journal_entries_reference (reference_type, reference_id)
);

-- Journal Entry Lines (Debit/Credit)
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  journal_entry_id INT NOT NULL,
  account_id INT NOT NULL,
  debit DECIMAL(15,2) DEFAULT 0.00,
  credit DECIMAL(15,2) DEFAULT 0.00,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
  INDEX idx_journal_lines_entry (journal_entry_id),
  INDEX idx_journal_lines_account (account_id)
);

-- General Ledger (Running balances)
CREATE TABLE IF NOT EXISTS general_ledger (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT NOT NULL,
  journal_entry_id INT NOT NULL,
  entry_date DATE NOT NULL,
  debit DECIMAL(15,2) DEFAULT 0.00,
  credit DECIMAL(15,2) DEFAULT 0.00,
  balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
  FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE RESTRICT,
  INDEX idx_ledger_account (account_id),
  INDEX idx_ledger_date (entry_date),
  INDEX idx_ledger_entry (journal_entry_id)
);

-- Account Balances (Current balances for quick access)
CREATE TABLE IF NOT EXISTS account_balances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT NOT NULL UNIQUE,
  debit_balance DECIMAL(15,2) DEFAULT 0.00,
  credit_balance DECIMAL(15,2) DEFAULT 0.00,
  net_balance DECIMAL(15,2) DEFAULT 0.00,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
);

-- Fiscal Periods
CREATE TABLE IF NOT EXISTS fiscal_periods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('open', 'closed') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_period_dates (start_date, end_date)
);
