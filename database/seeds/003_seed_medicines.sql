-- Medicine Seed Data

-- Categories
INSERT INTO medicine_categories (name, description) VALUES
  ('Tablets', 'Oral solid dosage form'),
  ('Capsules', 'Oral capsule dosage form'),
  ('Syrups', 'Oral liquid dosage form'),
  ('Injections', 'Injectable dosage form'),
  ('Ointments', 'Topical dosage form'),
  ('Drops', 'Ophthalmic/otic/nasal drops'),
  ('Powder', 'Powder for reconstitution or direct use'),
  ('Inhalers', 'Respiratory inhalation devices'),
  ('Gels', 'Topical gel dosage form'),
  ('Suspensions', 'Oral suspension dosage form');

-- Manufacturers
INSERT INTO manufacturers (name, country, contact_info) VALUES
  ('Sami Pharmaceuticals', 'Pakistan', '+92-21-111-726-472'),
  ('Abbott Laboratories', 'Pakistan', '+92-21-111-222-668'),
  ('GlaxoSmithKline', 'UK', '+44-20-8047-4000'),
  ('Getz Pharma', 'Pakistan', '+92-21-111-003-003'),
  ('Ferozsons Laboratories', 'Pakistan', '+92-42-111-337-697'),
  ('Highnoon Laboratories', 'Pakistan', '+92-51-2286-750'),
  ('Atco Laboratories', 'Pakistan', '+92-42-111-123-456'),
  ('Bayer', 'Germany', '+49-214-30-0'),
  ('Pfizer', 'USA', '+1-212-733-2323'),
  ('Reckitt Benckiser', 'UK', '+44-1753-217-000');

-- Units
INSERT INTO medicine_units (name, short_name) VALUES
  ('Tablets', 'tab'),
  ('Capsules', 'cap'),
  ('Bottle', 'btl'),
  ('Ampoule', 'amp'),
  ('Tube', 'tube'),
  ('Drop', 'drop'),
  ('Sachet', 'sach'),
  ('Inhaler', 'inh'),
  ('Puff', 'puff'),
  ('Milliliter', 'ml');

-- Medicines (common Pakistani pharmacy stock)
INSERT INTO medicines (name, generic_name, category_id, manufacturer_id, unit_id, barcode, strength, form, reorder_level) VALUES
  ('Panadol', 'Paracetamol', 1, 2, 1, '8964000100013', '500mg', 'Tablet', 100),
  ('Panadol Extra', 'Paracetamol + Caffeine', 1, 2, 1, '8964000100014', '500mg', 'Tablet', 50),
  ('Brufen', 'Ibuprofen', 1, 2, 1, '8964000100020', '400mg', 'Tablet', 80),
  ('Augmentin', 'Amoxicillin + Clavulanate', 1, 3, 1, '8964000100030', '625mg', 'Tablet', 40),
  ('Flagyl', 'Metronidazole', 1, 1, 1, '8964000100040', '400mg', 'Tablet', 60),
  ('Nexium', 'Esomeprazole', 1, 3, 1, '8964000100050', '40mg', 'Capsule', 30),
  ('Lipitor', 'Atorvastatin', 1, 9, 1, '8964000100060', '20mg', 'Tablet', 40),
  ('Glucophage', 'Metformin', 1, 9, 1, '8964000100070', '500mg', 'Tablet', 50),
  ('Norvasc', 'Amlodipine', 1, 9, 1, '8964000100080', '5mg', 'Tablet', 40),
  ('Coartem', 'Artemether + Lumefantrine', 1, 10, 1, '8964000100090', '20/120mg', 'Tablet', 30),
  ('Calpol', 'Paracetamol', 3, 2, 3, '8964000100100', '120mg/5ml', 'Syrup', 40),
  ('ORS', 'Oral Rehydration Salts', 7, 4, 7, '8964000100110', '1 sachet', 'Powder', 100),
  ('Betnovate', 'Betamethasone', 5, 3, 5, '8964000100120', '0.1%', 'Ointment', 30),
  ('Cetirizine', 'Cetirizine HCl', 1, 1, 1, '8964000100130', '10mg', 'Tablet', 80),
  ('Omeprazole', 'Omeprazole', 1, 7, 1, '8964000100140', '20mg', 'Capsule', 50),
  ('Amoxicillin', 'Amoxicillin', 1, 7, 1, '8964000100150', '500mg', 'Capsule', 60),
  ('Azithromycin', 'Azithromycin', 1, 4, 1, '8964000100160', '250mg', 'Tablet', 40),
  ('Dolo', 'Paracetamol', 1, 6, 1, '8964000100170', '650mg', 'Tablet', 60),
  ('Gaviscon', 'Sodium Alginate', 1, 10, 1, '8964000100180', '500mg', 'Tablet', 25),
  ('Ventolin', 'Salbutamol', 8, 3, 8, '8964000100190', '100mcg', 'Inhaler', 20);

-- Medicine Batches
INSERT INTO medicine_batches (medicine_id, batch_number, expiry_date, purchase_price, sale_price, quantity, supplier_id) VALUES
  (1, 'PAN-2024-A01', '2026-12-31', 18.00, 25.00, 500, 1),
  (1, 'PAN-2024-A02', '2027-06-30', 19.00, 25.00, 300, 1),
  (2, 'PANE-2024-B01', '2026-10-31', 32.00, 45.00, 200, 1),
  (3, 'BRU-2024-C01', '2027-03-31', 12.00, 18.00, 400, 2),
  (4, 'AUG-2024-D01', '2026-08-31', 85.00, 120.00, 150, 3),
  (5, 'FLG-2024-E01', '2027-01-31', 8.00, 12.00, 300, 1),
  (6, 'NEX-2024-F01', '2026-11-30', 280.00, 380.00, 80, 3),
  (7, 'LIP-2024-G01', '2027-05-31', 150.00, 220.00, 100, 9),
  (8, 'GLU-2024-H01', '2027-02-28', 22.00, 35.00, 250, 9),
  (9, 'NOR-2024-I01', '2027-04-30', 65.00, 95.00, 120, 9),
  (11, 'CAL-2024-J01', '2026-09-30', 45.00, 65.00, 200, 2),
  (12, 'ORS-2024-K01', '2027-08-31', 5.00, 10.00, 500, 4),
  (13, 'BET-2024-L01', '2027-07-31', 35.00, 55.00, 150, 3),
  (14, 'CET-2024-M01', '2027-09-30', 5.00, 8.00, 400, 1),
  (15, 'OMR-2024-N01', '2027-01-15', 18.00, 30.00, 200, 7),
  (16, 'AMX-2024-O01', '2026-12-15', 25.00, 40.00, 180, 7),
  (17, 'AZT-2024-P01', '2027-03-15', 55.00, 80.00, 120, 4),
  (18, 'DOL-2024-Q01', '2027-06-15', 20.00, 30.00, 250, 6),
  (19, 'GAV-2024-R01', '2027-04-15', 90.00, 130.00, 80, 10),
  (20, 'VEN-2024-S01', '2027-02-28', 350.00, 480.00, 50, 3);
