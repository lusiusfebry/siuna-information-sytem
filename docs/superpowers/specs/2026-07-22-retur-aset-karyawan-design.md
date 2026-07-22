# Desain: Retur Aset Karyawan (A + B + C)

- **Tanggal:** 2026-07-22
- **Modul:** Inventory (dengan titik masuk dari HR)
- **Status:** Disetujui untuk implementasi (menunggu review spec)
- **Lingkup:** Aset **ber-serial / ber-tag** saja. Barang non-serial **ditunda** (lihat "Di luar lingkup").

---

## 1. Latar Belakang & Masalah

Saat ini retur barang dari karyawan ke gudang dilakukan lewat form **Buat Transaksi → Stok Masuk → Retur dari Karyawan** (`TransaksiFormPage.tsx`). Masalah pada alur sekarang:

1. Kolom karyawan mengharuskan mengetik nama, sedangkan admin sering **lupa nama lengkap** karyawan.
2. Pencarian karyawan tidak discope ke **pemegang aset**, jadi memunculkan semua karyawan aktif.
3. Serial number yang diretur harus **diketik manual**, rawan salah dan tidak tahu aset apa yang sedang dipegang karyawan.
4. Tidak ada cara mulai dari **barang fisik** (serial/tag di tangan) untuk menemukan pemegangnya.

Fakta teknis terverifikasi:
- `sub_tipe: 'Retur Karyawan'` **sudah ada** dan sudah ditangani `stok.service.ts` (melepas `karyawan_id`, mengembalikan unit ke gudang). Bertipe `Masuk` → **auto-approve** (tidak masuk antrean Pending).
- Aset per karyawan yang terlacak = record `InvSerialNumber` dengan `karyawan_id` terisi (ber-serial atau ber-tag). Barang **non-serial tidak dilacak per karyawan** (`handleStokKeluar` hanya mengurangi stok gudang untuk non-serial).
- Tab aset karyawan `EmployeeAssetsTab.tsx` sudah menampilkan aset aktif + riwayat + tombol Berita Acara, tetapi **belum ada tombol Retur**.

## 2. Tujuan

Mengerjakan tiga peningkatan yang saling terkait:

- **A. Retur dari profil karyawan** — tombol "Retur Aset" di tab aset (HR) → buka halaman retur dengan karyawan terpilih & aset otomatis tampil.
- **B. Pemilihan aset via checklist** — setelah karyawan dipilih, aset yang dipegang muncul sebagai daftar centang (tanpa ketik serial manual).
- **C. Lacak via serial/tag** — pencarian serial/tag number terpisah → tampilkan pemegang saat ini → tombol retur langsung.

Ditambah penyempurnaan pencarian karyawan: **hanya pemegang aset**, tampil semua saat kolom kosong, filter saat mengetik (ketik "tri" → "Triyanto").

## 3. Di luar lingkup (ditunda)

- **Retur barang non-serial (berbasis qty).** Sistem belum melacak saldo barang non-serial per karyawan. Menambahkannya butuh perubahan alur "Ke Karyawan" + tabel/perhitungan saldo baru — dikerjakan sebagai fitur terpisah nanti.
- Perubahan mekanisme approval (approval tetap seperti sekarang; retur auto-approve karena tipe Masuk).

## 4. Keputusan desain (hasil brainstorming)

| Topik | Keputusan |
|-------|-----------|
| Bentuk alur | **Keduanya**: sempurnakan form transaksi + halaman retur khusus, berbagi logika inti |
| Scope search karyawan | **Hanya pemegang aset**; tampil semua saat kolom kosong |
| Barang non-serial | **Serial/tag dulu**, non-serial ditunda |
| Berita Acara retur | **Ya** — PDF "Berita Acara Pengembalian" (arah terbalik dari serah terima) |
| Titik masuk opsi C | **Pencarian serial/tag terpisah** dengan tombol Retur dari hasil |

## 5. Arsitektur

Prinsip: **logika inti dipusatkan** (satu hook + satu komponen picker) dan dikonsumsi oleh dua entry point, sehingga tidak ada duplikasi. Backend hanya **menambah endpoint baca** dan **reuse** jalur transaksi retur yang sudah ada — tidak menyentuh alur "Ke Karyawan" maupun approval.

### 5.1 Backend

**Endpoint baru** (modul inventory, `inventory.routes.ts`):

| Method | Path | Permission | Fungsi |
|--------|------|------------|--------|
| `GET` | `/inventory/employees/with-assets?q=` | `inventory_stock:read` | Daftar karyawan **pemegang aset** aktif. Field: `id`, `nama_lengkap`, `nomor_induk_karyawan`, `asset_count`. `q` kosong → semua pemegang (urut nama); ada `q` → filter `iLike` nama/NIK. |
| `GET` | `/inventory/assets/lookup?identifier=` | `inventory_stock:read` | Cari 1 unit via **serial ATAU tag** (`serial_number` = identifier OR `tag_number` = identifier). Kembalikan detail unit (produk, brand, status, gudang) + **pemegang saat ini** (karyawan atau null). |

**Service (`employee-asset.service.ts`):**
- `getEmployeesWithAssets(q?)` — query `InvSerialNumber` di-`group by karyawan_id` (where `karyawan_id` not null), join `Employee` (status Aktif), hitung `asset_count`. Filter `q` pada nama/NIK.
- `lookupAssetByIdentifier(identifier)` — cari `InvSerialNumber` dengan serial/tag = identifier, include produk/brand/gudang + karyawan (paranoid:false agar nama historis tetap terbaca).
- `getEmployeeAssets(employeeId)` — **reuse tanpa perubahan** untuk checklist.

**Retur transaksi:** memakai jalur `stok.service` yang sudah ada dengan payload `sub_tipe: 'Retur Karyawan'`, `tipe: 'Masuk'`. Tidak ada perubahan logika retur di service.

**Berita Acara Pengembalian:** `generateBeritaAcara(employeeId, transaksiId?, arah?)` — tambah parameter `arah: 'serah' | 'kembali'` (default `'serah'` untuk kompatibilitas). `'kembali'` mengubah judul → "BERITA ACARA PENGEMBALIAN BARANG" dan membalik label tanda tangan (Yang Mengembalikan = karyawan, Yang Menerima = gudang/admin). Endpoint retur-BA memakai fungsi yang sama dengan `arah=kembali`.

### 5.2 Frontend — inti (dipakai bersama)

**`ReturAssetPicker`** (komponen, `components/inventory/ReturAssetPicker.tsx`):
- Search karyawan pemegang aset (memanggil `/employees/with-assets`), tampil semua saat kosong, filter saat mengetik.
- Setelah karyawan dipilih → panggil `getEmployeeAssets` → render **checklist aset** (produk, brand, serial/tag, status). Centang untuk memilih.
- Field **gudang tujuan** (wajib) — ke mana unit dikembalikan.
- Nilai keluaran (via props/callback): `{ karyawan_id, gudang_id, selected: {produk_id, uom_id, serial_or_tag}[] }`.
- Bisa di-*preselect* dari luar (untuk opsi A & C): terima prop `initialKaryawanId` dan `preselectIdentifiers`.

**`useReturKaryawan`** (hook, `hooks/useReturKaryawan.ts`):
- Membungkus `useCreateTransaksi` dengan penyusunan payload `Retur Karyawan` dari aset tercentang (dikelompokkan per produk → satu detail per produk dengan array serial/tag).
- On success → picu modal **Berita Acara Pengembalian** (unduh PDF `arah=kembali`).

**Layanan API baru** (`services/api/inventory-employee.service.ts`): `getEmployeesWithAssets(q)`, `lookupAsset(identifier)`, dan varian `downloadBeritaAcara(..., 'kembali')`.

### 5.3 Frontend — entry point

**Halaman retur khusus** (`pages/inventory/stok/ReturPage.tsx`, route `/inventory/retur`):
- Bagian atas: **panel pencarian serial/tag** (opsi C). Input identifier → `lookupAsset` → kartu hasil (produk, serial/tag, pemegang, gudang asal). Jika dipegang karyawan → tombol **"Retur unit ini"** yang men-*preselect* karyawan + unit di picker. Jika tidak dipegang karyawan → info "tidak sedang dipegang karyawan", tanpa tombol.
- Bagian utama: `ReturAssetPicker` + tombol Simpan (memakai `useReturKaryawan`).
- Membaca query `?karyawan=<id>` (untuk opsi A) → preselect karyawan.
- Dibungkus `PermissionGuard` `inventory_stock:create`.

**Form transaksi umum** (`TransaksiFormPage.tsx`):
- Saat `subTipe === 'Retur Karyawan'`, ganti blok input-karyawan-manual + textarea serial dengan `ReturAssetPicker`. Sub-tipe lain tidak berubah.
- Gudang tujuan retur dikelola oleh `ReturAssetPicker` (bukan field "Gudang" umum form), sehingga perilaku identik dengan halaman retur khusus. Field "Gudang" umum tetap dipakai sub-tipe lain.

**Profil karyawan HR** (`EmployeeAssetsTab.tsx`, opsi A):
- Tambah tombol **"Retur Aset"** di header (muncul saat `hasAssets`), navigate ke `/inventory/retur?karyawan=<employeeId>`.

**Sidebar** (`Sidebar.tsx`): tambah item `{ name: 'Retur Aset', path: '/inventory/retur', icon: 'assignment_return' }` di grup "Manajemen Stok".

**Routing** (`App.tsx`): route `inventory/retur` dengan `PermissionGuard` `INVENTORY_STOCK` / `CREATE`, lazy-loaded.

## 6. Alur data (contoh: opsi A)

1. Admin buka detail karyawan → tab Aset → klik "Retur Aset".
2. Navigate `/inventory/retur?karyawan=42`.
3. `ReturPage` preselect karyawan 42 → `getEmployeeAssets(42)` → checklist aset tampil.
4. Admin centang unit + pilih gudang tujuan → Simpan.
5. `useReturKaryawan` kirim transaksi `Retur Karyawan` (Masuk, auto-approve) → `stok.service` melepas `karyawan_id`, unit kembali ke gudang.
6. Modal tawarkan **Berita Acara Pengembalian** → unduh PDF (`arah=kembali`).
7. Aset hilang dari profil karyawan; muncul di riwayat transaksi.

## 7. Penanganan error

- `/assets/lookup` identifier tidak ditemukan → 404 "Serial/Tag number tidak ditemukan" (frontend tampilkan pesan, tanpa kartu).
- Aset ditemukan tetapi tidak dipegang karyawan → kartu info, tanpa tombol retur.
- Submit tanpa gudang tujuan / tanpa aset tercentang → validasi frontend (toast Indonesia), tidak kirim request.
- Serial/tag yang diretur ternyata sudah bukan milik karyawan (race) → service menolak dgn pesan existing; frontend tampilkan pesan error.
- Semua pesan berbahasa Indonesia (konvensi proyek).

## 8. Testing

**Backend (Jest, pola `stok.approval.test.ts`):**
- `/employees/with-assets`: hanya memunculkan karyawan yang punya aset; `asset_count` benar; filter `q` bekerja untuk nama & NIK; karyawan non-aktif tidak muncul.
- `/assets/lookup`: temukan via serial; temukan via tag; pemegang null saat unit di gudang; 404 saat tidak ada.
- Alur retur end-to-end: setelah retur, unit `karyawan_id` = null, `gudang_id` = gudang tujuan, `status` kembali 'Tersedia', transaksi ter-approve otomatis.
- `generateBeritaAcara(arah='kembali')`: judul & label tanda tangan terbalik.

**Frontend (Vitest):**
- `ReturAssetPicker`: search pemegang → pilih → checklist muncul → centang → callback berisi seleksi benar; preselect via props.
- `ReturPage`: lookup serial → kartu hasil → "Retur unit ini" preselect; query `?karyawan=` preselect.

## 9. Berkas terdampak (ringkas)

**Backend:**
- `modules/inventory/services/employee-asset.service.ts` (tambah 2 fungsi + param `arah` BA)
- `modules/inventory/controllers/employee-asset.controller.ts` (2 handler baru + param arah)
- `modules/inventory/routes/inventory.routes.ts` (2 route baru + route BA retur)
- test baru di `modules/inventory/services/__tests__/`

**Frontend:**
- `components/inventory/ReturAssetPicker.tsx` (baru)
- `hooks/useReturKaryawan.ts` (baru)
- `pages/inventory/stok/ReturPage.tsx` (baru)
- `services/api/inventory-employee.service.ts` (tambah fungsi)
- `pages/inventory/stok/TransaksiFormPage.tsx` (pakai picker saat Retur Karyawan)
- `components/inventory/EmployeeAssetsTab.tsx` (tombol Retur Aset)
- `components/layout/Sidebar.tsx`, `App.tsx` (menu + route)
- test baru di frontend

## 10. Kompatibilitas & keamanan

- Tidak ada migrasi DB baru (memakai kolom & sub_tipe yang sudah ada).
- Tidak mengubah alur "Ke Karyawan", approval, atau titik kopling lintas-modul (HR↔Inventory tetap via `karyawan_id`).
- Endpoint baru dilindungi permission inventory yang sudah ada; tidak menambah permission baru.
- Data produk milik user tidak disentuh (user input manual).
