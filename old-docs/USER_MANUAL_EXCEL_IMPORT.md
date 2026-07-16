# Panduan Import Data Karyawan via Excel

Fitur ini memungkinkan Anda menambahkan banyak data karyawan sekaligus menggunakan file Excel.

## Format File
- Gunakan template resmi yang dapat diunduh di halaman import.
- Format file: `.xlsx` atau `.xls`.
- **Kolom Wajib**:
  - `Nama Lengkap`
  - `NIK` (Harus unik 16 digit)
  - `Departemen` (Harus sesuai Master Data)
  - `Posisi` (Harus sesuai Master Data)
  - `Tanggal Bergabung` (DD-MM-YYYY)
- **Kolom Opsional**: Email, No HP, Alamat.

## Langkah-Langkah Import
1. Masuk ke menu **Karyawan**.
2. Klik tombol **Import Excel**.
3. **Download Template**: Jika belum memiliki format, unduh template terlebih dahulu.
4. **Isi Data**: Masukkan data karyawan ke dalam template Excel. Pastikan tidak ada NIK ganda.
5. **Upload File**:
   - Klik area upload atau drag & drop file Excel Anda.
   - Sistem akan melakukan **Preview** dan validasi data.
6. **Validasi**:
   - Baris berwarna **Merah**: Data error (misal NIK duplikat, Departemen tidak ditemukan). Arahkan kursor untuk melihat detail error.
   - Baris berwarna **Hijau**: Data valid.
7. **Proses Import**:
   - Jika data valid sudah benar, klik tombol **Import Data**.
   - Sistem hanya akan memproses baris yang valid.
   - Baris error akan diabaikan dan dapat diunduh dalam **Laporan Error**.

## Penyelesaian Masalah (Troubleshooting)
- **Error "Department not found"**: Pastikan nama departemen di Excel persis sama dengan di sistem Master Data.
- **Error "NIK already exists"**: NIK tersebut sudah dipakai oleh karyawan lain di database.
- **Gagal Upload**: Pastikan ukuran file tidak melebihi 5MB.

---
*Catatan: Proses import jumlah besar (500+ baris) mungkin memakan waktu beberapa menit. Jangan tutup browser selama proses berjalan.*
