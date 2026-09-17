-- 3 Default Users for Hussain Pharmacy POS
-- Roles: admin, stock_manager, cashier

-- Admin user
-- Email: admin@hussainsons.com
-- Password: admin123
INSERT INTO users (username, email, password_hash, full_name, phone, role_id) VALUES
  ('admin', 'admin@hussainsons.com', '$2b$10$s0LCvGlfB9rDZutJsPJLP.kxKeT8lZEYbKHG0cL.TtSkv8aUymqPW', 'System Admin', '+92-300-1111111', 2);

-- Stock Manager user
-- Email: stock@hussainsons.com
-- Password: stock123
INSERT INTO users (username, email, password_hash, full_name, phone, role_id) VALUES
  ('stockmanager', 'stock@hussainsons.com', '$2b$10$xyNaDiWYQzZdgGLKg4WAye1EazZRL39JEvtlCrTHiI57qZGs6/eo2', 'Stock Manager', '+92-300-2222222', 5);

-- Cashier user
-- Email: cashier@hussainsons.com
-- Password: cashier123
INSERT INTO users (username, email, password_hash, full_name, phone, role_id) VALUES
  ('cashier', 'cashier@hussainsons.com', '$2b$10$6mVZvHV6/NzbVRsHUm8r9u0xZkOcFXXPb364uxvBfj8Nep7XIIHfW', 'Cashier Staff', '+92-300-3333333', 4);
