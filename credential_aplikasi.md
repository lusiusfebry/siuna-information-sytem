# Kredensial Aplikasi - Sistem Informasi SDM Bebang

Dokumen ini berisi daftar kredensial default dan konfigurasi rahasia yang digunakan dalam pengembangan dan pengujian aplikasi.

> [!WARNING]
> Segera ganti semua kata sandi default setelah instalasi di lingkungan produksi untuk menjaga keamanan sistem.

---

## 1. Database (PostgreSQL)

Berikut adalah kredensial default yang ditemukan di konfigurasi sistem (`backend/src/config/env.ts`):

| Komponen | Nilai Default |
| :--- | :--- |
| **Host** | `localhost` |
| **Port** | `5432` |
| **User** | `postgres` |
| **Password** | `123456789` (atau `12345678` di `.env.example`) |
| **Database** | `bebang_db` |

---

## 2. Akun Login Aplikasi (Default/Test)

Berdasarkan dokumentasi API (Swagger) dan file pengujian integrasi, berikut adalah kredensial yang sering digunakan:

### A. Contoh Admin (Swagger Documentation)
*Dapat dicoba jika database sudah di-seed dengan data awal.*
- **NIK**: `111111`
- **Password**: `password123`

### B. Akun Pengujian (Integration Test)
*Akun ini biasanya dibuat secara dinamis saat melakukan pengujian otomatis.*
- **NIK**: `999999` atau `888888`
- **Password**: `password123`

---

## 3. Konfigurasi Backend & Security

| Variabel | Nilai Default / Contoh |
| :--- | :--- |
| **JWT Secret** | `secret` |
| **CORS Origin** | `http://localhost:5173` |
| **Redis Host** | `localhost` |
| **Redis Port** | `6379` |

---

## 4. Cara Membuat Akun Admin Baru

Jika Anda tidak dapat login dengan akun di atas, Anda dapat membuat akun admin melalui database secara manual atau menggunakan script tambahan. Namun, disarankan untuk mengikuti prosedur pendaftaran resmi jika tersedia di sistem atau melalui seeding.

> [!NOTE]
> Pastikan service PostgreSQL dan Redis sudah berjalan sebelum mencoba login.
