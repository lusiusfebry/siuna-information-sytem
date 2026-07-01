# Rencana Sistem Aplikasi Bebang Sistem Informasi

## Deskripsi Umum
Aplikasi enterprise web progresif bernama **Bebang Sistem Informasi** akan diimplementasikan di PT Prima Sarana Gemilang, site Taliabu. Tujuan aplikasi adalah sebagai pusat pelayanan data bagi karyawan.

### Flow
Login page - Welcome Page - Module

1. login page, akan menggunakan nomor induk karyawan sebagai username, format nomor induk karyawan : xx-xxxxx, contoh 02-03827
2. Pada welcome page, akan terdapat shortcut untuk module yang akan di akses
3. Module, akan terdiri dari module human resources, inventory, mess management, building management, user access right management. 

### Modul Utama:
1. Human Resources

### Platform & Teknologi
- Database: PostgreSQL dengan credential : root : postgres, password : 123456789
- Bahasa: Bahasa Indonesia
- Instalasi awal: Server lokal (potensi scale-up ke cloud)
- Support lebih dari 500 karyawan
- Struktur Folder: Terpisah antara backend, frontend, dan per modul

### Ketentuan 
- aplikasi menggunakan bahasa Indonesia
- tidak menggunakan data mock, atau data statis atau data hardoced
- untuk credential awal dalam develop aplikasi dapat menggunakan data seed
- demi kerapihan project, pisahkan folder frontend dan backend dan juga pisahkan modul per folder

### Mohon di perhatitikan
- pada login page, untuk login menggunakan nomor induk karyawan dan password, untuk develop awal password dapat menggunakan data seed. dalam produksi password akan di create oleh modul management access
- Welcome Page dengan shortcut ke modul
- Tidak menggunakan data hardcoded atau mock
- UI profesional, bersih dan modern
- Mendukung QR Code, Upload Foto & Dokumen
- Aplikasi menggunakan bahasa Indonesia
- untuk ux, moderen, profesional dan layak di gunakan pada industri 

