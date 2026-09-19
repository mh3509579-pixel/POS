ALTER TABLE customers ADD COLUMN cnic VARCHAR(20) NULL AFTER email;
CREATE INDEX idx_customers_cnic ON customers(cnic);
