---

# Modul: Human Resources

## 1. Master Data

### Divisi
- **nama divisi**: Teks
- **keterangan**: Teks
- **status**: Pilihan (Aktif/Tidak Aktif), default: `Aktif`

### Department
- **nama departmen**: Teks
- **nama manager**: Pilihan (diambil dari data karyawan yang berstatus aktif, bisa dikosongkan)
- **divisi**: Pilihan (diambil dari master divisi yang berstatus aktif)
- **keterangan**: Teks
- **status**: Pilihan (Aktif/Tidak Aktif), default: `Aktif`

### Posisi Jabatan
- **nama posisi jabatan**: Teks
- **department**: Pilihan (diambil dari master department yang berstatus aktif)
- **keterangan**: Teks
- **status**: Pilihan (Aktif/Tidak Aktif), default: `Aktif`

### Kategori Pangkat
- **nama kategori pangkat**: Teks
- **keterangan**: Teks
- **status**: Pilihan (Aktif/Tidak Aktif), default: `Aktif`

### Golongan
- **nama golongan**: Teks
- **keterangan**: Teks
- **status**: Pilihan (Aktif/Tidak Aktif), default: `Aktif`

### Sub Golongan
- **nama sub golongan**: Teks
- **keterangan**: Teks
- **status**: Pilihan (Aktif/Tidak Aktif), default: `Aktif`

### Jenis Hubungan Kerja
- **nama jenis hubungan kerja**: Teks
- **keterangan**: Teks
- **status**: Pilihan (Aktif/Tidak Aktif), default: `Aktif`

### Tag
- **nama tag**: Teks
- **warna tag**: Pilihan Warna
- **keterangan**: Teks
- **status**: Pilihan (Aktif/Tidak Aktif), default: `Aktif`

### Lokasi Kerja
- **nama lokasi kerja**: Teks
- **alamat**: Teks
- **keterangan**: Teks
- **status**: Pilihan (Aktif/Tidak Aktif), default: `Aktif`

### Status Karyawan
- **nama status**: Teks
- **keterangan**: Teks
- **status**: Pilihan (Aktif/Tidak Aktif), default: `Aktif`

---

## 2. Manajemen Karyawan

### Profil Karyawan

#### Bagian Head
- **foto_karyawan**: Unggah File (Gambar)
- **nama_lengkap**: Teks (Wajib diisi)
- **nomor_induk_karyawan**: Teks (Wajib diisi)
- **divisi**: Pilihan (dari master divisi yang aktif)
- **department**: Pilihan (dari master department yang aktif)
- **manager**: Pilihan (dari data karyawan aktif dengan posisi jabatan "head")
- **atasan_langsung**: Pilihan (dari data karyawan yang aktif)
- **posisi_jabatan**: Pilihan (dari master posisi jabatan yang aktif)
- **email_perusahaan**: Teks (Email, tidak wajib)
- **nomor_handphone**: Teks (Nomor Telepon)
- **status_karyawan**: Pilihan (dari master status karyawan)
- **lokasi_kerja**: Pilihan (dari master lokasi kerja)
- **tag**: Pilihan (dari master tag)

#### Bagian Detail (Tabs)

##### Tab: Personal Information

- **Group: Biodata Karyawan**
  - **nama_lengkap**: Teks (Referensi dari `head.nama_lengkap`)
  - **jenis_kelamin**: Pilihan (Laki-laki/Perempuan)
  - **tempat_lahir**: Teks
  - **tanggal_lahir**: Tanggal
  - **email_pribadi**: Teks (Email)

- **Group: Identifikasi**
  - **agama**: Pilihan
  - **golongan_darah**: Pilihan (A/B/AB/O)
  - **nomor_kartu_keluarga**: Teks
  - **nomor_ktp**: Teks
  - **nomor_npwp**: Teks
  - **nomor_bpjs**: Teks
  - **no_nik_kk**: Teks
  - **status_pajak**: Teks

- **Group: Alamat Domisili**
  - **alamat_domisili**: Teks Area
  - **kota_domisili**: Teks
  - **provinsi_domisili**: Teks

- **Group: Alamat KTP**
  - **alamat_ktp**: Teks Area
  - **kota_ktp**: Teks
  - **provinsi_ktp**: Teks

- **Group: Informasi Kontak**
  - **nomor_handphone_1**: Teks (Referensi dari `head.nomor_handphone`)
  - **nomor_handphone_2**: Teks
  - **nomor_telepon_rumah_1**: Teks
  - **nomor_telepon_rumah_2**: Teks

- **Group: Status Pernikahan dan Anak**
  - **status_pernikahan**: Pilihan
  - **nama_pasangan**: Teks
  - **tanggal_menikah**: Tanggal
  - **tanggal_cerai**: Tanggal
  - **tanggal_wafat_pasangan**: Tanggal
  - **pekerjaan_pasangan**: Teks
  - **jumlah_anak**: Angka

- **Group: Rekening Bank**
  - **nomor_rekening**: Teks
  - **nama_pemegang_rekening**: Teks
  - **nama_bank**: Teks
  - **cabang_bank**: Teks

##### Tab: Informasi HR

- **Group: Kepegawaian**
  - **nomor_induk_karyawan**: Teks (Referensi dari `head.nomor_induk_karyawan`)
  - **posisi_jabatan**: Pilihan (Referensi dari `head.posisi_jabatan`)
  - **divisi**: Pilihan (Referensi dari `head.divisi`)
  - **department**: Pilihan (Referensi dari `head.department`)
  - **email_perusahaan**: Teks (Referensi dari `head.email_perusahaan`)
  - **manager**: Pilihan (Referensi dari `head.manager`)
  - **atasan_langsung**: Pilihan (Referensi dari `head.atasan_langsung`)

- **Group: Kontrak**
  - **jenis_hubungan_kerja**: Pilihan (dari master jenis hubungan kerja)
  - **tanggal_masuk_group**: Tanggal
  - **tanggal_masuk**: Tanggal
  - **tanggal_permanent**: Tanggal
  - **tanggal_kontrak**: Tanggal
  - **tanggal_akhir_kontrak**: Tanggal
  - **tanggal_berhenti**: Tanggal

- **Group: Education**
  - **tingkat_pendidikan**: Teks
  - **bidang_studi**: Teks
  - **nama_sekolah**: Teks
  - **kota_sekolah**: Teks
  - **status_kelulusan**: Pilihan
  - **keterangan**: Teks Area

- **Group: Pangkat dan Golongan**
  - **kategori_pangkat**: Pilihan (dari master kategori pangkat yang aktif)
  - **golongan_pangkat**: Pilihan (dari master golongan yang aktif)
  - **sub_golongan_pangkat**: Pilihan (dari master sub golongan yang aktif)
  - **no_dana_pensiun**: Teks

- **Group: Kontak Darurat**
  - **nama_kontak_darurat_1**: Teks
  - **nomor_telepon_kontak_darurat_1**: Teks
  - **hubungan_kontak_darurat_1**: Teks
  - **alamat_kontak_darurat_1**: Teks Area
  - **nama_kontak_darurat_2**: Teks
  - **nomor_telepon_kontak_darurat_2**: Teks
  - **hubungan_kontak_darurat_2**: Teks
  - **alamat_kontak_darurat_2**: Teks Area

- **Group: POO/POH**
  - **point_of_original**: Teks
  - **point_of_hire**: Teks

- **Group: Seragam dan Sepatu Kerja**
  - **ukuran_seragam_kerja**: Teks
  - **ukuran_sepatu_kerja**: Teks

- **Group: Pergerakan Karyawan**
  - **lokasi_sebelumnya**: Pilihan (dari master lokasi kerja)
  - **tanggal_mutasi**: Tanggal

- **Group: Costing**
  - **siklus_pembayaran_gaji**: Teks
  - **costing**: Teks
  - **assign**: Teks
  - **actual**: Teks

##### Tab: Informasi Keluarga

- **Group: Pasangan dan Anak**
  - **nama_pasangan**: Teks (Referensi dari `Personal Information.Status Pernikahan dan Anak.nama_pasangan`)
  - **tanggal_lahir_pasangan**: Tanggal
  - **pendidikan_terakhir_pasangan**: Teks
  - **pekerjaan_pasangan**: Teks
  - **jumlah_anak**: Angka (Referensi dari `Personal Information.Status Pernikahan dan Anak.jumlah_anak`)
  - **keterangan_pasangan**: Teks Area

- **Group: Identitas Anak** (Repeatable, berdasarkan `jumlah_anak`)
  - **nama_anak_1**: Teks
  - **jenis_kelamin_anak_1**: Pilihan
  - **tanggal_lahir_anak_1**: Tanggal
  - **keterangan_anak_1**: Teks Area
  - *(Struktur ini diulang untuk anak ke-2, ke-3, ke-4, dst.)*

- **Group: Saudara Kandung**
  - **anak_ke**: Angka
  - **jumlah_saudara_kandung**: Angka

- **Group: Identitas Saudara Kandung** (Repeatable, maks. 5)
  - **nama_saudara_kandung_1**: Teks
  - **jenis_kelamin_saudara_kandung_1**: Pilihan
  - **tanggal_lahir_saudara_kandung_1**: Tanggal
  - **pendidikan_terakhir_saudara_kandung_1**: Teks
  - **pekerjaan_saudara_kandung_1**: Teks
  - **keterangan_saudara_kandung_1**: Teks Area
  - *(Struktur ini diulang hingga saudara kandung ke-5)*

- **Group: Orang Tua Mertua**
  - **nama_ayah_mertua**: Teks
  - **tanggal_lahir_ayah_mertua**: Tanggal
  - **pendidikan_terakhir_ayah_mertua**: Teks
  - **keterangan_ayah_mertua**: Teks Area
  - **nama_ibu_mertua**: Teks
  - **tanggal_lahir_ibu_mertua**: Tanggal
  - **pendidikan_terakhir_ibu_mertua**: Teks
  - **keterangan_ibu_mertua**: Teks Area

> **Catatan:** Untuk beberapa field yang memiliki `Pilihan`, sertakan fungsi pencarian (search) di dalamnya.

---



---
> **Catatan Umum:**
> - Untuk karyawan, dukung pembuatan QR code yang di-generate dari `nomor_induk_karyawan`.