# Tutorial Instalasi Aplikasi Bebang Sistem Informasi

Dokumen ini menjelaskan langkah-langkah untuk menginstal dan menjalankan aplikasi Bebang Sistem Informasi di lingkungan lokal Anda.

## Prasyarat (Prerequisites)

Pastikan Anda telah menginstal perangkat lunak berikut:
- **Node.js**: Versi 18 atau lebih baru.
- **PostgreSQL**: Versi 15 atau lebih baru.
- **Redis**: Diperlukan untuk caching dan scheduler.
- **Docker & Docker Compose**: Opsional, namun disarankan untuk menjalankan fitur database dan redis dengan mudah.

## Langkah-langkah Instalasi

### 1. Kloning Repositori
```bash
git clone <repository-url>
cd bis-fix
```

### 2. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env` di folder root dan sesuaikan konfigurasinya:
```bash
cp .env.example .env
```
Pastikan pengaturan database (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) dan Redis sesuai dengan lingkungan Anda.

### 3. Instalasi Dependensi

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 4. Persiapan Database

Jika Anda menggunakan Docker, Anda dapat menjalankan database dan redis menggunakan:
```bash
cd docker
docker-compose up -d
```

**Migrasi Database:**
Jalankan perintah berikut di dalam folder `backend` untuk membuat struktur tabel:
```bash
cd backend
npm run migrate
```

**Seeding Data (Opsional):**
Jalankan perintah berikut untuk mengisi data awal (master data dan contoh karyawan):
```bash
npm run seed
```

## Kredensial Default (Credential)

Setelah database berhasil dimigrasi dan diisi, Anda dapat menggunakan kredensial berikut untuk masuk ke sistem:

| Peran | NIK | Password |
|-------|-----|----------|
| **Superadmin** | `1234567890123456` | `password123` |
| **Admin HR** | `111111` | `password123` |

> [!NOTE]
> Jika kredensial di atas tidak ditemukan setelah seeding, Anda dapat membuat user admin baru secara manual melalui database atau menggunakan script pendaftaran jika tersedia.

## Menjalankan Aplikasi

Aplikasi harus dijalankan di dua terminal terpisah (Backend dan Frontend).

### Menjalankan Backend
```bash
cd backend
npm run dev
```
Server backend akan berjalan di `http://localhost:3000`. Dokumentasi Swagger dapat diakses di `http://localhost:3000/api-docs`.

### Menjalankan Frontend
```bash
cd frontend
npm run dev
```
Aplikasi frontend akan berjalan di `http://localhost:5173`.

---
**Tim IT Sistem Informasi Bebang**
