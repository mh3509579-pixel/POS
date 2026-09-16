-- Customers and Suppliers Seed Data

-- Customers
INSERT INTO customers (name, type, phone, email, address, city, credit_limit, total_purchases) VALUES
  ('MedCity Hospital', 'hospital', '+92-21-3456-7890', 'info@medcity.pk', '45 Sharah-e-Faisal', 'Karachi', 500000, 2500000),
  ('Kamran Brothers', 'wholesale', '+92-321-555-1234', 'kamran@brothers.pk', '12 Market Road', 'Lahore', 200000, 1200000),
  ('Dr. Ahmed Clinic', 'clinic', '+92-300-123-4567', 'dr.ahmed@clinic.pk', '78 Clifton Block 5', 'Karachi', 100000, 800000),
  ('Al-Rehman Medical Store', 'regular', '+92-333-987-6543', NULL, '23 Main Boulevard', 'Faisalabad', 50000, 450000),
  ('Fatima Memorial Hospital', 'hospital', '+92-42-3456-7890', 'pharmacy@fmh.pk', 'Shadman Town', 'Lahore', 800000, 5000000),
  ('Aysha Clinic', 'clinic', '+92-312-456-7890', NULL, '56 DHA Phase 1', 'Lahore', 75000, 350000),
  ('Bilal Medical', 'regular', '+92-345-678-9012', NULL, '89 Saddar', 'Rawalpindi', 30000, 200000),
  ('City Care Pharmacy', 'premium', '+92-321-234-5678', 'info@citycare.pk', '34 Gulberg III', 'Lahore', 150000, 900000),
  ('Shaheen Hospital', 'hospital', '+92-51-234-5678', 'admin@shaheen.pk', '67 F-8 Markaz', 'Islamabad', 600000, 3200000),
  ('Dr. Fatima Ali', 'regular', '+92-300-555-1234', NULL, '12 Bukhari Commercial', 'Karachi', 40000, 180000);

-- Suppliers
INSERT INTO suppliers (name, type, phone, email, address, city, contact_person, tax_number, payment_terms_days, current_balance, total_purchases, rating) VALUES
  ('Abbott Laboratories Pakistan', 'national', '+92-21-111-222-668', 'orders@abbott.pk', 'KAEMC, SITE Area', 'Karachi', 'Mr. Shahid', 'ABBT-PK-12345', 30, 450000, 3500000, 5),
  ('Sami Pharmaceuticals', 'national', '+92-21-111-726-472', 'sales@sami.pk', 'Korangi Industrial Area', 'Karachi', 'Mr. Tariq', 'SAM-PK-67890', 30, 280000, 2800000, 5),
  ('GlaxoSmithKline Pakistan', 'international', '+92-21-3568-1234', 'orders@gsk.pk', '35 Clifton', 'Karachi', 'Mr. Ahmed', 'GSK-PK-11111', 45, 620000, 4200000, 4),
  ('Getz Pharma', 'national', '+92-21-111-003-003', 'pharma@getz.pk', 'SITE Area', 'Karachi', 'Ms. Sara', 'GTZ-PK-22222', 30, 180000, 1500000, 4),
  ('Ferozsons Laboratories', 'national', '+92-42-111-337-697', 'info@ferozsons.pk', 'Canal Road', 'Lahore', 'Mr. Hassan', 'FRZ-PK-33333', 60, 350000, 2200000, 4),
  ('Highnoon Laboratories', 'national', '+92-51-2286-750', 'sales@highnoon.pk', 'I-9 Industrial Area', 'Islamabad', 'Mr. Imran', 'HIN-PK-44444', 30, 120000, 900000, 3),
  ('Atco Laboratories', 'national', '+92-42-111-123-456', 'orders@atco.pk', 'Multan Road', 'Lahore', 'Mr. Ali', 'ATC-PK-55555', 45, 200000, 1800000, 4),
  ('Bayer Pakistan', 'international', '+92-21-3568-9999', 'pk.orders@bayer.com', 'Sea View', 'Karachi', 'Mr. Mueller', 'BYR-PK-66666', 60, 500000, 3800000, 5),
  ('Pfizer Pakistan', 'international', '+92-21-3456-7890', 'orders@pfizer.pk', 'Clifton Block 9', 'Karachi', 'Mr. Khan', 'PFZ-PK-77777', 45, 380000, 2900000, 4),
  ('Reckitt Benckiser Pakistan', 'international', '+92-42-3456-1234', 'pk.orders@reckitt.com', 'Gulberg II', 'Lahore', 'Ms. Nida', 'RBT-PK-88888', 30, 90000, 700000, 3);
