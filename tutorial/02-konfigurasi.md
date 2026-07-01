# 02 - Konfigurasi

Panduan konfigurasi environment variables dan database. Langkah ini menghubungkan aplikasi BIS dengan database PostgreSQL.

---

## Mengapa Perlu Konfigurasi?

Aplikasi BIS perlu tahu:
- Di mana database-nya? (alamat, port, nama database)
- Apa password database-nya?
- Di port berapa backend harus berjalan?
- Apa secret key untuk enkripsi token login?

Semua pengaturan ini disimpan di file **`.env`** (environment variables). File ini **tidak di-upload ke repository** (ada di `.gitignore`) karena berisi informasi sensitif seperti password.

---

## Langkah 1: Buat File .env

### 1.1 Copy Template

Dari folder root project (`bis-fix/`), jalankan perintah berikut:

**Windows (Command Prompt):**
```bash
copy .env.example .env
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Linux/Mac:**
```bash
cp .env.example .env
```

### 1.2 Buka dan Edit File .env

Buka file `.env` dengan text editor (VS Code, Notepad++, atau editor lainnya). Isi seperti berikut:

```env
# ── Aplikasi ──────────────────────────────────────
NODE_ENV=development
PORT=3000

# ── Database PostgreSQL ───────────────────────────
DB_HOST=localhost
DB_PORT=5433
DB_NAME=bebang_db
DB_USER=postgres
DB_PASSWORD=123456789

# ── Authentication ────────────────────────────────
JWT_SECRET=your-secret-key-change-in-production

# ── File Upload ───────────────────────────────────
UPLOAD_DIR=./uploads

# ── CORS ──────────────────────────────────────────
CORS_ORIGIN=http://localhost:5173

# ── Redis (opsional, saat ini di-mock) ────────────
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=bebang:
```

---

## Langkah 2: Pahami Setiap Variabel

Berikut penjelasan setiap variabel dalam bahasa sederhana:

### Pengaturan Aplikasi

| Variabel | Contoh Nilai | Penjelasan Sederhana |
|----------|-------------|----------------------|
| `NODE_ENV` | `development` | Mode aplikasi. `development` = mode pengembangan (ada log detail, error lengkap). Jangan ubah kecuali untuk production. |
| `PORT` | `3000` | Port tempat backend API berjalan. Artinya backend bisa diakses di `http://localhost:3000`. |

### Pengaturan Database

| Variabel | Contoh Nilai | Penjelasan Sederhana |
|----------|-------------|----------------------|
| `DB_HOST` | `localhost` | Alamat komputer tempat database berjalan. `localhost` artinya di komputer Anda sendiri. |
| `DB_PORT` | `5433` atau `5432` | "Pintu" untuk mengakses database. **Pakai `5433` jika Docker**, **pakai `5432` jika PostgreSQL native**. |
| `DB_NAME` | `bebang_db` | Nama database yang akan digunakan. Akan dibuat otomatis oleh Docker, atau perlu dibuat manual jika PostgreSQL native. |
| `DB_USER` | `postgres` | Username untuk login ke database. Default PostgreSQL adalah `postgres`. |
| `DB_PASSWORD` | `123456789` | Password database. **Jika pakai Docker**, biarkan `123456789` (sesuai docker-compose). **Jika PostgreSQL native**, ganti dengan password yang Anda buat saat instal PostgreSQL. |

### Pengaturan Autentikasi

| Variabel | Contoh Nilai | Penjelasan Sederhana |
|----------|-------------|----------------------|
| `JWT_SECRET` | `your-secret-key...` | Kunci rahasia untuk membuat token login (JWT). Seperti "password" untuk mengenkripsi token. Untuk development, bisa pakai nilai default. **Wajib diganti di production** dengan string acak yang panjang. |

### Pengaturan File & CORS

| Variabel | Contoh Nilai | Penjelasan Sederhana |
|----------|-------------|----------------------|
| `UPLOAD_DIR` | `./uploads` | Folder tempat menyimpan file yang di-upload (foto karyawan, dokumen, dll). |
| `CORS_ORIGIN` | `http://localhost:5173` | URL frontend yang diizinkan mengakses backend. Ini mencegah website lain mengakses API Anda. Harus sesuai dengan URL frontend. |

### Pengaturan Redis

| Variabel | Contoh Nilai | Penjelasan Sederhana |
|----------|-------------|----------------------|
| `REDIS_HOST` | `localhost` | Alamat server Redis (cache). |
| `REDIS_PORT` | `6379` | Port Redis (default). |
| `REDIS_PASSWORD` | *(kosong)* | Password Redis. Kosongkan jika tidak ada password. |
| `REDIS_DB` | `0` | Nomor database Redis (0-15). |
| `REDIS_KEY_PREFIX` | `bebang:` | Prefix untuk semua key di Redis, agar tidak bentrok dengan aplikasi lain. |

> **Catatan tentang Redis:** Saat ini Redis **di-mock** (disimulasikan) dalam kode aplikasi, sehingga **tidak wajib** dijalankan. Aplikasi tetap berjalan normal tanpa Redis. Jika Anda menggunakan Docker, Redis sudah otomatis berjalan.

---

## Langkah 3: Setup Database

Ada dua cara menjalankan PostgreSQL. Pilih sesuai yang Anda instal di langkah sebelumnya.

### Opsi A: Menggunakan Docker (Direkomendasikan)

Docker akan menjalankan 3 service sekaligus:
- **PostgreSQL** — database utama
- **Redis** — cache (opsional, di-mock)
- **pgAdmin** — tampilan web untuk mengelola database

#### Langkah-langkah:

1. **Pastikan Docker Desktop sudah berjalan** (buka dari Start Menu jika belum)

2. **Jalankan container database:**
   ```bash
   cd docker
   docker-compose up -d postgres redis pgadmin
   ```
   
   > Penjelasan perintah:
   > - `docker-compose up` = jalankan service
   > - `-d` = jalankan di background (tidak memblokir terminal)
   > - `postgres redis pgadmin` = hanya jalankan 3 service ini

3. **Tunggu sampai semua container siap** (sekitar 10-30 detik), lalu verifikasi:
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
   
   > **Jika status bukan "Up":** Tunggu beberapa detik lalu cek lagi. Jika tetap error, cek log dengan `docker-compose logs postgres`.

4. **Pastikan `.env` menggunakan port Docker:**
   ```env
   DB_PORT=5433
   DB_PASSWORD=123456789
   ```

#### Perbandingan Port Docker vs Native:

| | Docker | PostgreSQL Native |
|---|---|---|
| Port di `.env` | `5433` | `5432` |
| Password default | `123456789` (dari docker-compose) | Yang Anda buat saat instal |
| Database dibuat | Otomatis (`bebang_db`) | Perlu buat manual |
| Redis | Sudah termasuk | Perlu instal terpisah (opsional) |
| pgAdmin | Sudah termasuk (port 5050) | Perlu instal terpisah |

### Opsi B: PostgreSQL Native (Instal Langsung)

Jika PostgreSQL sudah terinstal langsung di komputer:

1. **Buka terminal/Command Prompt dan masuk ke psql:**
   ```bash
   psql -U postgres
   ```
   Masukkan password PostgreSQL Anda saat diminta.

2. **Buat database:**
   ```sql
   CREATE DATABASE bebang_db;
   ```
   
   Verifikasi database sudah dibuat:
   ```sql
   \l
   ```
   Cari `bebang_db` di daftar yang muncul.

3. **Keluar dari psql:**
   ```sql
   \q
   ```

4. **Pastikan `.env` menggunakan port native:**
   ```env
   DB_PORT=5432
   DB_PASSWORD=password_anda_saat_instal_postgresql
   ```

---

## Langkah 4: Akses pgAdmin (Web Database Admin)

pgAdmin adalah tampilan web untuk melihat dan mengelola database PostgreSQL. Berguna untuk melihat data di tabel, menjalankan query SQL, dan debugging.

### Jika Menggunakan Docker:

pgAdmin sudah berjalan otomatis di Docker.

1. **Buka browser**, akses: **http://localhost:5050**

2. **Login dengan credential berikut:**
   | Field | Nilai |
   |-------|-------|
   | Email | `admin@admin.com` |
   | Password | `root` |

3. **Tambahkan koneksi ke database:**
   - Klik kanan **Servers** di panel kiri
   - Pilih **Register** > **Server...**
   
4. **Tab General:**
   - Name: `BIS Local` (atau nama bebas)

5. **Tab Connection:**
   | Field | Nilai | Keterangan |
   |-------|-------|------------|
   | Host name/address | `bebang-postgres` | Nama container Docker, **bukan** `localhost` |
   | Port | `5432` | Port **internal** container (bukan 5433) |
   | Maintenance database | `bebang_db` | Nama database |
   | Username | `postgres` | Username database |
   | Password | `123456789` | Password database |
   
   > **Penting:** Host harus `bebang-postgres` (nama container), bukan `localhost`. Ini karena pgAdmin berjalan di dalam Docker network yang sama dengan PostgreSQL.

6. **Centang "Save password?"** agar tidak perlu input ulang
7. Klik **Save**

Sekarang Anda bisa melihat database `bebang_db` di panel kiri. Setelah migration dijalankan (langkah berikutnya), tabel-tabel akan muncul di sini.

### Jika Menggunakan PostgreSQL Native:

pgAdmin biasanya sudah terinstal bersama PostgreSQL. Buka dari Start Menu: **pgAdmin 4**.

---

## Langkah 5: Konfigurasi Frontend

Frontend sudah memiliki konfigurasi default yang **sudah termasuk dalam repository**. File `frontend/.env` sudah di-track oleh git, sehingga **tidak perlu dibuat manual**.

File konfigurasi frontend (`frontend/.env`):

```env
VITE_API_URL=/api
VITE_APP_NAME=Bebang Sistem Informasi
```

> **Mengapa `/api` dan bukan `http://localhost:3000/api`?**
> Dalam mode development, Vite memiliki fitur **proxy** yang otomatis meneruskan semua request `/api` ke `http://localhost:3000`. Ini dikonfigurasi di `vite.config.ts`. Jadi Anda tidak perlu mengubah apa-apa.

> **Penting:** Jangan hapus file `frontend/.env`. Jika file ini tidak ada, frontend akan error 404 saat login karena request tidak diarahkan ke backend.

---

## Ringkasan Konfigurasi

### Jika Pakai Docker:
```env
DB_PORT=5433
DB_PASSWORD=123456789
```

### Jika Pakai PostgreSQL Native:
```env
DB_PORT=5432
DB_PASSWORD=password_anda
```

### Yang Tidak Perlu Diubah (untuk development):
- `NODE_ENV`, `PORT`, `DB_HOST`, `DB_NAME`, `DB_USER` — biarkan default
- `JWT_SECRET` — biarkan default untuk development
- `CORS_ORIGIN` — biarkan default
- `REDIS_*` — biarkan default (di-mock)
- `frontend/.env` — sudah termasuk dalam repository, tidak perlu diubah

---

## Troubleshooting

### "Connection refused" saat menjalankan aplikasi
- Pastikan Docker Desktop sudah berjalan (jika pakai Docker)
- Pastikan container PostgreSQL statusnya "Up": `docker-compose ps`
- Pastikan `DB_PORT` di `.env` sesuai (5433 untuk Docker, 5432 untuk native)

### "Password authentication failed"
- Pastikan `DB_PASSWORD` di `.env` sesuai dengan password database
- Jika Docker: password default adalah `123456789`
- Jika native: gunakan password yang Anda buat saat instal PostgreSQL

### pgAdmin tidak bisa connect
- Jika Docker: pastikan Host adalah `bebang-postgres` (bukan `localhost`)
- Jika Docker: pastikan Port adalah `5432` (port internal, bukan 5433)
- Pastikan container PostgreSQL sudah berjalan

### Frontend error 404 saat login (`POST http://localhost:5173/auth/login 404`)
- Penyebab: file `frontend/.env` tidak ada atau `VITE_API_URL` tidak terdefinisi
- Pastikan file `frontend/.env` ada dan berisi `VITE_API_URL=/api`
- Jika file hilang, buat manual:
  ```env
  VITE_API_URL=/api
  VITE_APP_NAME=Bebang Sistem Informasi
  ```
- Restart frontend dev server setelah membuat/mengubah file `.env`

---

## Langkah Selanjutnya

Lanjut ke **[03 - Menjalankan Aplikasi](./03-menjalankan-aplikasi.md)** untuk menjalankan migration, seeding data, dan dev server.
