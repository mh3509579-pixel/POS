-- Roles and Permissions Seed Data

-- Roles
INSERT INTO roles (name, description) VALUES
  ('SUPER_ADMIN', 'Full system administrator with all permissions'),
  ('admin', 'Full system administrator with all permissions'),
  ('pharmacist', 'Licensed pharmacist with full operational access'),
  ('cashier', 'POS operator with sales and customer access'),
  ('inventory_manager', 'Manages stock, purchases, and suppliers'),
  ('accountant', 'Manages accounts, journal entries, and reports');

-- Permissions (module + action based)
INSERT INTO permissions (name, module, action) VALUES
  -- POS
  ('pos.access', 'pos', 'access'),
  ('pos.sale.create', 'pos', 'sale.create'),
  ('pos.sale.void', 'pos', 'sale.void'),
  ('pos.return.create', 'pos', 'return.create'),

  -- Medicines
  ('medicines.view', 'medicines', 'view'),
  ('medicines.create', 'medicines', 'create'),
  ('medicines.update', 'medicines', 'update'),
  ('medicines.delete', 'medicines', 'delete'),

  -- Inventory
  ('inventory.view', 'inventory', 'view'),
  ('inventory.adjust', 'inventory', 'adjust'),
  ('inventory.batch.manage', 'inventory', 'batch.manage'),

  -- Purchases
  ('purchases.view', 'purchases', 'view'),
  ('purchases.create', 'purchases', 'create'),
  ('purchases.update', 'purchases', 'update'),
  ('purchases.delete', 'purchases', 'delete'),
  ('purchases.return.create', 'purchases', 'return.create'),

  -- Sales
  ('sales.view', 'sales', 'view'),
  ('sales.create', 'sales', 'create'),
  ('sales.void', 'sales', 'void'),
  ('sales.return.create', 'sales', 'return.create'),

  -- Customers
  ('customers.view', 'customers', 'view'),
  ('customers.create', 'customers', 'create'),
  ('customers.update', 'customers', 'update'),
  ('customers.delete', 'customers', 'delete'),

  -- Suppliers
  ('suppliers.view', 'suppliers', 'view'),
  ('suppliers.create', 'suppliers', 'create'),
  ('suppliers.update', 'suppliers', 'update'),
  ('suppliers.delete', 'suppliers', 'delete'),

  -- Expenses
  ('expenses.view', 'expenses', 'view'),
  ('expenses.create', 'expenses', 'create'),
  ('expenses.update', 'expenses', 'update'),
  ('expenses.delete', 'expenses', 'delete'),

  -- Accounting
  ('accounting.view', 'accounting', 'view'),
  ('accounting.journal.create', 'accounting', 'journal.create'),
  ('accounting.journal.post', 'accounting', 'journal.post'),
  ('accounting.journal.void', 'accounting', 'journal.void'),
  ('accounting.reports', 'accounting', 'reports'),

  -- Users
  ('users.view', 'users', 'view'),
  ('users.create', 'users', 'create'),
  ('users.update', 'users', 'update'),
  ('users.delete', 'users', 'delete'),
  ('users.roles.manage', 'users', 'roles.manage'),

  -- Reports
  ('reports.view', 'reports', 'view'),
  ('reports.export', 'reports', 'export'),

  -- Settings
  ('settings.view', 'settings', 'view'),
  ('settings.update', 'settings', 'update'),

  -- Backup
  ('backup.create', 'backup', 'create'),
  ('backup.restore', 'backup', 'restore'),

  -- Audit
  ('audit.view', 'audit', 'view');

-- SUPER_ADMIN gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions;

-- Pharmacist permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE module IN ('pos', 'medicines', 'inventory', 'purchases', 'sales', 'customers', 'suppliers', 'expenses');

-- Cashier permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions WHERE module IN ('pos', 'medicines', 'customers') AND action IN ('access', 'sale.create', 'return.create', 'view', 'create');

-- Inventory manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 5, id FROM permissions WHERE module IN ('medicines', 'inventory', 'purchases', 'suppliers');

-- Accountant permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 6, id FROM permissions WHERE module IN ('accounting', 'expenses', 'reports');
