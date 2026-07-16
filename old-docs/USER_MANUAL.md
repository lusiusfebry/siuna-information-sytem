# Panduan Pengguna - Sistem Informasi SDM (Bebang)

Selamat datang di Sistem Informasi SDM Bebang. Dokumen ini menjelaskan cara menggunakan fitur-fitur utama sistem.

## Daftar Isi
1. [Login](#login)
2. [Dashboard](#dashboard)
3. [Manajemen Karyawan](#manajemen-karyawan)
4. [Manajemen Master Data](#manajemen-master-data)
5. [Manajemen Akses (RBAC)](#manajemen-akses-rbac)

## Login
Untuk mengakses sistem, masukkan NIK dan password Anda pada halaman login.
- **URL**: `/login`
- Masukkan kredensial yang valid.
- Jika lupa password, hubungi administrator IT.
- Setelah login berhasil, Anda akan diarahkan ke Dashboard.

## Dashboard
Halaman utama menampilkan ringkasan data:
- Statistik karyawan (Total, Aktif, Cuti, Resign)
- Grafik distribusi karyawan per departemen.
- Aktivitas terbaru (Audit Log).
- Notifikasi penting.

## Manajemen Karyawan
Menu **Karyawan** memungkinkan Anda mengelola data pegawai.

### Melihat Data
- Buka menu **Karyawan**.
- Gunakan fitur pencarian (Nama/NIK) atau filter (Departemen/Posisi) di atas tabel.
- Klik baris karyawan untuk melihat detail profil.

### Menambah Karyawan Baru
1. Klik tombol **Tambah Karyawan**.
2. **Langkah 1 (Data Personal)**: Isi Nama, NIK, Foto, dan informasi pribadi.
3. **Langkah 2 (Informasi HR)**: Pilih Jabatan, Departemen, Tanggal Bergabung, Atasan, dll.
4. **Langkah 3 (Keluarga)**: Tambahkan data pasangan, anak, dan saudara kandung.
5. Klik **Simpan** untuk menyelesaikan.

### Mengubah Data
- Buka detail karyawan.
- Klik tombol **Edit** (ikon pensil) pada bagian yang ingin diubah.
- Simpan perubahan.

### Menghapus Data
- Klik tombol **Hapus** (ikon tempat sampah) pada tabel atau detail.
- Konfirmasi penghapusan. Data akan ditandai non-aktif (soft delete).

## Manajemen Master Data
Hanya pengguna dengan akses Admin/HR Manager yang dapat mengakses ini.
- Menu: **Master Data**.
- Sub-menu: Departemen, Divisi, Posisi, Golongan, dll.
- Anda dapat menambah, mengubah, dan menghapus opsi referensi yang digunakan dalam form karyawan.

## Manajemen Akses (RBAC)
Menu **Pengaturan Akun** (Admin Only).
- **Peran (Roles)**: Mengatur hak akses (Create, Read, Update, Delete) per modul.
- **Pengguna (Users)**: Mengatur role untuk setiap pengguna.

---
Untuk bantuan teknis, hubungi Tim IT melalui email: it-support@bebang.com
