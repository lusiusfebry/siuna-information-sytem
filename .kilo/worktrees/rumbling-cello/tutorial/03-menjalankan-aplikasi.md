# 03 - Menjalankan Aplikasi

Panduan untuk menjalankan migration, seeding data, dan memulai development server.

---

## Quick Start (Ringkasan Cepat)

Jika Anda ingin langsung menjalankan tanpa membaca detail, jalankan perintah berikut secara berurutan:

```bash
# Terminal 1 — Database (jika pakai Docker)
cd docker
docker-compose up -d postgres redis pgadmin

# Terminal 2 — Backend
cd backend
npm run migrate
npm run seed:complete
npm run dev

# Terminal 3 — Frontend
cd frontend
npm run dev
```

Buka browser: **http://localhost:5173**
Login: NIK `1234567890123456`, Password `password123`

---

## Langkah Detail

### 1. Jalankan Database

#### Jika menggunakan Docker:
```bash
cd docker
docker-compose up -d postgres redis pgadmin
```

Verifikasi container berjalan:
```bash
docker-compose ps
```

Output yang diharapkan:
```
NAME              STATUS
bebang-postgres   Up (healthy)
bebang-redis      Up
bebang-pgadmin    Up
```

#### Jika PostgreSQL native:
Pastikan service PostgreSQL sudah running dan database `bebang_db` sudah dibuat (lihat [02-konfigurasi.md](./02-konfigurasi.md)).

---

### 2. Jalankan Database Migration

Migration membuat semua tabel yang diperlukan (50 migration files):

```bash
cd backend
npm run migrate
```

Output yang diharapkan:
```
Database connected.
{ event: 'migrating', name: '00_initial_schema.ts' }
{ event: 'migrated', name: '00_initial_schema.ts' }
{ event: 'migrating', name: '01_create_users_table.ts' }
...
{ event: 'migrated', name: '49_add_uom_id_to_inv_produk.ts' }
All migrations completed.
```

Migration hanya perlu dijalankan **sekali** saat setup awal, atau setiap kali ada migration baru.

---

### 3. Seed Data

Ada beberapa opsi seeding:

#### Opsi A: Seed Minimal (Hanya Credentials)

```bash
npm run seed
```

Membuat:
- 35 permissions (RBAC)
- 5 roles (superadmin, admin, staff, manager, employee)
- 2 akun superadmin

Gunakan ini jika Anda ingin **langsung input data real**.

#### Opsi B: Seed RBAC + Cleanup (`npm run seed:all`)

```bash
npm run seed:all
```

Membuat:
- Cleanup semua data non-credential (karyawan, inventaris, master data)
- 35 permissions (RBAC)
- 5 roles dengan permission masing-masing
- 2 akun superadmin

Gunakan ini untuk **reset data tanpa kehilangan user credentials**.

#### Opsi C: Seed Lengkap (Dengan Data Demo)

```bash
npm run seed:complete
```

Membuat semua data demo:
- RBAC (35 permissions, 5 roles dengan permission masing-masing)
- 6 divisi, 12 departemen, 18 posisi jabatan
- 10 master data HR lainnya (status, lokasi, golongan, dll)
- 20 karyawan lengkap (personal info, HR info, family info)
- 12 akun user dengan berbagai role
- 5 kategori, 12 sub kategori, 15 brand, 6 UOM, 15 produk, 5 gudang
- 53 serial number/asset tag
- 8 transaksi inventaris (masuk, keluar, transfer, opname)
- 16 stok records

Gunakan ini untuk **melihat dan menguji semua fitur** sebelum input data real.

#### Opsi D: Seed Ulang (Reset + Seed)

Jika ingin seed ulang dari awal:
```bash
npm run seed:complete
```
Script `seed:complete` sudah otomatis membersihkan semua data sebelum seeding ulang.

---

### 4. Jalankan Backend Development Server

```bash
cd backend
npm run dev
```

Output yang diharapkan:
```
Server is running on port 3000
Database connected successfully.
Swagger docs available at: http://localhost:3000/api-docs
```

Backend akan berjalan di **http://localhost:3000** dengan hot-reload (nodemon).

---

### 5. Jalankan Frontend Development Server

Buka terminal baru:

```bash
cd frontend
npm run dev
```

Output yang diharapkan:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://xxx.xxx.x.xxx:5173/
```

Frontend akan berjalan di **http://localhost:5173** dengan hot-reload (Vite HMR).

---

### 6. Akses Aplikasi

| URL | Keterangan |
|-----|------------|
| http://localhost:5173 | Aplikasi utama (frontend) |
| http://localhost:3000 | Backend API |
| http://localhost:3000/api-docs | Swagger API documentation |
| http://localhost:5050 | pgAdmin (database admin) |

---

## NPM Scripts Reference

### Backend (`cd backend`)

| Command | Keterangan |
|---------|------------|
| `npm run dev` | Development server dengan hot-reload |
| `npm run build` | Compile TypeScript ke `dist/` |
| `npm run start` | Jalankan production build |
| `npm run migrate` | Jalankan database migration |
| `npm run seed` | Seed minimal (RBAC + superadmin) |
| `npm run seed:all` | Seed RBAC + cleanup data non-credential |
| `npm run seed:complete` | Seed lengkap dengan data demo |
| `npm run reset-data` | Hapus semua data kecuali credentials |
| `npm run type-check` | Cek TypeScript tanpa compile |
| `npm run lint` | Cek code style (ESLint) |
| `npm run lint:fix` | Auto-fix code style |
| `npm run test` | Jalankan semua test |

### Frontend (`cd frontend`)

| Command | Keterangan |
|---------|------------|
| `npm run dev` | Development server dengan HMR |
| `npm run build` | Build production |
| `npm run preview` | Preview production build |
| `npm run test` | Jalankan unit test (watch mode) |
| `npm run test:run` | Jalankan unit test sekali |
| `npm run test:e2e` | Jalankan E2E test (Playwright) |
| `npm run lint` | Cek code style (ESLint) |

---

## Langkah Selanjutnya

Lanjut ke **[04 - Credential Login](./04-credential-login.md)** untuk daftar akun default dan cara login.
