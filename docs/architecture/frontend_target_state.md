
# MasterDB Frontend Target State

## Purpose

This document defines the **target state of the MasterDB Frontend**.

The frontend is designed to function as the **Administrator Console UI** for operating the MasterDB system.

It is intentionally separated from backend responsibilities to ensure a clean system architecture.

---

## Core Principle

Frontend is **UI-only**.

Frontend MUST NOT:

- Access the database directly
- Perform business logic
- Call external integrations directly
- Execute synchronization logic

Frontend MUST:

- Render administrator interfaces
- Handle user interactions
- Manage UI state
- Call Backend APIs
- Display operational system data

All system operations occur through Backend APIs.

---

## Technology Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod (validation)
- API Client Layer

Deployment:

- Vercel

---

## Target Architecture

```
Browser
   │
   ▼
Frontend (Next.js / Vercel)
   │
   ▼
Backend API
```

Frontend communicates with the backend exclusively through HTTPS APIs.

---

## Feature Modules

Frontend should be organized by **feature modules**, not pages.

Example structure:

```
src/features/
 ├ products
 ├ reservations
 ├ catalog-rules
 ├ integrations
 └ operations
```

Each feature module contains:

```
feature/
 ├ pages
 ├ components
 ├ api client
 ├ types
 └ hooks
```

---

## Target Screens

### Product Management

```
/products
/products/new
/products/:id
```

Capabilities:

- search
- filter
- pagination
- edit
- delete
- sync

---

### Reservation Management

```
/reservations
/reservations/new
/reservations/:id
```

---

### Catalog Rules

```
/catalog-rules/badges
```

Manages category-based thumbnail badge rules.

---

### Operations

```
/operations/sync
/operations/master-codes
/operations/exchange-rates
```

Operational controls for the system.

---

### Integrations

```
/integrations/imweb
/integrations/ecount
```

Integration configuration and monitoring.

---

### System

```
/settings
/activity-log
```

System configuration and operational history.

---

## Required Frontend Capabilities

The frontend must support:

- authentication
- role guard
- API client abstraction
- loading states
- error handling
- pagination
- form validation
- consistent mutation patterns

---

## Design Goals

The frontend should evolve from:

```
Internal Tool → Operational Console → Commerce Admin UI
```

Key goals:

- maintainable feature modules
- scalable admin console architecture
- clear separation from backend responsibilities
- extensibility for future commerce operations
