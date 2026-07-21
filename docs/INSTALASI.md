# Panduan Instalasi BIS (Bebang Sistem Informasi)

Panduan lengkap memasang dan menjalankan BIS di komputer lokal, **dengan Docker** maupun **tanpa Docker**. Dokumen ini adalah acuan instalasi terbaru dan menggantikan panduan lama di folder `tutorial/`.

> Ringkasan cepat ada di [README.md](../README.md). Dokumen ini menjelaskan detail, perbedaan mode, dan troubleshooting.

---

## Daftar Isi

1. [Prasyarat](#1-prasyarat)
2. [Struktur file environment (.env)](#2-struktur-file-environment-env)
3. [Metode A — Dengan Docker](#3-metode-a--dengan-docker)
4. [Metode B — Tanpa Docker (native)](#4-metode-b--tanpa-docker-native)
5. [Migration & Seed](#5-migration--seed)
6. [Verifikasi & Login](#6-verifikasi--login)
7. [Deployment Production (Docker)](#7-deployment-production-docker)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prasyarat

| Kebutuhan | Versi | Dipakai untuk |
|-----------|-------|---------------|
| **Node.js** | 18 LTS atau lebih baru | Backend & frontend (Docker image memakai Node 18) |
| **npm** | bawaan Node | Install dependency, jalankan script |
| **Git** | terbaru | Clone repository |
| **Docker Desktop** | terbaru | Hanya untuk Metode A |
| **PostgreSQL** | 15 | Hanya untuk Metode B (native) |

Cek versi:
```bash
node -v      # harus v18.x atau lebih tinggi
npm -v
git --version
docker --version   # jika pakai Docker
```

**Catatan Redis:** saat ini Redis **di-mock** di dalam kode (`backend/src/config/redis.ts`), jadi aplikasi **tetap berjalan normal tanpa Redis**. Container Redis di Docker boleh dibiarkan, tapi tidak wajib.

---

## 2. Struktur file environment (.env)

Ada dua file `.env` yang perlu diperhatikan. Ini bagian yang **paling sering salah**, jadi baca dengan teliti.

| File | Dibaca oleh | Wajib? | Sumber template |
|------|-------------|--------|-----------------|
| **`backend/.env`** | Backend (Express) — via `backend/src/config/env.ts` | **Ya** | root `.env.example` |
| **`frontend/.env`** | Frontend (Vite) | Sudah ada di repo | — |

> **Penting:** Backend membaca `backend/.env`, **bukan** `.env` di root project. Ini dikonfirmasi di `backend/src/config/env.ts`:
> ```ts
> const envPath = path.join(__dirname, '../../.env'); // → backend/.env
> ```

### 2.1 Buat `backend/.env`

Salin template dari root ke folder backend:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example backend\.env
```

**Linux/Mac:**
```bash
cp .env.example backend/.env
```

Isi `backend/.env` untuk development:
```env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bebang_db
DB_USER=postgres
DB_PASSWORD=123456789

# Auth
JWT_SECRET=your-secret-key-change-in-production

# Upload & CORS
UPLOAD_DIR=./uploads
CORS_ORIGIN=http://localhost:5173

# Redis (opsional — saat ini di-mock, boleh dibiarkan)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=bebang:
```

Penjelasan variabel kunci:

| Variabel | Development | Keterangan |
|----------|-------------|------------|
| `DB_PORT` | `5432` | Port Postgres. Docker dev mem-publish di `5432` (bisa diubah lewat `DB_PORT`). PostgreSQL native default juga `5432`. |
| `DB_PASSWORD` | `123456789` | Docker: biarkan default. Native: pakai password yang Anda set saat instal PostgreSQL. |
| `JWT_SECRET` | bebas untuk dev | **Wajib diganti** dengan string acak ≥32 karakter di production (dipaksa oleh kode). |
| `CORS_ORIGIN` | `http://localhost:5173` | URL frontend yang diizinkan mengakses API. |

### 2.2 `frontend/.env`

Sudah termasuk dalam repository dengan isi:
```env
VITE_API_URL=/api
VITE_APP_NAME=Bebang Sistem Informasi
```
Tidak perlu diubah untuk development (Vite mem-proxy `/api` ke backend). Jika file ini hilang, buat ulang dengan isi di atas.

---

## 3. Metode A — Dengan Docker

Docker menjalankan semua service dalam container. Cocok untuk setup cepat tanpa memasang PostgreSQL manual.

### Langkah 1 — Clone & siapkan env
```bash
git clone <repository-url> bis-fix
cd bis-fix
```
Buat `backend/.env` seperti [bagian 2.1](#21-buat-backendenv).

### Langkah 2 — Pilih salah satu mode Docker

Ada dua gaya pemakaian Docker untuk development:

#### Mode A1 — Docker untuk database saja (paling umum, sesuai README)

Docker hanya menjalankan PostgreSQL, Redis, dan pgAdmin. Backend & frontend dijalankan lewat `npm` di host (lebih cepat untuk coding & hot-reload).

```bash
cd docker
docker-compose up -d postgres redis pgadmin
docker-compose ps        # pastikan bebang-postgres = Up (healthy)
cd ..
```

Lalu jalankan backend & frontend lewat npm (lihat [Metode B langkah 3-4](#4-metode-b--tanpa-docker-native), lewati bagian instal PostgreSQL).

#### Mode A2 — Full Docker (semua service dalam container)

```bash
cd docker
docker-compose up -d      # postgres, redis, pgadmin, backend, frontend
docker-compose ps
```

Service yang berjalan:

| Service | Container | Port host |
|---------|-----------|-----------|
| PostgreSQL | `bebang-postgres` | `5432` |
| Redis | `bebang-redis` | `6379` |
| pgAdmin | `bebang-pgadmin` | `5050` |
| Backend | `bebang-backend-dev` | `3000` |
| Frontend | `bebang-frontend-dev` | `5173` |

Backend & frontend melakukan hot-reload dari kode host (`src/` di-mount sebagai volume).

### Langkah 3 — Migration & Seed

Backend **tidak** otomatis migrate saat start. Jalankan sekali:

**Mode A1 (npm di host):**
```bash
cd backend
npm install
npm run migrate
npm run seed:complete
```

**Mode A2 (full Docker):**
```bash
docker exec -it bebang-backend-dev npm run migrate
docker exec -it bebang-backend-dev npm run seed:complete
```

Detail opsi seed ada di [bagian 5](#5-migration--seed).

### Langkah 4 — Akses aplikasi
Buka **http://localhost:5173** dan login (lihat [bagian 6](#6-verifikasi--login)).

Menghentikan container:
```bash
cd docker
docker-compose down        # stop & hapus container (data DB tetap tersimpan di volume)
docker-compose down -v     # ⚠️ hapus juga volume → semua data DB hilang
```

---

## 4. Metode B — Tanpa Docker (native)

Untuk yang ingin menjalankan langsung di host tanpa Docker sama sekali.

### Langkah 1 — Instal & siapkan PostgreSQL 15

1. Instal PostgreSQL 15 dari <https://www.postgresql.org/download/>. Catat password user `postgres` yang Anda buat.
2. Buat database:
   ```bash
   psql -U postgres
   ```
   ```sql
   CREATE DATABASE bebang_db;
   \q
   ```
3. Sesuaikan `backend/.env`:
   ```env
   DB_PORT=5432
   DB_PASSWORD=<password_postgres_anda>
   ```

### Langkah 2 — Clone & siapkan env
```bash
git clone <repository-url> bis-fix
cd bis-fix
```
Buat `backend/.env` seperti [bagian 2.1](#21-buat-backendenv).

### Langkah 3 — Backend
```bash
cd backend
npm install
npm run migrate          # buat 68 tabel/migration
npm run seed:complete    # isi data demo (lihat bagian 5 untuk opsi lain)
npm run dev              # jalankan di http://localhost:3000
```
Output sukses:
```
Server is running on port 3000
Database connected successfully.
Swagger docs available at: http://localhost:3000/api-docs
```

### Langkah 4 — Frontend (terminal baru)
```bash
cd frontend
npm install
npm run dev              # jalankan di http://localhost:5173
```

Buka **http://localhost:5173**.

---

## 5. Migration & Seed

### Migration
```bash
cd backend
npm run migrate
```
Membuat seluruh skema (68 migration). Cukup dijalankan sekali saat setup awal, atau setiap ada migration baru.

### Opsi Seed

| Perintah | Isi | Kapan dipakai |
|----------|-----|---------------|
| `npm run seed` | 35 permission, 5 role, 2 akun superadmin | Ingin **langsung input data real** sendiri |
| `npm run seed:all` | Cleanup data non-credential + RBAC + superadmin | **Reset data** tanpa hilangkan user/role |
| `npm run seed:complete` | Semua data demo 3 modul (HR, Inventory, Facility) | **Mencoba/menguji semua fitur** sebelum data real |
| `npm run reset-and-seed` | Hapus semua data (kecuali credential) lalu seed lengkap | **Reset cepat** dalam satu langkah |
| `npm run reset-data` | Hapus data saja (minta konfirmasi `yes`) | Kosongkan data tanpa isi ulang |

> `seed:complete` dan `reset-and-seed` **tidak menghapus** credential (users, roles, permissions, company_settings).

---

## 6. Verifikasi & Login

| Cek | URL |
|-----|-----|
| Frontend | <http://localhost:5173> |
| Backend health | <http://localhost:3000/api/health> |
| Swagger API docs | <http://localhost:3000/api-docs> |
| pgAdmin (Docker) | <http://localhost:5050> |

**Akun default (dari seed):**

| NIK | Password | Role |
|-----|----------|------|
| `1234567890123456` | `password123` | Superadmin |
| `111111` | `password123` | Superadmin |

> Ganti/hapus akun default ini sebelum dipakai di lingkungan nyata.

---

## 7. Deployment Production (Docker)

File `docker/docker-compose.prod.yml` menjalankan: **app** (backend, Node) + **nginx** (serve frontend build + proxy `/api`) + **postgres**.

### Langkah build & jalankan
```bash
# 1. Build frontend (dihasilkan ke frontend/dist, di-serve oleh nginx)
cd frontend && npm install && npm run build && cd ..

# 2. Set variabel production (shell atau file docker/.env)
export DB_NAME=bebang_db
export DB_USER=postgres
export DB_PASSWORD=<password-kuat>
export CORS_ORIGIN=https://domain-anda

# 3. Jalankan
cd docker
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Migration & seed di dalam container app
docker exec -it bebang-app node dist/database/migrate.js
```
Akses via **http://localhost** (nginx port 80).

### ⚠️ Wajib diperhatikan sebelum production

Kode (`backend/src/config/env.ts`) **menolak start** di luar `development`/`test` bila:
- `JWT_SECRET` kosong, lemah, atau < 32 karakter → **set string acak ≥32 karakter**.
- `DB_PASSWORD` masih `123456789` → **ganti dengan password kuat**.

Selain itu:
- `NODE_ENV=production` wajib di-set pada service `app` (sudah default di compose prod).
- nginx prod hanya listen **port 80 (tanpa TLS)**. Untuk publik, tambahkan **HTTPS/TLS** (mis. reverse proxy/terminasi TLS atau konfigurasi cert di nginx).
- Redis masih **mock** — jika butuh cache nyata, aktifkan kembali klien di `backend/src/config/redis.ts` dan sediakan service Redis.
- Pastikan volume `postgres-data` dan folder `uploads` di-backup secara berkala.

---

## 8. Troubleshooting

| Masalah | Kemungkinan penyebab & solusi |
|---------|-------------------------------|
| Backend gagal connect DB | `backend/.env` salah (host/port/password). Docker: pastikan `docker-compose ps` menunjukkan `bebang-postgres` **Up (healthy)**. |
| `.env` tidak terbaca | Pastikan file ada di **`backend/.env`**, bukan root `.env`. |
| Port 5432 sudah dipakai | PostgreSQL lain sudah jalan. Hentikan, atau ubah `DB_PORT` di `backend/.env` **dan** jalankan Docker dengan `DB_PORT=5433 docker-compose up -d`. |
| Frontend tidak konek API | Pastikan backend jalan di `:3000`. Cek `frontend/.env` berisi `VITE_API_URL=/api`. |
| Login gagal | Pastikan seed sudah dijalankan. Coba NIK `1234567890123456` / `password123`. |
| Migration error "already exists" | Migration sudah pernah jalan sebagian. Untuk dev bisa reset: `npm run reset-and-seed` (⚠️ menghapus data). |
| Server production gagal start dengan error `FATAL: JWT_SECRET ...` | Set `JWT_SECRET` ≥32 karakter dan `DB_PASSWORD` non-default. |
| Container Docker tidak mau start | Cek log: `docker-compose logs <service>` (mis. `docker-compose logs postgres`). |

---

*Dokumen ini disimpan di `docs/` sesuai konvensi kerapihan project. Panduan lama yang terpisah ada di `tutorial/` (versi split, sebagian sudah usang).*
