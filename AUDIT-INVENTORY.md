# AUDIT MODUL INVENTORY — DOKUMEN KONTROL

**Proyek:** Bebang Sistem Informasi (BIS)
**Modul:** Inventory (+ relasi HR, Facility, Access Rights)
**Konteks target:** Perusahaan pertambangan & industri umum — kelas enterprise
**Tanggal dibuat:** 15 Juli 2026
**Status dokumen:** AKTIF — kontrol audit (living document)

> Dokumen ini adalah **alat kontrol audit**, bukan laporan hasil. Ia mendefinisikan *ruang lingkup*, *metode*, *checklist*, dan *register temuan* untuk audit menyeluruh modul Inventory. Setiap item diberi ID agar bisa dilacak dari "ditemukan" → "diperbaiki" → "diverifikasi". **Belum ada kode yang diubah** oleh dokumen ini.

---

## 1. TUJUAN & KRITERIA SELESAI

Audit dinyatakan **SELESAI** bila keempat sasaran berikut terpenuhi dan terverifikasi:

| # | Sasaran | Kriteria verifikasi |
|---|---------|---------------------|
| S-1 | Tidak ada bug | Semua item severity **Critical/Major** di register (§7) berstatus `VERIFIED-FIXED`; regresi diuji end-to-end |
| S-2 | Semua fitur berjalan baik | Matriks fitur (§5) semua baris `OK`; tiap alur transaksi diuji end-to-end (§8) |
| S-3 | Validasi berjalan baik | Checklist validasi (§6.D) semua `PASS`; validasi berlapis (DB → service → controller → frontend) konsisten |
| S-4 | Siap ditambah fitur | Tidak ada utang arsitektur pemblokir; relasi lintas-modul konsisten & terdokumentasi (§6.A/B/C) |

**Patokan:** implementasi dibandingkan terhadap **(a)** spesifikasi asli (`planning/03_modul_inventory.md`, `04_modul_mess.md`, `05_building_management.md`) dan **(b)** praktik **sistem inventory modern** (§3).

---

## 2. RUANG LINGKUP

### Termasuk
- Backend modul Inventory: `backend/src/modules/inventory/` (models, services, controllers, routes, migrations `28–62`).
- Frontend modul Inventory: `frontend/src/pages/inventory/`, `hooks/useInventory*`, `services/api/inventory-*`, `types/inventory.ts`, komponen `components/inventory/`.
- **Relasi lintas-modul** (fokus permintaan): Inventory ↔ HR, Inventory ↔ Facility, Inventory ↔ Access Rights (RBAC).
- Validasi di semua lapis; integritas data; kesiapan ekstensi.

### Tidak termasuk (tetapi disinggung bila memengaruhi relasi)
- Internal modul HR, Facility, Auth yang tak bersentuhan dengan Inventory.
- Infrastruktur (Redis, Docker) kecuali berdampak langsung ke perilaku Inventory.

---

## 3. PATOKAN: PRINSIP SISTEM INVENTORY MODERN

Audit menilai modul terhadap prinsip berikut (checklist di §6.E):

1. **Single source of truth untuk lokasi/kepemilikan aset.** Setiap unit fisik (serial) punya *satu* status & lokasi kanonik yang tak boleh saling bertentangan antar-modul.
2. **Double-entry / pergerakan berpasangan.** Transfer antar-lokasi = dua kaki (keluar+masuk) yang atomik dan seimbang. Saldo tak pernah negatif.
3. **Ketertelusuran penuh (audit trail).** Setiap pergerakan tercatat, bisa ditelusuri: siapa, kapan, dari/ke mana, dokumen pendukung.
4. **Identitas unik.** Serial number unik global; asset tag unik; kode produk/gudang unik & auto.
5. **Integritas transaksional.** Operasi multi-tabel atomik (all-or-nothing per unit kerja); tak ada partial write yang meninggalkan data timpang.
6. **Kontrol akses berbutir.** RBAC per resource+action; idealnya scoping per-department/site untuk multi-site (mining).
7. **Rekonsiliasi & pencegahan orphan.** Penghapusan/penonaktifan entitas terkait (karyawan, gudang) tak meninggalkan aset menggantung.
8. **Validasi berlapis & fail-closed.** Validasi di DB (constraint), service (bisnis), controller (referensi), frontend (UX). Default menolak, bukan meloloskan.
9. **Manajemen siklus hidup aset.** Tersedia → Digunakan → Dikembalikan/Rusak/Disposed, dengan transisi status yang tervalidasi.
10. **Observability & pelaporan akurat.** Dashboard/laporan mencerminkan keadaan sebenarnya; filter berfungsi; angka konsisten lintas endpoint.

---

## 4. METODE AUDIT

Tahapan (setiap tahap menghasilkan entri di register §7):

1. **Pemetaan faktual** *(SELESAI)* — 3 penelusuran paralel: backend, frontend, relasi lintas-modul. Hasil diringkas di §6.
2. **Verifikasi statis** — baca kode jalur kritis; cek konsistensi tipe/enum/constraint; bandingkan vs spesifikasi & prinsip modern.
3. **Verifikasi dinamis (runtime)** — uji end-to-end tiap alur transaksi (§8) via API + DB; cek anomali data integritas (query pemeriksa).
4. **Klasifikasi temuan** — severity (Critical/Major/Minor/Info) + kategori (Bug/Integritas/Validasi/RBAC/Konsistensi/UX/Utang).
5. **Rencana perbaikan** — usulan fix per item (tanpa mengeksekusi sampai disetujui).
6. **Verifikasi perbaikan** — setelah fix, uji ulang; update status register.

**Legenda status:** `OPEN` (ditemukan) · `PLANNED` (rencana fix disepakati) · `FIXED` (kode diubah) · `VERIFIED-FIXED` (diuji ulang lolos) · `ACCEPTED` (diterima sebagai bukan masalah / by-design) · `DEFERRED` (ditunda beralasan).

---

## 5. MATRIKS FITUR (status awal dari pemetaan)

> Diisi `OK` hanya setelah verifikasi dinamis (§8). Saat ini status = hasil pemetaan statis.

| Area | Fitur | Endpoint/Halaman | Status awal | Catatan |
|------|-------|------------------|-------------|---------|
| Master Data | CRUD Kategori/SubKategori/Brand/UOM/Produk/Gudang + soft-delete/restore | `/inventory/master/:model` | ⚠️ CEK | 6 entitas; recycle-bin & filter relasi baru disamakan |
| Master Data | Foto produk | `PUT /master/produk/:id/photo` | ⚠️ CEK | |
| Master Data | Filter relasi (SubKategori→Kategori, Produk→Brand) | Frontend | ⚠️ CEK | Baru ditambahkan sesi ini |
| Stok | Saldo per gudang | `/inventory/stok`, StokPage | ⚠️ CEK | |
| Stok | Kartu stok (histori per produk) | `/inventory/kartu-stok` | ⚠️ CEK | |
| Transaksi | Masuk/Supplier | `POST /transaksi` | ⚠️ CEK | Serial global-unique baru diperbaiki |
| Transaksi | Transfer antar gudang (berpasangan) | `POST /transaksi` | ⚠️ CEK | Kaki keluar+masuk otomatis |
| Transaksi | Ke Karyawan / Retur Karyawan | `POST /transaksi` | ⚠️ CEK | Relasi HR |
| Transaksi | Ke Gedung/Mess | `POST /transaksi` | ⚠️ CEK | Relasi Facility |
| Transaksi | Disposal / Rusak-Terbuang | `POST /transaksi` | ⚠️ CEK | |
| Transaksi | Adjustment / Opname | `POST /transaksi` | ⚠️ CEK | Tak menyentuh serial |
| Transaksi | Detail + serial number | `GET /transaksi/:id` | ⚠️ CEK | Tampilan serial baru diperbaiki |
| Transaksi | Upload dokumen | `POST /transaksi/:id/dokumen` | ⚠️ CEK | |
| Serial/Tag | Daftar & pelacakan | `/inventory/serial-numbers` | ⚠️ CEK | |
| Tagging | Auto asset-tag (`prefix_tag_kode-site_urut`) | `stok.service.generateTagNumber` | ⚠️ CEK | Null diam bila prefix/kode_site kosong (INV-M10) |
| Label/QR | Generate QR, cetak label A4/thermal, lookup | `/inventory/label/*` | ⚠️ CEK | QR FE dead code |
| Scan | Scan kamera/barcode QR | — | 🔴 BELUM ADA | Diminta spek §3/§11 (INV-M11) |
| Import | Produk & Stok Masuk (Excel) | `/inventory/import/*` | ⚠️ CEK | Stok-masuk all-or-nothing (INV-M12) |
| Export | 5 laporan × Excel/PDF | `/inventory/export/*` | ⚠️ CEK | Duplikasi export stok |
| Laporan | Halaman 5-tab | LaporanPage | 🔴 BUG | Filter `tipe` mismatch (INV-B01) |
| Dashboard | Stats, chart, velocity, monitoring | `/inventory/dashboard/*` | ⚠️ CEK | Refetch 60s |
| Aset Karyawan | Daftar, histori, Berita Acara PDF | `/inventory/employee/*` | ⚠️ CEK | Relasi HR |
| Facility Inv. | Inventaris per gedung | `/inventory/facility/:id/inventory` | ⚠️ CEK | Berbasis log transaksi |
| Foto Produk | Upload/preview | `PUT /master/produk/:id/photo` | ⚠️ CEK | |
| PWA/Offline | Mobile offline sync | — | 🔴 BELUM ADA | Diminta spek §7/§11 (INV-N06) |
| Approval | Alur persetujuan transaksi | — | 🔴 BELUM ADA | Diminta spek §8 (INV-N07) |
| Notifikasi | Reminder retur aset / barang rusak | — | ⚠️ SEBAGIAN | Hanya low-stock; sisanya belum (INV-N08) |

---

## 6. CHECKLIST AUDIT PER AREA

Setiap item: `[ ]` belum diaudit · `[~]` sedang · `[x]` selesai. ID temuan (bila ada) merujuk register §7.

### 6.A — RELASI INVENTORY ↔ HUMAN RESOURCES

Referensi kode: `stok.service.ts` (Ke/Retur Karyawan), `employee-asset.service.ts`, `employee.service.ts:468-506`, FK `karyawan_id` di `inv_serial_number` & `inv_transaksi`.

- [ ] **A-1** Assign aset ke karyawan ("Ke Karyawan") mengubah serial: `karyawan_id` diset, `status='Digunakan'`, `gudang_id=null`, stok berkurang. → uji end-to-end (§8-T4).
- [ ] **A-2** Retur karyawan ("Retur Karyawan") mengembalikan serial: `karyawan_id=null`, `status='Tersedia'`, stok bertambah; scoping per-karyawan benar (tak me-reset unit milik karyawan lain).
- [x] **A-3** **[INV-M01]** Produk *tag-only* (`has_tag_number && !has_serial_number`) yang di-assign ke karyawan **tidak punya jalur retur** → aset nyangkut `Digunakan` selamanya. Verifikasi & rencanakan simetri.
- [ ] **A-4** **[INV-M02]** Hapus (soft-delete) karyawan **tidak** memeriksa/mengembalikan aset inventory yang masih dipegang. FK `SET NULL` tak pernah aktif pada soft-delete → aset tetap `Digunakan` milik karyawan terhapus (orphan custody). Bandingkan: HR memblokir hapus bila masih jadi penghuni facility (`FacilityOccupant`), tapi tak ada guard serupa untuk aset inventory.
- [ ] **A-5** Nonaktif karyawan (status≠'Aktif'): tak ada penanganan aset; karyawan hilang dari pencarian assign tapi aset lama tetap tercatat. Tentukan apakah perlu peringatan.
- [ ] **A-6** Pencarian karyawan untuk assign hanya menampilkan `status='Aktif'` & non-deleted — verifikasi benar & diinginkan.
- [ ] **A-7** Join karyawan di semua read inventory memakai `paranoid:false` (karyawan terhapus tetap tampil di histori/Berita Acara) — verifikasi konsisten & benar.
- [ ] **A-8** `penanggung_jawab_id` gudang → `employees` (FK `SET NULL`). Verifikasi perilaku saat penanggung jawab dihapus.
- [ ] **A-9** Berita Acara PDF (serah-terima) akurat: data karyawan, daftar aset, per-transaksi vs semua-aset.

### 6.B — RELASI INVENTORY ↔ FACILITY MANAGEMENT

Referensi: `stok.service.ts` (Ke Gedung/Mess, `getFacilityInventory`), `facility/models/Asset.ts` (`serial_number_id`), migration `50/51`. Spesifikasi: `05_building_management.md:47-49` ("stock berkurang, tercatat di building; riwayat sinkron").

- [ ] **B-1** Assign aset ke gedung/kamar ("Ke Gedung/Mess"): stok berkurang, `status='Digunakan'`, `facility_building_id`/`room_id` tercatat di **header transaksi**. Uji end-to-end (§8-T5).
- [ ] **B-2** **[INV-C01 — STRUKTURAL]** Dua mekanisme penempatan **terputus**: (1) transaksi "Ke Gedung/Mess" (ref gedung hanya di header, serial tak tertaut ke kamar) vs (2) tabel `facility_assets` (`serial_number_id`+`room_id`, dibuat manual via `POST /facility/assets`). Membuat transaksi **tidak** membuat baris `facility_assets`, dan sebaliknya. Akibat: satu unit bisa `Tersedia` di gudang (versi inventory) **sekaligus** `Aktif` di kamar (versi facility). **Bertentangan dengan spesifikasi** yang meminta sinkron. → keputusan desain diperlukan.
- [ ] **B-3** **[INV-M03]** Lokasi serial setelah "Ke Gedung/Mess" tidak tersimpan di record serial (tak ada kolom building/room di `inv_serial_number`); hanya bisa direkonstruksi via `transaksi_terakhir_id`. Evaluasi apakah perlu kolom lokasi langsung.
- [ ] **B-4** **[INV-M04]** `facility_assets` **tidak paranoid** & tak terikat siklus transaksi: retur/transfer serial tak menutup/memperbarui baris `facility_assets` → placement bisa basi.
- [ ] **B-5** `facility_assets.serial_number_id` FK `RESTRICT` ke `inv_serial_number` (non-paranoid). Verifikasi tak ada jalur hard-delete serial yang men-orphan.
- [ ] **B-6** `getFacilityInventory` berbasis log transaksi (bukan tabel penempatan hidup). Verifikasi akurasi bila ada perpindahan berkali-kali.
- [ ] **B-7** `penanggung_jawab_id`/`lokasi_kerja_id` gedung ↔ HR: konsistensi dengan gudang.

### 6.C — RELASI INVENTORY ↔ ACCESS RIGHTS (RBAC)

Referensi: `shared/constants/permissions.ts`, `types/permission.ts`, `routes/inventory.routes.ts`, `permission.middleware.ts`.

- [ ] **C-1** Konstanta RESOURCES/ACTIONS backend ↔ frontend **identik** (terverifikasi cermin persis). Pertahankan.
- [ ] **C-2** Semua route inventory `authenticate` + `checkPermission` (terverifikasi lengkap, tak ada yang bolong). Pertahankan.
- [ ] **C-3** **[INV-M05]** RBAC kasar: ACTIONS `IMPORT`/`EXPORT` tersedia tapi tak dipakai — `/import/*` pakai `INVENTORY_STOCK:CREATE`, `/export/*` pakai `:READ`. Siapa pun dengan read bisa export; create bisa bulk-import. Evaluasi pemakaian action khusus.
- [ ] **C-4** **[INV-M06]** Konflasi resource lintas-modul: endpoint `/employees/search`, `/employee/:id/assets`, `/berita-acara`, `/facility/:id/inventory` dijaga `INVENTORY_STOCK:READ` — tak ada cek permission HR/Facility untuk data lintas-modul.
- [ ] **C-5** **[INV-M07]** Tanpa department/site scoping: `InvGudang.department_id` ada tapi tak ada `checkDepartmentAccess` di inventory. Semua user dengan `inventory_stock:read` melihat **seluruh** gudang/transaksi lintas-department. HR menerapkan scoping untuk konsep sama. **Penting untuk konteks multi-site mining.** → keputusan kebijakan.
- [ ] **C-6** `POST /label/print` (mutatif secara bentuk) dijaga `ACTIONS.READ`. Evaluasi.
- [ ] **C-7** `restore` memakai `ACTIONS.DELETE` (bukan action khusus) — konsisten internal (facility sama). Terima atau standarkan.
- [ ] **C-8** Route-level FE hanya guard READ/CREATE; UPDATE/DELETE tak dijaga di route (diandalkan backend). Verifikasi backend benar-benar menegakkan.

### 6.D — VALIDASI DALAM MODUL INVENTORY

Referensi: `validateInventoryMasterData.ts`, `validateInventoryStok.ts`, cek inline `master-data.controller.ts`, constraint DB.

- [ ] **D-1** Validasi master data (Zod): status/boolean coercion, code di-strip (server-generated), stok_minimum≥0. Uji tiap model.
- [x] **D-2** **[INV-M08]** `validateInventoryMasterData` **meloloskan tanpa validasi** bila slug `:model` tak ada di schemaMap (silent pass-through). Fail-open — bertentangan prinsip #8. Rencanakan reject default.
- [ ] **D-3** Validasi transaksi (Zod `superRefine`): Supplier→supplier_nama; Transfer→gudang_tujuan_id; Ke Gedung/Mess→facility_building_id; Ke/Retur Karyawan→karyawan_id; jumlah≥1 (Adjustment boleh negatif). Uji tiap cabang.
- [x] **D-4** **[INV-M09]** `facility_room_id` diterima tapi tak pernah divalidasi/diwajibkan; tak dicek apakah room milik building yang dipilih. Evaluasi.
- [ ] **D-5** Validasi jumlah serial = kuantitas + no-duplikat (baru ditambahkan). Verifikasi tetap berlaku semua jalur.
- [ ] **D-6** Serial global-unique (DB partial index + cek service + cek frontend lintas-produk) — verifikasi 3 lapis konsisten (baru diperbaiki).
- [ ] **D-7** Saldo stok tak boleh negatif: `validateStokCukup` + `upsertStok` throw bila delta bikin negatif. Uji batas.
- [ ] **D-8** Cek referensi inline controller (kategori/sub/brand/penanggung_jawab/lokasi_kerja ada) — verifikasi lengkap & pesan Indonesia.
- [ ] **D-9** Import: validasi baris (brand/uom resolve, kode) — konsistensi pesan & penanganan gagal-sebagian.
- [ ] **D-10** Transisi status serial valid (mis. tak bisa "Ke Karyawan" unit yang sudah `Digunakan`/`Disposed`). Verifikasi guard status ada.

### 6.E — SISTEM INVENTORY MODERN & INTEGRITAS DATA

Referensi: prinsip §3; query integritas.

- [ ] **E-1** Atomicity transaksi: `createTransaksi` satu transaksi DB; transfer berpasangan atomik. Uji rollback saat gagal di tengah.
- [ ] **E-2** Transfer berpasangan seimbang: stok sumber turun = stok tujuan naik; serial berpindah sekali (tak dobel). Uji.
- [ ] **E-3** `generateCode`/`generateTagNumber` pakai advisory lock — verifikasi bebas race pada konkurensi.
- [ ] **E-4** `inv_stok` unik `(produk_id, gudang_id)` — satu produk/gudang satu baris; `uom_id` bukan bagian key (terverifikasi). Verifikasi konsekuensi bila UOM berubah.
- [ ] **E-5** Anomali data (query pemeriksa, §8-Q): stok negatif; serial `Digunakan` tanpa karyawan; serial `Tersedia` punya karyawan; produk has_serial tanpa row. *(Snapshot awal: semua 0 — bersih.)*
- [ ] **E-6** Notifikasi low-stock pasca-transaksi (non-blocking) berfungsi & tak menggagalkan transaksi.
- [ ] **E-7** Siklus hidup serial lengkap & tak ada dead-end status (kait ke A-3).
- [ ] **E-8** Cache invalidation master-data/stok pada create/update/delete — tak ada data basi.

### 6.F — KONSISTENSI, KUALITAS KODE & KESIAPAN EKSTENSI

- [x] **F-1** **[INV-B01 — BUG]** `LaporanPage.tsx:17` `TIPE_OPTIONS=['Barang Masuk','Barang Keluar','Transfer','Penyesuaian']` dikirim sebagai filter `tipe`, tapi backend cocokkan ke enum `'Masuk'|'Keluar'|'Adjustment'` → filter tipe **selalu nihil**. **Terverifikasi bug.**
- [x] **F-2** **[INV-N01]** Komponen `components/inventory/InventoryQRCode.tsx` **dead code** (tak diimpor mana pun).
- [x] **F-3** **[INV-N02]** Duplikasi `exportStokExcel/PDF` di `inventory-dashboard.service.ts` **dan** `inventory-laporan.service.ts` (endpoint sama).
- [ ] **F-4** **[INV-N03]** Inkonsistensi path: `/inventory/employees/search` (plural) vs `/inventory/employee/:id/...` (singular). Berfungsi (FE ikut), tapi tak rapi.
- [ ] **F-5** **[INV-N04]** `LaporanPage.tsx:37` akses defensif `.data.rows || .data` padahal service kembalikan `{data:T[]}` — sisa copy-paste.
- [ ] **F-6** Duplikasi logika serial vs tag-only di `handleStokKeluar` (blok hampir identik) — peluang refaktor.
- [ ] **F-7** Cakupan master data: 6 entitas inventory (vs 10 HR) — verifikasi cukup untuk kebutuhan; semua CRUD terimplementasi (bukan stub).
- [ ] **F-8** Kesiapan ekstensi: titik tempel fitur baru (approval, min/max stok lanjutan, multi-UOM, reservasi) tak terhalang utang arsitektur (terutama B-2, C-5).

### 6.G — FITUR FUNGSIONAL INVENTORY (tagging, QR/label, scan, import, export, dashboard, kartu stok, foto)

Area ini mengaudit fitur inventory *sebagai fitur* (bukan hanya relasinya), dibandingkan spesifikasi `03_modul_inventory.md` (§3 Pelabelan, §5 Laporan, §7 Mobile/PWA, §11 Fitur Modern, §12 Monitoring) dan prinsip modern §3.

**G.1 — Tagging / Asset Tag** — ref `stok.service.ts:generateTagNumber` (78-93), `SubKategori.prefix_tag`, `LokasiKerja.kode_site`.
- [ ] **G-1** Format tag `${prefix_tag}_${kode_site}_${urut(7)}`; auto saat "Masuk" bila produk `has_tag_number`. Uji end-to-end.
- [x] **G-2** **[INV-M10]** `generateTagNumber` **mengembalikan `null` diam-diam** bila sub-kategori tak punya `prefix_tag` ATAU gudang tak punya `lokasi_kerja.kode_site` → produk `has_tag_number` bisa masuk **tanpa tag** tanpa peringatan. Verifikasi & rencanakan peringatan/penolakan.
- [ ] **G-3** Keunikan `tag_number` global (`unique` di DB) — uji tak ada tabrakan lintas gudang/produk; urutan per-prefix bebas race (advisory lock).
- [ ] **G-4** Tag-only vs serial+tag vs serial-only: ketiga kombinasi `has_serial_number`/`has_tag_number` berperilaku benar di Masuk/Keluar (kait A-3/INV-M01).

**G.2 — QR Code, Label & Scan** — ref `label.service.ts`, `useInventoryLabel.ts`, `LabelPage.tsx`, `SerialNumberModal`.
- [ ] **G-5** Generate QR produk/serial/tag (payload `INV:PRODUK|SN|TAG:<kode>`) benar; `lookupQR` membalik payload ke record; format tak dikenal → 400.
- [ ] **G-6** Cetak label PDF: A4 (kolom) & thermal (50x30/70x40/100x50) render benar; asset-tag pakai `company_legal_name`.
- [ ] **G-7** **[INV-M11 — GAP SPESIFIKASI]** **Scan kamera/barcode TIDAK ADA.** Spek §3/§11 minta "scan kamera/scanner". Tak ada lib scan, `getUserMedia`, atau `BarcodeDetector` di kode. `lookupQR` ada di backend tapi tak ada antarmuka scan di frontend. → fitur belum dibangun; putuskan prioritas.
- [x] **G-8** **[INV-N05]** QR frontend inventory (`InventoryQRCode.tsx`) dead code (duplikasi F-2); QR nyata via backend PDF. Rapikan.

**G.3 — Import Excel** — ref `import.service.ts`, `ImportPage.tsx`.
- [ ] **G-9** Import Produk: resolve brand/uom by nama, generate kode, **per-baris independen** (bukan satu transaksi) — verifikasi gagal-sebagian dilaporkan benar (No. Baris).
- [x] **G-10** **[INV-M12]** Import Stok Masuk: **satu transaksi besar (all-or-nothing)** — satu baris gagal membatalkan semua. Bandingkan perbaikan import karyawan (per-baris) yang sudah diterapkan. Evaluasi konsistensi/robustness.
- [ ] **G-11** Preview → import (`/import/preview` simpan file, `/import/produk|stok-masuk` baca path) — verifikasi alur file & pembersihan temp.
- [ ] **G-12** Template & error report Excel benar; pesan Indonesia.

**G.4 — Export & Laporan** — ref `export.service.ts`, `inventory-laporan.service.ts`, `LaporanPage.tsx`.
- [ ] **G-13** 5 laporan (stok, transaksi, serial-number, stok-rendah, pergerakan) × Excel/PDF menghasilkan data benar & branding perusahaan.
- [ ] **G-14** **[INV-B01]** Filter `tipe` LaporanPage mismatch enum (lihat F-1) → laporan transaksi terfilter selalu kosong. **Bug terverifikasi.**
- [ ] **G-15** Filter tanggal/gudang pada tiap laporan berfungsi & konsisten dengan data.

**G.5 — Dashboard & Monitoring** — ref `dashboard.service.ts`, `DashboardPage.tsx`.
- [ ] **G-16** Akurasi stats: totalProduk, totalStok, lowStock (`< COALESCE(stok_minimum,5)`), asetDipinjam (serial ber-karyawan), transaksiBulanIni — cocokkan dengan query DB manual.
- [ ] **G-17** Stock-by-warehouse, category-breakdown, item-velocity (fast/slow/dead) benar & konsisten lintas endpoint (kait F-3 duplikasi velocity).
- [ ] **G-18** Monitoring realtime (spek §12): dashboard refetch 60s — verifikasi cukup untuk kebutuhan "pantau per gudang".

**G.6 — Kartu Stok & Foto** 
- [ ] **G-19** Kartu stok (histori pergerakan per produk) urut & saldo berjalan benar.
- [ ] **G-20** Upload/preview foto produk (`PUT /master/produk/:id/photo`) — tipe/ukuran file tervalidasi; path tersimpan benar.

**G.7 — Fitur spek yang BELUM ADA (gap, untuk kelengkapan kontrol)** — spek `03_modul_inventory.md`.
- [ ] **G-21** **[INV-M11]** Scan kamera/barcode (§3, §11) — belum ada (lihat G-7).
- [ ] **G-22** **[INV-N06]** PWA / offline sync (§7, §11) — tak ada service worker/manifest PWA. Belum ada.
- [ ] **G-23** **[INV-N07]** Approval system (§8 "approval system") — tak ada alur approval transaksi. Belum ada.
- [ ] **G-24** **[INV-N08]** Notifikasi/reminder pengembalian aset & barang rusak/kadaluarsa (§6) — hanya low-stock yang ada. Reminder lain belum.
- [ ] **G-25** Multi-language (§11) — UI Indonesia saja; evaluasi apakah dibutuhkan.

> **Catatan cakupan:** §6.G memastikan audit ini menilai **seluruh fitur** modul inventory (bukan hanya relasi HR/Facility/RBAC/validasi). Item **G-21..G-25** adalah *fitur spesifikasi yang belum dibangun* — dicatat agar kontrol audit lengkap; ini **bukan bug**, melainkan pekerjaan fitur yang menunggu prioritas.

---

## 7. REGISTER TEMUAN

Temuan dari pemetaan (statis). Severity akan dikonfirmasi pada verifikasi dinamis. **Belum ada yang diperbaiki oleh dokumen ini.**

| ID | Judul | Area | Severity | Kategori | Status |
|----|-------|------|----------|----------|--------|
| **INV-B01** | Filter `tipe` LaporanPage mismatch enum → hasil selalu kosong | F-1 | **Major** | Bug | FIXED |
| **INV-C01** | Dua mekanisme penempatan facility terputus (transaksi vs facility_assets) — bertentangan spesifikasi | B-2 | **Major** | Integritas/Struktural | OPEN |
| **INV-M01** | Produk tag-only tak punya jalur Retur Karyawan → aset nyangkut Digunakan | A-3 | Major | Bug/Integritas | FIXED |
| **INV-M02** | Hapus karyawan tak mengembalikan/blokir aset inventory (orphan custody) | A-4 | Major | Integritas | OPEN |
| **INV-M03** | Lokasi serial pasca Ke-Gedung/Mess tak tersimpan di record serial | B-3 | Minor | Desain | OPEN |
| **INV-M04** | facility_assets non-paranoid & tak terikat siklus transaksi → placement basi | B-4 | Minor | Integritas | OPEN |
| **INV-M05** | RBAC kasar: IMPORT/EXPORT action tak dipakai | C-3 | Minor | RBAC | ACCEPTED (by design) |
| **INV-M06** | Konflasi resource: data HR/Facility dijaga permission inventory_stock | C-4 | Minor | RBAC | ACCEPTED (by design) |
| **INV-M07** | Tanpa department/site scoping padahal gudang punya department_id | C-5 | **Major** (mining multi-site) | RBAC | FIXED |
| **INV-M08** | Validasi master-data fail-open untuk slug tak dikenal | D-2 | Minor | Validasi | FIXED |
| **INV-M09** | facility_room_id tak divalidasi milik building terpilih | D-4 | Minor | Validasi | FIXED |
| **INV-M10** | generateTagNumber return null diam-diam → produk bisa masuk tanpa tag | G-2 | Major | Bug/Integritas | FIXED |
| **INV-M11** | Scan kamera/barcode belum ada (diminta spesifikasi §3/§11) | G-7 | Major (gap fitur) | Fitur | OPEN |
| **INV-M12** | Import Stok Masuk all-or-nothing (satu baris gagal batalkan semua) | G-10 | Minor | Robustness | FIXED |
| **INV-N01** | Dead code InventoryQRCode.tsx | F-2 | Info | Kualitas | FIXED |
| **INV-N02** | Duplikasi fungsi export stok | F-3 | Info | Kualitas | FIXED |
| **INV-N03** | Inkonsistensi path employee (plural/singular) | F-4 | Info | Kualitas | OPEN |
| **INV-N04** | Akses response-shape defensif keliru di LaporanPage | F-5 | Info | Kualitas | OPEN |
| **INV-N05** | QR frontend inventory tak terpakai (duplikat INV-N01) | G-8 | Info | Kualitas | FIXED |
| **INV-N06** | PWA/offline sync belum ada (spek §7/§11) | G-22 | Info (gap fitur) | Fitur | OPEN |
| **INV-N07** | Approval system belum ada (spek §8) | G-23 | Info (gap fitur) | Fitur | OPEN |
| **INV-N08** | Reminder pengembalian aset/barang rusak belum ada (spek §6) | G-24 | Info (gap fitur) | Fitur | OPEN |

**Sudah diperbaiki di sesi sebelumnya (verifikasi ulang di audit):** serial global-unique (D-6), validasi jumlah serial=kuantitas (D-5), tampilan serial di detail transaksi, dropdown SearchableSelect number-vs-string, UX Gudang (department/PJ/lokasi).

---

## 8. RENCANA VERIFIKASI DINAMIS (uji end-to-end)

Dijalankan pada tahap verifikasi dinamis; setiap alur menghasilkan bukti (respons API + kondisi DB). Gunakan data uji prefix **ZZ** dengan pembersihan otomatis.

### Alur transaksi (T)
- **T1 — Masuk/Supplier:** buat produk ber-serial, masukkan N unit → cek `inv_stok +N`, N baris serial `Tersedia`, kode STM urut.
- **T2 — Transfer Gudang:** transfer M unit A→B → stok A −M, stok B +M, serial pindah gudang (sekali), dua kaki transaksi seimbang.
- **T3 — Adjustment/Opname:** koreksi + dan − → saldo sesuai, tak menyentuh serial, tolak hasil negatif.
- **T4 — Ke Karyawan + Retur Karyawan:** assign → serial `Digunakan`+karyawan, stok −1; retur → `Tersedia`, stok +1; **uji tag-only** (target INV-M01).
- **T5 — Ke Gedung/Mess:** assign ke gedung/kamar → cek header facility_*; bandingkan versi inventory vs `facility_assets` (target INV-C01).
- **T6 — Disposal & Rusak/Terbuang:** status `Disposed`/`Rusak`, stok −1.
- **T7 — Validasi transaksi:** tiap cabang wajib-field ditolak bila kosong; serial≠jumlah ditolak; serial duplikat lintas-produk ditolak (INV-... verifikasi ulang).
- **T8 — Detail transaksi:** serial tampil di `GET /transaksi/:id`.
- **T9 — Rollback:** paksa gagal di tengah multi-detail → tak ada partial write.
- **T10 — Tagging:** Masuk produk `has_tag_number` dgn sub-kategori ber-`prefix_tag` di gudang ber-`kode_site` → tag ter-generate format benar & unik; lalu uji tanpa prefix_tag/kode_site → amati apakah masuk tanpa tag diam-diam (target INV-M10).
- **T11 — QR/Label & lookup:** generate QR produk/serial/tag → cetak label A4 & thermal → `lookupQR` membalik payload ke record; format tak dikenal → 400.
- **T12 — Import:** import Produk (per-baris, gagal-sebagian dilaporkan) & Stok Masuk (uji satu baris salah → amati apakah semua batal, target INV-M12).
- **T13 — Export/Laporan:** tiap laporan Excel/PDF berisi data benar; filter tipe transaksi (target INV-B01) & tanggal/gudang berfungsi.
- **T14 — Dashboard akurasi:** cocokkan tiap angka stats dengan query DB manual.

### Query integritas (Q) — dijalankan berkala
- **Q1** stok negatif = 0
- **Q2** serial `Digunakan` tanpa karyawan = 0
- **Q3** serial `Tersedia` punya karyawan = 0
- **Q4** produk has_serial aktif tanpa row serial (informasional)
- **Q5** serial dobel lintas produk = 0 (constraint global)
- **Q6** transaksi facility_building_id menunjuk building tak ada = 0
- **Q7** `facility_assets` vs status serial inventory — deteksi kontradiksi (INV-C01)

*(Snapshot awal Q1–Q3, Q5: semua 0 — data bersih.)*

### Uji lintas-modul (X)
- **X1** Hapus karyawan yang memegang aset → amati perilaku (target INV-M02).
- **X2** Nonaktifkan karyawan pemegang aset → amati (A-5).
- **X3** Assign serial ke kamar via facility_assets lalu retur via inventory → cek konsistensi (INV-C01/M04).

---

## 9. KEPUTUSAN PEMILIK — SUDAH DIPUTUSKAN (15 Juli 2026)

Ketiga keputusan kebijakan bisnis di bawah **sudah disetujui pemilik** dan menjadi arahan resmi perbaikan:

1. **INV-C01 (penempatan facility): AUTO-SINKRON.** Transaksi "Ke Gedung/Mess" harus otomatis membuat/menutup baris `facility_assets`. `facility_assets` menjadi turunan dari transaksi inventory — satu sumber kebenaran. Aset tak boleh timpang (Tersedia di gudang tapi Aktif di kamar).
2. **INV-M07 (department/site scoping): SCOPING PER DEPARTMENT/SITE.** User non-admin hanya melihat gudang & transaksi milik department/site-nya (pola sama seperti HR `checkDepartmentAccess`). Role privileged tetap melihat semua.
3. **INV-M02 (aset saat karyawan keluar): BLOKIR + ARAHKAN RETUR.** Penghapusan/penonaktifan karyawan diblokir selama masih memegang aset inventory, dengan pesan agar melakukan retur/serah-terima dulu (pola sama seperti HR memblokir hapus penghuni mess aktif).

---

## 9b. RESOLUSI BATCH RBAC (INV-M05 / M06 / M07 / C-6)

**INV-M07 — department/site scoping: DIIMPLEMENTASI (FIXED).**
Mengikuti pola HR `checkDepartmentAccess`. Middleware disematkan pada seluruh route baca inventory (`/stok`, `/serial-numbers`, `/transaksi`, `/transaksi/:id`, `/kartu-stok`, dan 6 route `/dashboard/*`). Controller meneruskan `req.departmentFilter` ke service (query di-*spread* dahulu lalu di-*override*, sehingga klien tak bisa memalsukan lewat query param). Service memfilter lewat join `inv_gudang.department_id`:
- `undefined` (role privileged) → tanpa scoping.
- angka / `-1` fail-closed dari middleware → `INNER JOIN` terfilter; `-1` tak cocok gudang manapun sehingga tak ada kebocoran.
- `getTransaksiDetail` mengembalikan **404** (bukan 403) untuk transaksi di luar department — tak membocorkan keberadaan record.
- Metrik dashboard yang secara alami global (jumlah katalog produk, jumlah aset dipinjam yang `gudang_id=null`) **tetap global by design** dan didokumentasikan di kode.

Diverifikasi runtime terhadap DB: dept berisi data melihat penuh; dept lain & `-1` melihat nol; role privileged melihat semua. `tsc --noEmit` bersih.

Catatan operasional: saat ini **hanya `superadmin`** yang memegang permission `inventory_stock` (2 user, semuanya privileged), sehingga scoping ini bersifat **defense-in-depth / forward-looking** — aktif otomatis begitu role inventory non-privileged ditambahkan.

**INV-M05 — action IMPORT/EXPORT: DITERIMA (by design).**
Impor tetap di bawah `inventory_stock:create`, ekspor di bawah `inventory_stock:read`. Tanpa permission/seed/frontend baru. Pemetaan create-untuk-impor dan read-untuk-ekspor dinilai memadai; tidak diperlukan action inventory khusus.

**INV-M06 — konflasi resource lintas-modul: DITERIMA (by design).**
Endpoint lintas-modul (`/employees/search`, `/employee/:id/assets`, berita-acara, `/facility/:id/inventory`) melayani alur penugasan aset di dalam inventory; data diperlakukan sebagai milik alur inventory sehingga `inventory_stock:read` memadai. Tidak menambah syarat permission ganda (yang justru akan memutus pencarian karyawan karena user inventory tak memegang `employees:read`).

**C-6 (POST /label/print dijaga READ): DITERIMA (by design).**
`printLabels` hanya menghasilkan PDF dari daftar item yang di-*post* tanpa mutasi DB; POST dipakai semata untuk membawa body ID. Guard `READ` sudah tepat.

---

## 10. CARA MENGGUNAKAN DOKUMEN INI

1. Audit dijalankan per-area (§6.A → §6.F). Tandai checkbox saat item diverifikasi.
2. Temuan baru → tambahkan ke register §7 dengan ID `INV-xNN`.
3. Perbaikan **tidak** dilakukan sampai rencana per item disepakati (khususnya §9).
4. Setelah fix: jalankan uji dinamis terkait (§8), ubah status ke `VERIFIED-FIXED`.
5. Audit selesai saat kriteria §1 (S-1..S-4) terpenuhi.

---

*Dokumen kontrol — diperbarui seiring audit berjalan. Pembuatan berdasarkan pemetaan faktual backend, frontend, dan relasi lintas-modul (15 Juli 2026). Belum ada perubahan kode.*
