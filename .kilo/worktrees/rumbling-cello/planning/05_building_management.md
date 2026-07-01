# Modul Building Management

## Module Building Management

### 1. Master Data

- **Gedung**: kode gedung (auto), nama gedung, lokasi, penanggung jawab (data karyawan dari HR), keterangan, status (aktif/tidak aktif)
- **Lantai**: kode lantai (auto), nama lantai, gedung (referensi dari gedung aktif), keterangan, status
- **Ruangan**: kode ruangan (auto), nama ruangan, lantai (referensi dari lantai aktif), kapasitas, fungsi ruangan (kantor, meeting, gudang, dll.), status
- **Fasilitas Gedung**: kode fasilitas, nama fasilitas (AC, meja, kursi, proyektor, dll.), tipe (tetap/sewa), keterangan, status

### 2. Manajemen Aset Gedung

- **Distribusi Aset ke Gedung/Ruangan**
  - Data diambil dari modul **Inventory (stok keluar)**
  - Dicatat aset yang dipasang di gedung/ruangan tertentu
  - Aset muncul di tab khusus pada detail ruangan
- **Riwayat Perpindahan Aset**
  - Perpindahan antar gedung/ruangan tercatat
  - Bisa tracking siapa yang melakukan mutasi dan kapan
- **Monitoring Kondisi Aset**
  - Status: baik, perlu perbaikan, rusak, tidak digunakan
  - Upload foto & dokumen perawatan

### 3. Fitur Operasional Gedung

- **Penempatan & Kapasitas Ruangan**
  - Monitoring jumlah pengguna/penghuni ruangan
  - Statistik ruangan terpakai vs kosong
- **Perawatan Gedung & Fasilitas**
  - Pelaporan kerusakan (AC, listrik, furniture, plumbing, dll.)
  - Jadwal perawatan rutin (harian, mingguan, bulanan)
  - Penanggung jawab perbaikan (petugas maintenance)
- **Kebersihan & Utilitas**
  - Jadwal cleaning
  - Monitoring pemakaian listrik, air, internet

### 4. Laporan & Dashboard

- **Laporan Aset Gedung**: daftar aset per gedung/lantai/ruangan
- **Riwayat Pemakaian**: histori pemasangan dan perpindahan aset
- **Laporan Kerusakan & Perawatan**: status, frekuensi, biaya
- **Dashboard Real-Time**: kapasitas ruangan, jumlah aset, kerusakan terbuka

### 5. Integrasi

- **Integrasi dengan Modul Inventory**
  - Aset keluar dari inventory dapat langsung ditempatkan ke gedung/ruangan
  - Riwayat aset tetap sinkron dengan inventory (stock berkurang, tercatat di building)
- **Integrasi dengan Modul HR (Opsional)**
  - Penanggung jawab gedung/ruangan diambil dari data karyawan aktif
  - Maintenance staff dapat dicatat berdasarkan data HR

### 6. Audit Trail & Notifikasi

- **Audit Trail**: log aktivitas (penambahan aset, perpindahan, perawatan)
- **Notifikasi Otomatis**:
  - Aset rusak/perlu perbaikan
  - Jadwal perawatan rutin
  - Ruangan mendekati kapasitas penuh
