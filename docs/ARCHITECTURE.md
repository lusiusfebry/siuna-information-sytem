# Architecture Overview

Ringkasan cepat. Untuk gambaran lengkap & arah ke depan, lihat:
- **[ARCHITECTURE-BLUEPRINT.md](./ARCHITECTURE-BLUEPRINT.md)** — blueprint arsitektur (prinsip, cara tambah modul, versioning API, kesiapan mobile, roadmap hardening).
- **[../applikasi-strucktur.md](../applikasi-strucktur.md)** — potret struktur modul saat ini (fitur, relasi, routing).

## Backend (Modular — Express + TypeScript + Sequelize)
- `src/modules/<modul>`: tiap modul berisi `models`, `services`, `controllers`, `routes`, `docs` (Swagger), `associations.ts`.
  Modul saat ini: `auth`, `hr`, `inventory`, `facility`.
- `src/shared`: lintas-modul — `middleware` (auth, permission, csrf, cache, rate-limit, audit), `services` (notification, cache, scheduler), `constants` (RBAC `permissions.ts`), `utils`.
- `src/database`: migrations (Umzug) + seeds.
- `src/config`: env, database, swagger.

## Frontend (React + Vite + Zustand + React Query)
- `src/components`: UI reusable (termasuk `common/`, per-modul).
- `src/pages`: halaman per fitur, module-scoped.
- `src/services/api`: integrasi API (satu service per domain).
- `src/hooks`, `src/stores`, `src/types`, `src/context`: state & tipe bersama.
- `src/pwa.tsx`: registrasi service worker (PWA, read-only offline).

## Prinsip inti
1. Modul mandiri; relasi lintas-modul terkontrol (idealnya via service, bukan model langsung).
2. RBAC terpusat (`RESOURCES` × `ACTIONS`) + `checkPermission` di setiap route.
3. Response envelope konsisten `{ status, data }`.
4. Perubahan skema hanya via migrasi baru (tak menyunting migrasi lama).

Lihat blueprint untuk detail tiap poin.
