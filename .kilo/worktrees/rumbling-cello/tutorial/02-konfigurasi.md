# 02 - Konfigurasi

Panduan konfigurasi environment variables dan database.

---

## Environment Variables

### 1. Copy Template

Dari root project:

```bash
cp .env.example .env
```

### 2. Isi File `.env`

```env
# ── Aplikasi ──────────────────────────────────────
NODE_ENV=development
PORT=3000

# ── Database PostgreSQL ───────────────────────────
DB_HOST=localhost
DB_PORT=5432                  # Ganti 5433 jika pakai Docker
DB_NAME=bebang_db
DB_USER=postgres
DB_PASSWORD=123456789         # Ganti dengan password PostgreSQL Anda

# ── Authentication ────────────────────────────────
JWT_SECRET=your-secret-key-change-in-production

# ── File Upload ───────────────────────────────────
UPLOAD_DIR=./uploads

# ── CORS ──────────────────────────────────────────
CORS_ORIGIN=http://localhost:5173

# ── Frontend ──────────────────────────────────────
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Bebang Sistem Informasi

# ── Redis (opsional, saat ini di-mock) ────────────
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=bebang:
```

### Penjelasan Variabel

| Variabel | Default | Keterangan |
|----------|---------|------------|
| `NODE_ENV` | `development` | Mode aplikasi (`development`, `production`, `test`) |
| `PORT` | `3000` | Port backend API server |
| `DB_HOST` | `localhost` | Host database PostgreSQL |
| `DB_PORT` | `5432` | Port database (**5433 jika Docker**) |
| `DB_NAME` | `bebang_db` | Nama database |
| `DB_USER` | `postgres` | Username database |
| `DB_PASSWORD` | `123456789` | Password database |
| `JWT_SECRET` | - | Secret key untuk JWT token (wajib diganti di production) |
| `UPLOAD_DIR` | `./uploads` | Direktori penyimpanan file upload |
| `CORS_ORIGIN` | `http://localhost:5173` | URL frontend yang diizinkan |
| `VITE_API_URL` | `/api` | Base URL API untuk frontend |
| `REDIS_*` | - | Konfigurasi Redis (opsional, saat ini di-mock) |

---

## Setup Database

Ada dua cara menjalankan PostgreSQL:

### Opsi A: Menggunakan Docker (Direkomendasikan)

Docker akan menjalankan PostgreSQL, Redis, dan pgAdmin sekaligus.

```bash
cd docker
docker-compose up -d postgres redis pgadmin
```

Tunggu hingga container siap:
```bash
docker-compose ps
```

**Penting:** Docker mengekspos PostgreSQL pada port **5433** (bukan 5432). Update `.env`:

```env
DB_PORT=5433
```

#### Akses pgAdmin (Web Database Admin)

| | |
|---|---|
| URL | http://localhost:5050 |
| Email | `admin@admin.com` |
| Password | `root` |

Untuk menambahkan server di pgAdmin:
1. Buka http://localhost:5050
2. Login dengan credential di atas
3. Klik kanan **Servers** > **Register** > **Server**
4. Tab **General**: Name = `BIS Local`
5. Tab **Connection**:
   - Host: `bebang-postgres` (nama container, bukan localhost)
   - Port: `5432` (port internal container)
   - Database: `bebang_db`
   - Username: `postgres`
   - Password: `123456789`

### Opsi B: PostgreSQL Native (Instalasi Langsung)

Jika PostgreSQL sudah terinstal langsung di komputer:

1. Buka terminal/psql:
```bash
psql -U postgres
```

2. Buat database:
```sql
CREATE DATABASE bebang_db;
\q
```

3. Pastikan `.env` menggunakan port default:
```env
DB_PORT=5432
```

---

## Konfigurasi Frontend

Frontend sudah memiliki file `.env` default di `frontend/.env`:

```env
VITE_API_URL=/api
VITE_APP_NAME=Bebang Sistem Informasi
```

Dalam mode development, Vite akan proxy semua request `/api` ke `http://localhost:3000` secara otomatis (dikonfigurasi di `vite.config.ts`). Tidak perlu diubah.

---

## Redis (Opsional)

Redis saat ini **di-mock** dalam kode aplikasi, sehingga **tidak wajib** dijalankan. Jika menggunakan Docker, Redis sudah termasuk dalam `docker-compose up`.

---

## Langkah Selanjutnya

Lanjut ke **[03 - Menjalankan Aplikasi](./03-menjalankan-aplikasi.md)** untuk menjalankan migration, seeding, dan dev server.
