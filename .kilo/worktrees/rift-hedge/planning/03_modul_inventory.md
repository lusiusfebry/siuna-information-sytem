# Modul Inventory

## Module Inventory

### 1. Master Data

- **Kategori**: kode, nama, type (fixed asset/consumeable), keterangan, status
- **Sub Kategori**: kode, nama, kategori aktif, keterangan, status
- **Brand**: kode, nama, sub kategori aktif, keterangan, status
- **UOM**: kode, nama, keterangan, status
- **Produk**: kode (auto), nama, brand, serial number (yes/no), keterangan, status
- **Gudang**: kode (auto), nama, penanggung jawab (ambil dari karyawan), department otomatis, lokasi, keterangan, status

### 2. Manajemen Stok

- **Stok Masuk**: supplier, transfer antar gudang, retur dari user
- **Stok Keluar**: ke karyawan (aset ditambahkan ke profil karyawan), ke gudang lain, rusak/terbuang, ke gedung/mess
- **Stok Adjustment**: koreksi manual (stock opname)
- **Multi-gudang/lokasi**: pelacakan detail

### 3. Sistem Pelabelan & Tagging

- QR/Barcode, cetak label, scan kamera/scanner

### 4. Transfer & Mutasi

- Antar gudang, departemen, pengguna/karyawan

### 5. Laporan & Analitik

- Stok per gudang/lokasi/jenis, histori transaksi, fast/slow moving, penggunaan aset karyawan, dashboard

### 6. Notifikasi & Reminder

- Stok minimum, barang rusak/kadaluarsa, pengembalian aset

### 7. Mobile/PWA

- Mobile-friendly, kamera scan QR/barcode, offline mode

### 8. Audit Trail

- Role-based access, log aktivitas, approval system

### 9. Integrasi HR

- Distribusi aset, tanggung jawab barang, mutasi antar lokasi

### 10. Dokumen & Foto

- Upload faktur, surat jalan, berita acara, foto barang

### 11. Fitur Tambahan Modern

- Import/export Excel, scan kamera, offline sync, API-ready, multi-language

### 12. Monitoring Realtime

- Pantau barang per gudang (nama, jumlah, tag, dll.)
