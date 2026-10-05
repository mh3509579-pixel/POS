-- 012_fix_payments_payment_method_enum.sql
-- Adds the 'credit' value to payments.payment_method.
--
-- Why: sales.payment_method already allows 'credit' (005_create_transaction_tables.sql:19)
-- and purchases.payment_method allows it too (line 68), but payments.payment_method was
-- created without it (006_create_inventory_tables.sql:37). Recording a credit sale or a
-- credit purchase therefore failed with MySQL error 1265 (Data truncated for column
-- 'payment_method') *after* the sale/purchase rows had already been written.
--
-- Idempotent: safe to run on a database where the migration was never applied.

SET @has_credit := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'payments'
    AND COLUMN_NAME = 'payment_method'
    AND COLUMN_TYPE LIKE '%'credit'%'
);

SET @sql := IF(
  @has_credit > 0,
  'DO 0',
  'ALTER TABLE payments MODIFY COLUMN payment_method ENUM(''cash'', ''card'', ''bank_transfer'', ''online'', ''cheque'', ''credit'') NOT NULL'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;