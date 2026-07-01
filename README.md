# Bebang Sistem Informasi (BIS)

Enterprise HR/ERP system untuk manajemen karyawan, data kepegawaian, dan inventaris aset.

---

## Quick Start

```bash
# 1. Clone & install
git clone <repository-url> bis-fix
cd bis-fix

# 2. Setup environment
cp .env.example .env

# 3. Start database (Docker)
cd docker && docker-compose up -d postgres redis pgadmin && cd ..

# 4. Backend: migrate, seed, run
cd backend
npm install
npm run migrate
npm run seed:complete
npm run dev

# 5. Frontend: install & run (terminal baru)
cd frontend
npm install
npm run dev
```

Buka **http://localhost:5173** — Login: NIK `1234567890123456` / Password `password123`

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React 18, Vite 5, TailwindCSS 3.4, TypeScript |
| **Backend** | Node.js 18, Express 4, TypeScript, Sequelize 6 |
| **Database** | PostgreSQL 15 |
| **Cache** | Redis 7 (opsional) |
| **PDF** | Puppeteer (label, export) |
| **Testing** | Vitest (unit), Jest (backend), Playwright (E2E) |
| **Infra** | Docker, Nginx |

---

## Tutorial Lengkap

| # | Topik | Keterangan |
|---|-------|------------|
| 01 | [Instalasi](tutorial/01-instalasi.md) | Prerequisites, clone, install dependencies |
| 02 | [Konfigurasi](tutorial/02-konfigurasi.md) | Environment variables, setup database |
| 03 | [Menjalankan Aplikasi](tutorial/03-menjalankan-aplikasi.md) | Migration, seeding, dev server |
| 04 | [Credential Login](tutorial/04-credential-login.md) | Akun default, roles, cara login |
| 05 | [Fitur Aplikasi](tutorial/05-fitur-aplikasi.md) | Overview semua modul & fitur |
| 06 | [Deployment](tutorial/06-deployment.md) | Docker production, Nginx |
| 07 | [Maintenance](tutorial/07-maintenance.md) | Reset data, backup, troubleshooting |

---

## Modul Aplikasi

### HR Module
- Master data (divisi, departemen, jabatan, golongan, lokasi kerja, dll)
- CRUD karyawan lengkap (data pribadi, HR, keluarga, dokumen)
- Import/export Excel & PDF
- Dashboard & audit log

### Inventory Module
- Master data (kategori, brand, UOM, produk, gudang)
- Manajemen stok & serial number
- Transaksi (masuk, keluar, transfer, stock opname)
- Asset tag & label printing (A4 + thermal)
- Kartu stok & laporan

### Admin Module
- Manajemen user & role (RBAC)
- Company settings (branding, logo)

---

## Dokumentasi Tambahan

- [Panduan Instalasi Detail (SETUP.md)](docs/SETUP.md)
- [Panduan Pengujian (TESTING_GUIDE.md)](docs/TESTING_GUIDE.md)
- [Panduan Kontribusi (CONTRIBUTING.md)](docs/CONTRIBUTING.md)
- [Variabel Lingkungan (ENV_VARS.md)](docs/ENV_VARS.md)
- [Pemetaan Import Excel (EXCEL_MAPPING.md)](docs/EXCEL_MAPPING.md)
- [Arsitektur Sistem (ARCHITECTURE.md)](docs/ARCHITECTURE.md)
- [Dokumentasi API (Swagger)](http://localhost:3000/api-docs)

---

## NPM Scripts

### Backend (`cd backend`)

```bash
npm run dev              # Dev server (port 3000)
npm run migrate          # Database migration
npm run seed             # Seed minimal (credentials only)
npm run seed:all         # Seed RBAC + cleanup data non-credential
npm run seed:complete    # Seed lengkap (semua data demo)
npm run reset-data       # Hapus data seed, pertahankan credentials
npm run build            # Compile TypeScript
npm run type-check       # Cek TypeScript
npm run lint             # Cek code style
npm run test             # Jalankan test
```

### Frontend (`cd frontend`)

```bash
npm run dev              # Dev server (port 5173)
npm run build            # Production build
npm run lint             # Cek code style
npm run test             # Unit test
npm run test:e2e         # E2E test (Playwright)
```
