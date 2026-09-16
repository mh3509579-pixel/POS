-- Expense Categories and Settings Seed Data

-- Expense Categories
INSERT INTO expense_categories (name, description, budget_limit) VALUES
  ('Rent', 'Monthly shop/office rent', 150000),
  ('Utilities', 'Electricity, gas, water bills', 50000),
  ('Salaries', 'Staff salaries and wages', 400000),
  ('Transportation', 'Delivery and travel expenses', 30000),
  ('Marketing', 'Advertising and promotional expenses', 25000),
  ('Maintenance', 'Equipment and facility maintenance', 20000),
  ('Insurance', 'Business and inventory insurance', 15000),
  ('Office Supplies', 'Stationery, printer supplies, etc.', 10000),
  ('Licensing', 'Pharmacy license and regulatory fees', 5000),
  ('Miscellaneous', 'Other general expenses', 20000);

-- System Settings
INSERT INTO settings (setting_key, setting_value, setting_type, module, description, is_public) VALUES
  -- Pharmacy Info
  ('pharmacy.name', 'Hussain Son''s Pharmacy', 'string', 'pharmacy', 'Pharmacy business name', TRUE),
  ('pharmacy.phone', '+92-300-1234567', 'string', 'pharmacy', 'Primary phone number', TRUE),
  ('pharmacy.email', 'info@hussainsons.com', 'string', 'pharmacy', 'Primary email', TRUE),
  ('pharmacy.address', '123 Main Street, Lahore', 'string', 'pharmacy', 'Business address', TRUE),
  ('pharmacy.license', 'PHR-LHR-2024-001', 'string', 'pharmacy', 'Pharmacy license number', FALSE),

  -- Invoice
  ('invoice.prefix', 'INV', 'string', 'invoice', 'Invoice number prefix', FALSE),
  ('invoice.next_number', '1001', 'number', 'invoice', 'Next invoice number', FALSE),
  ('invoice.show_logo', 'true', 'boolean', 'invoice', 'Show logo on invoice', FALSE),
  ('invoice.footer_text', 'Thank you for your purchase!', 'string', 'invoice', 'Invoice footer text', FALSE),

  -- Tax
  ('tax.rate', '0', 'number', 'tax', 'Default tax rate percentage', FALSE),
  ('tax.gst_number', '', 'string', 'tax', 'GST registration number', FALSE),

  -- POS
  ('pos.default_payment_method', 'cash', 'string', 'pos', 'Default payment method', FALSE),
  ('pos.walk_in_customer', 'Walk-in Customer', 'string', 'pos', 'Default walk-in customer name', FALSE),
  ('pos.receipt_width', '80mm', 'string', 'pos', 'Receipt printer width', FALSE),

  -- Notification
  ('notification.low_stock_threshold', '10', 'number', 'notification', 'Low stock alert threshold', FALSE),
  ('notification.expiry_days', '90', 'number', 'notification', 'Expiry warning days', FALSE),

  -- Security
  ('security.session_timeout', '30', 'number', 'security', 'Session timeout in minutes', FALSE),
  ('security.max_login_attempts', '5', 'number', 'security', 'Max failed login attempts', FALSE),
  ('security.password_min_length', '8', 'number', 'security', 'Minimum password length', FALSE);
