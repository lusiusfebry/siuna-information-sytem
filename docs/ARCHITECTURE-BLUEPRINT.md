# BLUEPRINT ARSITEKTUR — Bebang Sistem Informasi (BIS)

**Status dokumen:** AKTIF — panduan arah arsitektur (living document)
**Tanggal dibuat:** 16 Juli 2026
**Konteks target:** ERP internal untuk industri **pertambangan & general industry**, kelas enterprise, multi-site.
**Sifat dokumen:** *forward-looking* — menetapkan **arah & aturan** untuk pertumbuhan (modul baru, fitur baru, klien mobile). Untuk potret struktur **saat ini**, lihat [`applikasi-strucktur.md`](../applikasi-strucktur.md). Untuk kontrol audit per modul, lihat `AUDIT-INVENTORY.md` (pola yang akan direplikasi ke modul lain).

> Dokumen ini **tidak mengubah kode**. Ia adalah kesepakatan arsitektur: bagaimana modul & fitur baru ditambahkan tanpa merusak yang sudah berjalan, dan bagaimana menyiapkan fondasi untuk mobile.

---

## 1. TUJUAN ARSITEKTUR (Architecture Goals)

Aplikasi akan **terus tumbuh** (modul & fitur bertambah) dan **berpotensi punya klien mobile** (Android/lainnya). Empat sasaran memandu setiap keputusan:

| # | Sasaran | Konsekuensi desain |
|---|---------|--------------------|
| **G-1** | **Modular & terpusat** — tiap domain berdiri sendiri tapi berbagi fondasi umum | Batas modul tegas; kode lintas-modul lewat kontrak, bukan reach-in |
| **G-2** | **Aman ditambah** — fitur baru tak merusak fitur lain | Kontrak API stabil + versioning + test regresi |
| **G-3** | **Siap multi-klien** — web sekarang, mobile nanti, mungkin integrasi pihak-3 | API-first, stateless-friendly auth, kontrak terdokumentasi |
| **G-4** | **Sesuai konteks tambang** — multi-site, audit ketat, andal di lapangan | Scoping per-site/department, audit trail, offline-tolerant |

---

## 2. PRINSIP ARSITEKTUR (aturan yang mengikat)

Sepuluh prinsip. Setiap PR/fitur baru dinilai terhadap ini.

1. **Batas modul tegas (bounded context).** Setiap modul = satu domain (HR, Inventory, Facility, Auth, …). Punya `models / services / controllers / routes` sendiri.
2. **Ketergantungan searah, lewat kontrak.** Modul boleh bergantung ke *shared* dan (terbatas) ke modul lain — tetapi lewat **service interface**, bukan meng-query model modul lain langsung. Hindari siklus.
3. **API sebagai kontrak publik.** Sekali sebuah versi API dirilis ke klien (terutama mobile), bentuknya **tidak boleh berubah merusak**. Perubahan merusak → versi baru.
4. **Response envelope seragam.** Semua endpoint balas `{ status, data | message, meta? }`. Klien apa pun bisa parsing seragam.
5. **RBAC terpusat & berbutir.** Semua otorisasi lewat `permissions.ts` (RESOURCES × ACTIONS) + `checkPermission`. Modul baru **wajib** mendaftarkan resource + seed permission.
6. **Scoping multi-site sejak awal.** Data yang terikat site/department discope (pola `checkDepartmentAccess` / `departmentFilter`). Penting untuk multi-site tambang.
7. **Validasi berlapis, fail-closed.** DB constraint → Zod service/route → cek referensi controller → UX frontend. Default menolak.
8. **Auditability.** Aksi konsekuensial tercatat (siapa/kapan/apa). Tabel ledger non-paranoid; master-data paranoid (soft-delete). Konvensi ini konsisten lintas modul.
9. **Integritas transaksional.** Operasi multi-tabel atomik (satu DB transaction). Tak ada partial write.
10. **Shared-first untuk lintas-potong.** Notifikasi, cache, audit, scheduler, base-CRUD hidup di `shared/` dan dipakai ulang — bukan diduplikasi per modul.

---

## 3. PETA MODUL & KONTEKS

### 3.1 Modul saat ini
| Modul | Prefix | Domain | Resource RBAC |
|-------|--------|--------|---------------|
| Auth / User Access | `/api/auth` | Autentikasi, RBAC, users, company | `roles`, `users` |
| HR | `/api/hr` | Karyawan, 10 master data, dokumen, dashboard | `employees`, `master_data`, `documents`, `audit_logs`, `dashboard`, `import`, `export` |
| Inventory | `/api/inventory` | Produk, stok, transaksi, serial, label | `inventory_master_data`, `inventory_stock` |
| Facility | `/api/facility` | Gedung, ruang, aset, penghuni, work order | `facility_master_data`, `facility_work_order` |
| Notifications | `/api/notifications` | Notifikasi sistem (shared) | — |

### 3.2 Kandidat modul ke depan (contoh, tambang/general industry)
Procurement/Purchasing, Maintenance/CMMS (aset berat), K3/HSE (safety incident), Fleet/Heavy Equipment, Finance/Cost, Payroll, Project/Contract, Vendor. **Setiap modul baru mengikuti §5 (cara menambah modul).**

### 3.3 Aturan relasi antar-modul
- Arah alami: **Inventory/Facility → HR → Auth** (yang "hilir" bergantung ke "hulu"). Pertahankan; hindari HR bergantung struktural ke Inventory.
- Ketika modul A butuh data modul B: panggil **service B** (mis. `stokService.createTransaksi`) — jangan tulis/ubah model B dari service A. Baca lintas-modul via service read atau association yang sudah didefinisikan; **tulis** selalu lewat service pemilik.
- Titik kopling yang sudah ada **wajib dijaga** (lihat §7).

---

## 4. LAPISAN & TANGGUNG JAWAB

```
Route      → auth, RBAC (checkPermission), validasi request (Zod), department scope
Controller → orkestrasi tipis: baca req, panggil service, bentuk response envelope
Service    → seluruh logika bisnis + transaksi DB; SATU-SATUNYA yang menyentuh model
Model      → definisi tabel + association (Sequelize)
Shared     → notification, cache, audit, scheduler, base-master-data, util, middleware
```

**Aturan:** controller tak query model langsung; logika lintas-modul tinggal di service pemilik domain; efek samping (notifikasi, cache-invalidation) lewat shared service.

---

## 5. CARA MENAMBAH MODUL BARU (checklist)

1. Buat `backend/src/modules/<modul>/{models,services,controllers,routes}` + `docs/<modul>.swagger.ts`.
2. Daftarkan `RESOURCES.<MODUL>_*` di `shared/constants/permissions.ts` (backend **dan** cermin frontend).
3. Migrasi seed permission (pola `57_seed_module_permissions.ts` / `67_*`), grant ke superadmin.
4. Mount route di `index.ts` **di bawah prefix berversi** (lihat §6): `/api/v1/<modul>`.
5. Ikuti response envelope `{ status, data }` + error lewat `AppError`/error handler.
6. Jika ada master-data CRUD → pakai `base-master-data.service`. Jika ada data per-site → terapkan department scoping.
7. Tambah Swagger untuk tiap endpoint.
8. Tulis test service (minimal happy-path + guard). Update dokumen kontrol audit modul.
9. Frontend: `services/api/<modul>-*.service.ts`, `hooks/`, `types/<modul>.ts`, halaman + guard `PermissionGuard`.

---

## 6. API SEBAGAI KONTRAK — VERSIONING (prioritas sebelum mobile)

**Kondisi sekarang:** route di `/api/hr`, `/api/inventory`, dst. — **tanpa versi**.

**Masalah untuk mobile:** aplikasi Android yang sudah ter-install di HP tak bisa dipaksa update serentak. Kalau kontrak API berubah, app lama rusak. Web bisa deploy ulang; mobile tidak.

**Arah yang direkomendasikan:**
- Introduksi prefix berversi **`/api/v1/...`** untuk semua modul.
- Transisi mulus: mount route yang sama di `/api/v1/*` **dan** pertahankan `/api/*` sebagai alias sementara (deprecated) agar frontend web tak langsung putus. Hapus alias setelah frontend pindah.
- **Aturan breaking vs non-breaking:** menambah field/endpoint = non-breaking (boleh di v1). Mengubah/menghapus field, mengubah tipe, mengubah makna = **breaking** → `/api/v2`.
- Dokumentasikan tiap versi di Swagger.

**Definisi "breaking change" (acuan):** ubah nama/tipe field response, hapus field, ubah kode status, ubah semantik nilai, perketat validasi input yang sebelumnya lolos.

---

## 7. TITIK KOPLING YANG WAJIB DIJAGA (regression guards)

Kopling lintas-modul yang sudah ada dan **tak boleh rusak** saat menambah fitur:

| Kopling | Lokasi | Fungsi | Risiko bila rusak |
|---------|--------|--------|-------------------|
| HR → Inventory | `employee.service.getOutstandingAssetCounts` | Hitung aset dipegang karyawan | Badge aset salah (INV-M02) |
| HR → Inventory | `employee.service` guard nonaktif | Blokir nonaktifkan karyawan pegang aset | Orphan custody (INV-M02) |
| HR → Facility | `employee.service` guard hapus | Blokir hapus karyawan penghuni aktif | Data facility timpang |
| Inventory ↔ Facility | `stok.service` ↔ `facility_assets` | Penempatan aset = 1 siklus transaksi | Stok/lokasi kontradiktif (INV-C01) |
| Auth → semua | `checkPermission`, `departmentFilter` | Otorisasi & scoping | Kebocoran data lintas-site |

**Aturan:** menyentuh area ini → jalankan test regresi terkait + verifikasi manual alur lintas-modul.

**Risiko diketahui:** `employees` paranoid (soft-delete) → `include` Employee dari modul lain menyembunyikan karyawan terhapus (nama kosong di data historis). Untuk baca historis, gunakan `paranoid: false` pada include (pola sudah dipakai di beberapa tempat).

---

## 8. KESIAPAN MOBILE (yang perlu disiapkan)

Rencana klien Android/mobile menuntut penyesuaian **sebelum** dibangun:

1. **Auth strategy.** Sekarang auth via **httpOnly cookie + CSRF double-submit** — ideal untuk web, tapi klien native tidak menangani cookie web semulus browser. Siapkan **opsi Bearer token** (access + refresh) untuk klien mobile, atau API token khusus. Backend sudah punya refresh-token; tinggal ekspos jalur header-based yang rapi.
2. **API versioning** (§6) — prasyarat utama.
3. **Kontrak terdokumentasi penuh** — Swagger untuk **semua** modul (kini baru auth & HR). Tim mobile bekerja dari kontrak, bukan tebakan.
4. **Payload ramah mobile** — pagination konsisten, hindari over-fetch, dukung filter server-side (sudah ada di banyak endpoint).
5. **Offline-tolerant** — pola PWA read-only (INV-N06) bisa jadi acuan; untuk native pertimbangkan cache lokal + sync.
6. **Aset statik & media** — URL absolut/CDN-ready untuk foto produk/karyawan.
7. **Error stabil & i18n-ready** — kode error konsisten; pesan bisa dilokalkan (saat ini id-only).

> **Keputusan arsitektur mobile** (native Android vs React Native vs PWA-saja) sebaiknya diambil eksplisit; masing-masing mengubah kebutuhan di atas. Blueprint ini menyiapkan backend agar **netral-klien**.

---

## 9. NON-FUNCTIONAL & OPERASIONAL

- **Keamanan:** helmet, rate-limit, CSRF, brute-force lockout sudah ada. **Wajib pra-produksi:** `JWT_SECRET` kuat (kini masih default/lemah — muncul warning), **HTTPS/TLS** (nginx masih `:80`; PWA & kamera scan butuh HTTPS).
- **Observability:** ada `/api/health`, performance monitor, audit log. Ke depan: structured logging + metrics per modul.
- **Data & multi-site:** scoping department/site jadi standar untuk modul yang menyimpan data operasional per-lokasi.
- **Migrasi:** additive-first, selalu migrasi baru (jangan sunting yang sudah teraplikasi), sertakan `down`. Backup sebelum migrasi di DB berisi data.
- **Caching:** Redis via `cache.service` (dependensi terluas) — invalidasi pada create/update/delete.
- **Testing:** setiap fitur konsekuensial punya test service; jaga suite hijau sebagai gerbang regresi.

---

## 10. ROADMAP HARDENING (usulan urutan, sebelum ekspansi besar)

| Prioritas | Item | Alasan | Perkiraan |
|-----------|------|--------|-----------|
| **P1** | API versioning `/api/v1` + alias transisi | Prasyarat mobile & stabilitas kontrak | Sedang |
| **P1** | Bearer-token auth path untuk klien non-browser | Prasyarat mobile | Sedang |
| **P2** | Swagger lengkap Inventory & Facility | Kontrak untuk tim mobile/integrasi | Kecil–Sedang |
| **P2** | Dokumen kontrol audit HR & Facility (pola AUDIT-INVENTORY) | Lacak kelengkapan fitur terpusat | Kecil |
| **P3** | Refactor kopling lintas-modul ke service interface | Cegah jaring kusut saat modul ke-5+ | Sedang |
| **P3** | HTTPS/TLS + `JWT_SECRET` kuat | Prasyarat produksi | Kecil (ops) |
| **P4** | Structured logging + metrics per modul | Observability skala | Sedang |

> **Catatan:** P1 paling murah dikerjakan **sekarang** (belum ada klien mobile terpasang). Biayanya naik drastis setelah app mobile rilis.

---

## 11. CARA MENGGUNAKAN DOKUMEN INI

1. Setiap **modul/fitur baru** dinilai terhadap §2 (prinsip) & mengikuti §5 (checklist).
2. Perubahan yang menyentuh **§7 (kopling)** wajib test regresi.
3. Sebelum membangun **mobile**, tuntaskan item mobile di §8 & P1/P2 di §10.
4. Dokumen diperbarui saat keputusan arsitektur berubah (mis. versioning diterapkan, strategi auth mobile dipilih).

---

*Blueprint arsitektur — disusun dari penelusuran kode aktual (16 Juli 2026). Melengkapi `applikasi-strucktur.md` (potret saat ini) dan `docs/ARCHITECTURE.md` (ringkas). Belum ada perubahan kode oleh dokumen ini.*
