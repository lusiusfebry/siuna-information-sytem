# RENCANA RESET DATA BIS

**Disusun:** 29 Juli 2026
**Status:** ✅ **SELESAI** — Pilihan B diimplementasikan dan **reset sudah dieksekusi** (29 Juli 2026).
Backup `pg_dump` dibuat lebih dulu, `npm run reset-data` dijalankan, dan login dengan
password lama sudah diverifikasi berhasil. Hasil verifikasi ada di §9.
**Permintaan:** reset seluruh data aplikasi, **kecuali** (a) kredensial login dan (b) master data modul Human Resources

> Semua temuan di bawah **diverifikasi langsung** terhadap kode dan terhadap database
> yang sedang berjalan (`pg_constraint`, `information_schema`, `COUNT(*)` eksak).

---

## 1. Ruang Lingkup

### Yang DIPERTAHANKAN

**Kredensial & hak akses (5 tabel, 99 baris)**

| Tabel | Baris |
|---|---|
| `users` | 2 |
| `roles` | 5 |
| `permissions` | 45 |
| `role_permissions` | 46 |
| `company_settings` | 1 |

`company_settings` bukan kredensial, tapi tetap dipertahankan karena berisi identitas
perusahaan (nama, logo, alamat) — bukan data operasional. Sudah dipertahankan oleh
script yang ada, jadi ini bukan perubahan.

**Master data HR (10 tabel, 119 baris)**

| Tabel | Baris |
|---|---|
| `posisi_jabatan` | 73 |
| `jenis_hubungan_kerja` | 13 |
| `sub_golongan` | 9 |
| `department` | 7 |
| `kategori_pangkat` | 5 |
| `golongan` | 5 |
| `status_karyawan` | 3 |
| `divisi` | 2 |
| `lokasi_kerja` | 2 |
| `tag` | 0 |

### Yang DIHAPUS (± 1.263 baris)

| Kelompok | Tabel & baris |
|---|---|
| **Karyawan** | `employees` 228, `employee_personal_info` 228, `employee_hr_info` 228, `employee_family_info` 228, `employee_documents` 0 |
| **Absensi & cuti** | `leaves` 0, `attendances` 0 |
| **Inventory** | `inv_brand` 8, `inv_uom` 4, `inv_kategori` 4, `inv_produk` 4, `inv_sub_kategori` 3, `inv_gudang` 3, sisanya 0 (`inv_stok`, `inv_serial_number`, `inv_transaksi`, `inv_transaksi_detail`, `inv_opname_*`) |
| **Facility** | `facility_room_types` 5, sisanya 0 (`facility_buildings`, `facility_rooms`, `facility_assets`, `facility_occupants`, `facility_work_orders`, `facility_maintenance_categories`) |
| **Lintas modul** | `audit_logs` 280, `notifications` 40 |

> ✅ **Dikonfirmasi user (29 Juli 2026):** yang dipertahankan **hanya** master data Human
> Resources. Master data **Inventory** (`inv_uom`, `inv_kategori`, `inv_sub_kategori`,
> `inv_brand`) dan **Facility** (`facility_room_types`, `facility_maintenance_categories`)
> **ikut dihapus**. Lihat Bagian 7.

---

## 2. Kondisi Script Saat Ini

Sudah ada dua script terdaftar di `backend/package.json`:

```
npm run reset-data      → ts-node src/database/reset-data.ts
npm run reset-and-seed  → ts-node src/database/reset-data.ts → seed-complete
```

`reset-data.ts` (295 baris) sudah cukup matang: ada gerbang konfirmasi (`--yes` untuk
melewati), backup/restore `users`, verifikasi jumlah baris di akhir, dan fallback admin.
**Tetapi tidak sesuai dengan permintaan ini.** Ada 4 cacat.

### Cacat A — Master data HR justru dihapus 🔴 **penghalang utama**

`reset-data.ts:19-21` — kesepuluh tabel master data HR ada di `TABLES_TO_CLEAN`:

```ts
// HR master data
'posisi_jabatan', 'department', 'divisi',
'kategori_pangkat', 'golongan', 'sub_golongan',
'jenis_hubungan_kerja', 'tag', 'lokasi_kerja', 'status_karyawan',
```

Menjalankan `npm run reset-data` hari ini akan **menghapus 119 baris master data HR**
yang justru diminta dipertahankan. Ini bertolak belakang 180° dengan permintaan.

### Cacat B — 4 tabel Stock Opname tidak terdaftar sama sekali 🟠

Diverifikasi ada di database tapi absen dari **kedua** script:

- `inv_opname_session`
- `inv_opname_detail`
- `inv_opname_petugas`
- `inv_opname_serial`

Tabel-tabel ini ditambahkan setelah script dibuat. Saat ini isinya tetap terhapus, tapi
hanya **secara tidak sengaja** — lewat `CASCADE` dari `inv_gudang` / `inv_produk` /
`inv_serial_number`. Konsekuensinya:

- tidak muncul di log "tabel dibersihkan"
- tidak muncul di verifikasi akhir
- perilaku `RESTART IDENTITY`-nya tidak terjamin (CASCADE meneruskan `RESTART IDENTITY`,
  tapi ini bergantung pada rantai FK yang bisa berubah kapan saja)

Harus didaftarkan eksplisit.

### Cacat C — `reset-and-seed.ts` menghapus `users` tanpa backup 🔴

`reset-and-seed.ts:4` mencantumkan `users` di `KEEP_TABLES`, tapi **tidak ada mekanisme
backup/restore** seperti di `reset-data.ts`. Karena `users.employee_id → employees`
(lihat Bagian 3), `TRUNCATE employees CASCADE` di baris 47 **akan mengosongkan tabel
`users`** — daftar `KEEP_TABLES` di sana hanya dicetak ke layar, tidak menjaga apa pun.

Selama ini tidak terasa karena `seed-complete` membuat ulang user setelahnya — tapi
password hasil buatan seed, bukan password asli. Perlu diperbaiki bersamaan.

### Cacat D — `department.manager_id` tanpa FK constraint 🟡

`hr/models/associations.ts:54` mendeklarasikan `Department.belongsTo(Employee, { foreignKey: 'manager_id' })`,
tetapi query ke `pg_constraint` menunjukkan **tidak ada** constraint
`department_manager_id_fkey`. Kolomnya ada (`integer`, nullable) tapi tidak ditegakkan database.

Artinya setelah `employees` dikosongkan, `department.manager_id` akan menyimpan ID yang
menunjuk ke karyawan yang tak ada lagi — tanpa protes dari database.

**Dampak nyata saat ini: nol.** Diperiksa: dari 7 baris `department`, **0 baris** punya
`manager_id` terisi. Jadi ini pencegahan, bukan perbaikan. Cukup satu
`UPDATE department SET manager_id = NULL` sebagai jaring pengaman.

---

## 3. Bukti Keamanan: Kenapa Mempertahankan Master Data HR Aman

Kekhawatiran wajar: `TRUNCATE ... CASCADE` bisa merembet ke tabel yang ingin dipertahankan.
Hasil pemeriksaan `pg_constraint` menjawab ini secara tuntas.

**Aturan yang berlaku:** `TRUNCATE ... CASCADE` merembet ke tabel yang **mereferensikan**
(anak), bukan ke tabel yang **direferensikan** (induk).

Seluruh FK antara tabel karyawan dan master data HR mengarah **dari karyawan ke master
data** — arah anak → induk. Jadi mengosongkan `employees` tidak menyentuh master data:

| FK | Arah | ON DELETE |
|---|---|---|
| `employees.department_id` → `department` | anak → induk | RESTRICT |
| `employees.divisi_id` → `divisi` | anak → induk | RESTRICT |
| `employees.posisi_jabatan_id` → `posisi_jabatan` | anak → induk | RESTRICT |
| `employees.lokasi_kerja_id` → `lokasi_kerja` | anak → induk | RESTRICT |
| `employees.status_karyawan_id` → `status_karyawan` | anak → induk | RESTRICT |
| `employees.tag_id` → `tag` | anak → induk | RESTRICT |
| `employee_hr_info.kategori_pangkat_id` → `kategori_pangkat` | anak → induk | SET NULL |
| `employee_hr_info.golongan_pangkat_id` → `golongan` | anak → induk | SET NULL |
| `employee_hr_info.sub_golongan_pangkat_id` → `sub_golongan` | anak → induk | SET NULL |
| `employee_hr_info.jenis_hubungan_kerja_id` → `jenis_hubungan_kerja` | anak → induk | SET NULL |
| `employee_hr_info.lokasi_sebelumnya_id` → `lokasi_kerja` | anak → induk | SET NULL |

FK internal di antara tabel yang dipertahankan juga aman karena keduanya tidak disentuh:
`department.divisi_id → divisi` dan `posisi_jabatan.department_id → department`.

Tabel yang dihapus dan mereferensikan master data yang dipertahankan (tidak berbahaya —
anaknya yang hilang, induknya tetap): `inv_gudang.department_id`, `inv_gudang.lokasi_kerja_id`,
`inv_transaksi.department_id`, `facility_buildings.lokasi_kerja_id`.

### Satu-satunya titik rawan: `users`

Dari 17 FK yang induknya `employees`, **hanya satu** yang berasal dari tabel yang
dipertahankan:

```
users.employee_id → employees   ON DELETE SET NULL
```

Ini **satu-satunya** alasan `TRUNCATE employees CASCADE` berbahaya. Dan ini persis yang
sudah didokumentasikan di `reset-data.ts:7-15`: `SET session_replication_role = replica`
menonaktifkan *trigger* FK, tapi **tidak** menghentikan perembetan `TRUNCATE ... CASCADE`.

16 FK lainnya berasal dari tabel yang memang dihapus, jadi tidak jadi masalah:
`attendances`, `employee_documents`, `employee_family_info`, `employee_hr_info`,
`employee_personal_info`, `leaves` (CASCADE); `employees.manager_id`,
`employees.atasan_langsung_id` (self, SET NULL); `facility_buildings.penanggung_jawab_id`,
`facility_work_orders.assigned_to`, `facility_work_orders.reported_by`,
`inv_gudang.penanggung_jawab_id`, `inv_serial_number.karyawan_id`,
`inv_transaksi.karyawan_id` (SET NULL); `facility_occupants.employee_id`,
`inv_opname_petugas.karyawan_id` (RESTRICT).

---

## 4. Dua Pilihan Pendekatan

### Pilihan A — pertahankan `TRUNCATE CASCADE` + backup/restore `users`

Perubahan paling kecil: pindahkan 10 tabel master data HR ke `KEEP_TABLES`, tambahkan
4 tabel opname, sisanya biarkan. Mekanisme backup/restore `users` yang sudah ada tetap
dipakai.

- ✅ perubahan minimal pada script yang sudah terbukti jalan
- ❌ tetap bergantung pada tarian *backup → truncate → insert ulang* untuk `users`,
  yang rapuh: kalau proses mati di tengah (setelah truncate, sebelum restore),
  **seluruh akun login hilang** dan hanya tersisa fallback admin `111111 / password123`

### Pilihan B — `DELETE` untuk `employees`, `TRUNCATE` untuk sisanya ✅ **disarankan**

Karena `employees` adalah **satu-satunya** tabel yang direferensikan oleh tabel yang
dipertahankan, perlakukan khusus hanya tabel itu:

```
1. TRUNCATE semua tabel lain (aman, tak ada kaitan ke tabel yang dipertahankan)
2. DELETE FROM employees          ← FK ON DELETE SET NULL bekerja normal:
                                     users.employee_id jadi NULL, baris users UTUH
3. ALTER SEQUENCE employees_id_seq RESTART WITH 1
```

- ✅ **`users` tidak pernah dihapus** → tidak perlu backup/restore, tidak ada jendela
  rawan, hash bcrypt asli otomatis terjaga (termasuk password yang sudah diganti lewat UI)
- ✅ tidak perlu `session_replication_role = replica` untuk langkah ini — FK bekerja
  sebagaimana dirancang, bukan diakali
- ✅ FK RESTRICT (`facility_occupants`, `inv_opname_petugas`) tidak menghalangi karena
  kedua tabel sudah dikosongkan di langkah 1 (dan keduanya memang 0 baris)
- ⚠️ `DELETE` lebih lambat dari `TRUNCATE` — untuk 228 baris tidak terasa
- ⚠️ butuh reset sequence manual (satu baris SQL)

**Rekomendasi: Pilihan B.** Ia menghapus bagian paling berisiko dari script, bukan
sekadar menghindarinya.

---

## 5. Rencana Perubahan Kode

### 5.1 `backend/src/database/reset-data.ts`

**`KEEP_TABLES` — dari 5 menjadi 15 tabel:**

```ts
const KEEP_TABLES = [
    // Kredensial & hak akses
    'users', 'roles', 'permissions', 'role_permissions',
    // Identitas perusahaan
    'company_settings',
    // Master data HR (BARU — sebelumnya ikut dihapus)
    'divisi', 'department', 'posisi_jabatan',
    'kategori_pangkat', 'golongan', 'sub_golongan',
    'jenis_hubungan_kerja', 'tag', 'lokasi_kerja', 'status_karyawan',
];
```

**`TABLES_TO_CLEAN` — dari 36 menjadi 29 tabel** (10 master data HR keluar,
`employees` pindah ke penanganan khusus, 4 tabel opname masuk):

```ts
const TABLES_TO_CLEAN = [
    // Facility — anak lebih dulu
    'facility_work_orders', 'facility_assets', 'facility_occupants',
    'facility_rooms', 'facility_buildings',
    'facility_room_types', 'facility_maintenance_categories',

    // Inventory — Stock Opname lebih dulu (BARU: 4 tabel ini sebelumnya tidak terdaftar)
    'inv_opname_serial', 'inv_opname_detail', 'inv_opname_petugas', 'inv_opname_session',
    'inv_serial_number', 'inv_transaksi_detail', 'inv_stok',
    'inv_transaksi', 'inv_produk', 'inv_gudang',
    'inv_brand', 'inv_sub_kategori', 'inv_kategori', 'inv_uom',

    // Lintas modul
    'audit_logs', 'notifications',

    // Detail karyawan (bukan 'employees' — lihat penanganan khusus)
    'employee_documents', 'employee_family_info', 'employee_hr_info',
    'employee_personal_info', 'leaves', 'attendances',
];
```

**Urutan fase yang diusulkan:**

| Fase | Tindakan | Catatan |
|---|---|---|
| 0 | Cetak ringkasan: tabel dipertahankan + jumlah baris **sebelum** | agar terlihat sebelum konfirmasi |
| 1 | Gerbang konfirmasi (`yes` / `--yes`) | sudah ada, dipertahankan |
| 2 | `TRUNCATE` ke-29 tabel di atas, satu per satu, dengan log | `RESTART IDENTITY CASCADE` |
| 3 | `UPDATE department SET manager_id = NULL` | Cacat D — jaring pengaman |
| 4 | `DELETE FROM employees` | `users.employee_id` otomatis jadi NULL |
| 5 | `ALTER SEQUENCE employees_id_seq RESTART WITH 1` | pakai `pg_get_serial_sequence` |
| 6 | Bersihkan baris soft-delete master data HR | urutan anak → induk (lihat 6.5) |
| 7 | Verifikasi: yang dihapus harus 0, yang dipertahankan harus sesuai angka **sebelum** | **gagalkan proses bila tidak cocok** |
| 8 | Ringkasan akhir | |

Yang **tidak lagi diperlukan** pada Pilihan B: `backupUsers()`, `restoreUsers()`,
`ensureFallbackAdmin()`, dan `SET session_replication_role`. Sebaiknya dihapus, jangan
disisakan sebagai kode mati — tapi bisa juga ditahan dulu sampai satu kali uji berhasil.

### 5.2 `backend/src/database/reset-and-seed.ts`

Sekarang menduplikasi daftar tabel — sumber cacat C dan pasti akan hanyut lagi.
**Refaktor: hapus duplikasinya.** Ekspor `KEEP_TABLES`, `TABLES_TO_CLEAN`, dan fungsi
reset dari `reset-data.ts`, lalu `reset-and-seed.ts` cukup memanggilnya sebelum
`seedComplete()`.

> ~~Catatan: setelah master data HR dipertahankan, `npm run reset-and-seed` berpotensi
> menabrak *unique constraint* pada `code` master data HR (mis. `seed-complete` mencoba
> membuat `DIV-001` yang sudah ada). Perlu diuji terpisah.~~
> **Terbukti tidak jadi masalah** (lihat §9 catatan #4): `seed-complete` memakai
> `findOrCreate` untuk seluruh master data (by `code`) dan untuk `User` (by NIK),
> jadi baris yang sudah ada dipakai ulang, bukan dibuat ganda. Selain itu
> `reset-and-seed` kini memakai mode `includeHrMaster: true` sehingga master data
> HR memang dikosongkan dulu. **Untuk permintaan ini yang dipakai adalah
> `reset-data`, bukan `reset-and-seed`.**

### 5.3 Berkas yang tidak perlu disentuh

Tidak ada perubahan pada model, service, controller, route, migration, maupun frontend.
Ini murni script pemeliharaan database.

---

## 6. Efek Samping yang Harus Ditangani

### 6.1 Akun login kehilangan kaitan ke karyawan

`users.employee_id` menjadi `NULL` untuk kedua akun. Akun tetap bisa login (NIK +
password + role utuh), tapi tautan ke profil karyawan hilang. Ini **tak terhindarkan** —
karyawan memang dihapus. Perlu ditautkan ulang manual setelah data karyawan baru masuk.

> Ini juga membuat **HR-4 (Employee Self Service)** di roadmap tidak bisa diuji sampai
> penautan ulang dilakukan.

### 6.2 Sequence

- Tabel yang dipertahankan: sequence **tidak** disentuh — benar, ID master data harus stabil
- Tabel yang dihapus: `RESTART IDENTITY` mengembalikan ke 1
- `employees`: reset manual (langkah 5)

### 6.3 Berkas upload jadi orphan

Diperiksa langsung di `backend/uploads/`:

| Direktori | Isi | Tindakan |
|---|---|---|
| `uploads/company/` | 2 logo | **JANGAN HAPUS** — `company_settings` dipertahankan |
| `uploads/employees/photos/` | 1 berkas | akan orphan (karyawan dihapus) |
| `uploads/employees/documents/` | kosong | — |
| `uploads/imports/excel/` | 8 berkas Excel sisa import | sudah sampah sejak awal; bisa dibersihkan |
| `uploads/inventory/photos`, `dokumen` | kosong | — |

Skalanya kecil (1 berkas orphan). **Saran: jangan otomatiskan penghapusan berkas** di
script reset — risikonya (terhapusnya logo perusahaan) tidak sepadan dengan manfaatnya.
Cukup cetak peringatan di ringkasan akhir dan bersihkan manual.

### 6.4 Cache Redis

Redis saat ini **stub no-op** (lihat A3 di `docs/ROADMAP-FITUR.md`), jadi tidak ada cache
basi yang perlu diinvalidasi. Setelah Redis nyata dipasang, script reset **wajib**
menambahkan langkah *flush* — kalau tidak, dashboard akan menampilkan 228 karyawan yang
sudah tidak ada. Sebaiknya dicatat sebagai komentar di kode sekarang agar tidak terlupa.

### 6.5 Baris soft-delete di master data HR

**Keputusan user (29 Juli 2026): ikut dibersihkan.**

Hasil pemeriksaan: **tidak ada satu pun baris soft-delete** di kesepuluh tabel master data HR
(`deleted_at IS NOT NULL` = 0 di semuanya). Angka di Bagian 1 seluruhnya baris aktif.

Jadi langkah pembersihan ini **tidak menghapus apa pun hari ini** — tetap dimasukkan ke
script agar perilakunya benar bila nanti ada baris yang di-soft-delete lewat UI:

```sql
DELETE FROM "posisi_jabatan"       WHERE deleted_at IS NOT NULL;
DELETE FROM "department"           WHERE deleted_at IS NOT NULL;
DELETE FROM "divisi"               WHERE deleted_at IS NOT NULL;
DELETE FROM "kategori_pangkat"     WHERE deleted_at IS NOT NULL;
DELETE FROM "golongan"             WHERE deleted_at IS NOT NULL;
DELETE FROM "sub_golongan"         WHERE deleted_at IS NOT NULL;
DELETE FROM "jenis_hubungan_kerja" WHERE deleted_at IS NOT NULL;
DELETE FROM "tag"                  WHERE deleted_at IS NOT NULL;
DELETE FROM "lokasi_kerja"         WHERE deleted_at IS NOT NULL;
DELETE FROM "status_karyawan"      WHERE deleted_at IS NOT NULL;
```

⚠️ **Urutan wajib anak → induk** (`posisi_jabatan` → `department` → `divisi`) karena FK
internal keduanya `RESTRICT`. Kalau nanti ada induk yang di-soft-delete sementara anaknya
masih aktif (mis. `divisi` soft-deleted tapi `department` di bawahnya aktif), `DELETE`-nya
akan **ditolak database**. Diperiksa hari ini: nol kasus seperti itu. Script harus
menangkap error ini dan melaporkannya, jangan menelannya diam-diam.

### 6.6 Frontend perlu muat ulang penuh

React Query akan menyimpan data lama di cache. Setelah reset: *hard refresh*
(Ctrl+Shift+R). Kalau *service worker* PWA aktif (hanya pada build produksi), perlu
juga unregister via DevTools → Application → Service Workers.

---

## 7. Keputusan: Master Data Inventory & Facility ✅ SUDAH DIPUTUSKAN

**Keputusan user (29 Juli 2026): DIHAPUS.** Yang dipertahankan hanya master data Human
Resources; selain itu boleh dihapus.

Yang ikut terhapus karena keputusan ini:

| Tabel | Baris | Isi |
|---|---|---|
| `inv_brand` | 8 | merek barang |
| `inv_uom` | 4 | satuan (pcs, box, liter, …) |
| `inv_kategori` | 4 | kategori barang |
| `inv_sub_kategori` | 3 | sub-kategori |
| `facility_room_types` | 5 | tipe ruangan |
| `facility_maintenance_categories` | 0 | kategori perawatan |

**Konsekuensi yang perlu diketahui:** sebelum modul Inventory bisa dipakai lagi, satuan,
kategori, sub-kategori, dan merek harus diisi ulang dari nol (baik manual lewat UI maupun
lewat `npm run seed:complete`). Produk tidak bisa dibuat tanpa satuan & kategori.

Tidak ada perubahan pada rencana — `TABLES_TO_CLEAN` di Bagian 5.1 sudah memuat keenam
tabel ini.

---

## 8. Prosedur Eksekusi

### Sebelum menjalankan

1. **Backup database** — ini wajib, bukan opsional:
   ```
   pg_dump -h localhost -p 5432 -U <user> -d bebang_db -F c -f backups/pre-reset-2026-07-29.dump
   ```
   Direktori `backups/` sudah ada di root proyek.
2. Hentikan backend dev server (agar tidak ada transaksi yang berjalan bersamaan).
3. Catat/screenshot daftar user yang ada — perlu untuk menautkan ulang `employee_id`
   setelah data karyawan baru masuk.

### Menjalankan

```bash
cd backend
npm run reset-data        # akan meminta konfirmasi: ketik "yes"
```

### Verifikasi setelahnya

| Pemeriksaan | Harapan |
|---|---|
| `SELECT COUNT(*) FROM users` | 2 |
| `SELECT COUNT(*) FROM roles` | 5 |
| `SELECT COUNT(*) FROM permissions` | 45 |
| `SELECT COUNT(*) FROM role_permissions` | 46 |
| `SELECT COUNT(*) FROM posisi_jabatan` | 73 |
| `SELECT COUNT(*) FROM jenis_hubungan_kerja` | 13 |
| `SELECT COUNT(*) FROM department` | 7 |
| `SELECT COUNT(*) FROM sub_golongan` | 9 |
| `SELECT COUNT(*) FROM employees` | 0 |
| `SELECT COUNT(*) FROM audit_logs` | 0 |
| `SELECT COUNT(*) FROM inv_produk` | 0 |
| Login dengan akun lama | **berhasil, password tetap sama** |
| Halaman master data HR | isinya masih lengkap |
| Tambah 1 karyawan baru | `id` = 1 |

Pemeriksaan **"login dengan password lama berhasil"** adalah yang paling penting — itu
pembeda utama Pilihan B dari Pilihan A.

### Bila gagal

```
pg_restore -h localhost -p 5432 -U <user> -d bebang_db -c backups/pre-reset-2026-07-29.dump
```

---

## 9. Ringkasan Perubahan — ✅ SEMUA SUDAH DIKERJAKAN (29 Juli 2026)

| # | Berkas | Perubahan | Prioritas | Status |
|---|---|---|---|---|
| 1 | `reset-data.ts` | 10 master data HR: `TABLES_TO_CLEAN` → `KEEP_HR_MASTER_TABLES` | 🔴 wajib | ✅ |
| 2 | `reset-data.ts` | daftarkan 4 tabel `inv_opname_*` | 🔴 wajib | ✅ |
| 3 | `reset-data.ts` | `employees`: `TRUNCATE CASCADE` → `DELETE` + reset sequence | 🟠 Pilihan B | ✅ |
| 4 | `reset-data.ts` | hapus `backupUsers`/`restoreUsers`/`ensureFallbackAdmin`/`session_replication_role` | 🟠 ikut #3 | ✅ |
| 5 | `reset-data.ts` | `UPDATE department SET manager_id = NULL` | 🟡 pencegahan | ✅ Fase 2 |
| 6 | `reset-data.ts` | bersihkan baris soft-delete master data HR (urutan anak → induk) | 🟡 nol dampak hari ini | ✅ Fase 4 |
| 7 | `reset-data.ts` | verifikasi ketat — gagalkan bila jumlah baris tidak cocok | 🟠 disarankan | ✅ Fase 5, `throw` |
| 8 | `reset-data.ts` | komentar: tambahkan flush Redis setelah A3 selesai | 🟡 catatan | ✅ header |
| 9 | `reset-and-seed.ts` | pakai daftar dari `reset-data.ts`, hapus duplikasi | 🟠 mencegah hanyut ulang | ✅ |

**Tidak ada** perubahan pada model, migration, service, controller, route, atau frontend.

### Catatan implementasi yang berbeda dari rencana

1. **Daftar tabel dipecah tiga**, bukan dua: `KEEP_CREDENTIAL_TABLES` (5),
   `KEEP_HR_MASTER_TABLES` (10), `TABLES_TO_TRUNCATE` (29). Pemisahan ini
   diperlukan karena `reset-and-seed` butuh mode di mana master data HR **ikut**
   dihapus, sementara `reset-data` mempertahankannya.
2. **Logika reset diekspor sebagai `performReset(opts)`** dengan opsi
   `includeHrMaster`. `reset-and-seed.ts` memanggilnya dengan
   `includeHrMaster: true`; tidak lagi menyalin daftar tabel apa pun.
   `performReset` **tidak** memanggil `process.exit` — itu tugas pemanggil.
3. **Mode `includeHrMaster` juga memakai `DELETE`, bukan `TRUNCATE`,** untuk
   master data HR. Alasannya: `TRUNCATE department CASCADE` merembet
   `→ employees → users`, jadi rantai yang sama yang membuat Cacat C berbahaya
   akan muncul lagi. Aturan yang dipakai: **apa pun yang rantai CASCADE-nya bisa
   mencapai `employees` dihapus dengan `DELETE`.**
4. **Cacat C selesai lebih tuntas dari rencana.** Ternyata `seed-complete`
   memakai `findOrCreate` (`User` by NIK, master data by `code`), jadi
   mempertahankan `users` tidak menimbulkan tabrakan unique. `reset-and-seed`
   sekarang benar-benar menjaga `users` — bukan hanya mencetak daftarnya.
   Peringatan di §5.2 tentang risiko tabrakan `code` **tidak terbukti**.
5. **`reset-and-seed` kini punya gerbang konfirmasi** (`yes` / `--yes`).
   Sebelumnya sama sekali tidak ada, padahal script itu destruktif.
6. **`ensureFallbackAdmin` dihapus tanpa pengganti.** Di bawah Pilihan B `users`
   tidak pernah dihapus, jadi tidak ada lagi keadaan "database kehilangan semua
   akun" yang perlu diselamatkan. Bila database memang 0 akun sejak awal, itu
   bukan akibat script ini.
7. **Flag baru `--include-hr-master`** pada `reset-data` untuk keperluan
   debugging/manual; tidak dipakai oleh `npm run reset-data`.

### Hasil verifikasi

```
npx tsc --noEmit          → tanpa error
npx eslint <kedua berkas> → tanpa peringatan
```

Dry-run (dijalankan lalu dibatalkan pada gerbang konfirmasi, **tanpa** menghapus
apa pun) mengonfirmasi angka pada §1 secara persis:

```
Tabel yang DIPERTAHANKAN (15):  218 baris  (99 kredensial + 119 master data HR)
Tabel yang DIKOSONGKAN  (30):  1.263 baris
```

---

## 9b. Hasil Eksekusi Nyata (29 Juli 2026)

User membuat backup `pg_dump` lebih dulu, lalu menjalankan `npm run reset-data`.
Semua pemeriksaan pasca-reset lulus:

| Pemeriksaan | Hasil |
|---|---|
| Login dengan password lama | ✅ berhasil (dikonfirmasi user) |
| 15 tabel dipertahankan | ✅ 218 baris — identik dengan sebelum reset |
| 30 tabel dikosongkan | ✅ 0 baris |
| `users` | ✅ 2 akun utuh: id 1 (`111111`), id 2 (`1234567890123456`), keduanya `is_active` |
| `users.employee_id` | `NULL` pada keduanya — **sesuai desain** |
| Sequence id berikutnya | ✅ 1 untuk `employees`, `inv_produk`, `inv_uom`, `audit_logs`, `notifications` |
| `department.manager_id` masih terisi | ✅ 0 |
| Baris soft-delete master data HR | ✅ 0 |

Master data HR yang bertahan: `posisi_jabatan` 73, `jenis_hubungan_kerja` 13,
`sub_golongan` 9, `department` 7, `kategori_pangkat` 5, `golongan` 5,
`status_karyawan` 3, `divisi` 2, `lokasi_kerja` 2, `tag` 0.

**Yang harus diisi ulang sebelum modul bisa dipakai:** master data Inventory
(satuan 4, kategori 4, sub-kategori 3, merek 8) dan Facility (tipe ruangan 5,
kategori perawatan).

**Konsekuensi `users.employee_id = NULL`** — ternyata **tidak bisa** ditautkan
ulang lewat UI: fiturnya belum ada sama sekali (tidak ada endpoint maupun kontrol
UI yang mengubah `employee_id`). Rinciannya dicatat di
`docs/ROADMAP-FITUR.md` §UA-2. Dampak saat ini nol karena kedua akun yang tersisa
ber-role `superadmin`, yang di-bypass oleh `permission.service.ts:62`.

---

## 10. Status Keputusan

| # | Pertanyaan | Status |
|---|---|---|
| 1 | Master data Inventory & Facility ikut dihapus? | ✅ **Ya, dihapus** (29 Juli 2026) |
| 2 | Pilihan A (`TRUNCATE` + backup/restore `users`) atau B (`DELETE`)? | ✅ **B** — sudah diimplementasikan |
| 3 | Baris soft-delete di master data HR dibersihkan? | ✅ **Ya** — ternyata 0 baris, jadi tanpa dampak |

**Langkah berikutnya (milik user):** ✅ **sudah dikerjakan** — backup `pg_dump`
diambil, `npm run reset-data` dijalankan, login diverifikasi. Lihat §9b untuk
hasilnya. Yang tersisa: isi ulang master data Inventory & Facility, lalu uji input
dan transaksi kedua modul itu.
