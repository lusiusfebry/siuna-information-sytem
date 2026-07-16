# Identifikasi Field Profil Karyawan yang Belum Ada / Tidak Sinkron

Berdasarkan perbandingan antara dokumen perencanaan `planning/02_modul_hr_v2.md` dengan implementasi saat ini (Backend Model, Frontend Types, dan UI Components), berikut adalah identifikasinya:

## 1. Field yang Ada di Database/Model tapi Belum Ada di UI Form (Wizard/Edit)
Beberapa field sudah tersedia di skema database dan model, namun belum diimplementasikan sebagai input di form pembuatan karyawan:

| Group (Planning) | Nama Field | Status di UI Form |
| :--- | :--- | :--- |
| **Identifikasi** | `no_nik_kk` | ❌ Missing |
| **Identifikasi** | `status_pajak` | ❌ Missing |
| **Informasi Kontak** | `nomor_telepon_rumah_2` | ❌ Missing |
| **Status Pernikahan** | `tanggal_cerai` | ❌ Missing |
| **Status Pernikahan** | `tanggal_wafat_pasangan` | ❌ Missing |
| **Pangkat & Golongan** | `no_dana_pensiun` | ❌ Missing (Di UI Form HR) |

## 2. Ketidaksinkronan Tampilan (UI Detail vs Planning)
Field yang ada di data tapi tampilannya belum sepenuhnya sesuai dengan grouping di planning:

| Group (Planning) | Nama Field | Catatan |
| :--- | :--- | :--- |
| **Informasi Kontak** | `nomor_handphone_1` | Planning minta ditampilkan sebagai referensi dari head, saat ini hanya `nomor_handphone` di bagian head yang tampil. |
| **Pasangan & Anak** | `pekerjaan_pasangan` | Di planning ada di Tab Family, di UI tampil di Tab Personal (sesuai letak di model `EmployeePersonalInfo`). |

## 3. Sinkronisasi Data Keluarga (Tab Informasi Keluarga)
Secara umum, Tab Informasi Keluarga sudah selaras dengan model `EmployeeFamilyInfo` dan `JSONB` data (anak & saudara), namun perlu dipastikan semua repeatable fields tampil di Detail Page (saat ini Detail Page baru menampilkan ringkasan/sebagian).

## 4. Kesimpulan Missing Secara Total (Database + UI)
**HAMPIR SEMUA** field yang diminta di planning sudah tersedia di tingkat Database (Sequelize Models) dan Typescript Types. Kekurangan utama ada pada:
- **Input Form (Wizard Step 1)**: Field identifikasi (`no_nik_kk`, `status_pajak`) dan detail status pernikahan (`tanggal_cerai`, dsb).
- **Detail View**: Penyesuaian layout agar benar-benar persis mengikuti grouping di dokumen planning.

---
*Catatan: Field `nomor_wa`, `akun_sosmed`, dan `kode_pos` baru saja ditambahkan dalam task sebelumnya sehingga sudah sinkron.*
