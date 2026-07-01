# 04 - Credential Login

Panduan akun default, sistem login, dan manajemen user.

---

## Cara Login

1. Buka **http://localhost:5173**
2. Masukkan **NIK** (Nomor Induk Karyawan) — bukan email
3. Masukkan **Password**
4. Klik **Masuk**

---

## Akun Default

### Seed Minimal (`npm run seed`)

Tersedia 2 akun superadmin:

| NIK | Password | Role | Keterangan |
|-----|----------|------|------------|
| `111111` | `password123` | Superadmin | Akun superadmin singkat |
| `1234567890123456` | `password123` | Superadmin | Akun superadmin utama |

### Seed RBAC + Cleanup (`npm run seed:all`)

Sama seperti seed minimal (2 akun superadmin), tapi juga:
- Cleanup semua data non-credential (karyawan, inventaris, master data)
- Re-seed RBAC (35 permissions, 5 roles)

Berguna untuk **reset data tanpa kehilangan user credentials**.

### Seed Lengkap (`npm run seed:complete`)

Tersedia 12 akun dengan berbagai role:

| NIK | Nama | Role | Password |
|-----|------|------|----------|
| `111111` | Superadmin | **Superadmin** | `password123` |
| `1234567890123456` | Superadmin Full | **Superadmin** | `password123` |
| `EMP-001` | Ahmad Surya Wijaya | **Superadmin** | `password123` |
| `EMP-002` | Siti Nurhaliza Rahman | **Admin** | `password123` |
| `EMP-003` | Bambang Prasetyo | **Admin** | `password123` |
| `EMP-004` | Dewi Kartika Sari | **Manager** | `password123` |
| `EMP-005` | Rizky Ramadhan Putra | **Manager** | `password123` |
| `EMP-006` | Andi Firmansyah | **Staff** | `password123` |
| `EMP-007` | Putri Ayu Lestari | **Staff** | `password123` |
| `EMP-009` | Dian Permata Sari | **Staff** | `password123` |
| `EMP-012` | Wahyu Hidayat | **Employee** | `password123` |
| `EMP-015` | Novita Anggraini | **Employee** | `password123` |

---

## Sistem Role & Permission

Aplikasi menggunakan RBAC (Role-Based Access Control) dengan 5 role:

### Superadmin
- Akses **penuh** ke seluruh fitur
- Dapat mengelola user, role, dan permission
- Dapat mengubah company settings

### Admin
- Mengelola data karyawan (CRUD)
- Mengelola master data HR dan inventory
- Melihat audit log
- Import/export data

### Manager
- Melihat data karyawan
- Melihat dashboard dan laporan
- Approve/review data bawahan

### Staff
- Melihat data karyawan (terbatas)
- Mengelola data inventaris
- Input transaksi stok

### Employee
- Melihat data diri sendiri
- Akses terbatas ke fitur umum

---

## Membuat User Baru

### Melalui UI (Superadmin/Admin)

1. Login sebagai Superadmin
2. Buka menu **Settings** > **Manajemen User**
3. Klik **Tambah User**
4. Isi form:
   - **Nama**: Nama lengkap
   - **NIK**: Nomor unik untuk login (maks 20 karakter)
   - **Password**: Minimal 6 karakter
   - **Role**: Pilih dari dropdown
   - **Karyawan** *(opsional)*: Link ke data employee
5. Klik **Simpan**

### Melalui Manajemen Role

1. Buka menu **Settings** > **Manajemen Role**
2. Di sini Anda bisa:
   - Melihat daftar role yang tersedia
   - Membuat role baru dengan permission custom
   - Mengedit permission per role

---

## Catatan Penting

- **NIK harus unik** — tidak boleh ada 2 user dengan NIK sama
- **Password di-hash otomatis** menggunakan bcrypt (10 salt rounds)
- **JWT Token berlaku 24 jam** — setelah itu harus login ulang
- **Session tersimpan di localStorage** — clear browser data = logout
- Jika lupa password, edit langsung di database atau buat user baru via Superadmin

---

## Langkah Selanjutnya

Lanjut ke **[05 - Fitur Aplikasi](./05-fitur-aplikasi.md)** untuk melihat semua fitur yang tersedia.
