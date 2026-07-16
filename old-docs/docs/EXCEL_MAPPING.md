# Pemetaan Excel (Excel Mapping Guide)

Dokumen ini menjelaskan format kolom Excel yang digunakan untuk fitur **Import Karyawan**.

## Format File
- **Ekstensi:** `.xlsx` atau `.xls`
- **Sheet:** Data harus berada pada sheet pertama.

## Daftar Kolom
| Nama Kolom (Header) | Deskripsi | Wajib | Contoh / Format |
| :--- | :--- | :--- | :--- |
| `NIK` | Nomor Induk Karyawan | Ya | `2024001` |
| `Nama Lengkap` | Nama lengkap sesuai KTP | Ya | `John Doe` |
| `Divisi` | Nama Divisi (harus ada di Master Data) | Ya | `IT` |
| `Departemen` | Nama Departemen (harus sesuai Divisi) | Ya | `Software` |
| `Jabatan` | Nama Posisi Jabatan | Ya | `Developer` |
| `Tanggal Masuk` | Tanggal mulai bekerja | Ya | `YYYY-MM-DD` |
| `Tempat Lahir` | Tempat lahir karyawan | Tidak | `Jakarta` |
| `Tanggal Lahir` | Tanggal lahir | Tidak | `1990-01-01` |
| `Jenis Kelamin` | Laki-laki atau Perempuan | Tidak | `L` atau `P` |
| `Agama` | Agama harian | Tidak | `Islam` |
| `No. KTP` | 16 digit nomor identitas | Tidak | `3171...` |
| `Email Pribadi` | Alamat email aktif | Tidak | `john@example.com` |

## Tips Import
1. Gunakan file template `BMI-kosong.xlsx` sebagai basis.
2. Pastikan data master (Divisi, Departemen, dll) sudah terdaftar di sistem sebelum melakukan import.
3. System akan memvalidasi duplikasi NIK secara otomatis saat proses preview.
