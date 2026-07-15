# Rencana INV-C01 — Auto-Sinkron Inventory ↔ Facility (placement aset gedung)

## Masalah
Dua mekanisme penempatan aset ke gedung **terputus**:
1. Transaksi **"Ke Gedung/Mess"** (`stok.service.ts`) → hanya catat ref gedung/kamar di *header* transaksi + set serial `status='Digunakan'`, `gudang_id=null`. TIDAK membuat `facility_assets`.
2. **`POST /facility/assets`** (`asset.service.ts`) → buat baris `facility_assets` manual TANPA menyentuh stok/serial inventory.

Akibat: satu unit bisa `Tersedia` di gudang (versi inventory) sekaligus `Aktif` di kamar (versi facility). Bertentangan dgn spec `05_building_management.md:47-49` ("riwayat tetap sinkron; stock berkurang, tercatat di building").

Tambahan temuan: **tak ada jalur "kembali dari gedung"** — enum `sub_tipe` mentok di "Ke Gedung/Mess"; aset yg dikirim ke gedung tak bisa balik ke gudang lewat transaksi. `facility_assets.withdraw` hanya set `Ditarik` tanpa menyentuh stok/serial.

## Kondisi menguntungkan
- Data **kosong**: 0 transaksi "Ke Gedung/Mess", 0 `facility_assets` → tak perlu backfill, bebas desain ulang.
- `stok.service` **sudah** import `FacilityBuilding`/`FacilityRoom` (kopling modul sudah ada).
- Validasi referensial room↔building sudah ada (INV-M09) di `createTransaksi`.
- Serial `Tersedia` punya `gudang_id`; `produk` punya `uom_id` → jalur manual bisa turunkan gudang asal & uom otomatis.

## Keputusan (sudah final dari user)
1. **Cakupan: dua arah penuh.** Auto-buat `facility_assets` saat "Ke Gedung/Mess" + tambah `sub_tipe` baru **"Ambil dari Gedung"** (tipe Masuk) yg kembalikan serial ke gudang & tutup `facility_assets`. Sekalian tuntaskan INV-M04.
2. **Jalur manual dipertahankan + disinkronkan.** `POST /facility/assets` tetap ada, tapi kini juga menyentuh serial (set `Digunakan`, `gudang_id=null`) via delegasi ke logika transaksi. Satu sumber kebenaran = state serial.
3. **Kamar opsional** untuk "Ke Gedung/Mess". Sinkron `facility_assets` hanya terjadi bila `facility_room_id` diisi (karena `facility_assets.room_id` NOT NULL). Penempatan level-gedung-saja tetap valid tapi tak buat baris `facility_assets` (didokumentasikan sbg batasan).

## Batasan yang diketahui
- `facility_assets.serial_number_id` NOT NULL → sinkron hanya untuk produk ber-**serial** atau **tag-only** (punya record `InvSerialNumber`). Produk qty-murni tak bisa ditaut ke `facility_assets` (tetap tercatat di header transaksi saja). Akan diberi komentar di kode.

## Backend

### 1. Migration — enum `sub_tipe` + kolom pelacak (idempoten)
- Tambah nilai enum **"Ambil dari Gedung"** ke `inv_transaksi.sub_tipe` (Postgres: `ALTER TYPE ... ADD VALUE IF NOT EXISTS`; jalankan di luar transaksi bila runner mengizinkan, ikuti pola migration enum yg sudah ada bila ada — cek dulu).
- Tambah kolom `source_transaksi_detail_id` / atau kaitkan `facility_assets` ke transaksi asal: tambah kolom **`facility_assets.transaksi_id`** (nullable, FK ke `inv_transaksi`, `SET NULL`) supaya baris placement bisa dilacak ke transaksi pembuatnya & ditutup saat "Ambil dari Gedung". Manual-create → `transaksi_id=null`.
- `down`: hapus kolom; enum value tak bisa di-drop bersih di PG (didokumentasikan; `down` no-op utk enum, aman krn additive).

### 2. `stok.service.ts` — sinkron dari sisi transaksi
- **Model:** import `FacilityAsset` (kopling inventory→facility; sudah ada preseden import FacilityRoom/Building).
- **Helper `syncFacilityPlacementOnKeluar(...)`** dipanggil di `handleStokKeluar` cabang `'Ke Gedung/Mess'`, hanya bila `payload.facility_room_id` ada & serial record tersedia:
  - Guard: serial belum jadi `facility_assets` status `Aktif` di tempat lain (pola sama `asset.service.create`), else 409.
  - `FacilityAsset.create({ room_id, serial_number_id, tanggal_penempatan=payload.tanggal, status:'Aktif', transaksi_id, created_by })` di dalam transaksi `t`.
  - Berlaku utk cabang `has_serial_number` maupun `has_tag_number` (loop yg sudah ada).
- **Helper `handleAmbilDariGedung(...)`** — sub_tipe baru "Ambil dari Gedung" (tipe **Masuk**): kebalikan "Ke Gedung/Mess":
  - Serial: `gudang_id = payload.gudang_id` (gudang tujuan pengembalian), `status='Tersedia'`, `transaksi_terakhir_id`.
  - `upsertStok(+jumlah)` ke gudang tujuan (pola sama Retur Karyawan).
  - Tutup `facility_assets` terkait: baris `status='Aktif'` utk `serial_number_id` → set `status='Ditarik'`, `tanggal_penarikan=payload.tanggal`.
  - Ditambahkan di `handleStokMasuk` (routing tipe Masuk) atau cabang khusus di `createTransaksi`.
- Semua di dalam transaksi `t` yg sudah ada → atomic; rollback konsisten.

### 3. `asset.service.ts` (facility) — jalur manual disinkronkan
- `create(data)`: selain guard duplikat aktif yg sudah ada, kini **juga**:
  - Validasi serial ada & `status='Tersedia'` (tak bisa tempatkan aset yg sedang dipakai/rusak/disposed) → 400 bila tidak.
  - Update serial: `status='Digunakan'`, `gudang_id=null`, (opsional `transaksi_terakhir_id` tetap).
  - `upsertStok(-1)` pada gudang asal serial (kurangi stok) — reuse util; perlu ekspor/akses fungsi stok. **Alternatif lebih bersih:** delegasikan ke `stokService.createTransaksi(...)` membentuk transaksi "Ke Gedung/Mess" sintetis lalu baris `facility_assets` dibuat oleh helper #2 → hindari duplikasi logika. **Rencana: pakai delegasi** (uom & gudang asal diturunkan dari produk & serial).
  - Bungkus dalam satu transaksi DB.
- `withdraw(id, data)`: selain set `Ditarik`, **juga** kembalikan serial ke gudang & tambah stok (delegasi ke transaksi "Ambil dari Gedung" sintetis, gudang tujuan = gudang asal terakhir / dipilih). Konsistenkan dgn #2.

> Catatan: delegasi dua arah antara asset.service (facility) ↔ stokService (inventory) berarti facility→inventory import. Cek tak ada circular import saat module load (pakai dynamic import bila perlu, pola sama guard occupant di employee.service).

### 4. `getFacilityInventory` — sumber data
- Saat ini baca log transaksi "Ke Gedung/Mess". Setelah sinkron, `facility_assets` jadi tabel penempatan hidup. Evaluasi: ubah `getFacilityInventory` membaca `facility_assets` (status `Aktif`) join serial+produk agar akurat pasca perpindahan berkali-kali (menyinggung INV-M06/B-6). **Minimal**: biarkan tapi tambahkan sumber `facility_assets` sbg kebenaran; **disarankan**: pindah ke `facility_assets`. Akan diputuskan saat implement (default: pindah ke facility_assets utk akurasi).

## Frontend
### 5. `TransaksiFormPage.tsx`
- Tambah opsi `sub_tipe` **"Ambil dari Gedung"** (tipe Masuk) dgn field: pilih gedung/kamar asal + gudang tujuan + serial. Mirror UI "Retur Karyawan".
- (Tak mengubah "Ke Gedung/Mess" selain memastikan kamar terkirim bila dipilih.)

### 6. `AssetPage.tsx` (facility)
- Setelah backend menyinkronkan, form create manual tetap; tambahkan info bahwa membuat placement akan menandai serial `Digunakan` & mengurangi stok. Field `serial_number_id` sebaiknya diganti dropdown serial `Tersedia` (opsional, quality) — minimal validasi backend sudah menjaga.

## Verifikasi
- **tsc --noEmit** BE + FE bersih.
- **Runtime BE** (script sementara, prefix ZZ, lalu dibersihkan):
  1. "Ke Gedung/Mess" dgn kamar → serial `Digunakan`, `facility_assets` `Aktif` dibuat & tertaut `transaksi_id`, stok berkurang.
  2. "Ambil dari Gedung" → serial `Tersedia` di gudang tujuan, `facility_assets` → `Ditarik`, stok bertambah.
  3. Manual `POST /facility/assets` utk serial `Tersedia` → serial jadi `Digunakan`, stok berkurang, tak dobel-aktif.
  4. Manual create utk serial yg sudah `Digunakan`/aktif di kamar lain → 409.
  5. `withdraw` → serial balik `Tersedia`, stok bertambah, `facility_assets` `Ditarik`.
  6. "Ke Gedung/Mess" tanpa kamar → tetap sukses, tak buat `facility_assets` (batasan terdokumentasi).
  7. Konsistensi: tak ada unit `Tersedia` di gudang sekaligus `Aktif` di `facility_assets`.
- Update `AUDIT-INVENTORY.md`: INV-C01 → FIXED, INV-M04 → FIXED, B-1/B-2/B-4/B-6 dicentang dgn catatan resolusi.

## Batas scope (yang TIDAK dikerjakan)
- Tidak menambah kolom lokasi (building/room) langsung di `inv_serial_number` (itu INV-M03, ditangani terpisah; lokasi tetap direkonstruksi via `facility_assets` + `transaksi_terakhir_id`).
- Tidak mengubah alur transfer gudang, disposal, atau retur karyawan.
- Produk qty-murni (tanpa serial/tag) tetap tak tertaut `facility_assets` (batasan struktural tabel).
