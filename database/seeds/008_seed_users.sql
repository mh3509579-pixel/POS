-- Users Seed Data
-- Default password for all users: Admin@123

INSERT INTO users (username, email, password_hash, full_name, phone, role_id) VALUES
  ('admin', 'admin@hussainsons.com', '$2b$10$hashed_password_admin', 'System Administrator', '+92-300-1111111', 1),
  ('ahmed', 'ahmed@hussainsons.com', '$2b$10$hashed_password_ahmed', 'Ahmed Khan', '+92-300-2222222', 2),
  ('fatima', 'fatima@hussainsons.com', '$2b$10$hashed_password_fatima', 'Fatima Bibi', '+92-300-3333333', 3),
  ('hassan', 'hassan@hussainsons.com', '$2b$10$hashed_password_hassan', 'Hassan Ali', '+92-300-4444444', 4),
  ('sara', 'sara@hussainsons.com', '$2b$10$hashed_password_sara', 'Sara Malik', '+92-300-5555555', 5);
