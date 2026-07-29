# ROADMAP FITUR BIS

**Disusun:** 29 Juli 2026
**Status:** Rekomendasi — belum dikerjakan. Pengembangan dimulai setelah tahap pengujian Inventory & modul lain selesai.
**Konteks target:** perusahaan pertambangan & industri umum, kelas enterprise.

> Semua temuan di dokumen ini **diverifikasi langsung terhadap kode**, bukan asumsi.
> Referensi file disertakan agar bisa langsung ditindaklanjuti.

---

## Ringkasan Temuan Kunci

Tiga hal yang menentukan urutan prioritas di bawah:

### 1. Absensi & Cuti adalah "tabel mati"

| Sudah ada | Belum ada |
|---|---|
| `database/migrations/16_create_leaves_and_attendances.ts` | service |
| `database/migrations/17_seed_leaves_and_attendances.ts` | controller |
| `modules/hr/models/Attendance.ts` | route |
| `modules/hr/models/Leave.ts` | halaman frontend |
| HR dashboard **sudah membaca** tabel ini | — |

Fondasi ~30% sudah terbayar dan menganggur. Rasio nilai/usaha tertinggi di seluruh sistem.

### 2. Rantai atasan sudah tersedia — tapi belum cukup untuk approval

`modules/hr/models/associations.ts:74-77` — `Employee.atasan_langsung_id` dan
`Employee.manager_id` sudah ada beserta asosiasinya (`atasan_langsung`,
`manager`, `managed_employees`, `directed_employees`).

Artinya **jalur** approval (siapa yang dilewati) bisa dibangun tanpa migrasi struktur baru.

⚠️ **Koreksi atas asumsi awal:** yang belum ada adalah **batas wewenangnya** (berhenti
di mana). `KategoriPangkat`, `Golongan`, dan `SubGolongan` hanya punya `code` + `nama` —
**tanpa level numerik**, sehingga program tidak bisa membandingkan GOL-IV dengan GOL-III.
Approval berjenjang tetap butuh master data baru. Lihat `docs/DESAIN-ORG-CHART.md`.

### 3. Tidak ada field harga/nilai di seluruh modul Inventory

- `inventory/models/Produk.ts` — tidak ada harga/HPP
- `inventory/models/TransaksiDetail.ts` — tidak ada harga satuan
- `inventory/models/Stok.ts` — tidak ada nilai

Konsekuensi: sistem **tidak bisa** menjawab "berapa nilai aset/persediaan di Departemen X",
biaya work order harus diketik manual, dan analisis dead stock hanya bicara kuantitas
(1 unit dead stock Rp 200 juta terlihat sama tidak pentingnya dengan 500 unit Rp 5.000).

### Catatan tambahan

- **Tidak ada kanal notifikasi keluar aplikasi.** Verifikasi: nol dependensi
  nodemailer / twilio / fonnte / firebase / web-push. Notifikasi hanya in-app.
- **`docs/ROADMAP-INVENTORY.md` bagian "Catatan Status" sudah usang** — mengklaim
  opname, void/amend, QR-scan, dan low-stock belum ada, padahal semuanya sudah jadi.
  Perlu disegarkan agar tidak menyesatkan.

---

## 1. Rekomendasi Aplikasi (Lintas Modul)

| Kode | Rekomendasi | Alasan | Prioritas |
|---|---|---|---|
| **A1** | Selesaikan Absensi & Cuti | Tabel, model, dan pembacaan dashboard sudah ada | 🔴 Tertinggi |
| **A2** | Kanal notifikasi keluar (email/WhatsApp) | Nol kanal eksternal; approval & alert tidak sampai ke orang di lapangan | 🔴 Tinggi |
| **A3** | Redis nyata (saat ini stub no-op) | Prasyarat multi-instance. Membuka cache nyata, lockout persisten (D-6), job queue PDF/export/notifikasi | 🟠 Pre-produksi |
| **A4** | Perluas offline PWA | PWA ada tapi hanya cache lookup label/QR. Site tambang sering low-signal — opname & work order lapangan idealnya offline lalu sinkron | 🟠 Sedang |
| **A5** | Modul Laporan terpadu | Export tersebar per-modul dengan format berbeda; manajemen butuh satu tempat + penjadwalan kirim | 🟡 Nanti |
| **A6** | API versioning `/api/v1` | Dari blueprint arsitektur; wajib sebelum ada klien mobile terpisah. Murah sekarang, mahal nanti | 🟡 Nanti |

---

## 2. Modul Human Resources

### HR-1 — Absensi & Cuti (bangun penuh) 🔴

Perlu dibuat: service + controller + route + halaman.
Sudah tersedia untuk dipakai langsung: tabel, model, relasi atasan.

Jangan buat absensi kantoran biasa — sesuaikan dengan konteks tambang:

- **Roster/shift & rotasi lapangan** (pola 8:2, 10:4, 14:7). Cuti lapangan berbeda sifatnya dari cuti tahunan
- **Approval berjenjang** memanfaatkan `atasan_langsung_id` yang sudah ada
- **Saldo cuti**: tahunan, besar, sakit, melahirkan, cuti lapangan — dengan carry-over
- **Lembur (overtime)** terpisah dari absensi biasa
- Absensi berbasis **QR/geofence** — pola scanner sudah terbukti di
  `frontend/src/components/inventory/QrCameraScanner.tsx` (`html5-qrcode@2.3.8`), bisa dipakai ulang

### HR-2 — Masa Berlaku Dokumen 🔴

`modules/hr/models/EmployeeDocument.ts` hanya punya `document_type`, `file_name`,
`file_path`, `file_size`, `mime_type`, `uploaded_by`, `description`.
**Tidak ada tanggal kadaluarsa.** Untuk perusahaan tambang ini gap kepatuhan serius.

Tambahkan: `nomor_dokumen`, `tanggal_terbit`, `tanggal_kadaluarsa`, `penerbit`.
Lalu pemindai terjadwal (ikuti pola `shared/utils/scheduler.ts` yang sudah dipakai
asset reminder) dengan peringatan H-90 / H-60 / H-30 untuk:

- Sertifikat K3 Umum, **POP/POM/POU** (Pengawas Operasional Pertama/Madya/Utama)
- **SIO** (Surat Izin Operator alat berat), SIM B2 / B2 Umum
- **MCU** (Medical Check-Up) tahunan, sertifikat rescue / first-aid
- Kartu BPJS, izin kerja khusus

Tanpa ini, seseorang bisa mengoperasikan alat berat dengan SIO kadaluarsa dan sistem diam.

### HR-3 — Peringatan Kontrak Habis 🟠

`modules/hr/models/EmployeeHRInfo.ts` sudah punya `tanggal_akhir_kontrak` tapi
tidak dipakai untuk apa pun. Satu cron job + notifikasi = nilai langsung.
Estimasi: setengah hari.

### HR-4 — Employee Self Service (ESS) 🟠

`modules/auth/models/User.ts` sudah punya `employee_id`. Buka portal terbatas:
lihat & koreksi data diri, ajukan cuti, unggah dokumen pribadi, lihat aset yang
sedang dipegang. Mengurangi beban admin HR secara nyata pada >200 karyawan.

### HR-5 — Bagan Organisasi (Organization Chart) 🟠

`manager_id` + `atasan_langsung_id` sudah tersimpan tapi tidak divisualisasikan.
Bagan baca-saja bisa dibangun **tanpa migrasi apa pun**.

Namun karena bagan ini juga akan **menentukan tingkat approval aplikasi**, cakupannya
jauh lebih besar dari sekadar visualisasi. Desain lengkapnya dipisah ke dokumen
tersendiri:

📄 **`docs/DESAIN-ORG-CHART.md`** — tahapan **ORG-1 .. ORG-6**

Ringkasan hambatan yang ditemukan di sana (semua terverifikasi terhadap kode):

- **Tidak ada level numerik** di `KategoriPangkat` / `Golongan` / `SubGolongan` —
  program tidak bisa tahu GOL-IV di atas GOL-III. Penghalang mutlak bagi approval berjenjang
- `KategoriPangkat` **menggabung Manager & Supervisor** jadi satu level (`KP-002`)
- `SubGolongan` **tidak punya `golongan_id`** — kombinasi GOL-II + SG-VA bisa tersimpan
- `PosisiJabatan.department_id` wajib & tunggal → bukti distorsinya ada di seed:
  `POS-001 Direktur Utama` tercatat di dalam `DEP-001 Recruitment`
- **"Fungsi" belum ada sebagai entitas** — padahal bagan diminta bisa di-custom
  berdasarkan jabatan **dan** fungsi

Usulan intinya: pisahkan tiga lapis — **unit** (sudah ada) / **jenjang**
(`JenjangJabatan` + `level` numerik) / **fungsi** (`Fungsi` lintas department) — lalu
simpan hanya *preset tampilan*, bukan struktur node, agar bagan tidak pernah usang.

---

## 3. Modul Inventory

### INV-1 — Nilai & Valuasi Stok 🔴 (gap terbesar)

Bukan fitur tambahan — **fondasi yang hilang**. Tanpa harga:

- Tidak bisa lapor nilai persediaan
- Tidak bisa hitung nilai aset per departemen
- `realisasi_biaya` work order harus diketik manual
- Analisis ABC / dead stock hanya bicara kuantitas, bukan uang

Usulan:
- `harga_satuan` di `InvTransaksiDetail` (harga pada saat transaksi)
- `harga_rata_rata` di `InvStok` (moving average)
- Laporan valuasi persediaan & nilai aset per departemen

Dashboard velocity yang sudah dirapikan di
`inventory/services/item-velocity.helper.ts` (`computeItemVelocity`,
`flattenVelocityForReport`) tinggal ditambahi kolom nilai.

### INV-2 — Master Supplier + Purchase Order 🔴

`inventory/models/Transaksi.ts` — `supplier_nama: string | null` masih **teks bebas**.
Artinya "PT Sumber Jaya", "Sumber Jaya", dan "sumber jaya" tercatat sebagai tiga vendor berbeda.

Perlu: master supplier, riwayat harga, lead time, penilaian vendor.
Lalu alur **PO → Penerimaan (GRN) → transaksi Masuk** menggantikan input manual.

### INV-3 — Status "Dipinjam" & Jatuh Tempo 🟠

`inventory/models/SerialNumber.ts` — `status: 'Tersedia' | 'Digunakan' | 'Rusak' | 'Disposed'`.
Peminjaman hanya **tersirat** dari `karyawan_id != null` (dashboard menghitungnya
sebagai `asetDipinjam` di `inventory/services/dashboard.service.ts:60-62`).
Tidak ada tanggal pinjam, tanggal jatuh tempo, atau status telat.

Tambahkan status `Dipinjam` + `tanggal_pinjam` + `tanggal_jatuh_tempo` + reminder.

### INV-4 — Serah-Terima & Pemutusan Otomatis 🟠

**Sudah ada (INV-M02):** `hr/services/employee.service.ts:183` —
`getOutstandingAssetCounts(employeeIds)` menghitung `InvSerialNumber` berstatus
`'Digunakan'` per karyawan. Dipakai di dua tempat: badge pada daftar karyawan
(baris 165) dan header profil (baris 247).

**Yang belum ada:** angka itu murni **tampilan** — tidak ada satu pun guard yang
memakainya. Saat `tanggal_berhenti` diisi atau karyawan dinonaktifkan, tidak ada
pemeriksaan apakah yang bersangkutan masih memegang laptop / radio / APD.

Karena penghitungnya sudah jadi, yang perlu dibangun tinggal:
- Guard pada perubahan status/`tanggal_berhenti` → tolak (atau minta konfirmasi
  berjenjang) bila `outstanding_assets_count > 0`
- Alur serah-terima: kembalikan ke gudang, atau alihkan ke karyawan pengganti
- Checklist offboarding lintas modul (aset inventory + penghunian mess di Facility)

### INV-5 — Persetujuan Berjenjang Berbasis Nilai 🟠

`inventory/models/Transaksi.ts` hanya punya satu `approved_by` + `approved_at`
(`approval_status: 'Pending' | 'Approved' | 'Rejected' | 'Voided'`).

Untuk enterprise perlu matriks: nilai < X → supervisor; X–Y → manager; > Y → direktur.

**Bergantung pada dua hal:**
- **INV-1** — harus ada nilai transaksi dulu
- **ORG-1..ORG-5** (`docs/DESAIN-ORG-CHART.md`) — matriks berbasis jenjang tidak bisa
  dijalankan sebelum ada `JenjangJabatan.level` numerik; saat ini pangkat tidak punya
  urutan yang bisa dibandingkan program

### INV-6 — Lot/Batch & Kadaluarsa untuk Consumable 🟡

`Produk.is_consumable` sudah ada, tapi tidak ada lot/expiry. Relevan untuk oli,
cairan kimia, tabung APAR, sarung tangan karet, dan APD bermasa pakai.

### INV-7 — Usulan Pembelian Otomatis (Min-Max) 🟡

Alert stok minimum sudah jalan (`Produk.stok_minimum` + `notification.service.ts`
→ `checkLowStockAndNotify`). Langkah berikutnya: hitung reorder point dari
pemakaian rata-rata × lead time supplier, lalu hasilkan draft PO otomatis.
**Bergantung pada INV-2.**

---

## 4. Facility Management

Modul paling tertinggal — pada dasarnya baru **help desk reaktif**.

### FAC-1 — Preventive Maintenance Terjadwal 🔴

`facility/models/WorkOrder.ts` hanya mendukung alur reaktif:
lapor → kerjakan → tutup (`status: Open/In Progress/Resolved/Closed`).
Tidak ada perawatan berkala — padahal untuk mess, kantor site, dan fasilitas
tambang inilah yang paling penting.

- Jadwal berulang per aset/ruangan: genset bulanan, AC 3-bulanan, pompa,
  hydrant, **inspeksi APAR**, uji instalasi listrik
- Otomatis membuat WO saat jatuh tempo (pakai `shared/utils/scheduler.ts`)
- Berbasis kalender **dan** berbasis meter (jam operasi genset)

### FAC-2 — Konsumsi Sparepart WO → Inventory 🔴

`WorkOrder.estimasi_biaya` & `realisasi_biaya` diketik manual, tidak terhubung ke gudang.
Integrasinya alami: WO menarik barang dari `InvStok` → membuat transaksi `Keluar`
→ biaya terisi otomatis (setelah INV-1 ada).

Ini menyatukan dua modul yang sekarang berdiri sendiri.

### FAC-3 — Lampiran Foto & Bukti 🟠

`WorkOrder` tidak punya lampiran sama sekali. Untuk kerusakan fasilitas,
foto sebelum/sesudah adalah standar minimum. Infrastruktur upload (multer) sudah tersedia
di `shared/middleware/`.

### FAC-4 — SLA & Eskalasi 🟠

`WorkOrder.prioritas` (Low/Medium/High/Critical) tersimpan tapi tidak berkonsekuensi apa pun.
Tetapkan target waktu tanggap/selesai per prioritas + eskalasi otomatis ke atasan
saat terlampaui. Lalu laporan kepatuhan SLA.

### FAC-5 — Pelaporan Mandiri via QR Ruangan 🟠

Tempel QR di tiap ruangan/mess; penghuni pindai → form lapor kerusakan langsung
terisi `room_id`-nya. Komponen scanner sudah terpasang dan terbukti (lihat HR-1).

### FAC-6 — Riwayat Perawatan per Aset 🟡

`facility/models/Asset.ts` sudah melacak penempatan (`tanggal_penempatan` /
`tanggal_penarikan`, `status: Aktif/Ditarik`). Tambahkan riwayat WO per aset →
dasar keputusan "perbaiki atau ganti".

---

## 5. User Access

### UA-1 — Ganti & Reset Password 🔴🔴 MENDESAK

Verifikasi: **tidak ada** endpoint `changePassword`, `resetPassword`, atau `forgot`
di seluruh backend. `modules/auth/services/auth.service.ts` hanya punya
`login(nik, password)` dan private `registerFailedAttempt(nik)`.

Konsekuensi hari ini:
- Pengguna **tidak bisa** mengganti passwordnya sendiri
- Admin **tidak bisa** mereset password pengguna yang lupa
- Satu-satunya jalan adalah UPDATE manual ke database

Ini bukan nice-to-have, ini **cacat operasional**.
Kabar baik: `User.token_version` sudah ada, jadi pencabutan sesi setelah ganti
password tinggal menaikkan angkanya.

### UA-2 — Manajemen Pengguna Lengkap 🔴

`modules/auth/routes/user.routes.ts` hanya menyediakan tiga endpoint:

```
GET  /users
PUT  /users/:id/role
PUT  /users/:id/status
```

**Tidak ada create dan tidak ada delete.** Onboarding pengguna baru tidak bisa
dilakukan lewat aplikasi. Perlu: buat akun dari data karyawan, nonaktifkan,
hapus (soft delete).

**Tambahan (29 Juli 2026): tidak ada cara menautkan akun ke karyawan.**
`users.employee_id` tidak bisa diatur dari mana pun — bukan lewat UI, bukan lewat
API. `UserManagementPage.tsx:116` hanya **menampilkan** `user.employee?.nama_lengkap`
sebagai teks; `user.controller.ts` menerima `role_id` dan `is_active` saja. Satu-satunya
tempat akun dibuat adalah script seed dan file test.

Akibatnya dua role tidak berfungsi tanpa tautan itu:

| Role | Tempat | Perilaku bila `employee_id` NULL |
|---|---|---|
| `employee` | `permission.middleware.ts:89` | tidak ada record yang cocok → 403 pada data dirinya sendiri |
| `manager` | `permission.service.ts:68` | `if (!user.employee) return false` → tidak bisa akses siapa pun |

`superadmin`/`admin`/`staff` tidak terpengaruh (`permission.service.ts:62` langsung
`return true`). Karena itu setelah reset data 29 Juli 2026 tidak ada dampak nyata —
kedua akun yang tersisa adalah superadmin. Masalah baru muncul saat akun ber-role
`employee`/`manager` dibutuhkan, dan **itu prasyarat HR-4 (ESS)**.

Untuk kebutuhan mendesak sebelum fitur ini ada, tautan bisa dibuat manual:
`UPDATE users SET employee_id = <id> WHERE nik = '<nik>';`

> **Keputusan user 29 Juli 2026:** UA-2 dikerjakan **setelah** pengujian input dan
> transaksi Inventory serta Facility Management selesai.

### UA-3 — Audit Log untuk Kejadian Autentikasi 🟠

Infrastruktur `audit_logs` sudah ada dan dipakai untuk CRUD data, tapi
**login, gagal login, logout, dan perubahan hak akses tidak dicatat**.
Untuk audit enterprise, justru inilah yang pertama ditanyakan auditor.

### UA-4 — Lockout Berbasis Redis (item audit D-6) 🟠

`registerFailedAttempt` sekarang in-memory: hilang saat restart dan tidak berlaku
lintas instance. **Terblokir sampai A3 selesai** (Redis masih stub no-op).

### UA-5 — 2FA untuk Peran Istimewa 🟠

Wajibkan TOTP untuk superadmin dan approver bernilai besar. Tidak perlu untuk
semua orang — cukup untuk peran yang bisa menyetujui uang atau mengubah hak akses.

### UA-6 — Delegasi Wewenang 🟠

Sangat spesifik untuk tambang: approver bisa berada di site tanpa sinyal selama
2 minggu (rotasi). Perlu mekanisme "delegasikan persetujuan saya ke X sampai
tanggal Y" agar operasional tidak macet. Bergantung juga pada A2.

### UA-7 — Kebijakan Password & Manajemen Sesi 🟡

Panjang minimum, kompleksitas, masa berlaku, larangan pakai ulang.
Plus daftar sesi aktif + tombol "keluarkan semua perangkat" (mudah, karena
`token_version` sudah ada).

### UA-8 — Batas Nilai pada Izin Approve 🟡

`ACTIONS.APPROVE` di `shared/constants/permissions.ts` saat ini biner: bisa atau
tidak bisa. Perlu berbatas nilai — pasangan dari INV-5 dan **ORG-5**
(`docs/DESAIN-ORG-CHART.md`).

---

## Urutan Kerja yang Disarankan

### Segera — menutup cacat
1. **UA-1** ganti/reset password — cacat operasional, effort kecil
2. **UA-2** create/delete user — melengkapi yang sama
3. **HR-3** peringatan kontrak habis — data sudah ada, tinggal cron

### Gelombang 1 — nilai terbesar
4. **A1 / HR-1** Absensi & Cuti penuh — fondasi 30% sudah terbayar
5. **A2** kanal notifikasi email/WA — pengganda nilai untuk semua fitur di atas
6. **HR-2** masa berlaku dokumen — kepatuhan K3 / SIO / MCU

### Gelombang 2 — fondasi enterprise
7. **INV-1** nilai & valuasi — membuka INV-5, INV-7, FAC-2
8. **INV-2** master supplier + PO
9. **FAC-1** preventive maintenance
10. **FAC-2** sparepart WO ↔ inventory

### Pre-produksi
- **A3** Redis nyata → membuka **UA-4**
- **UA-3** audit log autentikasi

---

## Peta Ketergantungan

```
A3 (Redis)  ────────────────►  UA-4 (lockout persisten)

ORG-1..ORG-4 (bagan organisasi)  ──►  ORG-5 (mesin approval)  ─┬──►  INV-5
                                              ▲                 └──►  UA-8
INV-1 (nilai)  ─┬─────────────────────────────┘
                ├──────────►  FAC-2 (biaya sparepart WO)
                └──────────►  A5   (laporan bernilai)

INV-2 (supplier) ──────────►  INV-7 (usulan pembelian otomatis)

A2 (notifikasi) ─┬─────────►  HR-2 (peringatan dokumen)
                 ├─────────►  HR-3 (peringatan kontrak)
                 ├─────────►  INV-3 (reminder jatuh tempo pinjam)
                 ├─────────►  FAC-4 (eskalasi SLA)
                 └─────────►  UA-6 (delegasi wewenang)

HR-1 (cuti) ─────┬─────────►  HR-4 (ESS: pengajuan cuti mandiri)
                 └─────────►  ORG-5 (approval cuti berjenjang)
```

> Rincian ORG-1..ORG-6 ada di **`docs/DESAIN-ORG-CHART.md`**.

---

## Item Audit Lama yang Masih Terbuka

Bukan bagian dari roadmap fitur, tapi relevan untuk pre-produksi.
Detail lengkap ada di `AUDIT-REPORT-FINAL.md`.

| Kode | Item | Status |
|---|---|---|
| **D-6** | Brute-force lockout in-memory → Redis | Terblokir (Redis stub) — lihat A3/UA-4 |
| **E-4** | N+1 generasi tag/serial dalam loop | Ditunda; kerjakan bila ada bukti lambat via EXPLAIN |
| **E-6** | Include profil karyawan ±13 join | Ditunda; sama seperti di atas |
| **D-10** | Access token dikembalikan di body login/refresh | Perlu audit alur login frontend lebih dulu |
| **TD-6** | Import per-baris savepoint + export streaming | Refaktor besar; PR tersendiri |
