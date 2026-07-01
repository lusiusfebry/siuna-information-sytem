# 07 - Maintenance

Panduan pemeliharaan: reset data, backup database, dan troubleshooting.

---

## Reset Data (Hapus Seed, Pertahankan Credentials)

Jika ingin menghapus semua data seed/demo dan mulai input data real:

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

Tabel yang DIHAPUS (29):
  inv_serial_number, inv_transaksi_detail, inv_stok, ...

Apakah Anda yakin? Ketik "yes" untuk melanjutkan:
```

Ketik `yes` untuk melanjutkan, atau apapun selain itu untuk membatalkan.

**Yang dipertahankan:**
- Akun user (bisa tetap login)
- Role dan permission
- Company settings (nama perusahaan, logo, dll)

**Yang dihapus:**
- Semua data karyawan dan HR master data
- Semua data inventory (produk, gudang, stok, transaksi, serial number)
- Audit log dan notifikasi
- Semua auto-increment ID reset ke 1

---

## Re-Seed Data

Jika ingin mengisi ulang data demo setelah reset:

```bash
# Seed lengkap (termasuk cleanup otomatis)
npm run seed:complete

# Seed RBAC + cleanup data non-credential
npm run seed:all

# Seed minimal (hanya RBAC + superadmin)
npm run seed
```

---

## Backup Database

### Backup dengan pg_dump

```bash
# Backup seluruh database
pg_dump -h localhost -p 5432 -U postgres -d bebang_db > backup_$(date +%Y%m%d).sql

# Jika pakai Docker (port 5433)
pg_dump -h localhost -p 5433 -U postgres -d bebang_db > backup_$(date +%Y%m%d).sql
```

### Restore dari Backup

```bash
# Buat database baru (jika perlu)
createdb -h localhost -p 5432 -U postgres bebang_db_restore

# Restore
psql -h localhost -p 5432 -U postgres -d bebang_db_restore < backup_20260101.sql
```

### Backup via Docker

```bash
# Backup
docker exec bebang-postgres pg_dump -U postgres bebang_db > backup.sql

# Restore
cat backup.sql | docker exec -i bebang-postgres psql -U postgres bebang_db
```

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

---

## Port Reference

| Service | Port | Keterangan |
|---------|------|------------|
| Frontend (Vite) | 5173 | Development server |
| Backend (Express) | 3000 | API server |
| PostgreSQL (Docker) | 5433 | Host port (internal 5432) |
| PostgreSQL (Native) | 5432 | Default port |
| Redis | 6379 | Cache (saat ini di-mock) |
| pgAdmin | 5050 | Web database admin |
| Nginx (Production) | 80 | Reverse proxy |
| Swagger Docs | 3000 | http://localhost:3000/api-docs |
