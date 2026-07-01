# 05 - Fitur Aplikasi

Overview lengkap semua modul dan fitur yang tersedia di BIS.

---

## Module Overview

BIS terdiri dari 3 modul utama:

```
BIS (Bebang Sistem Informasi)
  ├── HR Module           — Manajemen karyawan & data kepegawaian
  ├── Inventory Module    — Manajemen inventaris & aset
  └── Admin Module        — Pengaturan sistem, user, dan role
```

---

## 1. HR Module

### Halaman Utama / Welcome Page
- Dashboard ringkasan modul yang tersedia
- Quick navigation ke setiap modul

### Dashboard HR
- Statistik jumlah karyawan
- Grafik distribusi per divisi/departemen
- Grafik status karyawan
- Data terbaru (karyawan baru, dll)

### Master Data HR (10 Entitas)

| Menu | Keterangan | Fitur |
|------|------------|-------|
| **Divisi** | Pembagian divisi perusahaan | CRUD, kode unik, soft delete |
| **Departemen** | Departemen per divisi | CRUD, relasi ke divisi, assign manager |
| **Posisi Jabatan** | Jabatan per departemen | CRUD, relasi ke departemen |
| **Kategori Pangkat** | Kategori tingkatan pangkat | CRUD |
| **Golongan** | Golongan kepangkatan | CRUD |
| **Sub Golongan** | Detail sub golongan | CRUD, relasi ke golongan |
| **Jenis Hubungan Kerja** | Kontrak, tetap, magang, dll | CRUD |
| **Tag** | Label/tag untuk karyawan | CRUD |
| **Lokasi Kerja** | Lokasi/site kerja | CRUD, kode site |
| **Status Karyawan** | Aktif, resign, pensiun, dll | CRUD |

### Manajemen Karyawan

| Fitur | Keterangan |
|-------|------------|
| **Daftar Karyawan** | Tabel dengan search, filter, pagination |
| **Tambah Karyawan** | Form multi-step (data pribadi, HR, keluarga) |
| **Edit Karyawan** | Edit semua informasi karyawan |
| **Detail Karyawan** | Tampilan lengkap profil karyawan |
| **Import Karyawan** | Import data dari file Excel (.xlsx) |
| **Export Karyawan** | Export ke Excel atau PDF |
| **QR Code Karyawan** | Generate QR code untuk ID karyawan |

### Data Karyawan (4 Tab)

| Tab | Field Utama |
|-----|-------------|
| **Data Pribadi** | Nama, NIK, tempat/tanggal lahir, alamat, agama, dll |
| **Data HR** | Divisi, departemen, jabatan, golongan, tanggal masuk, status |
| **Data Keluarga** | Nama pasangan, anak, orang tua, kontak darurat |
| **Dokumen** | Upload KTP, NPWP, ijazah, sertifikat, dll |

### Audit Log
- Riwayat semua perubahan data
- Filter per user, tanggal, aksi
- Detail perubahan (before/after)

---

## 2. Inventory Module

### Dashboard Inventory
- Total produk, gudang, transaksi
- Grafik stok per kategori
- Alert stok minimum
- Transaksi terbaru

### Master Data Inventory (6 Entitas)

| Menu | Keterangan |
|------|------------|
| **Kategori** | Kategori inventaris (Elektronik, Furnitur, dll) |
| **Sub Kategori** | Sub kategori dengan prefix tag |
| **Brand** | Merk/brand produk |
| **UOM** | Satuan (Unit, Pcs, Kg, Box, dll) |
| **Produk** | Data produk lengkap (kode, nama, brand, stok minimum) |
| **Gudang** | Warehouse dengan PIC, lokasi, departemen |

### Manajemen Stok

| Fitur | Keterangan |
|-------|------------|
| **Stok Inventaris** | Daftar stok per produk per gudang |
| **Serial Number** | Tracking individual item dengan serial number |
| **Asset Tag** | Penomoran aset otomatis (format: `KRS-JKT-0001`) |

### Transaksi Stok

| Tipe | Keterangan |
|------|------------|
| **Barang Masuk** | Penerimaan dari supplier |
| **Barang Keluar** | Pengeluaran ke karyawan/departemen |
| **Transfer** | Pindah antar gudang |
| **Stock Opname** | Penyesuaian stok (adjustment) |

### Kartu Stok
- Riwayat pergerakan stok per produk per gudang
- Filter periode, produk, gudang
- Saldo berjalan (running balance)

### Label & QR Code
- **Cetak label bulk** — pilih banyak asset tag sekaligus
- **Filter** per gudang, produk, status
- **Pilih semua** dengan checkbox (indeterminate state)
- **Kertas A4** — layout grid (2/3/4 kolom)
- **Thermal Label** — preset 50x30mm, 70x40mm, 100x50mm
- **Scan QR Code** — lookup data aset dari QR

### Import Data
- Import produk dari file Excel
- Import karyawan dari file Excel
- Download template import (format .xlsx)
- Validasi data sebelum import

### Laporan
- Laporan stok per gudang
- Laporan transaksi per periode
- Export ke Excel/PDF

---

## 3. Admin Module

### Manajemen User
- Daftar semua user sistem
- Tambah/edit/nonaktifkan user
- Assign role ke user
- Link user ke data karyawan

### Manajemen Role
- Daftar role yang tersedia
- Buat role baru dengan permission custom
- Edit permission per role (checklist per resource + action)
- 35 permission tersedia (7 resource x 5 action)

### Company Settings
- **Nama perusahaan** — tampil di header, login page, label
- **Nama singkat** — untuk greeting
- **Nama legal** — untuk dokumen resmi, label aset
- **Tagline** — tampil di halaman login
- **Logo** — upload logo perusahaan
- **Versi aplikasi** — tampil di footer

---

## Navigasi Aplikasi

### Sidebar Menu (HR)
```
Halaman Utama
Dashboard
├── Master Data HR
│   ├── Divisi
│   ├── Departemen
│   ├── Posisi Jabatan
│   ├── Kategori Pangkat
│   ├── Golongan
│   ├── Sub Golongan
│   ├── Jenis Hubungan Kerja
│   ├── Tag
│   ├── Lokasi Kerja
│   └── Status Karyawan
├── Data Karyawan
│   ├── Daftar Karyawan
│   └── Import Data
└── Audit Log
```

### Sidebar Menu (Inventory)
```
Halaman Utama
Dashboard
├── Master Data Inventory
│   ├── Kategori
│   ├── Sub Kategori
│   ├── Brand
│   ├── UOM
│   ├── Produk
│   └── Gudang
├── Manajemen Stok
│   ├── Stok Inventaris
│   ├── Transaksi Stok
│   ├── Kartu Stok
│   ├── Label & QR Code
│   └── Import Data
└── Laporan
```

---

## Langkah Selanjutnya

Lanjut ke **[06 - Deployment](./06-deployment.md)** untuk panduan deploy ke production.
