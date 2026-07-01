# 01 - Instalasi

Panduan lengkap untuk menginstal dan menyiapkan aplikasi **BIS (Bebang Sistem Informasi)** dari nol. Tutorial ini ditulis untuk pemula yang baru pertama kali setup project development.

---

## Apa Itu BIS?

BIS adalah sistem informasi perusahaan (ERP) untuk mengelola:
- **HR (Human Resources)** — data karyawan, absensi, cuti, dokumen
- **Inventory** — stok barang, gudang, transaksi masuk/keluar
- **Facility Management** — gedung, ruangan, aset fasilitas, work order

Aplikasi ini terdiri dari 2 bagian:
- **Backend** — server API yang mengolah data (Express + TypeScript + PostgreSQL)
- **Frontend** — tampilan web yang dilihat pengguna (React + Vite + TailwindCSS)

---

## Apa Saja yang Perlu Diinstal?

Sebelum mulai, Anda perlu menginstal beberapa software. Berikut penjelasan masing-masing:

| Software | Versi Minimum | Fungsi | Download |
|----------|---------------|--------|----------|
| **Node.js** | 18.x | Menjalankan kode JavaScript di komputer (backend & frontend butuh ini) | [nodejs.org](https://nodejs.org/) |
| **npm** | 9.x | Menginstal library/package yang dibutuhkan project (otomatis terinstal bersama Node.js) | Sudah termasuk di Node.js |
| **Git** | 2.x | Mengunduh dan mengelola kode project dari repository | [git-scm.com](https://git-scm.com/) |
| **PostgreSQL** | 15.x | Database utama untuk menyimpan semua data aplikasi | [postgresql.org](https://www.postgresql.org/download/) |
| **Docker Desktop** *(opsional)* | 20.x | Menjalankan database dalam container (lebih mudah, tidak perlu instal PostgreSQL manual) | [docker.com](https://www.docker.com/products/docker-desktop/) |

> **Tips:** Jika Anda pemula, kami sarankan pakai **Docker Desktop** karena lebih mudah — Anda tidak perlu menginstal dan mengkonfigurasi PostgreSQL secara manual.

---

## Langkah 1: Instal Node.js

Node.js adalah "mesin" yang menjalankan kode JavaScript di komputer Anda. Baik backend maupun frontend membutuhkan Node.js.

### Cara Instal di Windows:

1. Buka [https://nodejs.org/](https://nodejs.org/)
2. Klik tombol download versi **LTS** (Long Term Support) — ini versi yang paling stabil
3. Jalankan file installer yang sudah didownload (contoh: `node-v20.x.x-x64.msi`)
4. Ikuti wizard instalasi:
   - Klik **Next** di setiap langkah
   - Centang **"Automatically install the necessary tools"** jika muncul
   - Klik **Install**, tunggu sampai selesai
5. Klik **Finish**

### Verifikasi Instalasi:

Buka **Command Prompt** atau **PowerShell** (tekan `Win + R`, ketik `cmd`, tekan Enter), lalu ketik:

```bash
node --version
```
Harus muncul versi seperti `v20.11.0` (minimal v18.x)

```bash
npm --version
```
Harus muncul versi seperti `10.2.4` (minimal v9.x)

> **Jika error "node is not recognized":** Tutup dan buka ulang Command Prompt/PowerShell. Jika masih error, restart komputer agar PATH ter-update.

---

## Langkah 2: Instal Git

Git digunakan untuk mengunduh (clone) kode project dari repository dan melacak perubahan kode.

### Cara Instal di Windows:

1. Buka [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Download akan dimulai otomatis. Jalankan file installer
3. Ikuti wizard instalasi:
   - Gunakan pengaturan default (klik **Next** terus)
   - Pada pilihan editor, bisa pilih **Visual Studio Code** jika sudah terinstal
   - Klik **Install**, tunggu sampai selesai
4. Klik **Finish**

### Verifikasi Instalasi:

```bash
git --version
```
Harus muncul versi seperti `git version 2.43.0.windows.1`

---

## Langkah 3: Instal Database (Pilih Salah Satu)

Anda perlu database PostgreSQL untuk menyimpan data. Ada 2 cara:

### Opsi A: Docker Desktop (Direkomendasikan untuk Pemula)

Docker memungkinkan Anda menjalankan PostgreSQL, Redis, dan pgAdmin dalam "container" tanpa perlu instal satu per satu.

1. Buka [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2. Klik **Download for Windows**
3. Jalankan installer `Docker Desktop Installer.exe`
4. Ikuti wizard instalasi (gunakan pengaturan default)
5. Setelah selesai, **restart komputer** (biasanya diminta)
6. Buka **Docker Desktop** dari Start Menu
7. Tunggu sampai Docker Desktop menampilkan status **"Docker Desktop is running"**

> **Catatan:** Docker Desktop membutuhkan **WSL 2** (Windows Subsystem for Linux). Jika diminta menginstal WSL 2, ikuti petunjuk yang muncul atau buka [panduan Microsoft](https://learn.microsoft.com/en-us/windows/wsl/install).

### Verifikasi Docker:

```bash
docker --version
```
Harus muncul versi seperti `Docker version 24.0.7`

```bash
docker-compose --version
```
Harus muncul versi seperti `Docker Compose version v2.23.3`

### Opsi B: PostgreSQL Native (Instal Langsung)

Jika tidak ingin pakai Docker, Anda bisa instal PostgreSQL langsung:

1. Buka [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Klik **Download the installer** (dari EDB)
3. Pilih versi **15.x** atau lebih baru
4. Jalankan installer:
   - Pilih komponen: centang **PostgreSQL Server**, **pgAdmin 4**, dan **Command Line Tools**
   - Tentukan password untuk user `postgres` — **ingat password ini!** (akan dipakai di konfigurasi)
   - Port biarkan default: **5432**
   - Klik **Next** sampai selesai
5. Klik **Finish**

### Verifikasi PostgreSQL Native:

```bash
psql --version
```
Harus muncul versi seperti `psql (PostgreSQL) 15.4`

> **Jika error "psql is not recognized":** Anda perlu menambahkan PostgreSQL ke PATH. Cari folder instalasi PostgreSQL (biasanya `C:\Program Files\PostgreSQL\15\bin`) dan tambahkan ke System Environment Variables.

---

## Langkah 4: Clone Repository (Unduh Kode Project)

Buka Command Prompt atau PowerShell, lalu navigasi ke folder tempat Anda ingin menyimpan project:

```bash
# Contoh: simpan di folder D:\project
cd D:\project
```

Clone (unduh) kode project:

```bash
git clone <repository-url> bis-fix
cd bis-fix
```

> **Catatan:** Ganti `<repository-url>` dengan URL repository yang diberikan oleh tim Anda.

---

## Langkah 5: Kenali Struktur Folder

Setelah clone, Anda akan melihat struktur folder seperti ini:

```
bis-fix/
  backend/           # Server API (Express + TypeScript + PostgreSQL)
                     # Mengolah data, autentikasi, business logic
  frontend/          # Tampilan web (React + Vite + TailwindCSS)
                     # Yang dilihat dan digunakan oleh pengguna
  docker/            # File konfigurasi Docker (database, Redis, pgAdmin)
  tutorial/          # Dokumentasi tutorial (Anda sedang membaca ini)
  .env.example       # Template konfigurasi — akan di-copy jadi .env
```

---

## Langkah 6: Instal Dependencies (Library yang Dibutuhkan)

Project ini membutuhkan banyak library tambahan. Perintah `npm install` akan mengunduh semua library yang tercantum di `package.json`.

### Instal Dependencies Backend:

```bash
cd backend
npm install
```

> **Proses ini bisa memakan waktu 2-5 menit** tergantung kecepatan internet. Tunggu sampai selesai tanpa error.

Library utama yang akan terinstal:
- **Express** — framework untuk membuat API server
- **Sequelize** — ORM (penghubung antara kode dan database PostgreSQL)
- **Puppeteer** — untuk generate PDF (label, export dokumen)
- **bcryptjs** — untuk mengenkripsi password
- **jsonwebtoken** — untuk autentikasi JWT (token login)

### Instal Dependencies Frontend:

```bash
cd frontend
npm install
```

Library utama yang akan terinstal:
- **React 18** — library untuk membuat tampilan web
- **Vite** — build tool dan dev server (sangat cepat)
- **TailwindCSS** — framework CSS untuk styling
- **React Query** — mengelola data dari server (caching, refetch otomatis)
- **Zustand** — mengelola state autentikasi (data login)
- **React Hook Form + Zod** — mengelola form dan validasi input

> **Tips:** Jika muncul warning `npm warn` saat install, itu biasanya tidak masalah. Yang penting tidak ada `npm ERR!` (error).

> **Jika error saat npm install:**
> - Pastikan Node.js sudah terinstal dengan benar (`node --version`)
> - Coba hapus folder `node_modules` dan file `package-lock.json`, lalu jalankan `npm install` lagi
> - Pastikan koneksi internet stabil

---

## Ringkasan Checklist

Sebelum lanjut ke langkah berikutnya, pastikan semua sudah terinstal:

- [ ] Node.js v18+ (`node --version`)
- [ ] npm v9+ (`npm --version`)
- [ ] Git v2+ (`git --version`)
- [ ] Docker Desktop ATAU PostgreSQL native
- [ ] Repository sudah di-clone
- [ ] `npm install` berhasil di folder `backend/`
- [ ] `npm install` berhasil di folder `frontend/`

---

## Langkah Selanjutnya

Setelah semua terinstal, lanjut ke **[02 - Konfigurasi](./02-konfigurasi.md)** untuk setup database dan environment variables.
