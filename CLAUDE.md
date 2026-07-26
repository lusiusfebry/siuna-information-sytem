# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bebang Sistem Informasi (BIS) — an enterprise HR/ERP system. Beyond HR (employees, master data, attendance, leaves, documents) it now spans **Inventory** (products, warehouses, stock, serial numbers, transactions with approval/void/amend, stock opname, QR labels) and **Facility** management, targeting mining and general industrial companies. Indonesian-language UI with Indonesian-language error messages and field names throughout.

## Commands

### Backend (run from `backend/`)
```bash
npm run dev              # Start dev server (nodemon + ts-node), port 3000
npm run build            # TypeScript compile to dist/
npm run migrate          # Run database migrations (umzug)
npm run seed             # Seed database
npm run seed:all         # Seed all datasets
npm run seed:complete    # Full seed (master data + demo data)
npm run reset-data       # Truncate/reset data
npm run reset-and-seed   # Reset then re-seed
npm run test             # Run all tests (Jest)
npm run test:unit        # Unit tests only    (jest --testPathPattern=__tests__/.*\.test\.ts)
npm run test:integration # Integration tests  (jest --testPathPattern=__tests__/integration/.*\.test\.ts)
npm run test:coverage    # Coverage report (threshold 80% global — build fails below)
npm run load-test        # Artillery load test
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
npm run format           # Prettier write
npm run type-check       # TypeScript type check without emit
```

**Run a single test / one file** (Jest matches on path substring):
```bash
npx jest opname.api                       # any file whose path contains "opname.api"
npx jest -t "menolak create tanpa"        # run tests matching a describe/it title
npm run test:integration -- opname.api    # single integration file
```
Integration tests hit a **real PostgreSQL DB** and run **serially** (`maxWorkers: 1` in `jest.config.js`) because suites share one database. Pending migrations auto-run in `src/test/setup.ts` when `NODE_ENV=test`. `testTimeout` is 30s.

### Frontend (run from `frontend/`)
```bash
npm run dev              # Start Vite dev server, port 5173
npm run build            # TypeScript check + Vite build
npm run test             # Run tests (Vitest, watch mode)
npm run test:run         # Run tests once
npm run test:coverage    # Vitest coverage
npm run test:e2e         # Playwright E2E tests
npm run lint             # ESLint check
```

**Run a single test / one file:**
```bash
npx vitest run src/hooks/useEmployee.test.ts   # one file
npx vitest run -t "renders label"              # by test title
npx playwright test tests/login.spec.ts        # one E2E spec
```

### Docker (run from `docker/`)
```bash
docker-compose up -d     # PostgreSQL (port 5432, DB bebang_db), Redis, pgAdmin (port 5050)
```
The compose file publishes `${DB_PORT:-5432}:5432` — host port matches `DB_PORT` in `.env` (default **5432**) so host-run processes and the container agree.

## Architecture

### Backend — Modular Express + TypeScript + Sequelize (PostgreSQL)

```
backend/src/
  index.ts                     # Express app setup, middleware chain, error handler
  config/                      # env.ts (config from .env), database.ts (Sequelize), swagger.ts
  modules/
    hr/                        # HR domain (employees, master data, dashboard, docs, import/export, qrcode, audit)
      controllers/  services/  models/ (+ associations.ts)  routes/hr.routes.ts  validators/  types/
    inventory/                 # Inventory domain (produk, gudang, stok, serial number, transaksi, stock opname, label/QR)
      controllers/  services/  models/ (+ associations.ts)  routes/inventory.routes.ts
    facility/                  # Facility domain
      controllers/  services/  models/ (+ associations.ts)  routes/facility.routes.ts
    auth/                      # Auth (login, roles, users)
      routes/                  # auth.routes.ts, role.routes.ts, user.routes.ts → all under /api/auth
  shared/
    middleware/                # auth (JWT), permission (RBAC), cache (Redis), rate-limit, upload (multer),
                               #   validation, CSRF (double-submit cookie), audit logging, performance monitoring
    services/                  # cache-warming.service, notification
    constants/                 # permissions.ts (RESOURCES, ACTIONS)
    utils/                     # scheduler (node-cron)
  database/
    migrations/                # Sequential numbered files 00..71 (72 total), managed by umzug
    migrate.ts, seed.ts, umzug.ts
```

**Key patterns:**
- All `/api/*` routes are JWT-authenticated via `authenticate` middleware
- RBAC enforced via `checkPermission(RESOURCE, ACTION)` middleware
- Department-scoped access via `checkDepartmentAccess()` middleware
- CSRF: double-submit cookie via `csrfProtection`, mounted on `/api/` after the health check
- Redis caching with cache middleware and cache-warming on startup
- Migrations are sequential numbered files using umzug (not Sequelize CLI); each new migration is the next number
- Error handler in `index.ts` catches Sequelize FK constraint errors (codes 23503, 23001) → 409 with Indonesian message; honors `err.statusCode`; else 500
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
- **PWA** via `vite-plugin-pwa` + Workbox (`registerType: 'autoUpdate'`): precaches the app shell, `navigateFallback` to `/index.html` (denylist `/^\/api/`), NetworkFirst runtime caching for inventory label/QR lookups. `devOptions.enabled: false` — the service worker is **off in dev**; test it against a production build. PWA install/offline needs an HTTPS secure context in production.
- Vite config: path aliases (`@components`, `@pages`, `@services`, `@hooks`, `@utils`, `@types`), `manualChunks` (react-vendor, ui-vendor, form-vendor, chart-vendor, hr-module), dev `server.proxy` `/api` → `http://localhost:3000`

## Environment Variables

Backend `.env` at project root (see `.env.example`):
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — PostgreSQL connection
- `JWT_SECRET` — JWT signing key
- `CORS_ORIGIN` — allowed frontend origin (default `http://localhost:5173`)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`, `REDIS_KEY_PREFIX` — Redis config
- `VITE_API_URL` — API base URL for frontend (default `http://localhost:3000/api`)
- `DEBUG_SQL=true` — enable full SQL logging

## API Routes

- `/api/hr/*` — HR endpoints (employees, master-data, dashboard, documents, import, export, qrcode, audit)
- `/api/inventory/*` — Inventory endpoints (produk, gudang, stok, serial number, transaksi, stock opname, label/QR lookup)
- `/api/facility/*` — Facility endpoints
- `/api/notifications/*` — Notifications
- `/api/auth/*` — Authentication (login), roles CRUD, users CRUD
- `/api/health` — DB health check (mounted before `csrfProtection`)
- `/api-docs` — Swagger UI

## Conventions

- Indonesian language for all user-facing strings (error messages, field labels, validation messages)
- Master data entities use soft delete (`deletedAt`) and a `code` field for custom identifiers
- Employee data is split across multiple related models: Employee, EmployeePersonalInfo, EmployeeHRInfo, EmployeeFamilyInfo, EmployeeDocument
- Frontend permission constants must mirror backend `shared/constants/permissions.ts`

## Inventory: Stock Opname domain

- A warehouse (`gudang`) may have only **one active session** at a time; while a session is `Berjalan`, ordinary stock transactions into that warehouse are rejected (409).
- Session lifecycle: `Draft → Berjalan → Selesai → Approved` (`cancel` allowed from Draft/Berjalan/Selesai). `start` snapshots the warehouse (Draft→Berjalan); `finish` locks input (Berjalan→Selesai); `approve` (Selesai→Approved) calls `stokService.createAndApplyAdjustment` **only for lines that were counted and have a non-zero selisih**, storing the resulting `transaksi_id`.
- Create requires `petugas_ids: number[]` (min 1). Department validation is skipped when the gudang has no `department_id`.
- **Two snapshot tracks** taken on `start`: *Fisik* lines from `inv_stok`, and *Serial* lines (`tipe_hitung: 'Serial'`) from `inv_serial_number` filtered by warehouse + status ∈ `['Tersedia','Digunakan']`.
- `PUT /inventory/opname/:id/serial` toggles a serial unit's `kondisi` (`Ada`/`Tidak Ada`) and auto-recomputes `jumlah_fisik` = count of `Ada` and `selisih` = `jumlah_fisik − jumlah_sistem_snapshot`.
- Berita Acara is rendered to PDF via Puppeteer.
