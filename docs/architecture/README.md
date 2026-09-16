# Architecture

## Overview

Hussain Son's Pharmacy POS follows a **Modular Monolith** architecture with **Onion Architecture** principles.

## Layers

### Domain Layer (Innermost)
- Entities, Value Objects, Domain Rules
- Repository interfaces
- **Must NOT depend on**: Express, Vercel, MySQL, HTTP, File System

### Application Layer
- Use cases, Application services, DTOs
- Transaction orchestration
- Repository interface usage

### Infrastructure Layer
- MySQL repositories, Database implementation
- External services, PDF generation
- **Depends on inner abstractions**

### Presentation Layer (Outermost)
- API routes, Controllers, Middleware
- Request validation, Response formatting
- Controllers MUST remain thin

## Module Boundaries

Each module is an independent business area within the monolith:
- Authentication, Users, Roles & Permissions
- Medicines, Inventory, Sales, Purchases
- Customers, Suppliers, Expenses
- Reports, Settings, Audit, Backup, Notifications

## Dependency Direction

```
Presentation → Application → Domain ← Infrastructure
```
