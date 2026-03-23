
# HAINK MasterDB System Architecture (Target Architecture)

This document defines the **target architecture** of the Haink MasterDB system.

The current implementation may differ from this design.  
Separate **audit documents** describe the current implementation state and migration progress.

This architecture represents the **intended system structure** that future development will follow.

---

# 1. Overview

Haink MasterDB is a **Central Product Data Platform** designed to manage product data, synchronize with external services, and support operational management tools.

The system provides:

- **Single Source of Truth (SSOT)** for product data
- Integration with external platforms (e.g. Imweb, ERP systems)
- Product code and metadata management
- Administrator-driven operational control
- Extensible architecture for future commerce platform development

The architecture separates responsibilities across four major components:

- **Frontend**
- **Backend**
- **Database**
- **Storage**

This separation ensures scalability, maintainability, and clear system boundaries.

---

# 2. High-Level Architecture

```
                ┌─────────────────────┐
                │      Frontend       │
                │      (Vercel)       │
                │     Next.js UI      │
                └──────────┬──────────┘
                           │ HTTPS
                           ▼
                ┌─────────────────────┐
                │      Backend        │
                │  Node.js / Fastify  │
                │  API & Integration  │
                └──────────┬──────────┘
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
 ┌───────────────┐                 ┌─────────────────┐
 │   PostgreSQL   │                 │       S3        │
 │   Database     │                 │   File Storage  │
 └───────────────┘                 └─────────────────┘
```

Each layer operates independently with clearly defined responsibilities.

---

# 3. Responsibility Boundaries

The MasterDB architecture strictly separates responsibilities between layers.

### Frontend Responsibilities

The frontend is responsible **only for user interface and interaction logic**.

Frontend does **NOT** perform:

- Database access
- Business logic execution
- External platform integration

Frontend responsibilities:

- Render administrator interfaces
- Handle user interaction
- Manage UI state
- Call Backend APIs
- Display operational data

Frontend communicates exclusively with the Backend through HTTPS APIs.

---

### Backend Responsibilities

The Backend is responsible for **all application logic and system operations**.

This includes:

- All CRUD APIs
- Business logic execution
- Data validation
- Authentication and authorization
- Integration with external systems
- Data synchronization
- File storage access
- Job orchestration

The Backend is the **only layer allowed to access the database or external systems**.

---

### Database Access Rule

```
Frontend → Backend API → Database
```

Direct database access from the frontend is **not permitted**.

---

### External Integration Rule

```
Frontend → Backend API → External Services
```

External platforms such as:

- Imweb
- ERP systems
- Other integrations

must only be accessed through the Backend.

---

# 4. System Components

## 4.1 Frontend

The frontend provides the administrative UI used by system operators.

Technology

- Next.js
- TypeScript
- Tailwind CSS

Responsibilities

- Product management UI
- Operational control interfaces
- Data visualization for administrators
- Triggering system operations through APIs

Deployment

- Hosted on **Vercel**
- CDN-based global distribution

Communication

```
Frontend → Backend API (HTTPS)
```

---

## 4.2 Backend

The Backend is the **core application layer** responsible for domain logic and integrations.

Technology

- Node.js
- Fastify
- Prisma ORM
- TypeScript

Responsibilities

- Product management APIs
- Reservation APIs
- Catalog rule APIs (e.g. thumbnail badge rules)
- External platform integration
- Data synchronization jobs
- Data validation
- Business logic execution
- Storage access control

The backend operates as a **stateless application server**.

---

## 4.3 Database

The system's structured data is stored in PostgreSQL.

Technology

- PostgreSQL
- Prisma ORM

Responsibilities

- Product data storage
- Product code management
- External system mapping
- System configuration data
- Operational metadata

Database is a **stateful system isolated from application servers**.

---

## 4.4 Storage

Binary and large files are stored in object storage.

Technology

- Amazon S3

Responsibilities

- Product image storage
- Data import/export files
- Static file assets

Storage access is mediated by the Backend.

---

# 5. Environment Structure

## Development Environment

Local development environment.

Components

- Frontend (local)
- Backend (local)
- Local PostgreSQL
- Development Storage

Purpose

- Safe feature development
- Data isolation from production

---

## Production Environment

Production environment processes real operational data.

Components

- Frontend (Vercel)
- Backend API Server
- Production PostgreSQL Database
- Production Storage (S3)

Development and production environments are fully isolated.

---

# 6. Storage Environment Separation

Storage uses separate buckets per environment.

Example:

```
masterdb-dev
masterdb-prod
```

Purpose

- Prevent accidental production data modification
- Separate testing files
- Protect operational assets

---

# 7. Database Management

Database schema is managed through ORM migrations.

Key features

- Versioned schema changes
- Automated migration application
- Controlled data structure evolution

All schema changes must go through migration workflows.

---

# 8. Integration Architecture

MasterDB includes an **Integration Layer** for external systems.

Example integrations

- Imweb
- ERP systems
- External commerce platforms

Responsibilities

- API communication
- Data mapping
- Synchronization management
- External identifier management

All integrations are handled exclusively by the Backend.

---

# 9. System Design Principles

### Separation of Concerns

The architecture separates system layers:

- Frontend (UI)
- Backend (Logic)
- Database (Data)
- Storage (Files)

---

### Single Source of Truth

All product data originates from MasterDB.

External platforms synchronize from this central system.

---

### Data Integrity

All validation and business rules are enforced by the Backend before data persistence.

---

### Extensibility

The architecture allows expansion into a full commerce platform.

---

# 10. Future Expansion

The architecture allows the following components to be added later:

- Worker runtime
- Background job processors
- Message queue
- Event-driven data pipelines
- Observability and monitoring stack

These additions will extend the Backend layer while keeping system boundaries intact.

---

# 11. Summary

Haink MasterDB target architecture:

```
Frontend  : Next.js (Vercel)
Backend   : Node.js / Fastify API
Database  : PostgreSQL
Storage   : Amazon S3
```

Key architectural rules:

- Frontend is **UI-only**
- Backend handles **all APIs and business logic**
- Database is accessed **only by Backend**
- External integrations are handled **only by Backend**

This architecture ensures:

- scalable system design
- secure data management
- maintainable system boundaries
- future expansion toward a full commerce platform
