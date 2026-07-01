# Daftar Kredensial Login Aplikasi Bebang

Berikut adalah daftar kredensial (NIK dan Password) yang dapat digunakan untuk masuk ke dalam sistem Bebang Informasi SDM.

## Kredensial Administrator (Utama)

Gunakan kredensial ini untuk akses penuh sebagai Super Administrator.

| Peran | NIK | Password |
|-------|-----|----------|
| **Superadmin (Example)** | `111111` | `password123` |
| **Superadmin (Full)** | `1234567890123456` | `password123` |

## Kredensial Pengujian (Integration Testing)

Kredensial berikut biasanya digunakan oleh tim pengembang dalam skenario pengujian otomatis (*Integration Tests*).

| Skenario Tes | NIK | Password |
|--------------|-----|----------|
| **Auth Test** | `999999` | `password123` |
| **Master Data Test** | `888888` | `password123` |
| **Import Test** | `888888` | `password123` |

## Catatan Penting

1. **Keamanan**: Pastikan untuk segera mengubah password default setelah login pertama kali di lingkungan produksi.
2. **Setup**: Kredensial ini hanya tersedia jika database telah diisi menggunakan perintah `npm run seed` atau melalui proses migrasi data awal yang menyertakan data pengguna.
3. **Role-Based Access Control (RBAC)**: Hak akses setiap akun ditentukan oleh *Role* yang diberikan. Akun `superadmin` memiliki akses ke seluruh modul termasuk pengaturan hak akses.

---
**Tim IT Sistem Informasi Bebang**
