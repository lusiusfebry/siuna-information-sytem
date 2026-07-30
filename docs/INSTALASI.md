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
7. [Menjalankan Test](#7-menjalankan-test)
8. [Deployment Production (Docker)](#8-deployment-production-docker)
9. [Troubleshooting](#9-troubleshooting)

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
| **`backend/.env.test`** | Jest (`src/test/globalSetup.ts`) — menunjuk ke DB `bebang_test` | Hanya untuk menjalankan test | Sudah ada di repo |

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
npm run migrate          # buat seluruh skema (73 migration)
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
Membuat seluruh skema (**73 migration**, file bernomor `00`–`72` di `backend/src/database/migrations/`, dikelola umzug). Cukup dijalankan sekali saat setup awal, lalu setiap kali ada migration baru. Migration yang sudah pernah jalan dicatat di tabel `SequelizeMeta` sehingga aman dijalankan ulang.

### Opsi Seed

| Perintah | Isi | Kapan dipakai |
|----------|-----|---------------|
| `npm run seed` | 35 permission, 5 role, 2 akun superadmin | Ingin **langsung input data real** sendiri |
| `npm run seed:all` | Cleanup data non-credential + RBAC + superadmin | **Reset data** tanpa hilangkan user/role |
| `npm run seed:complete` | Semua data demo 3 modul (HR, Inventory, Facility) | **Mencoba/menguji semua fitur** sebelum data real |
| `npm run reset-and-seed` | Kosongkan data **termasuk master data HR**, lalu seed lengkap | **Reset cepat ke database demo segar** dalam satu langkah |
| `npm run reset-data` | Kosongkan data operasional, **pertahankan kredensial + master data HR** | Mulai input data real setelah selesai menguji dengan data demo |

> Semua opsi di atas **tidak pernah menghapus kredensial** (`users`, `roles`, `permissions`, `role_permissions`, `company_settings`). `seed:complete` menambah akun demo lewat `findOrCreate` by NIK, jadi akun yang sudah ada tetap dengan password aslinya.

### Perilaku `reset-data` (penting)

`npm run reset-data` meminta konfirmasi (ketik `yes`; lewati dengan flag `--yes`) lalu:

| Kelompok | Jumlah tabel | Perlakuan |
|----------|--------------|-----------|
| Kredensial & identitas perusahaan (`users`, `roles`, `permissions`, `role_permissions`, `company_settings`) | 5 | **Tidak disentuh** |
| Master data HR (`divisi`, `department`, `posisi_jabatan`, `kategori_pangkat`, `golongan`, `sub_golongan`, `jenis_hubungan_kerja`, `tag`, `lokasi_kerja`, `status_karyawan`) | 10 | **Dipertahankan** (hanya baris soft-delete dibersihkan) |
| Data operasional (Inventory, Facility, detail karyawan, audit, notifikasi) | 29 | `TRUNCATE ... RESTART IDENTITY` |
| `employees` | 1 | `DELETE` (bukan TRUNCATE) |

**Mengapa `employees` pakai `DELETE`, bukan `TRUNCATE`:** di PostgreSQL, `TRUNCATE ... CASCADE` **mengosongkan** tabel yang mereferensikan — rantai `employees` → `users` akan menghapus akun login. Dengan `DELETE`, FK `users.employee_id → employees` yang bertanda `ON DELETE SET NULL` hanya meng-NULL-kan kolomnya, dan baris `users` tidak pernah tersentuh.

Setelah `reset-data`:
- Kredensial login **tetap berlaku** (password lama tidak berubah).
- `users.employee_id` menjadi `NULL` — tautan akun↔karyawan hilang dan **belum ada UI untuk menautkan ulang** (lihat `docs/ROADMAP-FITUR.md` §UA-2).
- **Master data Inventory & Facility harus diisi ulang manual** sebelum bisa membuat produk/ruangan: Inventory (satuan, kategori, sub-kategori, merek) dan Facility (tipe ruangan, kategori perawatan).
- Berkas di `backend/uploads/employees/` menjadi orphan; boleh dihapus manual. ⚠️ **JANGAN hapus `backend/uploads/company/`** — logo perusahaan masih dipakai karena `company_settings` dipertahankan.
- Di browser, lakukan hard refresh (`Ctrl+Shift+R`) agar cache React Query bersih.

> Untuk ikut mengosongkan master data HR, jalankan `npm run reset-data -- --include-hr-master`. Ini yang dipakai `reset-and-seed` agar seeder bisa mengisi ulang tanpa tabrakan unique `code`.

> **Selalu backup dulu:**
> ```bash
> pg_dump -h localhost -p 5432 -U postgres -d bebang_db -F c -f backups/pre-reset.dump
> ```
> Folder `backups/` sudah masuk `.gitignore` — **jangan pernah commit** file dump karena berisi data karyawan sebenarnya.

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

## 7. Menjalankan Test

### Backend (dari `backend/`)

Test backend memakai **database terpisah** `bebang_test` (konfigurasinya di `backend/.env.test`), bukan `bebang_db`. Buat database itu sekali:
```sql
CREATE DATABASE bebang_test;
```

```bash
npm run test              # semua test (Jest)
npm run test:unit         # unit test saja
npm run test:integration  # integration test saja
npm run test:coverage     # laporan coverage
```

Yang perlu diketahui:
- **Integration test memakai PostgreSQL sungguhan.** Database harus hidup; `bebang_test` di-`DROP SCHEMA public CASCADE` lalu dibuat ulang di awal setiap run, dan seluruh migration dijalankan otomatis (`src/test/setup.ts`). Jadi **jangan** arahkan `.env.test` ke database yang berisi data yang Anda sayangi.
- Test berjalan **serial** (`maxWorkers: 1` di `jest.config.js`) karena semua suite berbagi satu database. `testTimeout` = 30 detik.
- **Coverage threshold 80%** (branches/functions/lines/statements) — `test:coverage` gagal bila di bawah itu.

Menjalankan satu file / satu test saja (Jest mencocokkan substring path):
```bash
npx jest opname.api                     # semua file yang path-nya memuat "opname.api"
npx jest -t "menolak create tanpa"      # cocokkan judul describe/it
npm run test:integration -- opname.api  # satu file integration
```

### Frontend (dari `frontend/`)

```bash
npm run test          # Vitest mode watch
npm run test:run      # sekali jalan
npm run test:coverage # laporan coverage
npm run test:e2e      # Playwright E2E (butuh backend + frontend jalan)
```

Satu file / satu test saja:
```bash
npx vitest run src/hooks/useEmployee.test.ts
npx vitest run -t "renders label"
npx playwright test tests/login.spec.ts
```

### Lint & type-check

```bash
cd backend  && npm run lint && npm run type-check
cd frontend && npm run lint && npm run build   # build = tsc + vite build
```

---

## 8. Deployment Production (Docker)

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
- **PWA butuh HTTPS.** Frontend memakai `vite-plugin-pwa` + Workbox, dan install ke home screen serta mode offline hanya aktif pada **secure context (HTTPS)** — `localhost` dikecualikan browser. Jadi selama prod masih port 80 tanpa TLS, fitur PWA **tidak akan aktif** meski build-nya sudah menghasilkan service worker.
- **Service worker mati di dev** (`devOptions.enabled: false` di `vite.config.ts`). Untuk menguji PWA/offline, pakai build production:
  ```bash
  cd frontend && npm run build && npm run preview
  ```
- Redis masih **mock** — jika butuh cache nyata, aktifkan kembali klien di `backend/src/config/redis.ts` dan sediakan service Redis.
- Pastikan volume `postgres-data` dan folder `uploads` di-backup secara berkala.

---

## 9. Troubleshooting

| Masalah | Kemungkinan penyebab & solusi |
|---------|-------------------------------|
| Backend gagal connect DB | `backend/.env` salah (host/port/password). Docker: pastikan `docker-compose ps` menunjukkan `bebang-postgres` **Up (healthy)**. |
| `.env` tidak terbaca | Pastikan file ada di **`backend/.env`**, bukan root `.env`. |
| Port 5432 sudah dipakai | PostgreSQL lain sudah jalan. Hentikan, atau ubah `DB_PORT` di `backend/.env` **dan** jalankan Docker dengan `DB_PORT=5433 docker-compose up -d`. |
| Frontend tidak konek API | Pastikan backend jalan di `:3000`. Cek `frontend/.env` berisi `VITE_API_URL=/api`. |
| Login gagal | Pastikan seed sudah dijalankan. Coba NIK `1234567890123456` / `password123`. |
| Migration error "already exists" | Migration sudah pernah jalan sebagian. Untuk dev bisa reset: `npm run reset-and-seed` (⚠️ menghapus data). |
| Setelah `reset-data`, produk/ruangan tidak bisa dibuat | Master data Inventory & Facility ikut terhapus. Isi ulang dulu: satuan, kategori, sub-kategori, merek (Inventory); tipe ruangan, kategori perawatan (Facility). |
| Setelah reset, halaman masih menampilkan data lama | Cache React Query di browser. Hard refresh `Ctrl+Shift+R`. |
| Integration test gagal connect DB | Buat database `bebang_test` dan pastikan `backend/.env.test` benar. Lihat [bagian 7](#7-menjalankan-test). |
| Tombol "Install app" (PWA) tidak muncul | Service worker mati di `vite dev`, dan PWA butuh HTTPS di production. Uji dengan `npm run build && npm run preview`. |
| Server production gagal start dengan error `FATAL: JWT_SECRET ...` | Set `JWT_SECRET` ≥32 karakter dan `DB_PASSWORD` non-default. |
| Container Docker tidak mau start | Cek log: `docker-compose logs <service>` (mis. `docker-compose logs postgres`). |

---

*Dokumen ini disimpan di `docs/` sesuai konvensi kerapihan project. Panduan lama yang terpisah ada di `tutorial/` (versi split, sebagian sudah usang).*
