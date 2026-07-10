# LAPORAN AUDIT EKSEKUTIF — Bebang Sistem Informasi (BIS)
### Technical Due Diligence — Executive Report

> Disusun oleh tim virtual: Software Architect, Fullstack, Backend, Frontend, QA Automation, Database, Security, Performance, DevOps.
> Tanggal: 9–10 Juli 2026.
> **Dokumen ini adalah ringkasan eksekutif + matriks + roadmap.** Detail per-temuan (11 field) ada di **`AUDIT-REPORT.md`** dengan ID temuan yang sama (A-1, B-3, RT-1, dst). Struktur modul acuan: **`applikasi-strucktur.md`**.
> Metode: audit statis 6 auditor paralel + **runtime sweep LENGKAP semua modul** (~70 panggilan API nyata, data uji dibersihkan tuntas). Sweep runtime menemukan **4 bug tambahan (RT-1..RT-4)** yang audit statis lewatkan/salah-nilai.

---

## STATUS PERBAIKAN — TAHAP 1 SELESAI (10 Juli 2026)

**Seluruh 6 Critical (P0) sudah DIPERBAIKI & diverifikasi runtime.** Backend type-check ✅, frontend type-check ✅, 65/65 test ✅. Data uji dibersihkan. (Belum di-commit — menunggu Anda.)

| ID | Perbaikan | Verifikasi runtime |
|---|---|---|
| **A-1** | alias `user`→`executor` + atribut `['id','nama','nik']` (User tak punya `username`/`email`) — `audit.service.ts` | `GET /hr/audit-logs` → **200** ✅ |
| **A-2** | generate `code` via `generateCode(InvProduk)` di import — `import.service.ts` | import produk → **success=1** ✅ |
| **A-3** | guard occupants/assets `FACILITY_WORK_ORDER`→`FACILITY_MASTER_DATA` (route + menu per-item) — `App.tsx`, `Sidebar.tsx` | type-check ✅ + backend e2e konsisten |
| **A-4** | guard occupant aktif (dynamic import, 409) sebelum `destroy` — `employee.service.ts` | DELETE karyawan penghuni aktif → **409** ✅ |
| **RT-1** | default `tanggal_lapor=today` di WO create — `work-order.service.ts` | WO create → **201**, detail **200** ✅ |
| **RT-4** | seed permission facility+inventory (`rbac-seed.ts`) + migration idempoten `57` | DB 35→**43** permission; role `facility_master_data` → `/occupants` **200**, `/work-orders` **403** ✅ |

**Regresi yang ditangani:** unit test `deleteEmployee` diberi mock `FacilityOccupant` (akibat guard A-4). **Sisa (P1+):** RT-2 (adjustment negatif 500), RT-3 (notifikasi low-stock), B-1..B-9 — belum dikerjakan (Tahap 2).

---

---

## 1. RINGKASAN EKSEKUTIF

**Kondisi aplikasi:** Fondasi arsitektur **baik dan konsisten** (modular per-domain, RBAC terpusat, transaksi stok atomik, migrasi rapi 00–56, hashing benar). Alur inti lintas-modul **terbukti berfungsi saat runtime** (buat karyawan → assign laptop → assign mess). Namun ada **4 bug Critical** yang membuat fitur tertentu tidak berfungsi/500, **9 Major** (mayoritas keamanan & integritas soft-delete), dan **1 pola risiko sistemik** (paranoid + FK RESTRICT tanpa guard aplikasi). Tiga modul (Inventory, Facility, Notifications) **tidak memiliki test otomatis**.

**Tingkat kesiapan produksi:** ⛔ **BELUM SIAP** untuk produksi, dan **belum ideal** sebagai fondasi fitur baru sampai kategori P0 selesai. Setelah P0+P1 beres → layak jadi fondasi. **Runtime sweep menaikkan jumlah Critical dari 4 → 6** (Work Order & permission Facility ternyata rusak, bukan "OK" seperti dugaan statis).

### Skor Kesehatan (0–100)

| Dimensi | Skor | Justifikasi ringkas |
|---|---:|---|
| **Kesehatan codebase keseluruhan** | **58** | Struktur solid, tetapi **6 Critical** + 11 Major + utang test 3 modul (turun dari 62 pasca-runtime) |
| **Maintainability** | **65** | Modular & konsisten; tergerus 160 `as any`, 205 `console.log`, hook duplikat, dead code |
| **Scalability** | **58** | Export tanpa paginasi, N+1, race condition kode transaksi, brute-force in-memory (tak multi-instance) |
| **Security** | **46** | JWT type tak dicek, escalation superadmin, upload mimetype, tanpa CSRF/revocation, **permission facility tak di-seed** |
| **Performance** | **64** | Stok atomik & terindeks baik; tetapi export full-load, N+1 tag, index FK kurang |
| **Kesiapan produksi** | **35** | Diblok **6 Critical** (2 di antaranya bikin fitur mati total); keamanan P1 wajib |
| **Test coverage/maturity** | **35** | Hanya HR/Auth diuji; Inventory/Facility/Notifications 0 test → runtime sweep menemukan 4 bug yang test-lah seharusnya menangkap |

**Ringkasan angka temuan:** **6 Critical** · **11 Major** · 12 Minor · 8 Security · 7 Performance · 4 Architecture · 6 Database · 8 Frontend · 5 UI/UX · 4 Integration · 5 Dead Code. *(+RT-1..RT-4 dari runtime sweep.)*

---

## 2. TEMUAN AUDIT (indeks + status verifikasi)

> Format lengkap tiap temuan (Deskripsi/Penyebab/Dampak/Reproduksi/Solusi/Contoh Kode) ada di `AUDIT-REPORT.md` pada ID yang sama. Di bawah: indeks + severity + status bukti + estimasi effort. **RT-x = temuan dari runtime sweep.**

### Critical (P0)
| ID | Modul | Lokasi | Status bukti | Effort |
|---|---|---|---|---|
| **A-1** Audit-log 500 (alias `user`≠`executor`) | HR | `audit.service.ts:44,66,82` | ✅ **RUNTIME-CONFIRMED** (HTTP 500) | ~15 mnt |
| **A-2** Import produk gagal (kolom `code` null) | Inventory | `import.service.ts:100-109` | ✅ **RUNTIME-CONFIRMED** (`success:0`) | ~30 mnt |
| **A-3** Permission occupants/assets FE≠BE | Facility | `App.tsx:269-274` vs `facility.routes.ts:109-171` | ✅ **RUNTIME** (403) — & lihat RT-4 | ~20 mnt |
| **A-4** Hapus karyawan penghuni aktif (RESTRICT mati) | HR↔Facility | `employee.service.ts:468-490` | ✅ **RUNTIME-CONFIRMED** (HTTP 204) | ~1 jam |
| **RT-1** Work Order create/detail/update 500 (`tanggal_lapor` NOT NULL vs validator opsional) | Facility | `WorkOrder.ts:52` vs `validateFacilityWorkOrder.ts:14` | ✅ **RUNTIME-CONFIRMED** (500) | ~20 mnt |
| **RT-4** Permission Facility tak di-seed → hanya superadmin bisa akses | Auth/RBAC↔Facility | `rbac-seed.ts`; DB 0 baris `facility_*` | ✅ **RUNTIME-CONFIRMED** (403) | ~1 jam |

### Major (P1)
| ID | Modul | Status bukti | Effort |
|---|---|---|---|
| **B-1** Refresh token = access token | Auth | Diverifikasi kode | ~30 mnt |
| **B-2** Admin bisa demote/nonaktifkan superadmin | RBAC | Diverifikasi kode | ~1 jam |
| **B-3** Upload percaya mimetype + originalname mentah | Security | Diverifikasi kode | ~2 jam |
| **B-4** Tanpa revocation refresh token | Auth | Diverifikasi kode | ~3 jam |
| **B-5** Include Employee null di data historis + BA 404 | Inv/Fac↔HR | ✅ **RUNTIME-CONFIRMED** | ~2 jam |
| **B-6** Puppeteer tanpa try/finally (leak) | Inventory | Diverifikasi kode | ~1 jam |
| **B-7** Guard "masih dipakai" master-data mati (paranoid) | Shared | Diverifikasi kode | ~3 jam |
| **B-8** Import stok findOrCreate key salah | Inventory | Diverifikasi kode | ~30 mnt |
| **B-9** Hook karyawan duplikat + `useApi` dead | Frontend | Diverifikasi kode | ~1 jam |
| **RT-2** Adjustment stok NEGATIF selalu 500 (`reading 'map'`) | Inventory | ✅ **RUNTIME-CONFIRMED** | ~2 jam |
| **RT-3** Notifikasi low-stock tak pernah dibuat (query salah kolom permission) | Notif↔Inv | ✅ **RUNTIME-CONFIRMED** (0 notif) | ~1 jam |

### Minor / Security / Performance / lainnya
Lihat `AUDIT-REPORT.md` §C (C-1..C-12), §D (D-1..D-11), §E (E-1..E-8), §F, §G, §H, §J, §K, §L. Semua ber-`file:line`.

---

## 3. MATRIKS FEATURE

Legend: ✅ Berfungsi · ⚠️ Sebagian/berisiko · ❌ Rusak · 🚧 Belum selesai (roadmap)

### Auth
| Modul | Feature | Status | Bug | Severity | Catatan |
|---|---|:---:|---|:---:|---|
| Auth | Login | ✅ | — | — | Runtime OK; lockout+hash benar |
| Auth | Logout | ⚠️ | B-4 | Major | Hanya clear cookie, tak revoke |
| Auth | Refresh token | ⚠️ | B-1,B-4 | Major | Berfungsi, tapi type tak dicek & tak bisa dicabut |
| Auth | RBAC/Permission | ⚠️ | B-2,D-9 | Major | Berfungsi; escalation superadmin & fail-open |
| Auth | User management | ⚠️ | B-2,C-7 | Major | Tanpa validasi tipe input |
| Auth | Role management | ✅ | — | — | CRUD role + permission OK |
| Auth | Company settings | ⚠️ | D-8 | Minor | GET publik bocorkan PII |

### HR
| Modul | Feature | Status | Bug | Severity | Catatan |
|---|---|:---:|---|:---:|---|
| HR | Dashboard | ✅ | — | — | loading/error/empty ditangani |
| HR | Master Data (10) CRUD | ⚠️ | B-7,HR#7 | Major | Create/read/update runtime OK; delete-guard mati, search tak disanitasi |
| HR | Employee CRUD + Wizard | ✅ | — | — | Runtime create OK; field ortu kandung konsisten |
| HR | Import karyawan | ⚠️ | HR#2,3,4 | Major | All-or-nothing, `costing` hilang, preview tak validasi |
| HR | Export excel/pdf | ✅ | — | — | 4 sheet sejajar field |
| HR | Document upload/preview | ✅ | — | — | Berbasis auth (aman) |
| HR | QR Code | ⚠️ | HR#10 | Minor | Route download mati, swagger param salah |
| HR | **Audit Log** | ❌ | **A-1** | **Critical** | **HTTP 500 (runtime)** — menu rusak total |
| HR | Restore karyawan | ✅ | — | — | Runtime restore OK (parent+child) |
| HR | Soft-delete | ⚠️ | A-4 | Critical | Tak ada guard relasi aktif |

### Inventory
| Modul | Feature | Status | Bug | Severity | Catatan |
|---|---|:---:|---|:---:|---|
| Inventory | Dashboard | ⚠️ | C-8 | Minor | Agregasi tak filter produk Nonaktif |
| Inventory | Master Data (6) | ✅ | — | — | Runtime create semua OK |
| Inventory | Stok masuk/keluar | ✅ | — | — | Runtime OK, transaksi atomik + FOR UPDATE |
| Inventory | Serial number | ⚠️ | C-1,C-2 | Minor | Tersedia→Digunakan OK; transisi tak divalidasi |
| Inventory | **Assign laptop ke karyawan** | ✅ | — | — | **Runtime OK** (HR↔Inventory) |
| Inventory | Berita Acara | ⚠️ | B-5b | Major | OK utk aktif; **404 utk karyawan soft-deleted (runtime)** |
| Inventory | QR/Label | ✅ | — | — | lookup konsisten |
| Inventory | **Import produk** | ❌ | **A-2** | **Critical** | Selalu 0 sukses (code null) |
| Inventory | Import stok | ⚠️ | B-8 | Major | Gagal bila UOM beda |
| Inventory | Export (10 varian) | ⚠️ | E-1 | Perf | Full-load; `limit:500` memotong diam-diam |

### Facility
| Modul | Feature | Status | Bug | Severity | Catatan |
|---|---|:---:|---|:---:|---|
| Facility | Dashboard | ✅ | — | — | Runtime summary OK |
| Facility | Master Data (4) | ✅ | — | — | Runtime create OK |
| Facility | **Assign karyawan ke mess** (occupant) | ✅ | — | — | **Runtime OK** (HR↔Facility) |
| Facility | Occupant update/checkout | ⚠️ | C-3 | Minor | Checkout runtime OK; update lewati cek kapasitas |
| Facility | Asset (pasang/withdraw) | ✅⚠️ | C-4 | Minor | **Runtime create/withdraw OK**; bisa duplikat penempatan serial |
| Facility | **Work Order** | ❌ | **RT-1** | **Critical** | **create/detail/update 500** (`tanggal_lapor` null) — runtime |
| Facility | **Akses seluruh modul (permission)** | ❌ | **RT-4, A-3** | **Critical** | Permission facility **tak di-seed** → hanya superadmin (runtime 403) |

### Notifications
| Modul | Feature | Status | Bug | Severity | Catatan |
|---|---|:---:|---|:---:|---|
| Notif | API (list/unread/read/read-all) | ✅ | — | — | Runtime OK, ter-scope per user |
| Notif | Dropdown/badge Header | ✅ | — | — | Tersambung API |
| Notif | **Low-stock trigger** | ❌ | **RT-3** | **Major** | **Tak pernah buat notifikasi** (query salah kolom) — runtime 0 notif |
| Notif | Panel WelcomePage | 🚧 | H-4 | — | Masih statis/hardcoded |
| — | **Absensi & Cuti** | 🚧 | — | — | **Belum dikembangkan (roadmap)** |

### Inventory (perubahan pasca-runtime)
| Modul | Feature | Status | Bug | Severity | Catatan |
|---|---|:---:|---|:---:|---|
| Inventory | Stok Masuk / Keluar / Transfer | ✅ | — | — | Runtime OK (atomik) |
| Inventory | **Adjustment / Opname** | ⚠️ | **RT-2** | **Major** | Positif OK; **negatif selalu 500** (`reading 'map'`) — runtime |
| Inventory | **Import produk** | ❌ | **A-2** | **Critical** | Runtime `success:0` (code null); preview OK |
| Inventory | Export (10 varian) | ✅ | E-1 (perf) | — | **Runtime semua HTTP 200** (Excel/PDF nyata); `limit:500` truncation |

---

## 4. MATRIKS RELASI ANTAR MODUL

Legend: ✅ Valid · ⚠️ Berpotensi Rusak · ❌ Tidak Valid

| Relasi | Arah | Status | Bukti / Catatan |
|---|---|:---:|---|
| Auth ↔ HR | User ↔ Employee | ✅ Valid | Login membawa employee; FK `users.employee_id` |
| HR → Auth | associations + audit | ⚠️ Berpotensi Rusak | A-1: audit-log alias salah → 500 (runtime) |
| HR → Inventory | assign aset (write) | ✅ Valid | Runtime: serial `Digunakan`, `karyawan_id` terisi |
| Inventory → HR | baca nama karyawan (historis) | ⚠️ Berpotensi Rusak | B-5: null bila karyawan soft-deleted; BA 404 (runtime) |
| HR → Facility | assign occupant (write) | ✅ Valid | Runtime: occupant tampil nama karyawan |
| Facility → HR | integritas hapus karyawan | ❌ Tidak Valid | A-4: karyawan penghuni aktif bisa dihapus (runtime 204) |
| Facility → HR | baca nama penghuni (historis) | ⚠️ Berpotensi Rusak | B-5a: `employee=null` (runtime) |
| Inventory ↔ Facility | circular import model | ✅ Valid | Urutan load `index.ts:8-10` aman |
| Inventory → Facility | serial → facility_asset (RESTRICT) | ✅ Valid | Runtime asset create OK; SN bukan paranoid → RESTRICT efektif |
| **Notifications → Inventory** | low-stock event | ❌ **Tidak Valid** | **RT-3: query target user salah kolom → 0 notifikasi (runtime)** |
| **Auth/RBAC → Facility** | permission enforcement | ❌ **Tidak Valid** | **RT-4: permission facility tak di-seed → hanya superadmin (runtime 403)** |
| Master-data → semua | FK RESTRICT | ⚠️ Berpotensi Rusak | B-7: guard "masih dipakai" mati untuk paranoid |

**Kesimpulan relasi:** rantai **write** lintas-modul sehat (assign laptop & mess terbukti jalan). Masalah terkonsentrasi pada: (1) **read historis** & **penghapusan** saat target `paranoid` (pola sistemik), (2) **notifikasi lintas-modul mati** (RT-3), dan (3) **enforcement permission Facility tak berfungsi** untuk non-superadmin (RT-4).

---

## 5. TECHNICAL DEBT (dikelompokkan)

**TD-1 · Pola paranoid vs FK RESTRICT (SISTEMIK — prioritas tertinggi).** A-4, B-5, B-7, G-1, G-2, K-1. Soft-delete menetralisir proteksi DB tanpa guard aplikasi. Butuh keputusan pola standar menyeluruh (guard COUNT sebelum hapus + `paranoid:false` untuk baca historis).

**TD-2 · Keamanan auth belum matang.** B-1, B-2, B-3, B-4, D-5..D-11. JWT type, escalation, upload, revocation, CSRF, secret non-prod.

**TD-3 · Utang test.** Inventory/Facility/Notifications 0 test; e2e hanya HR/Auth. Coverage rendah → regresi berisiko saat kembangkan fitur.

**TD-4 · Konsistensi & type-safety.** 160 `as any` (backend) + 14 (frontend); 205 `console.log` tanpa logger terstruktur; dua error handler paralel (F-1); `authorize()` role-name vs RBAC (F-2).

**TD-5 · Dead code & duplikasi.** L-1..L-5 (useApi, hook duplikat, service tak dipakai, superRefine kosong, rate-limiter tak dipakai); duplikasi logika velocity (F-3).

**TD-6 · Robustifikasi data massal.** Import all-or-nothing (HR#2), export full-load + truncation (E-1), N+1 import & tag (HR#5, E-4), race code transaksi (E-2, E-3).

**TD-7 · Konsistensi UI/permission frontend.** H-2 (header path), H-3 (guard hardcoded), H-5/H-6 (guard tombol/menu), H-8 (state error), J-* (UX).

---

## 6. QUICK WINS (< 1 hari, dampak tinggi)

1. **A-1** ubah alias `user`→`executor` (3 baris) → menu Audit Log hidup. **~15 mnt.**
2. **RT-1** default `tanggal_lapor` di WO create → Work Order hidup. **~20 mnt.**
3. **A-3** samakan `PermissionGuard` occupants/assets ke `FACILITY_MASTER_DATA`. **~20 mnt.**
4. **A-2** generate `code` sebelum `InvProduk.create` di import. **~30 mnt.**
5. **RT-4** seed permission `facility_*` (+ verifikasi `inventory_*`) → Facility bisa di-assign ke role. **~1 jam.**
6. **RT-3** perbaiki query target user notifikasi (belongsToMany, bukan `Op.contains`) → notifikasi low-stock hidup. **~1 jam.**
7. **B-8** perbaiki key `findOrCreate` stok import. **~30 mnt.**
8. **B-1** enforce `type==='access'` di `verifyToken`. **~30 mnt.**
9. **H-2** perbaiki path Header (`/hr/employees`, `/hr/master-data/divisi`) + entri facility. **~30 mnt.**
10. **L-1..L-4** hapus dead code (useApi, hook duplikat, superRefine kosong). **~1 jam.**
11. **B-5** tambah `paranoid:false` pada include Employee historis + `findByPk` berita acara. **~2 jam.**
12. **A-4** guard occupant aktif sebelum `deleteEmployee`. **~1 jam.**

> 12 item ≈ 1.5–2 hari kerja menuntaskan **seluruh 6 Critical** + beberapa Major. (RT-2 adjustment butuh debugging → tidak masuk quick win.)

---

## 7. REFACTORING RECOMMENDATION (berurut prioritas)

1. **Standarkan pola soft-delete lintas-modul** (TD-1): helper `assertNotReferenced()` untuk delete + konvensi `paranoid:false` untuk query historis. Audit ulang semua `include Employee` & `delete master-data`.
2. **Hardening lapisan auth** (TD-2): secret access/refresh terpisah, jti/token_version untuk revocation, CSRF token, sanitasi filename upload + validasi magic-byte.
3. **Sinkronisasi permission↔seed↔konstanta** (TD-8, dari RT-4): jadikan seed permission diturunkan otomatis dari `RESOURCES×ACTIONS` agar tak ada resource yang tak ter-seed; tambah smoke-test "setiap resource punya baris permission".
4. **Ekstraksi & konsistensi** (TD-4/TD-5): satu logger terstruktur (ganti 205 `console.log`), satu error handler, kurangi `as any`, hapus dead code.
5. **Robustifikasi data massal** (TD-6): import per-baris (savepoint), export streaming/paginated, sequence DB / advisory lock untuk kode transaksi.
6. **Konsistensi permission UI** (TD-7): prop `permissionResource` pada `MasterDataTable`, guard tombol Facility, seragamkan menu vs route guard.

---

## 8. BUG PRIORITAS

**Critical:** A-1, A-2, A-3, A-4, **RT-1, RT-4**.
**High (Major):** B-1, B-2, B-3, B-4, B-5, B-6, B-7, B-8, **RT-2, RT-3**, H-2, H-3, (B-9 code-health).
**Medium:** C-1..C-5, D-5..D-9, E-1..E-3, G-3, K-3.
**Low:** C-6..C-12, D-10..D-11, E-4..E-8, F-1..F-4, G-4..G-5, H-4..H-8, J-1..J-5, L-1..L-5.

---

## 9. ROADMAP PERBAIKAN

**Tahap 1 — Stabilisasi Critical (2–3 hari).** A-1, A-2, A-3, A-4, **RT-1, RT-4**. *Exit: semua fitur bisa diakses (termasuk Work Order & Facility untuk role non-superadmin), tak ada 500, integritas hapus karyawan terjaga.* Verifikasi dengan runtime sweep yang sama.

**Tahap 2 — Keamanan, Integritas & Notifikasi (4–6 hari).** B-1..B-8, **RT-2 (adjustment), RT-3 (notifikasi)**, TD-1 (pola soft-delete menyeluruh), H-2, H-3. *Exit: lulus checklist keamanan dasar; read historis konsisten; notifikasi & adjustment berfungsi.*

**Tahap 3 — Kualitas & Robustness (1–1.5 minggu).** TD-4 (logger, error handler, `as any`), TD-5 (dead code), TD-6 (import/export/race), TD-8 (sinkronisasi seed permission), C-* & E-*. *Exit: maintainability & scalability naik; laporan/data massal andal.*

**Tahap 4 — Test & Hardening lanjutan (1–2 minggu).** Test Inventory/Facility/Notifications (unit+integration), e2e lintas-modul, CSRF, brute-force→Redis, secret hardening, index FK, UX (J-*). *Exit: coverage memadai; siap produksi & pengembangan fitur baru berkelanjutan.*

---

## 10. KESIMPULAN

**Apakah aplikasi layak menjadi fondasi pengembangan fitur baru?**
**Belum — tetapi jaraknya dekat, dan runtime sweep memperjelas gambarannya.** Arsitektur sudah benar dan alur bisnis inti lintas-modul **terbukti jalan saat dijalankan** (buat karyawan → assign laptop → assign mess). Masalahnya **terfokus dan mayoritas quick-win**, bukan cacat desain fundamental — tetapi runtime sweep menaikkan taruhannya: **2 fitur yang dikira "OK" ternyata mati total** (Work Order, akses Facility non-superadmin) dan **2 integrasi lintas-modul tidak berfungsi** (notifikasi low-stock, adjustment negatif).

**Alasan teknis:**
1. **6 Critical memblok** — audit-log 500 (A-1), import produk gagal (A-2), permission facility (A-3/RT-4), hapus karyawan penghuni aktif (A-4), Work Order 500 (RT-1), Facility hanya superadmin (RT-4). Mayoritas **quick win** (total ≈ 2–3 hari).
2. **Runtime membuktikan pentingnya menjalankan aplikasi**: audit statis menandai Work Order & notifikasi "OK", padahal keduanya rusak. Ini menegaskan **utang test 3 modul** (Inventory/Facility/Notifications = 0 test) sebagai risiko nyata, bukan teoretis.
3. **Dua akar sistemik**: (a) *paranoid vs RESTRICT* → A-4/B-5/B-7; (b) *seed permission tak sinkron dengan konstanta* → RT-4. Sekali pola standar keduanya ditetapkan, banyak temuan selesai bersamaan.
4. **Keamanan auth (P1)** wajib sebelum produksi, tetapi **tidak memblok** pengembangan fitur internal.

**Urutan prioritas:** Tahap 1 (6 Critical, wajib sebelum lanjut) → Tahap 2 (keamanan+integritas+notifikasi) → Tahap 3 (kualitas) → Tahap 4 (test+hardening). **Setelah Tahap 1 (2–3 hari), aplikasi layak dijadikan fondasi** pengembangan fitur baru, dengan Tahap 2–4 beriringan.

**Rekomendasi akhir:** Selesaikan **Tahap 1 lebih dulu** (1–2 hari) — setelah itu aplikasi **layak dijadikan fondasi** pengembangan fitur baru, dengan Tahap 2–4 dikerjakan beriringan mengikuti roadmap.
