-- Restore minimum operating permissions for the three default login roles.
--
-- Why: on the deployed database the seeded `role_permissions` rows for the
-- cashier role were missing, so POST /api/medicines and POST /api/customers
-- returned 403 "Insufficient permissions" and the cashier could not run a sale.
--
-- Roles are resolved by NAME, not id, because the live database has role ids
-- that do not match database/seeds/009_seed_3users.sql (the stock manager role
-- is `stock_manager`, not the seeded `inventory_manager`).
--
-- Safe to run repeatedly: role_permissions has UNIQUE (role_id, permission_id)
-- and every insert is guarded with INSERT IGNORE.
--
-- This only ADDS grants. It never revokes, so no existing access is lost.

-- ---------------------------------------------------------------------------
-- Diagnostic (run first to see current state):
--
--   SELECT r.id, r.name, COUNT(rp.id) AS permission_count
--   FROM roles r
--   LEFT JOIN role_permissions rp ON rp.role_id = r.id
--   GROUP BY r.id, r.name
--   ORDER BY r.id;
--
--   SELECT u.username, r.name AS role, p.name AS permission
--   FROM users u
--   JOIN roles r ON r.id = u.role_id
--   LEFT JOIN role_permissions rp ON rp.role_id = r.id
--   LEFT JOIN permissions p ON p.id = rp.permission_id
--   WHERE u.username IN ('admin', 'stockmanager', 'cashier')
--   ORDER BY u.username, p.name;
-- ---------------------------------------------------------------------------

-- 1) Cashier: POS operator.
--    Needs to read medicines and customers in order to build a sale.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'cashier'
  AND p.module IN ('pos', 'medicines', 'customers')
  AND p.action IN ('access', 'sale.create', 'return.create', 'sale.void', 'view', 'create', 'update');

-- 2) Stock manager: medicines, stock, purchases and suppliers.
--    Matches both the seeded `inventory_manager` name and the live `stock_manager`.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('inventory_manager', 'stock_manager')
  AND p.module IN ('medicines', 'inventory', 'purchases', 'suppliers');

-- 3) Admin: full access (role id 2 already bypasses checks via SUPER_ADMIN_ROLE_IDS,
--    but grant explicitly so the grants survive if that shortcut is ever removed).
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin';

-- Verification: each default role should now report a non-trivial permission count.
SELECT r.name AS role, COUNT(rp.id) AS permission_count
FROM roles r
LEFT JOIN role_permissions rp ON rp.role_id = r.id
WHERE r.name IN ('admin', 'cashier', 'inventory_manager', 'stock_manager')
GROUP BY r.name
ORDER BY r.name;
