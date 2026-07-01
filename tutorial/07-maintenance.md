# 07 - Maintenance

Panduan pemeliharaan: reset data, backup database, dan troubleshooting.

---

## Reset Data (Hapus Seed, Pertahankan Credentials)

Jika ingin menghapus semua data seed/demo dan mulai input data real **tanpa kehilangan login**:

```bash
cd backend
npm run reset-data
```

Script akan menampilkan konfirmasi:
```
╔══════════════════════════════════════════════════╗
║  WARNING: RESET DATA — HAPUS SEMUA DATA SEED   ║
╚══════════════════════════════════════════════════╝

Tabel yang DIPERTAHANKAN (5):
  users, roles, permissions, role_permissions, company_settings

Tabel yang DIHAPUS (36):
  facility_work_orders, facility_assets, facility_occupants,
  facility_rooms, facility_buildings, facility_room_types,
  facility_maintenance_categories,
  inv_serial_number, inv_transaksi_detail, inv_stok,
  inv_transaksi, inv_produk, inv_gudang,
  inv_brand, inv_sub_kategori, inv_kategori, inv_uom,
  audit_logs, notifications,
  employee_documents, employee_family_info, employee_hr_info,
  employee_personal_info, leaves, attendances, employees,
  posisi_jabatan, department, divisi,
  kategori_pangkat, golongan, sub_golongan,
  jenis_hubungan_kerja, tag, lokasi_kerja, status_karyawan

Apakah Anda yakin? Ketik "yes" untuk melanjutkan:
```

Ketik `yes` untuk melanjutkan, atau apapun selain itu untuk membatalkan.

**Skip konfirmasi (untuk CI / scripting):**
```bash
npm run reset-data -- --yes
# atau
npm run reset-data -- -y
```

**Yang dipertahankan (genuine — tidak perlu re-seed):**
- Akun user lengkap dengan **password hash asli** (login Anda tetap berlaku)
- Role dan permission
- Role-permission mapping (custom assignment Anda terjaga)
- Company settings (nama perusahaan, logo, dll)

**Yang dihapus (36 tabel):**
- Semua data karyawan dan HR master data
- Semua data inventory (produk, gudang, stok, transaksi, serial number)
- Semua data facility (gedung, ruangan, penghuni, aset, work order)
- Audit log dan notifikasi
- Semua auto-increment ID reset ke 1

**Catatan teknis — kenapa credentials aman:**
PostgreSQL `TRUNCATE employees CASCADE` akan ikut menghapus `users` karena FK
`users.employee_id → employees`. Script menangani ini dengan **backup-restore**:
sebelum truncate, semua baris `users` di-snapshot ke memori (termasuk password
hash apa adanya); setelah truncate, baris dipulihkan via raw `INSERT` yang
melewati hook bcrypt sehingga hash **tidak di-hash ulang**. Password Anda
sebelumnya akan tetap berfungsi setelah reset.

**Fallback otomatis:** Jika database awalnya tanpa user (fresh install),
script akan membuat akun `NIK 111111 / password123` sebagai superadmin agar
aplikasi tetap bisa diakses.

---

## Reset + Seed Ulang (Satu Perintah)

Cara paling cepat untuk reset dan mengisi ulang data demo:

```bash
cd backend
npm run reset-and-seed
```

Script ini otomatis:
1. Menghapus semua data kecuali credentials
2. Menjalankan seed lengkap (HR + Inventory + Facility)

Tidak perlu konfirmasi manual — langsung jalan.

---

## Re-Seed Data (Tanpa Reset)

Jika ingin mengisi ulang data demo tanpa reset terlebih dahulu:

```bash
# Seed lengkap (cleanup non-credential + seed semua modul)
npm run seed:complete

# Seed RBAC + cleanup data non-credential
npm run seed:all

# Seed minimal (hanya RBAC + superadmin)
npm run seed
```

---

## Backup Database

### Backup dengan pg_dump (Linux/Mac)

```bash
# Backup seluruh database
pg_dump -h localhost -p 5432 -U postgres -d bebang_db > backup_$(date +%Y%m%d).sql

# Jika pakai Docker (port 5433)
pg_dump -h localhost -p 5433 -U postgres -d bebang_db > backup_$(date +%Y%m%d).sql
```

### Backup dengan pg_dump (Windows)

```powershell
# Backup seluruh database
# pg_dump biasanya ada di C:\Program Files\PostgreSQL\15\bin\
& "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" -h localhost -p 5432 -U postgres -d bebang_db -f "D:\backup\backup_bebang.sql"

# Jika pg_dump sudah ada di PATH:
pg_dump -h localhost -p 5432 -U postgres -d bebang_db -f "D:\backup\backup_%date:~-4%%date:~3,2%%date:~0,2%.sql"
```

> **Tips Windows:** Jika diminta password, tambahkan variabel environment `PGPASSWORD` atau buat file `%APPDATA%\postgresql\pgpass.conf` dengan format: `localhost:5432:bebang_db:postgres:password_anda`

### Restore dari Backup

```bash
# Linux/Mac
createdb -h localhost -p 5432 -U postgres bebang_db_restore
psql -h localhost -p 5432 -U postgres -d bebang_db_restore < backup_20260101.sql
```

```powershell
# Windows
& "C:\Program Files\PostgreSQL\15\bin\createdb.exe" -h localhost -p 5432 -U postgres bebang_db_restore
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -h localhost -p 5432 -U postgres -d bebang_db_restore -f "D:\backup\backup_bebang.sql"
```

### Backup via Docker

```bash
# Backup
docker exec bebang-postgres pg_dump -U postgres bebang_db > backup.sql

# Restore
cat backup.sql | docker exec -i bebang-postgres psql -U postgres bebang_db
```

### Backup Otomatis (Windows Task Scheduler)

Untuk backup harian otomatis di Windows:

1. Buat file `D:\backup\backup-bis.bat`:
```bat
@echo off
set PGPASSWORD=password_anda
set BACKUP_DIR=D:\backup
set DATE=%date:~-4%%date:~3,2%%date:~0,2%
"C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" -h localhost -p 5432 -U postgres -d bebang_db -f "%BACKUP_DIR%\bebang_%DATE%.sql"
echo Backup selesai: bebang_%DATE%.sql
```

2. Buka **Task Scheduler** (tekan `Win + R`, ketik `taskschd.msc`)
3. Klik **Create Basic Task**
4. Nama: `BIS Database Backup`
5. Trigger: **Daily**, jam 02:00
6. Action: **Start a program**, pilih `D:\backup\backup-bis.bat`
7. Klik **Finish**

---

## Troubleshooting

### 1. "Database connection failed"

**Penyebab:** PostgreSQL belum berjalan atau konfigurasi salah.

**Solusi:**
```bash
# Cek apakah PostgreSQL running
docker-compose ps           # Jika Docker
pg_isready -h localhost     # Jika native

# Verifikasi .env
cat .env | grep DB_

# Pastikan port benar:
# Docker: DB_PORT=5433
# Native: DB_PORT=5432
```

### 2. "ECONNREFUSED 127.0.0.1:3000"

**Penyebab:** Backend belum berjalan.

**Solusi:**
```bash
cd backend
npm run dev
```

### 3. "401 Unauthorized" atau redirect ke login

**Penyebab:** JWT token expired (berlaku 24 jam) atau invalid.

**Solusi:**
- Clear localStorage di browser (DevTools > Application > Local Storage > Clear)
- Login ulang

### 4. "Migration failed"

**Penyebab:** Database belum dibuat atau migration sebelumnya gagal.

**Solusi:**
```bash
# Buat database jika belum ada
psql -U postgres -c "CREATE DATABASE bebang_db;"

# Jalankan migration ulang
cd backend
npm run migrate
```

### 5. "Port 5173 already in use"

**Penyebab:** Frontend dev server sudah berjalan di terminal lain.

**Solusi:**
```bash
# Cari dan matikan proses
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:5173 | xargs kill
```

### 6. "Puppeteer failed to launch"

**Penyebab:** Chromium belum terinstal untuk Puppeteer (dibutuhkan untuk generate PDF).

**Solusi:**
```bash
cd backend
npx puppeteer browsers install chrome
```

### 7. Halaman kosong setelah login

**Penyebab:** User tidak memiliki permission yang sesuai.

**Solusi:**
- Login sebagai Superadmin (NIK: `1234567890123456`)
- Buka Settings > Manajemen Role
- Pastikan role memiliki permission yang diperlukan

### 8. Data tidak muncul setelah seed

**Penyebab:** Seed mungkin gagal di tengah proses.

**Solusi:**
```bash
# Jalankan seed:complete (otomatis cleanup + seed ulang)
cd backend
npm run seed:complete
```

### 9. `npm run seed` berhasil tapi user tidak terbuat

**Penyebab:** Association `belongsToMany` antara Role dan Permission tidak ter-register karena model `RolePermission` belum di-import. Akibatnya `setPermissions()` gagal, dan karena user creation ada di block `try` yang sama, user juga tidak dibuat.

**Solusi:**
Pastikan file `src/database/seed.ts` memiliki import berikut di bagian atas:
```typescript
import '../modules/auth/models/RolePermission'; // Register belongsToMany associations
```

Kemudian rebuild dan jalankan ulang:
```bash
cd backend
npm run build
npm run seed
```

Verifikasi user berhasil dibuat:
```bash
# Cek di database
psql -U postgres -d bebang_db -c "SELECT nik, nama FROM users;"
```

### 9b. Setelah `reset-data` jumlah user = 0 dan tidak bisa login

**Penyebab:** Anda menggunakan versi lama `reset-data.ts` yang belum
melakukan backup-restore. `TRUNCATE employees CASCADE` di PostgreSQL
ikut menghapus baris `users` meskipun `KEEP_TABLES` mendaftarkan `users`
sebagai tabel yang dipertahankan.

**Solusi:**
1. Pastikan `backend/src/database/reset-data.ts` sudah versi terbaru
   (memiliki `backupUsers()` dan `restoreUsers()`).
2. Rebuild:
   ```bash
   cd backend
   npm run build
   ```
3. Sementara, pulihkan akun superadmin default:
   ```bash
   npm run seed
   # Login: NIK 111111 / password123  atau  NIK 1234567890123456 / password123
   ```

---

## Troubleshooting Khusus Windows

### 10. "EPERM: operation not permitted" saat npm install

**Penyebab:** File atau folder terkunci oleh proses lain (antivirus, editor, atau proses Node.js yang masih berjalan).

**Solusi:**
```powershell
# Matikan semua proses Node.js
taskkill /F /IM node.exe

# Hapus node_modules dan install ulang
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

> **Tips:** Tambahkan folder project ke exclusion list antivirus (Windows Defender > Virus & threat protection > Exclusions).

### 11. "psql is not recognized" di Windows

**Penyebab:** PostgreSQL belum ditambahkan ke PATH.

**Solusi:**
1. Buka **System Properties** > **Environment Variables**
2. Edit variabel **Path** (System variables)
3. Tambahkan: `C:\Program Files\PostgreSQL\15\bin`
4. Klik **OK**, tutup dan buka ulang terminal

### 12. Port 5432 sudah dipakai (PostgreSQL conflict)

**Penyebab:** Ada instance PostgreSQL lain yang berjalan, atau Docker dan native PostgreSQL bentrok.

**Solusi:**
```powershell
# Cek proses yang menggunakan port 5432
netstat -ano | findstr :5432

# Matikan proses berdasarkan PID
taskkill /PID <nomor-PID> /F

# Atau stop service PostgreSQL
net stop postgresql-x64-15
```

### 13. "ENOENT: no such file or directory" untuk path dengan backslash

**Penyebab:** Windows menggunakan backslash (`\`) untuk path, tapi beberapa library Node.js mengharapkan forward slash (`/`).

**Solusi:** Pastikan `UPLOAD_DIR` di `.env` menggunakan forward slash:
```env
# Benar
UPLOAD_DIR=./uploads

# Salah (bisa bermasalah)
UPLOAD_DIR=.\uploads
```

---

## Port Reference

| Service | Port | Keterangan |
|---------|------|------------|
| Frontend (Vite) | 5173 | Development server |
| Backend (Express) | 3000 | API server (HR, Inventory, Facility) |
| PostgreSQL (Docker) | 5433 | Host port (internal 5432) |
| PostgreSQL (Native) | 5432 | Default port |
| Redis | 6379 | Cache (opsional) |
| pgAdmin | 5050 | Web database admin |
| Nginx (Production) | 80 | Reverse proxy |
| Swagger Docs | 3000 | http://localhost:3000/api-docs |

## Daftar Perintah Maintenance

| Perintah | Keterangan |
|----------|------------|
| `npm run reset-data` | Hapus 36 tabel bisnis, credential dipertahankan (backup-restore) |
| `npm run reset-data -- --yes` | Sama, tanpa prompt konfirmasi (untuk CI) |
| `npm run reset-and-seed` | Reset + seed ulang dalam satu perintah |
| `npm run seed:complete` | Seed lengkap semua modul (HR, Inventory, Facility) |
| `npm run seed:all` | Seed RBAC + cleanup data non-credential |
| `npm run seed` | Seed minimal (RBAC + superadmin default) |
| `npm run migrate` | Jalankan database migration |
| `npm run type-check` | Cek TypeScript tanpa compile |
