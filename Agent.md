# HUSSAIN SON'S PHARMACY POS

## Master Development Specification & AI Coding Instructions

## 1. PROJECT IDENTITY

Project Name:

**Hussain Son's Pharmacy POS**

Software/Product Name:

**Hussain Pharmacy POS**

Business/Pharmacy Name:

**Hussain Son's Pharmacy**

Purpose:

Build a professional, secure, maintainable web-based Pharmacy Point of Sale and Pharmacy Management System.

The system must support:

* Pharmacy billing
* Medicine management
* Batch management
* Expiry management
* Inventory management
* Purchases
* Sales
* Sales returns
* Purchase returns
* Customers
* Suppliers
* Expenses
* Reports
* Users
* Roles and permissions
* Audit logs
* Backup
* Invoice printing
* Dashboard
* Barcode-based medicine lookup
* Professional pharmacy POS workflow

The application must be designed so it can initially operate for one pharmacy and later be extended to support multiple branches.

---

# 2. PRIMARY OBJECTIVE

Build a production-quality Pharmacy POS rather than a simple CRUD application.

The system must prioritize:

1. Data integrity
2. Security
3. Maintainability
4. Correct inventory calculations
5. Batch and expiry tracking
6. Transaction safety
7. Clear architecture
8. Good UX
9. Performance
10. Testability
11. Future extensibility

Do not sacrifice architecture quality just to generate code quickly.

---

# 3. REQUIRED ARCHITECTURE

The application MUST use:

## Modular Monolith

The system is one deployable application but is internally divided into independent business modules.

Required modules:

* Authentication
* Users
* Roles & Permissions
* Medicines
* Inventory
* Sales
* Purchases
* Customers
* Suppliers
* Expenses
* Reports
* Settings
* Audit
* Backup
* Notifications

Do NOT create microservices.

Do NOT split the application into multiple independently deployed backend services.

---

# 4. ONION ARCHITECTURE

Use Onion Architecture throughout the backend.

Dependency direction must point inward.

Required layers:

```text
Presentation
     ↓
Application
     ↓
Domain

Infrastructure depends on inner abstractions.
Domain must not depend on Infrastructure.
```

## Domain Layer

Contains:

* Entities
* Value Objects
* Domain rules
* Repository interfaces
* Domain services where necessary

The Domain layer MUST NOT depend on:

* Express
* Vercel
* MySQL
* Axios
* HTTP
* Browser APIs
* File system
* External services

## Application Layer

Contains:

* Use cases
* Application services
* DTOs
* Application-level validation
* Transaction orchestration
* Repository interface usage

Examples:

```text
CreateMedicine
UpdateMedicine
CreatePurchase
ReceivePurchase
CreateSale
ProcessSaleReturn
ProcessPurchaseReturn
AdjustStock
GetLowStockMedicines
GetExpiringMedicines
GenerateSalesReport
```

## Infrastructure Layer

Contains:

* MySQL repositories
* Database implementation
* External services
* PDF generation
* Backup implementation
* Logging implementation
* Other technology-specific implementations

## Presentation Layer

Contains:

* API routes
* Controllers
* Request validation
* Response formatting
* Authentication middleware
* Authorization middleware

Controllers MUST remain thin.

Business logic must not be placed directly inside controllers.

---

# 5. MONOREPO

Use one Git repository.

Recommended structure:

```text
hussain-pharmacy-pos/

├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   ├── shared/
│   └── types/
│
├── database/
│   ├── migrations/
│   └── seeds/
│
├── docs/
│   ├── architecture/
│   ├── database/
│   ├── api/
│   └── requirements/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── AGENTS.md
├── README.md
├── package.json
├── .gitignore
└── .env.example
```

Do not duplicate shared types unnecessarily.

---

# 6. TECHNOLOGY STACK

## Frontend

Use:

* HTML5
* CSS3
* TypeScript
* Bootstrap 5
* Axios
* Chart.js
* SweetAlert2
* Day.js

The frontend should be modular and component-oriented even without requiring React.

## Backend

Use:

* Node.js
* TypeScript
* Express-compatible API architecture where appropriate for Vercel
* REST API
* MySQL

## Database

Use:

**MySQL**

Use migrations.

Never rely on manually modifying production tables.

---

# 7. DEPLOYMENT REQUIREMENTS

The project will eventually be deployed using:

* GitHub for source control
* Vercel for web/API hosting
* A separate MySQL-compatible cloud database

The backend MUST be compatible with Vercel's serverless execution model.

Do not assume a permanently running server process.

Avoid architecture that depends on:

```text
app.listen(...)
```

for production deployment.

Database connections must be handled appropriately for serverless execution.

Environment variables must be used for:

```text
DATABASE_URL
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
JWT_SECRET
```

Only include variables that are actually required by the implementation.

Never commit secrets.

---

# 8. SECURITY RULES

Security is mandatory.

Implement:

* Password hashing
* Authentication
* Authorization
* Role-based access control
* Input validation
* Server-side validation
* SQL injection protection
* XSS protection
* Secure authentication tokens/sessions
* Secure cookies where applicable
* Rate limiting where appropriate
* Proper CORS configuration
* Security headers
* Audit logging
* Environment variables for secrets

Never store passwords in plaintext.

Never trust frontend validation alone.

All important permissions MUST be checked on the backend.

---

# 9. USER ROLES

Initial roles:

```text
SUPER_ADMIN
ADMIN
PHARMACIST
CASHIER
INVENTORY_MANAGER
ACCOUNTANT
```

Permissions must be granular.

Examples:

```text
SALE_VIEW
SALE_CREATE
SALE_RETURN
SALE_DELETE

MEDICINE_VIEW
MEDICINE_CREATE
MEDICINE_UPDATE
MEDICINE_DELETE

PURCHASE_VIEW
PURCHASE_CREATE
PURCHASE_RETURN

INVENTORY_VIEW
INVENTORY_ADJUST

REPORT_VIEW
REPORT_EXPORT

USER_VIEW
USER_CREATE
USER_UPDATE
USER_DELETE

SETTINGS_VIEW
SETTINGS_UPDATE

BACKUP_CREATE
BACKUP_RESTORE
```

Never rely only on hiding frontend buttons.

Backend authorization is mandatory.

---

# 10. DATABASE DESIGN PRINCIPLES

The database must be normalized and relational.

Use:

* Primary keys
* Foreign keys
* Unique constraints
* Appropriate indexes
* NOT NULL constraints
* CHECK constraints where supported
* Timestamps
* Soft deletion where appropriate

Do not store important relational data as arbitrary JSON when a proper relational design is more appropriate.

---

# 11. CORE DATABASE TABLES

Initial database design should include:

```text
users
roles
permissions
role_permissions

medicines
medicine_categories
manufacturers
medicine_units
medicine_batches

suppliers
customers

purchases
purchase_items

purchase_returns
purchase_return_items

sales
sale_items

sale_returns
sale_return_items

stock_movements

payments

expenses
expense_categories

audit_logs

settings
```

Future multi-branch support may add:

```text
branches
user_branches
branch_inventory
```

Do not implement multi-branch complexity until required by the current milestone.

---

# 12. MEDICINE MODEL

Medicine and batch MUST be separate concepts.

Example:

```text
Medicine:
Paracetamol 500mg

Batch A:
Batch Number: A101
Expiry: 2027-05
Stock: 50
Purchase Price: 40
Sale Price: 50

Batch B:
Batch Number: A102
Expiry: 2028-02
Stock: 100
Purchase Price: 42
Sale Price: 52
```

Never assume one medicine has only one batch.

---

# 13. INVENTORY RULES

Inventory is a critical business area.

Stock changes only through controlled business operations.

Examples:

```text
Purchase             → Stock +
Sale                 → Stock -
Sale Return          → Stock +
Purchase Return      → Stock -
Stock Adjustment     → Stock +/-
```

Every stock change must create a stock movement record.

Stock movement should record:

* Medicine
* Batch
* Quantity
* Movement type
* Reference
* Date/time
* User

Do not allow random frontend code to directly modify stock.

---

# 14. STOCK TRANSACTION RULE

Sales, purchases, and returns must use database transactions.

For a sale:

```text
Create Sale
Create Sale Items
Reduce Stock
Create Stock Movements
Create Payment
```

All operations should succeed together.

If one important operation fails, rollback the transaction.

Never allow partially completed sales.

---

# 15. EXPIRY MANAGEMENT

The system must support:

* Expired medicines
* Medicines expiring within 30 days
* Medicines expiring within 60 days
* Medicines expiring within 90 days

Expired stock must not be automatically available for normal sale.

The UI must clearly display expiry status.

---

# 16. POS REQUIREMENTS

The POS must be fast and keyboard-friendly.

Required features:

* Medicine search
* Barcode input
* Cart
* Quantity changes
* Batch selection where necessary
* Price calculation
* Discount
* Tax
* Customer selection
* Walk-in customer
* Payment method
* Received amount
* Change calculation
* Hold sale
* Resume sale
* Remove item
* Clear cart
* Complete sale
* Print invoice
* Sale return

Suggested shortcuts:

```text
F2 → Medicine Search
F4 → Customer
F8 → Hold Sale
F9 → Payment
ESC → Close Modal
DELETE → Remove Item
CTRL + ENTER → Complete Sale
```

Shortcuts must not interfere with browser/system shortcuts unnecessarily.

---

# 17. SALES WORKFLOW

Required flow:

```text
Search/Scan Medicine
        ↓
Select Batch
        ↓
Check Stock
        ↓
Add to Cart
        ↓
Calculate Total
        ↓
Apply Discount/Tax
        ↓
Select Payment
        ↓
Validate
        ↓
Database Transaction
        ↓
Create Sale
        ↓
Reduce Stock
        ↓
Create Stock Movement
        ↓
Create Payment
        ↓
Generate Invoice
```

---

# 18. PURCHASE WORKFLOW

```text
Select Supplier
        ↓
Enter Purchase Invoice
        ↓
Add Medicine
        ↓
Enter Batch
        ↓
Enter Expiry
        ↓
Enter Quantity
        ↓
Enter Purchase Price
        ↓
Enter Sale Price
        ↓
Save Purchase
        ↓
Create/Update Batch
        ↓
Increase Stock
        ↓
Create Stock Movement
        ↓
Update Supplier Balance
```

---

# 19. RETURN WORKFLOWS

## Sale Return

```text
Find Sale
↓
Select Items
↓
Select Quantity
↓
Validate Return Quantity
↓
Calculate Refund
↓
Return Stock
↓
Create Stock Movement
↓
Record Refund
```

## Purchase Return

```text
Find Purchase
↓
Select Items
↓
Select Quantity
↓
Validate
↓
Reduce Stock
↓
Create Stock Movement
↓
Update Supplier Balance
```

---

# 20. FRONTEND DESIGN SYSTEM

Use a professional pharmacy/business dashboard style.

Brand:

**Hussain Son's Pharmacy**

Primary colors:

```text
Navy
Medical Green
Teal
White
Light Gray
```

Use a clean modern font such as:

**Inter**

UI must be:

* Professional
* Clean
* Fast
* Desktop-first
* Responsive
* Accessible
* Consistent

Do not use excessive animations.

Do not use random colors on different pages.

---

# 21. GLOBAL FRONTEND LAYOUT

Authenticated pages should use:

```text
AppShell
├── Sidebar
├── Topbar
├── Breadcrumb
├── PageHeader
└── MainContent
```

Sidebar sections:

```text
Dashboard
POS
Medicines
Inventory
Purchases
Sales
Customers
Suppliers
Expenses
Reports
Users
Audit
Backup
Settings
```

Items must be displayed according to user permissions.

---

# 22. REQUIRED FRONTEND PAGES

## Authentication

```text
/login
/forgot-password
/reset-password
```

## Dashboard

```text
/dashboard
```

## POS

```text
/pos
/pos/held-sales
```

## Medicines

```text
/medicines
/medicines/new
/medicines/:id
/medicines/:id/edit
/medicines/categories
/medicines/manufacturers
```

## Inventory

```text
/inventory
/inventory/batches
/inventory/low-stock
/inventory/expiring
/inventory/expired
/inventory/movements
/inventory/adjustments
```

## Purchases

```text
/purchases
/purchases/new
/purchases/:id
/purchases/returns
```

## Sales

```text
/sales
/sales/:id
/sales/returns
```

## Suppliers

```text
/suppliers
/suppliers/new
/suppliers/:id
/suppliers/:id/edit
```

## Customers

```text
/customers
/customers/new
/customers/:id
/customers/:id/edit
```

## Expenses

```text
/expenses
/expenses/new
/expenses/categories
```

## Reports

```text
/reports
/reports/sales
/reports/purchases
/reports/profit
/reports/inventory
/reports/expiry
/reports/expenses
/reports/products
/reports/customers
/reports/suppliers
```

## Administration

```text
/users
/users/new
/users/:id/edit
/roles
/audit
```

## Settings

```text
/settings
/settings/pharmacy
/settings/invoice
/settings/tax
/settings/security
/settings/notifications
```

## System

```text
/backup
/notifications
/profile
```

---

# 23. REQUIRED GLOBAL COMPONENTS

Build reusable components.

## Layout

```text
AppShell
Sidebar
Topbar
Breadcrumb
PageHeader
```

## Buttons

```text
PrimaryButton
SecondaryButton
DangerButton
IconButton
LoadingButton
```

## Forms

```text
TextInput
NumberInput
DateInput
Select
SearchSelect
Checkbox
Radio
Toggle
BarcodeInput
```

## Tables

```text
DataTable
Pagination
Search
Filter
Sort
EmptyState
LoadingState
```

## Feedback

```text
Toast
Alert
ConfirmDialog
LoadingSpinner
ErrorState
```

## Pharmacy components

```text
MedicineSelector
BatchSelector
CustomerSelector
SupplierSelector
PaymentModal
InvoicePreview
StockBadge
ExpiryBadge
StatusBadge
```

Do not duplicate these components across pages.

---

# 24. FRONTEND API RULE

Frontend must communicate with the backend through service modules.

Do not write raw API requests randomly inside page files.

Example:

```text
services/
├── auth.service.ts
├── medicine.service.ts
├── inventory.service.ts
├── sales.service.ts
├── purchase.service.ts
├── customer.service.ts
└── supplier.service.ts
```

Page:

```text
Page
 ↓
Service
 ↓
API
```

not:

```text
Page
 ↓
Direct database
```

The frontend must NEVER access MySQL directly.

---

# 25. ERROR HANDLING

Every API operation must handle:

* Loading
* Success
* Validation errors
* Authorization errors
* Not found
* Server errors
* Network errors

Never expose raw database errors to users.

Use user-friendly messages.

---

# 26. TABLE REQUIREMENTS

Important tables must support:

* Search
* Sorting
* Pagination
* Filters
* Loading state
* Empty state
* Error state
* Responsive behavior

Do not load thousands of records unnecessarily.

Use server-side pagination for large datasets.

---

# 27. REPORT REQUIREMENTS

Reports should support:

* Date range
* Filters
* Search
* Generate
* Print
* PDF export where implemented
* Excel/CSV export where implemented

Required reports:

```text
Sales
Purchases
Profit
Inventory
Expiry
Expenses
Products
Customers
Suppliers
Stock Movements
```

---

# 28. INVOICE REQUIREMENTS

Invoice must display:

* Pharmacy logo
* Pharmacy name
* Pharmacy contact information
* Invoice number
* Date
* Customer
* Cashier
* Medicine
* Batch
* Quantity
* Price
* Discount
* Tax
* Total
* Payment method
* Amount paid
* Change
* Footer message

Support:

* Print preview
* A4
* Thermal receipt layouts where feasible

---

# 29. ACCESSIBILITY

Use:

* Proper labels
* Keyboard navigation
* Focus management
* Accessible buttons
* Accessible forms
* Appropriate ARIA attributes
* Sufficient contrast

Do not rely only on colors to communicate status.

---

# 30. AUDIT LOGGING

Record important actions:

```text
Login
Logout
Create
Update
Delete
Sale
Sale Return
Purchase
Purchase Return
Stock Adjustment
User changes
Permission changes
Settings changes
Backup
Restore
```

Audit records should contain enough information to determine:

```text
Who
What
When
Which record
```

---

# 31. TESTING REQUIREMENTS

Use three testing levels.

## Unit Tests

Test business logic:

* Sale calculation
* Discount
* Tax
* Stock calculation
* Expiry rules
* Permission rules

## Integration Tests

Test:

* API + database
* Purchase + inventory
* Sale + inventory
* Returns + inventory

## E2E Tests

Test complete workflows:

```text
Login
→ Create Medicine
→ Create Supplier
→ Create Purchase
→ Verify Stock
→ Create Sale
→ Verify Stock Reduction
→ Print Invoice
→ Create Return
→ Verify Stock Restoration
```

Do not mark a feature complete without testing it.

---

# 32. CODE QUALITY RULES

Use:

* TypeScript strict mode
* ESLint
* Prettier
* Clear naming
* Small functions
* Single Responsibility Principle
* DRY
* SOLID principles where appropriate

Avoid:

* Giant files
* Giant functions
* Duplicate business logic
* Hard-coded credentials
* Hard-coded URLs
* Direct database calls from controllers
* Direct database calls from frontend
* Business logic in HTML
* Business logic in route definitions

---

# 33. DATABASE MIGRATION RULE

Every database change must be represented by a migration.

Never tell the user to manually modify production database tables.

Migration history must remain reproducible.

Seed data must be separate from migrations.

---

# 34. GIT RULES

Use meaningful commits.

Examples:

```text
feat: add medicine module
feat: implement purchase workflow
feat: add POS cart
fix: prevent sale of expired batch
fix: correct stock return calculation
refactor: improve medicine repository
test: add sale transaction tests
docs: update database architecture
```

Do not commit:

```text
.env
passwords
API keys
database passwords
JWT secrets
private credentials
```

---

# 35. DEVELOPMENT RULE

Do NOT generate the entire application in one step.

Work milestone-by-milestone.

Before implementing a milestone:

1. Inspect existing code.
2. Understand the current architecture.
3. Identify dependencies.
4. Plan the change.
5. Implement.
6. Run tests.
7. Fix errors.
8. Verify architecture.
9. Update documentation.
10. Report what changed.

Never overwrite working code unnecessarily.

---

# 36. ARCHITECTURE PROTECTION RULE

Do not change the architecture without explicit approval.

Do not:

* Introduce microservices
* Introduce unnecessary frameworks
* Move business logic into controllers
* Couple domain to MySQL
* Couple domain to Express
* Couple domain to Vercel
* Create random utility layers
* Duplicate repositories
* Create duplicate entities

If an architectural change appears necessary, explain the reason before making it.

---

# 37. PHASED DEVELOPMENT PLAN

Implement in this exact order.

### Phase 1

Project initialization

### Phase 2

Database architecture and migrations

### Phase 3

Core backend architecture

### Phase 4

Authentication

### Phase 5

Users/Roles/Permissions

### Phase 6

Medicine module

### Phase 7

Medicine batches

### Phase 8

Inventory

### Phase 9

Suppliers

### Phase 10

Purchases

### Phase 11

Customers

### Phase 12

POS

### Phase 13

Sales

### Phase 14

Returns

### Phase 15

Expenses

### Phase 16

Reports

### Phase 17

Dashboard

### Phase 18

Invoice/Printing

### Phase 19

Audit

### Phase 20

Backup

### Phase 21

Notifications

### Phase 22

Security hardening

### Phase 23

Testing

### Phase 24

Production optimization

### Phase 25

Vercel deployment

---

# 38. DEFINITION OF DONE

A feature is NOT complete simply because code has been generated.

A feature is complete only when:

* Backend implemented
* Frontend implemented
* Validation implemented
* Authorization implemented
* Database migration completed
* Error handling completed
* Loading state implemented
* Empty state implemented where relevant
* Tests implemented
* Tests pass
* No architecture violation
* Documentation updated
* Existing functionality still works

---

# 39. AI CODING AGENT BEHAVIOR

When working on this project:

1. Read `AGENTS.md` first.
2. Inspect the existing project before modifying files.
3. Do not assume missing architecture.
4. Do not create duplicate functionality.
5. Reuse existing components/services.
6. Follow existing naming conventions.
7. Follow the established module boundaries.
8. Keep controllers thin.
9. Keep domain independent.
10. Keep frontend independent from database.
11. Use transactions for critical business operations.
12. Test changes.
13. Fix errors before moving forward.
14. Do not silently change requirements.
15. Do not introduce unnecessary dependencies.
16. Do not remove working functionality without explicit instruction.

---

# 40. CURRENT DEVELOPMENT GOAL

Do NOT start implementing all modules immediately.

The first task is:

**Create the project foundation and architecture only.**

First establish:

```text
Monorepo
TypeScript
Frontend
Backend
Onion Architecture
Module boundaries
Database configuration
Environment configuration
Linting
Formatting
Testing foundation
Git configuration
Documentation
```

Do not implement POS, Sales, Purchases or other business modules until the foundation has been reviewed.

---

# 41. IMPORTANT BUSINESS RULE

This is pharmacy software.

Inventory accuracy is critical.

Never make assumptions about stock.

Never allow:

* Negative stock unless explicitly supported
* Sale of expired batches
* Return quantities greater than sold quantities
* Purchase return greater than purchased quantity
* Invalid batch references
* Invalid payment totals

All such rules must be validated server-side.

---

# 42. FUTURE EXTENSIBILITY

The system should be designed so future versions can support:

* Multiple branches
* Cloud synchronization
* Mobile application
* PWA/offline capabilities
* Advanced accounting
* Supplier portal
* Customer portal
* Online ordering
* Subscription/SaaS model
* Advanced analytics

Do not implement these features now unless explicitly requested.

Design for extension without over-engineering the current version.

---

# 43. FINAL ARCHITECTURE

The final system should follow:

```text
GitHub Monorepo
        │
        ├── Web Application
        │
        └── API Application
                │
                ▼
        Modular Monolith
                │
        ┌───────┴────────┐
        │                │
 Presentation      Application
        │                │
        └───────┬────────┘
                │
             Domain
                │
                ▲
                │
        Infrastructure
                │
              MySQL
```

The frontend communicates only with the API.

The backend owns business rules.

The domain owns core business logic.

Infrastructure owns technical implementations.

MySQL owns persistent data.

GitHub owns source control.

Vercel hosts the deployable web/API application.

---

# 44. FIRST COMMAND TO EXECUTE

Before writing business functionality, inspect the repository and produce:

1. Current directory structure
2. Existing files
3. Existing package configuration
4. Existing dependencies
5. Existing TypeScript configuration
6. Existing database configuration
7. Existing architecture
8. Any conflicts with this specification

Then provide a short implementation plan.

Do not generate the entire project yet.

After inspection, begin only Phase 1.

# END OF MASTER SPECIFICATION
