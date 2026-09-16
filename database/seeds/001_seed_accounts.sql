-- Chart of Accounts Seed Data for Hussain Son's Pharmacy
-- Standard Double Entry Accounting COA

-- ============================================
-- ASSETS (1000-1999)
-- ============================================

-- Current Assets
INSERT INTO accounts (code, name, type, parent_id, description) VALUES
('1000', 'Assets', 'asset', NULL, 'All Assets'),
('1010', 'Cash in Hand', 'asset', 1, 'Physical cash at pharmacy'),
('1020', 'Bank Account', 'asset', 1, 'Main bank account'),
('1030', 'Accounts Receivable', 'asset', 1, 'Amounts owed by customers'),
('1040', 'Inventory - Medicines', 'asset', 1, 'Stock value of medicines'),
('1050', 'Inventory - Supplies', 'asset', 1, 'Stock value of supplies'),
('1060', 'Prepaid Expenses', 'asset', 1, 'Advance payments');

-- Fixed Assets
INSERT INTO accounts (code, name, type, parent_id, description) VALUES
('1500', 'Fixed Assets', 'asset', 1, 'All Fixed Assets'),
('1510', 'Computer Equipment', 'asset', 15, 'Computers, printers, etc.'),
('1520', 'Furniture & Fixtures', 'asset', 15, 'Shelves, counters, etc.'),
('1530', 'POS Hardware', 'asset', 15, 'POS terminals, barcode scanners');

-- ============================================
-- LIABILITIES (2000-2999)
-- ============================================

-- Current Liabilities
INSERT INTO accounts (code, name, type, parent_id, description) VALUES
('2000', 'Liabilities', 'liability', NULL, 'All Liabilities'),
('2010', 'Accounts Payable', 'liability', 20, 'Amounts owed to suppliers'),
('2020', 'Sales Tax Payable', 'liability', 20, 'GST/Tax collected'),
('2030', 'Accrued Expenses', 'liability', 20, 'Expenses incurred but not paid'),
('2040', 'Customer Advances', 'liability', 20, 'Advance payments from customers');

-- Long-term Liabilities
INSERT INTO accounts (code, name, type, parent_id, description) VALUES
('2500', 'Long-term Liabilities', 'liability', 20, 'All Long-term Liabilities'),
('2510', 'Business Loans', 'liability', 25, 'Bank loans');

-- ============================================
-- EQUITY (3000-3999)
-- ============================================

INSERT INTO accounts (code, name, type, parent_id, description) VALUES
('3000', 'Equity', 'equity', NULL, 'All Equity'),
('3010', 'Owner Equity', 'equity', 30, 'Owner investment'),
('3020', 'Retained Earnings', 'equity', 30, 'Accumulated profits'),
('3030', 'Current Year Earnings', 'equity', 30, 'Current year profit/loss');

-- ============================================
-- INCOME (4000-4999)
-- ============================================

INSERT INTO accounts (code, name, type, parent_id, description) VALUES
('4000', 'Income', 'income', NULL, 'All Income'),
('4010', 'Sales Revenue', 'income', 40, 'Medicine sales'),
('4020', 'Sales Returns', 'income', 40, 'Returns from customers (contra)'),
('4030', 'Service Income', 'income', 40, 'Service charges'),
('4040', 'Discount Received', 'income', 40, 'Discounts from suppliers');

-- ============================================
-- EXPENSES (5000-6999)
-- ============================================

-- Cost of Goods Sold
INSERT INTO accounts (code, name, type, parent_id, description) VALUES
('5000', 'Cost of Goods Sold', 'expense', NULL, 'All COGS'),
('5010', 'Purchase - Medicines', 'expense', 50, 'Cost of medicines purchased'),
('5020', 'Purchase Returns', 'expense', 50, 'Returns to suppliers (contra)'),
('5030', 'Freight & Delivery', 'expense', 50, 'Transportation costs');

-- Operating Expenses
INSERT INTO accounts (code, name, type, parent_id, description) VALUES
('6000', 'Operating Expenses', 'expense', NULL, 'All Operating Expenses'),
('6010', 'Rent', 'expense', 60, 'Shop rent'),
('6020', 'Utilities', 'expense', 60, 'Electricity, water, gas'),
('6030', 'Salaries', 'expense', 60, 'Staff salaries'),
('6040', 'Marketing', 'expense', 60, 'Advertising expenses'),
('6050', 'Office Supplies', 'expense', 60, 'Stationery, printing'),
('6060', 'Telephone & Internet', 'expense', 60, 'Communication costs'),
('6070', 'Insurance', 'expense', 60, 'Business insurance'),
('6080', 'Repairs & Maintenance', 'expense', 60, 'Equipment maintenance'),
('6090', 'Professional Fees', 'expense', 60, 'Legal, accounting fees'),
('6100', 'Licenses & Permits', 'expense', 60, 'Government licenses'),
('6110', 'Depreciation', 'expense', 60, 'Asset depreciation'),
('6120', 'Bad Debts', 'expense', 60, 'Uncollectible receivables');

-- ============================================
-- Initialize Account Balances
-- ============================================

INSERT INTO account_balances (account_id, debit_balance, credit_balance, net_balance)
SELECT id, 0.00, 0.00, 0.00 FROM accounts;

-- ============================================
-- Create Current Fiscal Year
-- ============================================

INSERT INTO fiscal_periods (name, start_date, end_date, status)
VALUES ('FY 2026', '2026-01-01', '2026-12-31', 'open');
