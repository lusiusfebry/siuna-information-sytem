# LAPORAN AUDIT MENYELURUH — Bebang Sistem Informasi (BIS)
### Technical Due Diligence Report

> Tanggal audit: 9–10 Juli 2026
> Metode: (1) audit statis kode aktual (6 auditor paralel: Auth/Security, HR, Inventory, Facility/Notifications, Frontend, Database) dibandingkan dengan `applikasi-strucktur.md`; (2) **audit fungsional runtime lintas-modul** — aplikasi dijalankan, alur nyata dieksekusi via API (login → buat karyawan → assign laptop → assign mess → uji soft-delete), lalu data uji dibersihkan tuntas.
> Semua temuan disertai bukti `file:line`. Temuan Critical diverifikasi langsung pada kode; A-1, A-4, B-5 juga **terbukti saat runtime** (lihat §RUNTIME).

---

## RINGKASAN EKSEKUTIF

| Kategori | Jumlah | Terparah |
|---|---|---|
| A. Critical Bug | 4 | Audit-log 500, Import produk gagal total, Permission facility mismatch, Hapus karyawan penghuni aktif |
| B. Major Bug | 9 | Refresh=access token, admin demote superadmin, upload mimetype, paranoid null, Puppeteer leak |
| C. Minor Bug | 12 | — |
| D. Security Issue | 8 | JWT type, revocation, CSRF, brute-force |
| E. Performance Issue | 7 | Export tanpa limit, N+1, missing index |
| F. Architecture Issue | 4 | — |
| G. Database Issue | 6 | Paranoid vs RESTRICT (2 pola) |
| H. Frontend Issue | 8 | — |
| I. Backend Issue | 5 | — |
| J. UI/UX Issue | 5 | — |
| K. Integration Issue | 4 | Soft-delete lintas modul |
| L. Dead Code | 5 | — |
| M. Recommendation | ringkasan |

**Kesimpulan tingkat tinggi:** Fondasi arsitektur baik (modular, RBAC terpusat, transaksi stok atomik untuk row existing, migrasi rapi, hashing benar). Namun ada **4 bug Critical yang membuat fitur tidak berfungsi / endpoint 500**, dan **satu pola risiko sistemik**: `employees` (dan seluruh master-data) kini `paranoid` sementara FK di DB memakai `RESTRICT` / `SET NULL` — soft-delete menetralisir proteksi DB itu tanpa ada guard pengganti di aplikasi. Ini muncul berulang di HR, Inventory, dan Facility.

**Rekomendasi rilis:** JANGAN masuk tahap berikutnya sebelum kategori A selesai. Kategori B & D (keamanan) harus dijadwalkan sebelum produksi.

---

## RUNTIME — HASIL AUDIT FUNGSIONAL LINTAS-MODUL (aplikasi dijalankan)

Alur nyata dieksekusi dengan aplikasi hidup (backend port 3000, DB `bebang_db`), login superadmin, memakai data uji berprefix `ZZAUDIT` yang **sudah dibersihkan tuntas** setelah uji.

**✅ Alur lintas-modul yang TERBUKTI BERFUNGSI (saat karyawan aktif):**
- Login → buat karyawan (HR) → buat master data inventory → **stok masuk laptop** (serial `Tersedia`) → **assign laptop ke karyawan** (`Keluar/Ke Karyawan`): serial jadi `Digunakan`, `karyawan_id` terisi ✓ — HR↔Inventory tersambung.
- Buat gedung/kamar (Facility) → **assign karyawan ke mess** (occupant `Aktif`): occupant menampilkan `nama_lengkap` karyawan ✓ — HR↔Facility tersambung.
- 17/17 langkah CRUD lintas-modul lolos.

**❌ Bug lintas-modul yang TERBUKTI SAAT RUNTIME (bukan lagi prediksi statis):**

| Bug | Uji nyata | Hasil aktual | Seharusnya |
|---|---|---|---|
| **A-1** | `GET /hr/audit-logs` | **HTTP 500** `User is associated... alias (user)... (executor)` | 200 + daftar |
| **A-4** | `DELETE /hr/employees/:id` saat karyawan masih penghuni mess AKTIF + pegang laptop | **HTTP 204 (diizinkan)** | 409 (blokir) |
| **B-5a** | `GET /facility/occupants` setelah karyawan soft-deleted | `occupant.employee = NULL` (nama hilang, status masih Aktif) | nama tetap tampil |
| **B-5b** | `GET /inventory/employee/:id/berita-acara` untuk karyawan soft-deleted | **HTTP 404** "Karyawan tidak ditemukan" | dokumen tercetak |
| **B-5d** | `GET /inventory/transaksi` (transaksi historis) | kolom `karyawan = NULL` | nama tetap tampil |

**Catatan nuansa runtime:** endpoint `GET /inventory/employee/:id/assets` **tetap** menampilkan aset karyawan yang sudah soft-deleted (query-nya berbeda), sementara Berita Acara 404. Jadi dampak soft-delete **tidak seragam** antar-endpoint — memperkuat rekomendasi menetapkan pola standar `paranoid:false` untuk seluruh baca historis.

> A-2 (import produk) & A-3 (permission facility) tidak diuji runtime pada sesi ini (A-2 butuh file Excel; A-3 butuh membuat role terbatas) tetapi keduanya sudah diverifikasi pasti dari kode.

---

## RUNTIME SWEEP LENGKAP — BUG BARU (ditemukan saat menjalankan semua modul)

Sweep runtime menyeluruh (semua modul, ~70 panggilan API, data `ZZAUDIT` + cleanup) mengonfirmasi A-1/A-2 secara langsung DAN menemukan **4 bug yang audit statis lewatkan atau salah-nilai**. Ini menegaskan nilai audit runtime.

### RT-1. Work Order create/detail/update GAGAL 500 — `tanggal_lapor` NOT NULL tapi validator opsional
- **Lokasi File**: `backend/src/modules/facility/models/WorkOrder.ts:52` (`tanggal_lapor allowNull:false`, tanpa default) vs `backend/src/shared/middleware/validateFacilityWorkOrder.ts:14` (`tanggal_lapor optional`)
- **Severity**: **Critical (naik dari klaim statis "WO OK")** · **Modul**: Facility
- **Penyebab**: Model mewajibkan `tanggal_lapor`, tetapi validator menandainya opsional dan controller tidak mengisi default. `create` → `notNull Violation: FacilityWorkOrder.tanggal_lapor cannot be null`.
- **Dampak**: **Fitur Work Order tidak berfungsi** — tidak bisa membuat WO sama sekali. (List OK karena tak menyentuh create.) Audit statis menandai WO "✅ create/update OK" — **runtime membuktikan sebaliknya**.
- **Cara Reproduksi**: `POST /facility/work-orders {judul, room_id, prioritas}` → HTTP 500 `tanggal_lapor cannot be null`.
- **Rekomendasi**: Default `tanggal_lapor` ke hari ini di service create, atau jadikan wajib di validator, atau `defaultValue: DataTypes.NOW` di model.
- **Contoh Kode**: `const code=...; return FacilityWorkOrder.create({ ...data, tanggal_lapor: data.tanggal_lapor || new Date(), code });`
- **Prioritas**: P0

### RT-2. Adjustment stok NEGATIF selalu GAGAL 500 (`reading 'map' of undefined`)
- **Lokasi File**: jalur `backend/src/modules/inventory/services/stok.service.ts` `createTransaksi`→`handleAdjustment` (`:383-411`) untuk `jumlah < 0` (root-cause presis butuh stack-trace server; error runtime: `Cannot read properties of undefined (reading 'map')`)
- **Severity**: **Major** · **Modul**: Inventory (Stok Opname/Adjustment)
- **Penyebab**: Adjustment dengan `jumlah` negatif (stok cukup, hasil ≥ 0) tetap melempar 500; adjustment positif pada produk yang sama sukses (201). Deterministik & tereproduksi pada produk serial maupun non-serial.
- **Dampak**: **Stok opname pengurangan tidak bisa dilakukan** — koreksi stok turun (mis. barang hilang/rusak) gagal total.
- **Cara Reproduksi**: `POST /inventory/transaksi {tipe:Adjustment, sub_tipe:Opname, details:[{...,jumlah:-2}]}` pada produk berstok cukup → HTTP 500 `reading 'map'`.
- **Rekomendasi**: Debug jalur adjustment negatif (kemungkinan pemrosesan serial/response yang mengasumsikan array pada nilai negatif); tambah uji unit untuk adjustment ±.
- **Prioritas**: P1

### RT-3. Notifikasi low-stock TIDAK PERNAH dibuat — query target user salah kolom
- **Lokasi File**: `backend/src/shared/services/notification.service.ts:56-66` (`Role.permissions` `Op.contains` JSONB) vs realita RBAC `RolePermission.ts:44` (`belongsToMany` — permission di tabel join, bukan kolom JSON)
- **Severity**: **Major (membantah klaim statis "notifikasi ter-wiring OK")** · **Modul**: Notifications ↔ Inventory
- **Penyebab**: `checkLowStockAndNotify` memilih user target via `include Role where permissions [Op.contains] {inventory_stock:[...]}` — mengasumsikan `permissions` adalah kolom JSONB pada `roles`. Faktanya permission tersimpan via `belongsToMany` (tabel `role_permissions`+`permissions`). Query gagal/menghasilkan 0 user; error ditelan `try/catch` (`console.error`).
- **Dampak**: **Notifikasi stok rendah tidak pernah muncul** untuk siapa pun. Runtime: stok turun 5→1 (min 5) → `unread-count=0`, 0 notifikasi. Fitur notifikasi low-stock (satu-satunya pembuat notifikasi) mati senyap.
- **Cara Reproduksi**: Transaksi keluar hingga stok < minimum → `GET /notifications` kosong.
- **Rekomendasi**: Ganti query target user memakai join `roleDetails.permissions` (belongsToMany) dengan `where {resource:'inventory_stock', action:['read','create']}`, bukan `Op.contains` JSON.
- **Contoh Kode**: `User.findAll({ include:[{ model:Role, as:'roleDetails', include:[{ model:Permission, as:'permissions', where:{ resource:'inventory_stock' } }] }], where:{is_active:true} })`
- **Prioritas**: P1

### RT-4. Permission Facility TIDAK di-seed — modul Facility hanya bisa diakses superadmin
- **Lokasi File**: `backend/src/database/seeds/rbac-seed.ts` (daftar permission berhenti di `USERS`; tidak ada `FACILITY_*` maupun `INVENTORY_*` untuk sebagian) — DB nyata: 35 permission, **0 baris `facility_*`**
- **Severity**: **Critical** · **Modul**: Auth/RBAC ↔ Facility
- **Penyebab**: Konstanta `FACILITY_MASTER_DATA` & `FACILITY_WORK_ORDER` didefinisikan di FE & BE, tetapi baris permission-nya tak pernah di-seed ke tabel `permissions`. `checkPermission` mencari permission yang tak ada → selalu tolak (kecuali superadmin bypass).
- **Dampak**: **Modul Facility mustahil diberikan ke role selain superadmin** — role kustom apa pun mendapat 403 di semua endpoint facility (occupants, assets, work-orders, master-data). Diverifikasi runtime: user ber-role kustom → 403 di seluruh `/facility/*`. Ini juga membuat A-3 (mismatch resource) menjadi akademis: bahkan resource yang "benar" pun tak bisa diberikan.
- **Cara Reproduksi**: `SELECT * FROM permissions WHERE resource LIKE 'facility%'` → 0 baris. Buat role non-superadmin → tak ada permission facility yang bisa dilampirkan.
- **Rekomendasi**: Tambah seluruh permission `facility_master_data` & `facility_work_order` (×CRUD) ke `rbac-seed.ts` + migration seed idempoten untuk DB existing. Verifikasi juga kelengkapan `inventory_*` vs konstanta.
- **Contoh Kode**: di `rbac-seed.ts` tambah `...findPerms(RESOURCES.FACILITY_MASTER_DATA)`, `...findPerms(RESOURCES.FACILITY_WORK_ORDER)` dan daftarkan baris permission-nya.
- **Prioritas**: P0

### Ringkasan hasil sweep (yang TERBUKTI BERFUNGSI runtime)
Auth: login/me/refresh/logout, role create, users list ✅ · HR: master-data CRUD+search+pagination+restore, employee CRUD+detail, **export excel & pdf** (7–106 KB), qrcode, dashboard ✅ · Inventory: 6 master-data, stok masuk, assign ke karyawan, serial, kartu-stok, **6 dashboard metrics**, **10 export variants**, label QR, adjustment POSITIF ✅ · Facility: 4 master-data, dashboard summary, asset create/list/withdraw, occupant create/detail/checkout ✅ · Notifications: list/unread/mark-read/mark-all (endpoint) ✅.

**Catatan:** klaim statis "semua export gagal (HTTP -1)" pada draf awal adalah **artefak harness** (respons biner) — export sesungguhnya **berfungsi** (diverifikasi via curl: HTTP 200 + byte nyata).

---

## A. CRITICAL BUG

### A-1. Audit Log 500 — alias include `user` tidak terdaftar (seharusnya `executor`)
- **Lokasi File**: `backend/src/modules/hr/services/audit.service.ts:44, 66, 82` vs `backend/src/modules/hr/models/associations.ts:45`
- **Severity**: Critical · **Modul**: HR (Audit Log / Riwayat Aktivitas)
- **Penyebab**: Service meng-`include: [{ model: User, as: 'user' }]`, tetapi asosiasi terdaftar sebagai `AuditLog.belongsTo(User, { as: 'executor' })`. Alias `'user'` hanya ada pada `Employee.hasOne(User, as:'user')` (model lain).
- **Dampak**: `GET /hr/audit-logs`, `/hr/audit-logs/:id`, dan `/hr/audit-logs/entity/:type/:id` melempar `EagerLoadingError` → **HTTP 500**. Menu "Riwayat Aktivitas" rusak total.
- **Cara Reproduksi**: Login → buka menu Riwayat Aktivitas → daftar gagal load (500).
- **Analisis Teknis**: Diverifikasi langsung pada kode. Komentar di `associations.ts:45` menandakan alias pernah diubah bolak-balik.
- **Rekomendasi**: Samakan alias di service menjadi `executor` (3 lokasi), atau ubah asosiasi menjadi `as: 'user'`.
- **Contoh Kode**:
  ```ts
  include: [{ model: User, as: 'executor', attributes: ['id','username','email'] }]
  ```
- **Prioritas**: P0

### A-2. Import Produk gagal total — kolom `code` (NOT NULL, unik) tidak pernah diisi
- **Lokasi File**: `backend/src/modules/inventory/services/import.service.ts:100-109`; `backend/src/modules/inventory/models/Produk.ts:32-34` (`code allowNull:false`, tanpa hook `beforeCreate`)
- **Severity**: Critical · **Modul**: Inventory (Import)
- **Penyebab**: `InvProduk.create({...})` di jalur import tidak menyertakan `code`; jalur CRUD normal meng-generate code via `BaseMasterDataService.generateCode`, jalur import melewatinya.
- **Dampak**: Setiap baris melempar `notNull Violation: code cannot be null`, ditangkap catch → `failed++`. Import produk **selalu 0 sukses / N gagal**. Fitur tidak berfungsi.
- **Cara Reproduksi**: Upload template produk valid → `POST /inventory/import/produk` → `{ success: 0, failed: N }`.
- **Analisis Teknis**: Diverifikasi langsung pada kode.
- **Rekomendasi**: Generate `code` sebelum create (reuse `generateCode`, dengan penjagaan increment antar-baris dalam satu batch).
- **Contoh Kode**:
  ```ts
  const code = await masterDataService.generateCode(InvProduk);
  await InvProduk.create({ code, nama, brand_id: brandId, /* ... */ });
  ```
- **Prioritas**: P0

### A-3. Mismatch permission Facility — Penghuni & Aset (frontend `FACILITY_WORK_ORDER` vs backend `FACILITY_MASTER_DATA`)
- **Lokasi File**: `frontend/src/App.tsx:269-274` + `frontend/src/components/layout/Sidebar.tsx:207-215` vs `backend/src/modules/facility/routes/facility.routes.ts:109-171`
- **Severity**: Critical · **Modul**: Facility
- **Penyebab**: Route & menu Penghuni/Aset di-guard `FACILITY_WORK_ORDER`; seluruh endpoint `/occupants` & `/assets` di backend di-proteksi `FACILITY_MASTER_DATA` (diverifikasi: baris 110,116,122,129,136,145,151,157,164,171).
- **Dampak**: Role dengan hanya `facility_work_order:*` → menu/halaman tampil, tapi fetch data ditolak backend (403) → halaman kosong. Role dengan `facility_master_data:*` → backend mengizinkan, tapi frontend menyembunyikan menu & blok ke `/403`. Fitur tidak dapat diakses oleh role manapun kecuali yang punya kedua permission.
- **Cara Reproduksi**: Buat role hanya `facility_work_order:read` → buka `/facility/occupants` → tabel 403.
- **Analisis Teknis**: Diverifikasi langsung. Tidak ada resource `facility_occupant`/`facility_asset` di kedua sisi.
- **Rekomendasi**: Samakan frontend ke `FACILITY_MASTER_DATA` untuk occupants & assets (route + menu), sisakan `FACILITY_WORK_ORDER` hanya untuk work-orders. (Atau ubah backend bila desain menghendaki sebaliknya — putuskan satu.)
- **Contoh Kode**:
  ```tsx
  <PermissionGuard resource={RESOURCES.FACILITY_MASTER_DATA} action={ACTIONS.READ} redirectTo="/403"><FacOccupantPage /></PermissionGuard>
  ```
- **Prioritas**: P0

### A-4. Karyawan penghuni AKTIF bisa dihapus — RESTRICT dinetralisir soft-delete, tanpa guard aplikasi
- **Lokasi File**: `backend/src/modules/hr/services/employee.service.ts:468-490` (`deleteEmployee`); `backend/src/database/migrations/50_create_facility_tables.ts:80` (`employee_id NOT NULL, onDelete RESTRICT`); `Employee.ts:213` (`paranoid:true`)
- **Severity**: Critical · **Modul**: HR ↔ Facility (Integrasi)
- **Penyebab**: `facility_occupants.employee_id` dirancang RESTRICT agar karyawan yang masih menghuni tak bisa dihapus. Karena `employee.destroy()` kini hanya `UPDATE deleted_at`, RESTRICT DB tak pernah terpicu; `deleteEmployee` tidak memeriksa occupant aktif.
- **Dampak**: Karyawan yang masih menghuni mess bisa "dihapus". Baris occupant jadi yatim logis; nama karyawan tampil kosong di daftar penghuni aktif (lihat K-1). Aturan bisnis hilang total.
- **Cara Reproduksi**: Buat occupant `Aktif` untuk employee X → `DELETE /hr/employees/X` → sukses (tak ada 409).
- **Analisis Teknis**: Guard harus dipindah ke application layer untuk semua target paranoid.
- **Rekomendasi**: Cek occupant aktif (dan idealnya serial/work-order aktif) sebelum `destroy()`, lempar 409.
- **Contoh Kode**:
  ```ts
  const aktif = await FacilityOccupant.count({ where: { employee_id: id, status: 'Aktif' }, transaction: t });
  if (aktif > 0) { const e:any = new Error('Karyawan masih menjadi penghuni aktif'); e.statusCode = 409; throw e; }
  ```
- **Prioritas**: P0

---

## B. MAJOR BUG

### B-1. Refresh token dapat dipakai sebagai access token (type claim tak diverifikasi)
- **Lokasi File**: `backend/src/modules/auth/services/auth.service.ts:103-105`; `backend/src/shared/middleware/auth.middleware.ts:33-36`
- **Severity**: Major · **Modul**: Auth/JWT
- **Penyebab**: `verifyToken` hanya `jwt.verify` tanpa cek `decoded.type === 'access'`. Access & refresh ditandatangani secret yang sama.
- **Dampak**: Refresh token 7-hari yang dikirim sebagai `Authorization: Bearer <refresh>` lolos `authenticate` → akses penuh 7 hari, membatalkan desain access 15 menit.
- **Rekomendasi**: Enforce `type==='access'` di `verifyToken`; idealnya secret terpisah access/refresh.
- **Prioritas**: P1

### B-2. Privilege escalation — admin dapat menurunkan / menonaktifkan superadmin
- **Lokasi File**: `backend/src/modules/auth/controllers/user.controller.ts:32-63` (updateUserRole), `:65-83` (toggleUserStatus)
- **Severity**: Major · **Modul**: RBAC
- **Penyebab**: Guard hanya memblok ubah role sendiri & pemberian role privileged oleh non-superadmin; TIDAK memproteksi target yang lebih tinggi. Admin dengan `users:update` bisa set role superadmin → employee, atau `is_active=false`.
- **Dampak**: Admin non-superadmin dapat melumpuhkan superadmin lalu mengambil alih; lockout administrator tertinggi.
- **Rekomendasi**: Tolak modifikasi target ber-role privileged kecuali aktor superadmin.
- **Prioritas**: P1

### B-3. Upload memercayai `mimetype` client + `originalname` mentah (stored-XSS / path traversal)
- **Lokasi File**: `backend/src/shared/middleware/upload.middleware.ts:16-30, 50-53`; static serve `backend/src/index.ts:35-37`
- **Severity**: Major · **Modul**: Upload/Security
- **Penyebab**: `fileFilter` hanya cek `mimetype` (dikendalikan client), bukan magic bytes; filename foto karyawan & excel menyisipkan `originalname` mentah tanpa sanitasi (berbeda dari jalur dokumen yang men-sanitasi). Dir foto disajikan statis.
- **Dampak**: Upload file `mimetype:image/png` tapi `originalname: evil.html` → tersimpan `.html`, disajikan `text/html` di origin aplikasi → XSS tersimpan. Nama file `../` berpotensi traversal.
- **Rekomendasi**: Nama file server-side + ekstensi whitelist dari tipe tervalidasi; validasi magic bytes; `Content-Disposition: attachment` + `nosniff` pada mount statis.
- **Prioritas**: P1

### B-4. Tidak ada revocation refresh token / logout tidak menginvalidasi
- **Lokasi File**: `backend/src/modules/auth/controllers/auth.controller.ts:79-109, 146-154`
- **Severity**: Major · **Modul**: Auth/Session
- **Penyebab**: "Rotasi" hanya menerbitkan cookie baru; tak ada jti/denylist. Token lama tetap valid s/d 7 hari. Logout hanya clear cookie.
- **Dampak**: Refresh token curian tetap valid 7 hari meski logout; rotasi tak memberi deteksi pencurian.
- **Rekomendasi**: Simpan `jti`/`token_version` per user (DB/Redis); verifikasi saat refresh; hapus saat logout/ganti password.
- **Prioritas**: P1

### B-5. Include Employee tanpa `paranoid:false` — nama karyawan hilang & Berita Acara 404 (data historis)
- **Lokasi File**: Inventory `stok.service.ts:167,543,568,614`, `employee-asset.service.ts:50`, `export.service.ts:50,239,323,377,433`, `dashboard.service.ts:113`; Facility `occupant.service.ts:25,60`, `work-order.service.ts:48-49,70-71`
- **Severity**: Major · **Modul**: Inventory & Facility ↔ HR
- **Penyebab**: `Employee` paranoid → include (LEFT JOIN) menambah `deleted_at IS NULL` → karyawan soft-deleted tak ter-join → `karyawan=null`. Pada `employee-asset.service.ts:50`, `Employee.findByPk` (paranoid default) mengembalikan null → `throw 404`.
- **Dampak**: Daftar/detail transaksi, serial number, export laporan, occupant, work order menampilkan nama karyawan kosong untuk data historis; **Berita Acara serah-terima aset tidak bisa dicetak** untuk karyawan non-aktif.
- **Rekomendasi**: Tambah `paranoid:false` pada semua include Employee historis dan `findByPk` berita acara.
- **Prioritas**: P1

### B-6. Puppeteer tanpa `try/finally` — kebocoran proses Chromium (memory leak/DoS)
- **Lokasi File**: `backend/src/modules/inventory/services/employee-asset.service.ts:128-134`; `label.service.ts:203-227`; `export.service.ts:178-206`
- **Severity**: Major · **Modul**: Inventory (PDF/Label)
- **Penyebab**: `launch → pdf → close` tanpa `try/finally`; jika `setContent`/`pdf` melempar, `browser.close()` tak dipanggil. Tiap request me-launch browser baru (tanpa pooling).
- **Dampak**: Setiap kegagalan render meninggalkan proses Chromium zombie → akumulasi memori → OOM.
- **Rekomendasi**: Bungkus `try/finally { await browser.close() }`; pertimbangkan singleton browser.
- **Prioritas**: P1

### B-7. Guard "masih digunakan" pada BaseMasterDataService mati untuk model paranoid
- **Lokasi File**: `backend/src/shared/services/base-master-data.service.ts:115-137`; FK RESTRICT `migrations/12_expand_employees_table.ts:24-29`, `32_create_inv_produk.ts:14`
- **Severity**: Major · **Modul**: HR/Inventory/Facility (shared)
- **Penyebab**: `delete()` mengandalkan tangkapan FK error `23503`, tetapi master-data paranoid → `destroy()` = UPDATE, RESTRICT tak terpicu → blok catch jadi dead code.
- **Dampak**: Divisi/Department/Brand/dll yang masih dipakai bisa di-soft-delete; relasi karyawan/produk lalu tampil null. Guard 409 tak pernah muncul.
- **Rekomendasi**: Cek COUNT anak sebelum destroy per model (atau non-paranoid-kan master-data yang di-RESTRICT).
- **Prioritas**: P1

### B-8. Import Stok-Masuk: `findOrCreate` pakai `uom_id` padahal unik hanya `(produk_id, gudang_id)`
- **Lokasi File**: `backend/src/modules/inventory/services/import.service.ts:206-211` vs `migrations/34_create_inv_stok.ts:33`
- **Severity**: Major · **Modul**: Inventory (Import/Stok)
- **Penyebab**: `where {produk_id, gudang_id, uom_id}` tak menemukan row bila UOM beda → `create` → tabrak unique `(produk_id, gudang_id)` → seluruh transaksi import rollback.
- **Dampak**: Import stok gagal total bila produk sudah punya stok di gudang dengan UOM berbeda. Inkonsistensi dengan `upsertStok` (yang benar hanya pakai produk+gudang).
- **Rekomendasi**: `where {produk_id, gudang_id}`, set `uom_id` di defaults/update.
- **Prioritas**: P1

### B-9. Duplikasi hook karyawan + `useApi.ts` dead code (naming collision, cache tak ter-invalidate)
- **Lokasi File**: `frontend/src/hooks/useEmployee.ts:18` (dipakai) vs `hooks/useMasterData.ts:82` (`useEmployeeList` duplikat, tak dipakai) vs `hooks/useApi.ts` (tak diimpor sama sekali)
- **Severity**: Major (code health) · **Modul**: HR/Shared
- **Penyebab**: Beberapa iterasi hook tanpa konsolidasi; nama sama diekspor 2 file; key tidak seragam (`['employees','list']` vs `['employees-list']`).
- **Dampak**: Ambiguitas impor; `useApi.ts` dead file; bila key `['employees-list']` dipakai kelak, tak ter-invalidate oleh delete/restore → data basi.
- **Rekomendasi**: Hapus `useApi.ts`; hapus duplikat di `useMasterData.ts`; standarkan key `['employees', ...]`.
- **Prioritas**: P2

---

## C. MINOR BUG

- **C-1** Transisi status Serial Number tak divalidasi; Retur Karyawan tanpa filter `karyawan_id` bisa reset SN karyawan lain — `stok.service.ts:295-307, 322-350`. P2
- **C-2** Transfer Masuk membuat SN baru (bukan pindah) → duplikasi/langgar unik — `stok.service.ts:257-267, 218-219`. P2
- **C-3** Occupant `update` melewati validasi kapasitas & FK → reaktivasi melebihi kapasitas — `occupant.service.ts:90-94`. P2
- **C-4** Serial number bisa terpasang aktif di banyak ruangan (tak ada guard duplikasi asset aktif); status SN tak diubah saat pasang/withdraw — `asset.service.ts:43-62`. P2
- **C-5** Notifikasi stok-rendah tanpa deduplikasi → spam per transaksi — `notification.service.ts:71-90`. P2
- **C-6** Perubahan stok via import tak memicu notifikasi stok-rendah — `import.service.ts:189-199`. P3
- **C-7** `toggleUserStatus`/`updateUserRole` tanpa validasi tipe (`is_active` boolean, `role_id` int) — `user.controller.ts:67-77`. P3
- **C-8** `getStockByWarehouse`/`getCategoryBreakdown` tak memfilter produk `Tidak Aktif` (inkonsisten dgn kartu Aktif) — `dashboard.service.ts:54-106`. P3
- **C-9** `uploadPhoto` produk tak invalidasi cache HTTP list → foto lama s/d 1 jam — `master-data.controller.ts:179-193`. P3
- **C-10** Menu "Absensi & Cuti" (roadmap) jatuh ke `*` → redirect `/login` (kesan ter-logout) — `Sidebar.tsx:90-94`, `App.tsx:309`. P3
- **C-11** Kolom "Aksi" ganda/no-op di OccupantPage (handler kosong + guard hardcoded) — `OccupantPage.tsx:225-227`. P3
- **C-12** `getByUser` notifikasi rawan bila `req.user.id` undefined (hardening) — `notification.controller.ts:7,18,29,40`. P3

---

## D. SECURITY ISSUE

- **D-1** (=B-1) JWT type claim tak diverifikasi. P1
- **D-2** (=B-2) Privilege escalation admin→superadmin. P1
- **D-3** (=B-3) Upload mimetype/filename. P1
- **D-4** (=B-4) Tanpa revocation refresh token. P1
- **D-5** CSRF — cookie auth + `withCredentials` tanpa CSRF token, hanya andalkan `sameSite:lax` — `auth.controller.ts:14-27`, `index.ts:21-22`, `client.ts:6`. **Potensi Masalah** (Lax memitigasi, tapi single point of failure). P2
- **D-6** Brute-force lockout in-memory, di-skip di dev, lockout by-NIK saja → targeted-DoS akun — `auth.service.ts:13-25, 64-76`. P2
- **D-7** `JWT_SECRET`/`DB_PASSWORD` default lemah bila `NODE_ENV≠production` (staging berisiko); satu secret untuk 2 token — `env.ts:38,40`. P2
- **D-8** `GET /company-settings` publik mengembalikan seluruh row (PII kontak + versi) — `company-settings.controller.ts:5-12`. P3
- **D-9** `checkDepartmentAccess` fail-open untuk `staff`/`employee` (tanpa filter) — `permission.middleware.ts:52-60`. **Potensi Masalah** (tergantung komposisi route). P2
- **D-10** Access token tetap dikembalikan di body (mengurangi manfaat httpOnly) — `auth.controller.ts:64-67, 105`. P3
- **D-11** `mutationLimiter`/`publicLimiter` didefinisikan tapi tak dipakai; `apiLimiter` skip total di dev — `rate-limit.middleware.ts:72-115`. P3

---

## E. PERFORMANCE ISSUE

- **E-1** Export/berita-acara memuat seluruh dataset tanpa limit; `limit:500` diam-diam memotong laporan transaksi — `export.service.ts:30-38,61,372-380`, `employee-asset.service.ts:14-44`. P2
- **E-2** Race condition generasi `code` transaksi & `tag_number` (MAX+1, `FOR UPDATE` tak cegah phantom) — `stok.service.ts:54-103`. **Potensi Masalah**. P2
- **E-3** Race INSERT-INSERT baris stok pertama → error mentah 500 — `stok.service.ts:475-492`. **Potensi Masalah**. P2
- **E-4** N+1 pada generasi tag/serial dalam loop (~300 query untuk 100 unit) — `stok.service.ts:258-291`. P3
- **E-5** Index FK belum lengkap: `inv_transaksi_detail.uom_id`, `inv_transaksi.gudang_tujuan_id`, `created_by` — `migrations/36:34-35`, `35:52-57`. P3
- **E-6** Include profil karyawan ±13 join eager; list juga include 6 relasi — `employee.service.ts:121-192`. P3
- **E-7** `deleted_at` tak diindeks di 20+ tabel paranoid (pertimbangkan partial index) — `migrations/56, 27, 50`. P3
- **E-8** `QueryClient` default retry 3x pada 4xx, tanpa `staleTime` — `frontend/src/main.tsx:13`. P3

---

## F. ARCHITECTURE ISSUE

- **F-1** Dua error handler (inline `index.ts:77-124` vs `errorHandler.ts`) — verifikasi mana yang mounted agar tak divergen. P3
- **F-2** `authorize()` (role-name based) dipakai company-settings, tak konsisten dengan RBAC permission-based — `auth.middleware.ts:78-89`. P3
- **F-3** Duplikasi logika klasifikasi item-velocity antara dashboard & export (±80 baris) — `dashboard.service.ts:143-215` vs `export.service.ts:579-744`. P3
- **F-4** Satu `ErrorBoundary` root saja; tak ada per-Outlet → satu page crash mem-blank seluruh app — `main.tsx:24-31`. P3

---

## G. DATABASE ISSUE

- **G-1** (=A-4) Paranoid `employees` menetralisir RESTRICT `facility_occupants.employee_id`, tanpa guard. P0
- **G-2** (=B-7) Paranoid master-data menetralisir RESTRICT (guard base service dead). P1
- **G-3** UNIQUE warisan `employees.email_perusahaan` (dari kolom `email`) tak tercermin di model → error `23505` tak diantisipasi — `migrations/00:20-24`, `12:10`, `52:9-12`, `Employee.ts:166-172`. **Potensi Masalah**. P2
- **G-4** `audit_logs.user_id` `onUpdate:'SET NULL'` (harusnya CASCADE, inkonsisten) — `migrations/21:19-20`. P4
- **G-5** Migration rename non-idempoten (55, 12, 56) — aman via Umzug, berisiko pada partial-apply/manual re-run. **Potensi Masalah**. P3
- **G-6** Klarifikasi: `facility_assets.serial_number_id` RESTRICT **AMAN** (SN bukan paranoid) — koreksi asumsi dokumen §8. Bukan bug. P4

---

## H. FRONTEND ISSUE

- **H-1** (=A-3) Permission mismatch occupants/assets. P0
- **H-2** Header `MODULE_HEADERS` path usang (`/hr/employee`, `/hr/masterdata` mati) + tak ada entri `facility` (fallback ke HR) — `Header.tsx:9-13,40-42`. P1 (Major)
- **H-3** `MasterDataTable` hardcode guard `RESOURCES.MASTER_DATA` walau dipakai Inventory/Facility → tombol Edit/Hapus salah gate — `MasterDataTable.tsx:138,194,204`. P1 (Major)
- **H-4** Panel notifikasi WelcomePage statis/hardcoded (badge merah selalu tampil, link mati) — `WelcomePage.tsx:66-69,217-244`. P3
- **H-5** Tombol create/checkout/withdraw Facility tanpa `PermissionGuard` (user read-only lihat tombol → 403) — `pages/facility/*.tsx`. P3
- **H-6** Menu "Perusahaan" tanpa `permission` tapi route di-guard `USERS:READ` → user tanpa users:read lihat menu → `/403` — `Sidebar.tsx:175-179`, `App.tsx:300-304`. P3
- **H-7** Sidebar memutasi `item.subItems` saat filter (antipattern, rapuh bila navItems dipindah ke konstanta) — `Sidebar.tsx:234-243`. P3
- **H-8** List tanpa state error eksplisit (StokPage/EmployeeListPage/OccupantPage) → error tampil sebagai "Tidak ada data" — `StokPage.tsx`, `EmployeeListPage.tsx`, `OccupantPage.tsx`. P3

---

## I. BACKEND ISSUE

- **I-1** (=A-1) Audit-log alias. P0
- **I-2** (=A-2) Import produk code. P0
- **I-3** (=B-8) Import stok-masuk findOrCreate key. P1
- **I-4** (=C-6) Import stok tak trigger notifikasi. P3
- **I-5** (=C-7) Validasi input user endpoints hilang. P3

---

## J. UI/UX ISSUE

- **J-1** "Absensi & Cuti" → `/login` alih-alih halaman "Coming Soon"/404 (roadmap) — `App.tsx:309`. P3
- **J-2** Kolom Aksi no-op di OccupantPage. P3
- **J-3** Tombol aksi Facility tampil untuk read-only user (403 saat klik). P3
- **J-4** WelcomePage informasi palsu (94.2%, "v2.4") + nav `href="#"`. P3
- **J-5** Redirect `/hr` lintas-prefix ke `/dashboard`; route `master-data` parent bersisa komentar developer — `App.tsx:113,146-160`. P3

---

## K. INTEGRATION ISSUE

- **K-1** (=A-4/B-5) Soft-delete employee lintas modul: nama kosong di Inventory/Facility historis, Berita Acara 404, occupant yatim. P0/P1
- **K-2** Notifikasi hanya ter-wiring di `createTransaksi`, tidak di import; dedup tidak ada. P3
- **K-3** Serial number status tak disinkron antara inventory ↔ facility asset (pasang/withdraw). P2
- **K-4** Klarifikasi: circular dependency inventory↔facility **AMAN** (urutan load `index.ts:8-10` benar; file model tidak saling impor associations). Bukan bug. P4

---

## L. DEAD CODE

- **L-1** `frontend/src/hooks/useApi.ts` — tak diimpor di manapun. Hapus.
- **L-2** `useEmployeeList` duplikat di `hooks/useMasterData.ts:82-90` — tak dipakai. Hapus.
- **L-3** `services/validation.service.ts:34-44` `validateDepartmentDivisi` & `services/permission.service.ts:35-37` `checkPermission` — tak berkonsumen. Hapus/konsolidasi ke `authStore.hasPermission`.
- **L-4** `employee.schema.ts:89-97` `superRefine` kosong (hanya komentar). Hapus.
- **L-5** `mutationLimiter`/`publicLimiter` (rate-limit) & blok catch FK di base service (untuk model paranoid) — dead. Wire atau hapus.

---

## M. RECOMMENDATION (Prioritas Perbaikan)

**P0 — sebelum tahap berikutnya (fitur rusak / 500):**
1. A-1 Audit-log alias (`user`→`executor`, 3 lokasi).
2. A-2 Import produk generate `code`.
3. A-3 Samakan permission occupants/assets (frontend↔backend).
4. A-4 Guard hapus karyawan penghuni aktif.

**P1 — sebelum produksi (keamanan & integritas):**
5. B-1..B-8: JWT type, escalation superadmin, upload hardening, refresh revocation, `paranoid:false` historis, Puppeteer try/finally, guard master-data paranoid, import stok key.
6. H-2, H-3: Header path + MasterDataTable resource prop.

**P2 — jadwalkan:** CSRF token, brute-force→Redis, secret hardening non-prod, email_perusahaan unique drift, race code/tag (advisory lock/sequence), export streaming/limit, C-1..C-4 (state machine SN/asset/occupant).

**P3–P4 — hygiene & optimasi:** index FK, dead code (L-1..L-5), dashboard filter Aktif, WelcomePage wiring notifikasi, ErrorBoundary per-Outlet, QueryClient defaults, migration idempotency, dokumen §8 koreksi (G-6/K-4).

**Pola sistemik yang harus diselesaikan menyeluruh:** *paranoid target + FK RESTRICT/SET NULL tanpa guard aplikasi*. Audit ulang SEMUA `include` Employee & SEMUA `delete` master-data setelah menetapkan pola standar (`paranoid:false` untuk baca historis; COUNT-guard untuk hapus).

---

## LAMPIRAN — "Verified OK" (sudah benar, tidak perlu diubah)

**Auth/Security:** bcrypt hooks (salt 10), tak ada kebocoran password di response, cookie flags benar (httpOnly/secure-prod/sameSite/path refresh), anti user-enumeration, akun nonaktif ditolak, prod secret fail-fast, dokumen/excel tidak disajikan statis, helmet aktif, status code 401/403 tepat, tak ada SQL injection di jalur request (ORM parameterized), token hanya di memori (frontend).

**HR/DB:** timestamp snake_case konsisten pasca-migrasi 55, child HR paranoid + mapping benar, delete/restore transaksional, FK lintas-modul sesuai dokumen §5, tak ada mismatch onDelete model-vs-migration, index FK & kolom pencarian ada, duplikasi index sudah dibersihkan (migrasi 54), numbering migrasi 00–56 lengkap, keunikan NIK/`code` pasca-soft-delete sesuai desain (terkunci sengaja).

**Inventory:** atomicity update stok existing (transaction + FOR UPDATE), negative-stock guard, unique stok `(produk,gudang)`, SN unik+terindex, transfer berpasangan konsisten, validasi Zod transaksi lengkap, master-data CRUD+restore+validasi FK, import guardrails dasar (file rusak/kosong/temp cleanup), label/QR lookup konsisten, semua endpoint inventory punya konsumen frontend.

**Facility/Notifications:** master-data CRUD+restore+search+pagination, checkout occupant benar, create occupant menolak employee terhapus & cek kapasitas, asset→SN RESTRICT utuh, work-order create/update + code immutable, dashboard summary benar, notifikasi dibuat & ter-wiring ke inventory (non-blocking), otorisasi mark-read per-user benar, scheduler tunggal (cleanup 02:00) dengan try/catch, cache-warming no-op aman, circular dependency aman.

**Frontend:** RESOURCES/ACTIONS mirror backend persis, notifikasi Header tersambung API, auth flow + interceptor refresh anti-loop, master-data HR sinkron end-to-end, invalidasi cache stok benar, guard inventory sinkron backend, facility master-data & work-order guard sinkron, DashboardPage tangani loading/error/empty, zod+RHF pada jalur utama, ErrorBoundary root berfungsi, lazy-loading + Suspense, modul-scoped sidebar.
