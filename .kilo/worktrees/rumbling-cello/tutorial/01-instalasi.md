# 01 - Instalasi

Panduan lengkap untuk menginstal dan menyiapkan aplikasi **BIS (Bebang Sistem Informasi)**.

---

## Prerequisites

Pastikan software berikut sudah terinstal di komputer Anda:

| Software | Versi Minimum | Keterangan |
|----------|---------------|------------|
| **Node.js** | 18.x | Runtime JavaScript ([download](https://nodejs.org/)) |
| **npm** | 9.x | Sudah termasuk saat instal Node.js |
| **Git** | 2.x | Version control ([download](https://git-scm.com/)) |
| **PostgreSQL** | 15.x | Database utama ([download](https://www.postgresql.org/download/)) |
| **Docker** *(opsional)* | 20.x | Untuk menjalankan database via container ([download](https://www.docker.com/)) |

### Cek Versi

```bash
node --version    # Harus v18.x atau lebih
npm --version     # Harus v9.x atau lebih
git --version
psql --version    # Jika instal PostgreSQL native
docker --version  # Jika menggunakan Docker
```

---

## Clone Repository

```bash
git clone <repository-url> bis-fix
cd bis-fix
```

---

## Struktur Folder

```
bis-fix/
  backend/           # Express API server (Node.js + TypeScript)
  frontend/          # React SPA (Vite + TypeScript + TailwindCSS)
  docker/            # Docker Compose & Nginx config
  tutorial/          # Dokumentasi tutorial (Anda sedang membaca ini)
  .env.example       # Template environment variables
```

---

## Install Dependencies

### Backend

```bash
cd backend
npm install
```

Dependency utama yang akan terinstal:
- **Express** — HTTP framework
- **Sequelize** — ORM untuk PostgreSQL
- **Puppeteer** — PDF generation (label, export)
- **bcryptjs** — Password hashing
- **jsonwebtoken** — JWT authentication

### Frontend

```bash
cd frontend
npm install
```

Dependency utama yang akan terinstal:
- **React 18** — UI library
- **Vite** — Build tool & dev server
- **TailwindCSS** — Utility-first CSS framework
- **React Query** — Server state management
- **Zustand** — Client state management (auth)
- **React Hook Form + Zod** — Form handling & validation

---

## Langkah Selanjutnya

Setelah instalasi selesai, lanjut ke **[02 - Konfigurasi](./02-konfigurasi.md)** untuk setup database dan environment variables.
