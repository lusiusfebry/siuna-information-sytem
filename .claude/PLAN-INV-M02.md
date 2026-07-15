# Rencana INV-M02 — Guard Aset saat Karyawan Keluar + Indikator "Belum Kembalikan Aset"

## Tujuan
Karyawan tidak dihapus (cukup ubah status aktif/tidak aktif). Karyawan **tidak bisa di-set ke status "Tidak Aktif"** (keluar/resign) selama masih memegang aset inventory yang belum dikembalikan. Tampilkan indikator jumlah aset tertahan sebagai nilai turunan (derived), bukan flag manual.

## Prinsip desain
- **Sumber kebenaran tunggal:** aset tertahan = `InvSerialNumber` dengan `karyawan_id = X` dan `status = 'Digunakan'`. Tidak menambah kolom flag di tabel employee (agar tak pernah basi).
- **Deteksi "keluar" berbasis kolom master** `status_karyawan.status = 'Tidak Aktif'` (future-proof: admin cukup menandai status keluar mana pun sebagai 'Tidak Aktif').
- **Meniru pola HR yang sudah ada** (blokir hapus penghuni mess aktif → 409 dengan pesan jelas).

## Perubahan data (migration — DIPUTUSKAN)
Data master `status_karyawan` saat ini: `Aktif`, `Cuti`, `Resign` — semua `status='Aktif'`. Hanya "Resign" yang bermakna keluar.
- **Migration idempoten**: `UPDATE status_karyawan SET status='Tidak Aktif' WHERE nama='Resign' AND status='Aktif'`. `down`: kembalikan ke 'Aktif'.
- Mengikuti pola file migration yang sudah ada di repo (cek konvensi penamaan & runner sebelum menulis).
- Gate langsung aktif setelah migration jalan.

## Backend

### 1. Guard transisi status (tingkat A) — `employee.service.ts`
Di `updateEmployeeComplete`, sebelum `employee.update(...)`:
- Deteksi apakah update ini menjadikan karyawan "Tidak Aktif":
  - Ambil `status_karyawan_id` baru (jika ada di payload), lookup `StatusKaryawan.status`.
  - Jika status baru = 'Tidak Aktif' DAN status lama bukan 'Tidak Aktif' (transisi masuk ke keluar):
    - Hitung aset tertahan: `InvSerialNumber.count({ where: { karyawan_id: id, status: 'Digunakan' } })`.
    - Jika > 0 → lempar error 409: `"Karyawan masih memegang N aset yang belum dikembalikan. Lakukan Retur Karyawan terlebih dahulu sebelum menonaktifkan."`
- Dilakukan di dalam transaksi yang sudah ada.
- Dynamic import model inventory (pola sama seperti guard facility occupant, agar dependensi hr→inventory tak masuk saat module load).

### 2. Hitungan aset tertahan (derived) untuk UI (tingkat B/badge)
- **Detail karyawan:** tambahkan `outstanding_assets_count` ke response `getEmployeeById`/`getEmployeeBase` (subquery COUNT atau hitung terpisah). Alternatif ringan: endpoint aset per-karyawan sudah ada (`/inventory/employee/:id/assets`) — badge di tab bisa dihitung dari situ. Untuk badge di **profil header** (bukan hanya tab), sediakan angka di response employee.
- **Daftar karyawan (opsional, list badge):** tambahkan `outstanding_assets_count` di `getAllEmployees` via subquery agar badge bisa muncul di list tanpa N+1. (Bisa ditandai opsional bila ingin scope minimal.)

Karena hitungan lintas modul (hr→inventory), gunakan subquery literal atau hitung batch (satu query COUNT GROUP BY karyawan_id untuk halaman list) — hindari N+1.

## Frontend

### 3. Badge indikator — `EmployeeDetailPage.tsx`
- Tampilkan badge peringatan di header profil bila `outstanding_assets_count > 0`: mis. lencana merah "⚠ N aset belum dikembalikan", dengan aksi klik → pindah ke tab "Aset".
- Tab "Aset" sudah ada (`EmployeeAssetsTab`) — tak perlu dibuat baru (tingkat B sebagian besar sudah terpenuhi).

### 4. Pesan error saat gagal nonaktif
- Saat submit ubah status gagal 409, tampilkan pesan dari backend via toast (pola error handling yang sudah ada di wizard/form).

### 5. Badge di daftar — `EmployeeListPage.tsx` (DIPUTUSKAN: dikerjakan)
- `getAllEmployees` menyertakan `outstanding_assets_count` via satu query COUNT GROUP BY karyawan_id (batch, tanpa N+1) untuk halaman yang tampil.
- Render ikon/lencana kecil pada baris karyawan yang `outstanding_assets_count > 0`.

## Verifikasi
- **tsc --noEmit** BE + FE bersih.
- **Runtime BE** (script sementara terhadap DB, lalu dibersihkan):
  - Karyawan tanpa aset `Digunakan` → boleh diubah ke 'Tidak Aktif' (sukses).
  - Karyawan dengan aset `Digunakan` → ubah ke 'Tidak Aktif' ditolak 409 dengan jumlah benar.
  - Transisi antar status 'Aktif' (mis. Aktif↔Cuti) → tidak terpengaruh.
  - `outstanding_assets_count` akurat (0 vs N).
- Karena saat ini belum ada aset yang dipegang siapa pun, buat data uji sementara (prefix ZZ) lalu bersihkan.
- Update `AUDIT-INVENTORY.md`: INV-M02 → FIXED + catatan resolusi.

## Batas scope (yang TIDAK dikerjakan)
- Tidak membuat modul Offboarding penuh (checklist keluar, approval, akses) — itu fitur terpisah di luar INV-M02.
- Tidak menghapus/menonaktifkan jalur `deleteEmployee` (tetap apa adanya; guard occupant HR yang sudah ada tak diubah).
- Kolom flag manual TIDAK ditambahkan (indikator murni derived).

## Keputusan (sudah final)
1. Data master: **migration otomatis** set 'Resign' → 'Tidak Aktif'.
2. Badge: **detail + daftar karyawan** (langkah 3, 4, dan 5 semua dikerjakan).
