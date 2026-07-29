# DESAIN — ORGANIZATION CHART & APPROVAL BERJENJANG

**Disusun:** 29 Juli 2026
**Status:** Rekomendasi desain — belum dikerjakan. Implementasi dimulai setelah pengujian modul Inventory & modul lain selesai.
**Skala sasaran:** ±500 karyawan, beberapa fungsi & department, multi-site.
**Konteks target:** perusahaan pertambangan & industri umum, kelas enterprise.

> Semua temuan di dokumen ini **diverifikasi langsung terhadap kode dan data seed**
> (`backend/src/modules/hr/models/`, `backend/src/database/seed-complete.ts`), bukan asumsi.
>
> Dokumen ini adalah pendalaman dari **HR-5** di `ROADMAP-FITUR.md`, dan menjadi
> prasyarat desain bagi **INV-5** (approval berjenjang berbasis nilai) dan
> **UA-8** (batas nilai pada izin approve).

---

## 1. Kondisi Saat Ini — Apa yang Sudah Ada

Struktur master data HR sudah hierarkis tiga tingkat:

```
Divisi  ──< Department (divisi_id)  ──< PosisiJabatan (department_id)
                  │
                  └─ manager_id ──> Employee
```

`Employee` sudah menyimpan seluruh kaitan yang dibutuhkan sebuah bagan organisasi:

| Field | Isi |
|---|---|
| `divisi_id`, `department_id`, `posisi_jabatan_id` | penempatan struktural |
| `atasan_langsung_id` | atasan langsung |
| `manager_id` | atasan kedua (semantik belum ditetapkan) |
| `lokasi_kerja_id` | site — `LokasiKerja` punya `kode_site` |
| `status_karyawan_id`, `tag_id` | status & penanda |
| `foto_karyawan`, `nama_lengkap`, `nomor_induk_karyawan` | atribut tampilan node |
| `is_draft` | penanda data belum final (harus difilter dari chart) |

Asosiasi terkait ada di `modules/hr/models/associations.ts`:

```
49-50  Department  ↔ Divisi          (divisi_id)
52-53  PosisiJabatan ↔ Department    (department_id)
54     Department.manager_id → Employee
74     Employee.belongsTo(Employee, as 'manager')            (manager_id)
75     Employee.belongsTo(Employee, as 'atasan_langsung')    (atasan_langsung_id)
76     Employee.hasMany(Employee,  as 'managed_employees')   (manager_id)
77     Employee.hasMany(Employee,  as 'directed_employees')  (atasan_langsung_id)
```

Pangkat tersimpan di `EmployeeHRInfo`: `kategori_pangkat_id`, `golongan_pangkat_id`,
`sub_golongan_pangkat_id`.

**Kesimpulan:** modal awalnya baik. Bagan organisasi baca-saja bisa dibangun tanpa
migrasi apa pun. Yang **tidak bisa** dibangun tanpa perubahan adalah *approval berjenjang* —
penyebabnya di bawah.

---

## 2. Lima Hambatan yang Harus Dibereskan Dulu

### ⛔ H-1 — Tidak ada level numerik di mana pun

`KategoriPangkat`, `Golongan`, dan `SubGolongan` **hanya punya `code`, `nama`,
`keterangan`, `status`**. Tidak ada kolom urutan/level.

```
KategoriPangkat : KP-001 Eksekutif · KP-002 Managerial · KP-003 Staff · KP-004 Non-Staff
Golongan        : GOL-I .. GOL-V
SubGolongan     : IA, IB, IIA, IIB, IIIA, IIIB, IVA, IVB, VA, VB
```

Manusia tahu GOL-IV di atas GOL-III. **Program tidak.** Urutan hanya tersirat dari
angka Romawi di dalam string `nama` — rapuh dan tidak bisa dibandingkan.

Untuk approval berjenjang ini **penghalang mutlak**: mesin approval harus bisa menjawab
"apakah orang ini cukup tinggi untuk menyetujui?" dan itu butuh perbandingan numerik.

### ⛔ H-2 — `KategoriPangkat` terlalu kasar untuk approval

Keterangan seed-nya sendiri sudah mengakui:
`KP-002 Managerial — "Level Manager dan Supervisor"`.

Manager dan Supervisor **digabung jadi satu level**, padahal justru di antara keduanyalah
batas wewenang persetujuan paling sering ditarik. Tidak bisa dipakai apa adanya.

### ⛔ H-3 — `SubGolongan` tidak punya relasi ke `Golongan`

`SG-IVA` secara logika adalah anak dari `GOL-IV`, tapi tidak ada `golongan_id`.
Akibatnya kombinasi tidak valid seperti `GOL-II` + `SG-VA` bisa tersimpan tanpa protes.

### ⛔ H-4 — `PosisiJabatan` terkunci ke satu department

`PosisiJabatan.department_id` wajib dan tunggal. Dua masalah:

**Duplikasi.** "Safety Officer" yang ada di Produksi, Maintenance, dan Hauling harus
dibuat tiga kali sebagai tiga baris `PosisiJabatan` berbeda.

**Distorsi bagan — dan buktinya sudah ada di seed:**

```
POS-001  Direktur Utama  →  dept_code: 'DEP-001'  (Recruitment, DIV-001 SDM & Umum)
```

Direktur Utama tercatat berada **di dalam Departemen Rekrutmen**. Itu bukan kesalahan
input, melainkan gejala model yang memaksa setiap jabatan menempel ke satu department —
padahal jabatan puncak tidak berada di department mana pun. Bagan yang diturunkan murni
dari `department_id` akan selalu salah di puncaknya.

### ⛔ H-5 — `manager_id` vs `atasan_langsung_id`: dua field, satu makna

Keduanya ada dan keduanya menunjuk ke `Employee`. Di seed hanya `manager_nik` yang
diisi. Tanpa definisi tegas, mesin approval tidak tahu harus mengikuti yang mana.

**Ini justru peluang** — dipakai di §3.3 untuk memisahkan garis solid & dotted.

### Catatan tambahan

- **`Divisi` flat** — tidak ada `parent_id`. Tidak ada tingkat Direktorat di atas Divisi.
- **"Fungsi" tidak ada sebagai entitas.** `Divisi` adalah yang paling mendekati, tapi
  sudah dipakai sebagai pengelompok struktural.

---

## 3. Rekomendasi Inti — Pisahkan Tiga Lapis

Permintaan "custom berdasarkan **jabatan** dan **fungsi**" pada dasarnya adalah
**organisasi matriks**. Kuncinya: jangan campur tiga hal berbeda ke dalam satu pohon.

```
Lapis 1 — UNIT     : di mana orang ditempatkan   (Divisi → Department)  ✅ sudah ada
Lapis 2 — JENJANG  : seberapa tinggi wewenangnya (job grade + level)    ❌ belum ada
Lapis 3 — FUNGSI   : keahlian profesionalnya     (job family)           ❌ belum ada
```

Satu karyawan = 1 unit + 1 jenjang + 1 fungsi. Dari tiga koordinat ini **semua bentuk
bagan bisa diturunkan** tanpa memelihara pohon terpisah.

### 3.1 — Master data baru: `JenjangJabatan` (job grade)

Mengambil peran penentu wewenang. `KategoriPangkat` **tetap dipakai** untuk
payroll/tunjangan — jangan dihapus, fungsinya memang beda.

| Kode | Nama | `level` | Contoh dari data yang ada | Contoh tambahan (tambang) |
|---|---|---:|---|---|
| JG-01 | Direktur | **90** | Direktur Utama *(POS-001)* | Direktur Operasi |
| JG-02 | General Manager | **80** | — | GM Site, GM Operations |
| JG-03 | Manager | **70** | HR Manager *(POS-002)*, IT Manager *(POS-006)*, Production Manager *(POS-012)*, Finance Manager *(POS-015)* | Mine Manager (KTT) |
| JG-04 | Superintendent | **60** | — | Superintendent Maintenance |
| JG-05 | Supervisor | **50** | — | Supervisor Hauling, Supervisor HSE |
| JG-06 | Foreman / Leader | **40** | — | Foreman Pit, Group Leader |
| JG-07 | Senior Staff | **30** | Network Engineer *(POS-007)*, System Administrator *(POS-008)* | Senior Mine Engineer |
| JG-08 | Staff | **20** | Recruiter *(POS-003)*, Accountant *(POS-016)*, QC Inspector *(POS-014)*, Legal Officer *(POS-018)* | Safety Officer, Admin Logistik |
| JG-09 | Operator / Teknisi | **10** | Operator Produksi *(POS-013)*, IT Helpdesk *(POS-011)* | Operator Alat Berat, Driver HD |

> **Kenapa loncat 10, bukan 1–9?** Supaya bisa menyisipkan jenjang baru di tengah
> (mis. "Assistant Manager" = 65) tanpa menomori ulang seluruh tabel dan merusak
> matriks approval yang sudah berjalan.

**Perubahan skema:** `PosisiJabatan.jenjang_id` → `JenjangJabatan`.

### 3.2 — Master data baru: `Fungsi` (job family)

Lintas department. Inilah yang menjawab permintaan "bagan berdasarkan fungsi".

| Kode | Fungsi | Department yang tercakup (seed saat ini + tambang) |
|---|---|---|
| FN-01 | Operations / Produksi | Produksi *(DEP-007)*, Hauling, Pit Control |
| FN-02 | Maintenance / Plant | Plant, Workshop, Tyre |
| FN-03 | **HSE** | tersebar di **semua** department |
| FN-04 | Engineering & Geology | Mine Engineering, Survey, Geologi |
| FN-05 | Supply Chain & Logistik | Warehouse, Procurement, Fuel |
| FN-06 | Finance & Accounting | Finance *(DEP-009)*, Accounting *(DEP-010)* |
| FN-07 | Human Capital & GA | Recruitment *(DEP-001)*, Training *(DEP-002)*, General Affairs *(DEP-003)* |
| FN-08 | Information Technology | IT Infrastructure *(DEP-004)*, Software Dev *(DEP-005)*, IT Support *(DEP-006)* |
| FN-09 | Legal, Permit & External | Legal *(DEP-012)* |

**Kenapa ini bukan kosmetik:** Safety Officer di Departemen Produksi dan Safety Officer
di Departemen Maintenance adalah **fungsi yang sama (HSE)** meski department berbeda.
Tanpa lapis Fungsi:

- Bagan tidak bisa menampilkan "seluruh tim HSE di perusahaan"
- Dan lebih penting — permintaan APD/safety akan naik ke **Production Manager**, bukan ke
  **HSE Manager**. Secara tata kelola K3 itu salah.

**Perubahan skema:** `Employee.fungsi_id` (disarankan di `Employee`, bukan di
`PosisiJabatan`, karena orang bisa dipinjamkan lintas fungsi).

### 3.3 — Tegaskan makna dua field atasan

Gratis — tanpa migrasi. Cukup keputusan + dokumentasi + validasi.

| Field | Makna | Garis di bagan | Peran dalam approval |
|---|---|---|---|
| `atasan_langsung_id` | Atasan **struktural** (administratif) | **──── solid** | **Jalur utama** approval |
| `manager_id` | Atasan **fungsional** (matriks) | ┈┈┈┈ putus-putus | Jalur khusus: HSE, mutu, teknis |

Contoh: Safety Officer di Site Bekasi → `atasan_langsung_id` = Production Manager site
tersebut (solid, urusan harian); `manager_id` = HSE Manager pusat (dotted, standar K3).

> ⚠️ Sebelum menetapkan ini, **periksa dulu bagaimana kedua field dipakai di data
> produksi**, karena di seed hanya satu yang terisi.

### 3.4 — Perbaikan kecil yang sebaiknya sekalian

| Perubahan | Alasan |
|---|---|
| `SubGolongan.golongan_id` | Menutup H-3; mencegah kombinasi GOL-II + SG-VA |
| `level` pada `KategoriPangkat`, `Golongan`, `SubGolongan` | Konsistensi & berguna untuk payroll, walau approval memakai `JenjangJabatan` |
| `Divisi.parent_id` | Divisi kini flat; 500 orang multi-site butuh >2 tingkat (Direktorat → Divisi → Department → Seksi) |
| `PosisiJabatan.department_id` boleh `NULL` | Menutup H-4; Direktur Utama tidak harus "milik" Departemen Rekrutmen |

---

## 4. Model Bagan yang Bisa Di-custom

**Rekomendasi paling penting di dokumen ini:**

> **Jangan simpan struktur bagan sebagai tabel node.**

Dengan 500 karyawan yang mutasi, promosi, dan resign, bagan tersimpan akan usang dalam
hitungan minggu dan akan muncul dua sumber kebenaran yang saling bertentangan.

**Sebagai gantinya:** simpan hanya **preset tampilan**, lalu turunkan bagan dari data
karyawan setiap kali dirender.

```ts
// tabel: org_chart_view
{
  nama: "Struktur Operasional — Site Bekasi",
  mode: "struktural" | "fungsional" | "matrix" | "jenjang",
  akar: { tipe: "divisi" | "department" | "fungsi" | "karyawan", id: 3 },
  filter: {
    lokasi_kerja_id: 2,          // LOK-002 Site Bekasi
    status_karyawan_id: 1,       // SK-001 Aktif saja
    jenjang_level_min: 40        // sembunyikan di bawah Foreman
  },
  kelompok_per: "department" | "fungsi" | "lokasi_kerja",
  tampilkan_posisi_kosong: true,   // posisi lowong
  tampilkan_garis_fungsional: true // garis dotted
}
```

Empat mode yang disarankan:

| Mode | Disusun dari | Untuk apa |
|---|---|---|
| **Struktural** | `atasan_langsung_id` | Bagan resmi — inilah yang dipakai approval |
| **Fungsional** | `fungsi_id` + `manager_id` | "Tampilkan seluruh tim HSE lintas site" |
| **Matrix** | keduanya (solid + dotted) | Melihat tumpang tindih kewenangan |
| **Jenjang** | `JenjangJabatan.level` | Piramida organisasi; deteksi struktur gemuk/timpang |

Ditambah filter `lokasi_kerja_id`, satu sumber data ini melayani semua kebutuhan tanpa
duplikasi pemeliharaan.

---

## 5. Bagaimana Bagan Menentukan Approval

Approval ditentukan oleh **dua hal terpisah** — sering dicampur, dan itu sumber kekacauan:

```
SIAPA  yang dilewati    →  dari atasan_langsung_id (jalur di bagan)
SAMPAI di mana berhenti →  dari JenjangJabatan.level vs nilai transaksi
```

### 5.1 Matriks wewenang (pasangan INV-5)

| Nilai transaksi | Approver minimum | `level` |
|---|---|---:|
| ≤ Rp 5 juta | Supervisor | 50 |
| Rp 5 – 50 juta | Manager | 70 |
| Rp 50 – 500 juta | General Manager | 80 |
| > Rp 500 juta | Direktur | 90 |

Bisa dibuat per-modul: pengajuan cuti memakai matriks lain (berbasis jumlah hari,
bukan rupiah).

### 5.2 Contoh terjalan memakai data seed

**Kasus A — Wahyu Hidayat mengajukan permintaan barang Rp 8 juta**

```
Wahyu Hidayat (EMP-012)
  Operator Produksi (POS-013)  →  JG-09, level 10
  Dept Produksi (DEP-007) · Site Bekasi (LOK-002)
  manager_nik: EMP-005
        │
        ▼  telusur ke atas
Rizky Ramadhan Putra (EMP-005)
  Production Manager (POS-012)  →  JG-03, level 70
  Dept Produksi (DEP-007) · Site Bekasi (LOK-002)
        │
        ▼  level 70 ≥ 70  ✅ CUKUP — berhenti di sini
```

**Hasil:** approver = Rizky Ramadhan Putra. Satu tingkat.

**Kasus B — permintaan yang sama, tapi Rp 120 juta** (butuh level 80)

```
Wahyu (10) → Rizky (70) → ???
                            └─ atasan_langsung_id Rizky KOSONG di seed
```

**Rantai putus.** Ini akan terjadi berulang kali pada 500 karyawan dan harus ditangani
sejak desain — bukan ditambal belakangan.

**Aturan fallback berjenjang yang direkomendasikan:**

```
1. atasan_langsung_id                       (jalur normal)
2. bila kosong → Department.manager_id
3. bila kosong → manajer Divisi induk
4. bila kosong → pemegang jenjang tertinggi di lokasi_kerja yang sama
5. bila tetap kosong → tandai "rantai approval tidak lengkap"
                       + notifikasi ke HR — JANGAN diam-diam auto-approve
```

Langkah 5 penting: kegagalan harus **terlihat**, bukan tersembunyi.

**Kasus C — jalur struktural penuh yang sehat** (referensi bentuk yang benar)

```
Ahmad Surya Wijaya (EMP-001) · Direktur Utama (POS-001) · JG-01 level 90
  KP-001 Eksekutif / GOL-V / SG-VA · tanpa atasan
        │
        ├── Siti Nurhaliza Rahman (EMP-002) · HR Manager (POS-002) · JG-03 level 70
        │      KP-002 Managerial / GOL-IV / SG-IVA
        │        ├── Andi Firmansyah (EMP-006) · Recruiter (POS-003) · JG-08 level 20
        │        │      KP-003 Staff / GOL-II / SG-IIB
        │        └── Putri Ayu Lestari (EMP-007) · Training Officer (POS-004)
        │
        ├── Bambang Prasetyo (EMP-003) · IT Manager (POS-006) · JG-03 level 70
        │      KP-002 Managerial / GOL-IV / SG-IVB
        │        └── EMP-008, EMP-009, EMP-010, EMP-011  (manager_nik: EMP-003)
        │
        ├── Dewi Kartika Sari (EMP-004) · Finance Manager (POS-015) · JG-03 level 70
        │
        └── Rizky Ramadhan Putra (EMP-005) · Production Manager (POS-012) · JG-03 level 70
               Site Bekasi (LOK-002) · KP-002 / GOL-III / SG-IIIB
                 └── Wahyu Hidayat (EMP-012) · Operator Produksi (POS-013) · JG-09 level 10
```

### 5.3 Kasus khusus yang wajib ditangani sejak awal

| Kasus | Contoh | Penanganan |
|---|---|---|
| **Rantai putus** | Rizky tanpa atasan | Fallback 5 langkah di §5.2 |
| **Siklus** | A atasan B, B atasan A | Batas kedalaman telusur (mis. 10) + deteksi node berulang |
| **Pemohon = approver** | Siti (HR Manager) mengajukan sendiri | Lewati dirinya, naik ke atasnya |
| **Approver nonaktif** | Atasan sudah resign (`SK-002`) | Filter `status_karyawan_id` = Aktif, lanjut naik |
| **Jalur fungsional** | Permintaan APD | Naik lewat `fungsi_id = FN-03 HSE`, bukan jalur struktural |
| **Beda site** | Barang Site Bekasi | Batasi approver pada `lokasi_kerja_id` sama, kecuali level ≥ 80 |
| **Approver di lapangan** | Rotasi 14:7, tanpa sinyal | Delegasi wewenang — **UA-6** |
| **Nilai belum ada** | — | ⚠️ Matriks rupiah **butuh INV-1** (harga) lebih dulu |

> **Ketergantungan penting:** matriks approval berbasis nilai tidak bisa jalan sampai
> **INV-1 (harga & valuasi)** selesai. Sebelum itu, approval hanya bisa berbasis jenjang
> dan jenis transaksi.

---

## 6. Catatan Teknis untuk Skala 500 Karyawan

**Penelusuran rantai atasan — satu query, bukan loop.**
PostgreSQL `WITH RECURSIVE` menelusuri seluruh rantai sekali jalan. Loop `findByPk`
per tingkat = 5–8 query per permintaan approval, dan akan terasa saat ratusan transaksi
per hari.

**Render bagan — jangan 500 node sekaligus.**
Muat per cabang (lazy expand) + virtualisasi. Default: tampilkan sampai 2 tingkat di
bawah akar. Selalu filter `is_draft = false` dan `status_karyawan_id` = Aktif (SK-001).

**Cache dengan invalidasi yang tepat.**
Simpan hasil resolusi rantai; hapus cache saat `atasan_langsung_id`, `posisi_jabatan_id`,
atau `status_karyawan_id` berubah. Cache nyata butuh **A3 — Redis** (sekarang stub no-op).

**Simpan jejak approval, bukan hanya hasilnya.**
Saat transaksi disetujui, catat *snapshot* rantai yang berlaku saat itu. Tanpa itu,
audit 6 bulan kemudian tidak bisa menjelaskan mengapa orang tertentu yang menyetujui —
karena strukturnya sudah berubah.

**Kaitan ke RBAC.**
Bagan menentukan **siapa** approver-nya; `checkPermission(RESOURCE, ACTIONS.APPROVE)`
tetap menentukan **boleh tidaknya** mengakses fitur. Keduanya harus dicek — jangan
salah satu saja. Lihat `shared/constants/permissions.ts`.

**Data historis.**
Bagan periode lampau perlu membaca karyawan yang sudah di-soft-delete → gunakan
`paranoid: false` untuk pembacaan historis (pola yang sama sudah dipakai lintas modul).

---

## 7. Urutan Pengerjaan

| Tahap | Kode | Isi | Hasil |
|---|---|---|---|
| 1 | **ORG-1** | `JenjangJabatan` + `level`; `Fungsi`; `PosisiJabatan.jenjang_id` & longgarkan `department_id`; `Employee.fungsi_id`; `SubGolongan.golongan_id`; `Divisi.parent_id` | Data siap; belum ada UI |
| 2 | **ORG-2** | Pemetaan data: 18 posisi & ±500 karyawan → jenjang + fungsi; **isi `atasan_langsung_id` yang masih kosong** | Rantai atasan lengkap & terverifikasi |
| 3 | **ORG-3** | Bagan baca-saja: mode struktural, lazy-load, filter site/status | Menu Organization Chart pertama |
| 4 | **ORG-4** | `org_chart_view`; mode fungsional/matrix/jenjang; ekspor PDF/PNG | Bagan bisa di-custom |
| 5 | **ORG-5** | Mesin approval: recursive CTE + matriks wewenang + fallback + deteksi siklus + snapshot jejak | Bagan mengendalikan approval |
| 6 | **ORG-6** | Delegasi (UA-6), jalur fungsional HSE, matriks per-modul | Siap operasional |

> **ORG-2 adalah risiko terbesar — dan itu bukan risiko teknis.**
> Rantai `atasan_langsung_id` untuk 500 orang harus diverifikasi manusia bersama HR.
> Bagan yang bagus di atas data atasan yang salah akan menyalurkan approval ke orang
> yang keliru, dengan tampilan yang meyakinkan.

### Peta ketergantungan

```
ORG-1 (master data) ──► ORG-2 (pemetaan) ──► ORG-3 (bagan) ──► ORG-4 (preset & mode)
                                                                     │
                                                                     ▼
INV-1 (nilai) ─────────────────────────────────────────────────► ORG-5 (mesin approval)
                                                                     │
A3 (Redis) ────► cache rantai                                        ├──► INV-5
                                                                     ├──► UA-8
A2 (notifikasi) ────────────────────────────────────────────────────►└──► ORG-6 / UA-6
```

---

## 8. Keputusan yang Perlu Diambil Sebelum Implementasi

Tiga hal berikut menentukan bentuk implementasi dan hanya bisa diputuskan oleh pemilik
proses bisnis. Rekomendasi default disertakan.

1. **`Fungsi` — master data baru, atau pakai `Divisi` yang sudah ada?**
   *Rekomendasi: master data baru.* `Divisi` sudah dipakai sebagai pengelompok
   struktural; menumpuk dua makna di satu tabel akan menyulitkan begitu ada karyawan
   yang struktur dan fungsinya berbeda.

2. **`atasan_langsung_id` = solid, `manager_id` = dotted — setuju?**
   *Rekomendasi: ya*, dengan syarat memeriksa dulu pemakaian kedua field di data
   produksi (di seed hanya satu yang terisi).

3. **Approval melewati semua orang di rantai, atau cukup yang pertama memenuhi level?**
   *Rekomendasi: cukup yang pertama memenuhi* (lebih cepat, lebih sedikit macet),
   dengan opsi "wajib lewat atasan langsung" untuk jenis transaksi tertentu.
