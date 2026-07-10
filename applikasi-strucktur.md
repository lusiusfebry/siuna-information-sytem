# Struktur Modul Aplikasi — Bebang Sistem Informasi (BIS)

Dokumen ini merangkum **modul-modul** dalam aplikasi BIS beserta fitur/menu, struktur, relasi antar-modul, routing, dan komponen bersama. Disusun berdasarkan penelusuran kode (backend `Express + TypeScript + Sequelize`, frontend `React + Vite + Zustand + React Query`).

> Terakhir diperbarui: 10 Juli 2026

---

## 1. Daftar Modul

| # | Modul | Prefix API | Domain | Peran |
|---|-------|-----------|--------|-------|
| 1 | **Auth** | `/api/auth` | Autentikasi & otorisasi | Login, JWT (httpOnly cookie + refresh), RBAC (roles/permissions), users, company settings |
| 2 | **HR** | `/api/hr` | Sumber Daya Manusia | Karyawan (CRUD, wizard, import/export), 10 master data, dashboard, dokumen, audit log, QR code |
| 3 | **Inventory** | `/api/inventory` | Inventaris & Stok | Produk, gudang, kategori, sub-kategori, brand, UOM, transaksi stok, serial number, label |
| 4 | **Facility** | `/api/facility` | Manajemen Fasilitas | Gedung (building), ruangan (room), tipe ruangan, kategori maintenance, aset, penghuni (occupant), work order |
| 5 | **Notifications** | `/api/notifications` | Notifikasi | Notifikasi sistem (mis. stok minimum) — *modul shared* |

Selain itu ada endpoint utilitas: `/` (root), `/api/health` (health check), `/api-docs` (Swagger UI).

Halaman pusat modul: `WelcomePage` (`/welcome`) menampilkan 4 kartu modul → HR (`/hr`), Inventory (`/inventory`), Facility (`/facility`), User Access (`/settings`). Sidebar bersifat **module-scoped**: menu berganti otomatis mengikuti prefix URL.

---

## 2. Fitur & Menu per Modul

Untuk tiap modul: **Menu (frontend)** = yang tampil di sidebar; **Fitur (backend)** = endpoint API yang tersedia. Semua label berbahasa Indonesia.

### 2.1 Auth / Settings (User Access)

**Menu sidebar (module `settings`):**
- Manajemen User → `/settings/users`
- Role & Akses → `/settings/roles`
- Perusahaan → `/settings/company`

**Halaman:** LoginPage (`/login`, publik) · UserManagementPage · RoleManagementPage · RoleFormPage (create/edit role) · CompanySettingsPage · PermissionDeniedPage (`/403`).

**Fitur backend:**
- **Autentikasi:** `POST /login` (rate-limited + brute-force lockout), `POST /refresh` (rotasi token via cookie), `GET /me`, `POST /logout`.
- **Users:** `GET /users`, `PUT /users/:id/role` (ubah role), `PUT /users/:id/status` (aktif/nonaktif).
- **Roles & Permissions:** `GET /roles`, `GET /roles/:id`, `POST /roles`, `PUT /roles/:id`, `DELETE /roles/:id`, `GET /permissions`.
- **Company Settings:** `GET /company-settings` (publik), `PUT /company-settings`, `POST /company-settings/logo` (khusus superadmin/admin).

### 2.2 HR (Human Resources)

**Menu sidebar (module `hr`):**
- Dashboard → `/dashboard`
- Master Data (grup 10 item): Divisi, Departemen, Posisi Jabatan, Kategori Pangkat, Golongan, Sub Golongan, Jenis Hubungan, Tag, Lokasi Kerja, Status Karyawan
- Manajemen Karyawan → Karyawan (`/hr/employees`)
- Absensi & Cuti → `/hr/attendance` 🚧 *placeholder — fitur belum dikembangkan (menu sudah disiapkan)*
- Riwayat Aktivitas → `/hr/audit-logs`

**Halaman:** EmployeeListPage · EmployeeCreatePage (wizard) · EmployeeDetailPage · EmployeeEditPage · EmployeeImportPage (`/hr/import`, tanpa item menu) · AuditLogPage · 10 halaman masterdata · DashboardPage.

**Fitur backend:**
- **Dashboard:** `/dashboard/stats`, `/dashboard/distribution`, `/dashboard/activities`, `/dashboard/employment-status`.
- **Karyawan:** list (`GET /employees` — paginasi, cari nama/NIK, filter departemen/divisi), profil lengkap (`GET /employees/:id`), sub-data terpisah (`/base`, `/personal`, `/employment`, `/family`), `POST` (create, multipart+foto), `PUT` (update), `DELETE` (soft delete), `POST /:id/restore` (pulihkan). Validasi: `/validation/employees/managers`, `/validation/employees/active`.
- **Master Data (dinamis `:model`):** CRUD + restore untuk 10 entitas: `divisi, department, posisi-jabatan, kategori-pangkat, golongan, sub-golongan, jenis-hubungan-kerja, tag, lokasi-kerja, status-karyawan`. Relasi berjenjang: `departments/by-divisi/:divisiId`, `posisi-jabatan/by-department/:departmentId`.
- **Dokumen:** upload (`POST /employees/:id/documents`), list, delete, download, preview.
- **Import:** `POST /import/preview` (pratinjau + validasi Excel), `POST /import/employees` (proses), `POST /import/master-data/:type`, `POST /import/error-report`.
- **Export:** `GET /employees/export/excel`, `GET /employees/:id/export/pdf`.
- **QR Code:** QR karyawan (base64 + download PNG), `GET /qrcode/generate` (generik).
- **Audit Log:** list (paginasi/filter), stats, users, riwayat per-entitas, detail.

### 2.3 Inventory

**Menu sidebar (module `inventory`):**
- Dashboard → `/inventory/dashboard`
- Master Data Inventory (grup 6 item): Kategori, Sub Kategori, Brand, UOM, Produk, Gudang
- Manajemen Stok (grup): Stok Inventaris (`/inventory/stok`), Transaksi Stok (`/inventory/transaksi`), Kartu Stok (`/inventory/kartu-stok`), Label & QR Code (`/inventory/label`)
- Import Data → `/inventory/import`
- Laporan → `/inventory/laporan`

**Halaman:** DashboardPage · StokPage · TransaksiListPage · TransaksiFormPage · KartuStokPage · LabelPage · ImportPage · LaporanPage · 6 halaman masterdata.

**Fitur backend:**
- **Master Data (dinamis `:model`):** CRUD + restore untuk 6 entitas: `kategori, sub-kategori, brand, uom, produk, gudang`; plus `PUT /master/produk/:id/photo` (foto produk).
- **Stok & Transaksi:** `GET /stok`, `GET /serial-numbers`, `POST /transaksi` (masuk/keluar), `GET /transaksi`, `GET /transaksi/:id`, `POST /transaksi/:id/dokumen`, `GET /kartu-stok`.
- **Dashboard:** stats, stock-by-warehouse, category-breakdown, recent-transactions, low-stock, item-velocity.
- **Import:** template per tipe, preview, `import/produk`, `import/stok-masuk`, error-report.
- **Export / Laporan:** Excel & PDF untuk stok, transaksi, serial-number, stok-rendah, pergerakan.
- **Aset Karyawan:** `GET /employees/search`, aset per karyawan, riwayat aset, berita acara serah-terima (per karyawan & per transaksi).
- **Facility Inventory:** `GET /facility/:buildingId/inventory` (aset pada gedung).
- **Label & QR:** QR produk / serial-number / asset-tag, `POST /label/print` (cetak massal), `GET /label/lookup` (hasil scan).

### 2.4 Facility

**Menu sidebar (module `facility`):**
- Dashboard → `/facility/dashboard`
- Master Data Fasilitas (grup 4 item): Gedung, Tipe Ruangan, Ruangan, Kategori Maintenance
- Operasional (grup): Work Order (`/facility/work-orders`), Penghuni (`/facility/occupants`), Aset Ruangan (`/facility/assets`)

**Halaman:** DashboardPage · WorkOrderPage · OccupantPage · AssetPage · 4 halaman masterdata.

**Fitur backend:**
- **Dashboard:** `GET /dashboard/summary`.
- **Master Data (dinamis `:model`):** CRUD + restore untuk 4 entitas: `building, room-type, room, maintenance-category`.
- **Work Order:** list, detail, create, update.
- **Occupant (Penghuni):** list, detail, create, update, `PUT /occupants/:id/checkout` (check-out).
- **Asset (Aset Fasilitas):** list, detail, create, update, `PUT /assets/:id/withdraw` (tarik aset).

### 2.5 Notifications (shared)

Tidak punya halaman/menu tersendiri — tampil sebagai **dropdown lonceng di Header** (badge unread, tandai dibaca, tandai semua dibaca).

**Fitur backend:** `GET /` (semua notifikasi), `GET /unread-count`, `PUT /:id/read`, `PUT /read-all`.

> Catatan: panel "Pemberitahuan Sistem" di WelcomePage masih **statis/hardcoded** (belum tersambung ke API notifikasi).

---

## 3. Struktur Direktori

### Backend (`backend/src/`)
```
modules/
  auth/           controllers, services, models (User, Role, Permission), routes (auth/role/user), company-settings
  hr/             controllers, services, models (Employee + Personal/HR/Family/Document + 10 master data),
                  routes/hr.routes.ts, validators, models/associations.ts
  inventory/      controllers, services (stok, export, label, dashboard, employee-asset, master-data),
                  models (InvProduk, InvGudang, InvKategori, InvSubKategori, InvBrand, InvUom,
                          InvTransaksi, InvSerialNumber ...), models/associations.ts
  facility/       controllers, services (work-order, master-data), models (FacilityBuilding, Room, RoomType,
                          MaintenanceCategory, Occupant, Asset, WorkOrder), models/associations.ts
shared/
  services/       base-master-data.service, cache.service, notification.service, cache-warming.service
  middleware/     auth, permission, cache, rate-limit, upload, audit log, performance, validasi per-modul
  routes/         notification.routes
  constants/      permissions (RESOURCES, ACTIONS)
  utils/          scheduler (node-cron), validation utils
config/           env.ts, database.ts, redis.ts (stub), swagger.ts
database/         migrations/ (00–56), migrate.ts, seed.ts, umzug.ts
```

### Frontend (`frontend/src/`)
```
pages/
  auth/           LoginPage
  hr/             EmployeeList/Create/Edit/Detail/Import, masterdata/ (10 halaman)
  inventory/      masterdata/ (Brand, Kategori, SubKategori, Uom, Produk, Gudang), stok/, Dashboard, Laporan, Import
  facility/       masterdata/ (Building, Room, RoomType, MaintenanceCategory), Asset, WorkOrder, Occupant, Dashboard
  admin/          UserManagement, RoleManagement, RoleForm, CompanySettings
  dashboard/      DashboardPage
  error/          PermissionDeniedPage
  WelcomePage.tsx
components/
  common/         Button, Modal, SearchableSelect, ErrorBoundary, ConfirmDialog, ...
  hr/             MasterDataTable, MasterDataForm, EmployeeWizard, EmployeeStep1/2/3Form,
                  VirtualEmployeeTable, EmployeeGrid, EmployeeCard  ← dipakai lintas modul
  auth/           ProtectedRoute, PermissionGuard
  layout/         MainLayout, Sidebar, Header, MasterDataLayout, LayoutSwitcher
hooks/            useMasterData, useEmployee, useEmployeeList, useInventoryMasterData,
                  useFacilityMasterData, useNotifications, useApi, usePermission, useDebounce
services/api/     client (axios), *.service.ts per domain (termasuk notification.service)
stores/           authStore (Zustand)
types/            permission.ts (RESOURCES, ACTIONS), hr, auth, ...
```

---

## 4. Relasi Antar-Modul (Dependency Graph)

Arah panah = "mengimpor / bergantung pada".

```
        ┌───────────────┐
        │     AUTH       │  User bergantung pada hr.Employee
        └──────┬─────────┘
               │ (User ⇄ Employee)
        ┌──────▼─────────┐
        │      HR         │  ← fondasi: Employee, LokasiKerja, Department, master data
        └──────┬─────────┘
        ┌──────┴───────────────────────┐
        │                              │
 ┌──────▼───────┐              ┌───────▼──────┐
 │  INVENTORY    │◄────────────►│   FACILITY    │  (saling bergantung / circular)
 └───────────────┘              └──────────────┘
```

**Ringkasan ketergantungan kode:**
- **auth → hr**: `User` berrelasi ke `Employee`; login & permission service memakai `Employee`.
- **hr → auth**: `associations.ts` HR mendaftarkan relasi `User`/`Role`/`Permission`; audit service memakai `User`.
- **inventory → hr, auth, facility**: memakai `Employee`, `Department`, `LokasiKerja` (hr), `User` (auth), `Building`/`Room` (facility). Punya endpoint lintas-modul: `GET /inventory/employee/:id/assets`, `GET /inventory/facility/:buildingId/inventory`.
- **facility → hr, auth, inventory**: memakai `Employee`, `LokasiKerja` (hr), `User` (auth), `SerialNumber`/`Transaksi`/`Produk` (inventory).
- ⚠️ **inventory ↔ facility bersifat sirkular** (saling impor model) — saat ini aman karena urutan load asosiasi di `index.ts`, tapi rapuh bila salah satu diimpor terpisah.

---

## 5. Relasi Database Lintas-Modul (Foreign Key)

FK yang menembus batas modul (semua mengarah ke HR `employees`/`lokasi_kerja`/`department`, auth `users`, atau antar inventory–facility):

| Kolom (tabel) | → Target (modul) | onDelete |
|---|---|---|
| `inv_gudang.penanggung_jawab_id` | employees (hr) | SET NULL |
| `inv_gudang.department_id` | department (hr) | SET NULL |
| `inv_gudang.lokasi_kerja_id` | lokasi_kerja (hr) | SET NULL |
| `inv_transaksi.karyawan_id` | employees (hr) | SET NULL |
| `inv_transaksi.created_by` | users (auth) | SET NULL |
| `inv_transaksi.facility_building_id` | facility_buildings (facility) | SET NULL |
| `inv_transaksi.facility_room_id` | facility_rooms (facility) | SET NULL |
| `inv_serial_number.karyawan_id` | employees (hr) | SET NULL |
| `facility_buildings.lokasi_kerja_id` | lokasi_kerja (hr) | SET NULL |
| `facility_buildings.penanggung_jawab_id` | employees (hr) | SET NULL |
| `facility_occupants.employee_id` | employees (hr) | RESTRICT |
| `facility_occupants.created_by` | users (auth) | SET NULL |
| `facility_assets.serial_number_id` | inv_serial_number (inventory) | RESTRICT |
| `facility_work_orders.reported_by` / `assigned_to` | employees (hr) | SET NULL |
| `users.employee_id` | employees (hr) | — |

> Catatan: sejak `employees` memakai **soft-delete (paranoid)**, aturan `onDelete` FK ini menjadi kurang relevan karena `destroy()` kini hanya meng-`UPDATE deleted_at` (bukan `DELETE`). Lihat bagian Risiko.

---

## 6. Komponen & Layanan Bersama

| Shared | Dipakai oleh |
|---|---|
| `BaseMasterDataService` | HR, Inventory, Facility (3 service master-data extend kelas ini) |
| `cache.service` | HR, Inventory, Facility, Auth (dependensi terluas) |
| `notification.service` | Inventory (stok.service) |
| `authenticate` middleware | Semua modul |
| `checkPermission` middleware | Semua modul (memakai auth permission.service) |
| `upload.middleware` | HR, Inventory, Auth |
| `cache` & `auditLog` middleware | HR, Inventory, Facility |
| **Frontend** `MasterDataTable`, `MasterDataForm` (komponen HR) | Hampir semua halaman master-data Inventory & Facility |
| **Frontend** hooks `useEmployeeList`, `useMasterData` | Halaman Facility (WorkOrder, Occupant, Building) & Inventory (Gudang) |
| **Frontend** tipe `MasterData` (`types/hr`), `PaginatedResponse` | Service Inventory & Facility |

---

## 7. Routing (mount di `backend/src/index.ts`)

| Prefix | Router |
|---|---|
| `/api/hr` | hr.routes |
| `/api/inventory` | inventory.routes |
| `/api/facility` | facility.routes |
| `/api/notifications` | notification.routes (shared) |
| `/api/auth` | auth.routes + role.routes + user.routes (3 router bertumpuk) |
| `/api/health` | health check (cek koneksi DB) |
| `/api-docs` | Swagger UI |

---

## 8. Catatan Risiko & Temuan

**Risiko integrasi lintas-modul:**
1. **Soft-delete `employees` (dampak lintas-modul terbesar).** Karena `employees` kini `paranoid`, setiap `include` Employee dari Inventory/Facility (relasi `belongsTo`/LEFT JOIN) akan **menyembunyikan** karyawan yang sudah dihapus → nama tampil kosong pada data historis (transaksi, serial number, work order, occupant). Tidak crash, tapi:
   - Guard `facility_occupants.employee_id` (dulu `NOT NULL` + `RESTRICT`) tak lagi mencegah "hapus karyawan yang masih menghuni ruangan".
   - Bila daftar tertentu harus tetap menampilkan karyawan non-aktif, query-nya perlu `paranoid: false`.
2. **Circular dependency Inventory ↔ Facility** — aman saat ini (urutan load `index.ts`), namun rapuh.
3. **`/api/auth` menumpuk 3 router** — bekerja selama sub-path tidak bertabrakan.

**Temuan UI (menu vs route):**
4. **Fitur direncanakan (belum dikembangkan):** menu HR "Absensi & Cuti" → `/hr/attendance` adalah **placeholder**; halaman & endpoint-nya memang belum dibuat. Menu sengaja disiapkan lebih dulu. Saat diklik, route jatuh ke `*`. Perlu diimplementasikan saat pengembangan modul absensi/cuti dimulai.
5. **Quick-link Header usang:** `MODULE_HEADERS` di `Header.tsx` menunjuk path lama (`/hr/employee`, `/hr/masterdata`) yang tidak ada; Facility tidak punya entri sehingga fallback ke config HR.
6. **Panel notifikasi WelcomePage statis** (hardcoded), belum tersambung ke API notifikasi yang sudah tersedia.

*(Item 2, 3 = pemantauan; item 4 = fitur roadmap; item 5, 6 = perbaikan kecil frontend.)*

---

## 9. Status Verifikasi Fungsional (per Juli 2026)

| Modul | Status audit |
|---|---|
| Auth | ✅ Diverifikasi mendalam (login, cookie+refresh, RBAC, lockout) |
| HR | ✅ Diverifikasi mendalam (CRUD karyawan, master data, import/export, dashboard, soft-delete, restore) |
| Inventory | ⚠️ Dianalisa struktural + relasi + inventarisasi endpoint; **belum** diuji fungsional end-to-end menyeluruh |
| Facility | ⚠️ Dianalisa struktural + relasi + inventarisasi endpoint; **belum** diuji fungsional end-to-end menyeluruh |
| Notifications | ⚠️ Endpoint teridentifikasi; belum diuji fungsional; panel WelcomePage masih statis |

> Rekomendasi: lakukan smoke-test fungsional untuk Inventory, Facility, dan Notifications sebelum produksi. (Modul Absensi & Cuti belum masuk lingkup — masih placeholder/roadmap.)
