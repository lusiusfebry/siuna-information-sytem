# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bebang Sistem Informasi (BIS) — an enterprise HR/ERP system for managing employees, master data, attendance, leaves, and documents. Indonesian-language UI with Indonesian-language error messages and field names throughout.

## Commands

### Backend (run from `backend/`)
```bash
npm run dev              # Start dev server (nodemon + ts-node), port 3000
npm run build            # TypeScript compile to dist/
npm run migrate          # Run database migrations (umzug)
npm run seed             # Seed database
npm run test             # Run all tests (Jest)
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
npm run type-check       # TypeScript type check without emit
```

### Frontend (run from `frontend/`)
```bash
npm run dev              # Start Vite dev server, port 5173
npm run build            # TypeScript check + Vite build
npm run test             # Run tests (Vitest, watch mode)
npm run test:run         # Run tests once
npm run test:e2e         # Playwright E2E tests
npm run lint             # ESLint check
```

### Docker (run from `docker/`)
```bash
docker-compose up -d     # Start PostgreSQL (port 5433), Redis, pgAdmin (port 5050)
```

## Architecture

### Backend — Modular Express + TypeScript + Sequelize (PostgreSQL)

```
backend/src/
  index.ts                     # Express app setup, middleware chain, error handler
  config/                      # env.ts (config from .env), database.ts (Sequelize), swagger.ts
  modules/
    hr/                        # HR domain module
      controllers/             # Request handlers (employee, master-data, dashboard, import, export, document, qrcode, audit)
      services/                # Business logic layer
      models/                  # Sequelize models + associations.ts
      routes/hr.routes.ts      # Single route file, all HR endpoints under /api/hr
      validators/              # Request validation
      types/                   # TypeScript interfaces
    auth/                      # Auth module (login, roles, users)
      routes/                  # auth.routes.ts, role.routes.ts, user.routes.ts → all under /api/auth
  shared/
    middleware/                 # auth (JWT), permission (RBAC), cache (Redis), rate-limit, upload (multer), validation, audit logging, performance monitoring
    services/                  # cache-warming.service
    constants/                 # permissions.ts (RESOURCES, ACTIONS)
    utils/                     # scheduler (node-cron)
  database/
    migrations/                # Numbered migration files (00–27), managed by umzug
    migrate.ts, seed.ts, umzug.ts
```

**Key patterns:**
- All routes are JWT-authenticated via `authenticate` middleware
- RBAC enforced via `checkPermission(RESOURCE, ACTION)` middleware
- Department-scoped access via `checkDepartmentAccess()` middleware
- Redis caching with cache middleware and cache-warming on startup
- Migrations are sequential numbered files using umzug (not Sequelize CLI)
- Error handler in `index.ts` catches Sequelize FK constraint errors (codes 23503, 23001) and returns Indonesian error messages
- Swagger docs available at `/api-docs`

### Frontend — React 18 + Vite + TailwindCSS + TypeScript

```
frontend/src/
  App.tsx                      # Route definitions with lazy loading, PermissionGuard on every route
  components/
    common/                    # Shared UI components
    layout/                    # MainLayout (sidebar + content area)
    auth/                      # ProtectedRoute, PermissionGuard
    hr/, dashboard/            # Domain-specific components
  pages/
    hr/                        # Employee CRUD pages, import, masterdata/ (10 master data pages)
    admin/                     # Role and user management
    dashboard/                 # Dashboard page
  services/api/
    client.ts                  # Axios instance (base URL from VITE_API_URL, JWT from localStorage, 401 → redirect to /login)
    *.service.ts               # API service modules per domain
  hooks/                       # React Query hooks (useEmployee, useMasterData, useDashboard, etc.)
  stores/authStore.ts          # Zustand auth store
  types/                       # TypeScript types including permission.ts (RESOURCES, ACTIONS)
  schemas/                     # Zod validation schemas
```

**Key patterns:**
- State management: Zustand for auth, React Query for server state
- All routes wrapped in `PermissionGuard` checking resource + action permissions
- Lazy-loaded pages with Suspense
- Form handling via react-hook-form + zod resolvers
- Master data pages follow a consistent CRUD pattern (10 entity types: divisi, department, posisi-jabatan, kategori-pangkat, golongan, sub-golongan, jenis-hubungan-kerja, tag, lokasi-kerja, status-karyawan)

## Environment Variables

Backend `.env` at project root (see `.env.example`):
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — PostgreSQL connection
- `JWT_SECRET` — JWT signing key
- `CORS_ORIGIN` — allowed frontend origin (default `http://localhost:5173`)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`, `REDIS_KEY_PREFIX` — Redis config
- `VITE_API_URL` — API base URL for frontend (default `http://localhost:3000/api`)
- `DEBUG_SQL=true` — enable full SQL logging

## API Routes

- `/api/hr/*` — All HR endpoints (employees, master-data, dashboard, documents, import, export, qrcode, audit)
- `/api/auth/*` — Authentication (login), roles CRUD, users CRUD
- `/api-docs` — Swagger UI

## Conventions

- Indonesian language for all user-facing strings (error messages, field labels, validation messages)
- Master data entities use soft delete (`deletedAt`) and a `code` field for custom identifiers
- Employee data is split across multiple related models: Employee, EmployeePersonalInfo, EmployeeHRInfo, EmployeeFamilyInfo, EmployeeDocument
- Frontend permission constants must mirror backend `shared/constants/permissions.ts`
