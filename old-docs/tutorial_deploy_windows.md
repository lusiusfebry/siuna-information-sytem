# Panduan Deployment Windows - Sistem Informasi SDM Bebang

Dokumen ini menjelaskan langkah-langkah komprehensif untuk men-deploy aplikasi **Sistem Informasi SDM Bebang** pada server lokal berbasis OS Windows.

---

## 1. Prasyarat Sistem

Sebelum memulai, pastikan perangkat lunak berikut telah terinstal pada sistem Windows Anda:

### A. Core Requirements
- **Node.js**: Minimal v18.0.0 (LTS direkomendasikan). [Unduh di sini](https://nodejs.org/).
- **PostgreSQL**: Minimal v14. [Unduh di sini](https://www.postgresql.org/download/windows/).
- **Redis**: Diperlukan untuk caching. Gunakan [Memurai](https://www.memurai.com/) (Redis-compatible untuk Windows) atau [Redis for Windows](https://github.com/tporadowski/redis/releases).
- **Git**: Untuk cloning repository. [Unduh di sini](https://git-scm.com/download/win).

### B. Production Tools (Opsional tapi Direkomendasikan)
- **PM2**: Process manager untuk menjaga backend tetap berjalan.
  ```bash
  npm install -g pm2
  ```
- **Nginx for Windows**: Untuk web server dan reverse proxy. [Unduh di sini](https://nginx.org/en/download.html).

---

## 2. Persiapan Database (PostgreSQL)

1. Buka **pgAdmin 4** atau **SQL Shell (psql)**.
2. Jalankan perintah SQL berikut untuk membuat database dan user:
   ```sql
   CREATE DATABASE bebang_db;
   CREATE USER bebang_user WITH PASSWORD 'password_anda_disini';
   GRANT ALL PRIVILEGES ON DATABASE bebang_db TO bebang_user;
   ```

---

## 3. Konfigurasi Backend

1. Buka terminal (CMD atau PowerShell) di dalam folder `backend`.
2. Install dependensi:
   ```bash
   npm install --production
   ```
3. Salin file `.env.example` menjadi `.env` dan sesuaikan nilainya:
   ```env
   NODE_ENV=production
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=bebang_db
   DB_USER=bebang_user
   DB_PASSWORD=password_anda_disini
   JWT_SECRET=rahasia_minimal_32_karakter
   CORS_ORIGIN=http://localhost (atau domain anda)
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```
4. Jalankan migrasi database dan seeding data awal:
   ```bash
   npm run migrate
   ```
5. Build aplikasi backend:
   ```bash
   npm run build
   ```
6. Jalankan backend menggunakan PM2 agar berjalan di background:
   ```bash
   pm2 start dist/index.js --name bebang-backend
   ```

---

## 4. Konfigurasi Frontend

1. Buka terminal di dalam folder `frontend`.
2. Install dependensi:
   ```bash
   npm install
   ```
3. Buat file `.env.production` dan tentukan URL API backend:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```
4. Build aplikasi frontend untuk produksi:
   ```bash
   npm run build
   ```
   Hasil build akan tersedia di folder `frontend/dist`.

---

## 5. Konfigurasi Nginx (Web Server)

Agar aplikasi dapat diakses melalui port standar (80/443), gunakan Nginx sebagai reverse proxy.

1. Ekstrak Nginx ke lokasi permanen (misal: `C:\nginx`).
2. Edit file `C:\nginx\conf\nginx.conf`:
   ```nginx
   server {
       listen       80;
       server_name  localhost;

       # Frontend (Static Files)
       location / {
           root   C:/path/ke/project-it/bis-fix/frontend/dist; # SESUAIKAN PATH INI
           index  index.html;
           try_files $uri $uri/ /index.html;
       }

       # Backend API Proxy
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
       
       # Uploads storage (Opsional jika simpan file lokal)
       location /uploads {
           alias C:/path/ke/project-it/bis-fix/backend/uploads; # SESUAIKAN PATH INI
       }
   }
   ```
3. Jalankan Nginx:
   ```bash
   start nginx
   ```

---

## 6. Otomatisasi Startup (Penting)

Agar aplikasi otomatis berjalan saat Windows booting:

### A. PM2 Startup
Gunakan `pm2-windows-startup`:
```bash
npm install -g pm2-windows-startup
pm2-startup install
pm2 save
```

### B. Nginx sebagai Service
Gunakan [WinSW](https://github.com/winsw/winsw) untuk menjadikan Nginx sebagai Windows Service agar tetap berjalan meskipun tidak ada user yang login.

---

## 7. Troubleshooting

- **Redis Error**: Pastikan service Redis sudah "Started" melalui `services.msc`.
- **Port Conflict**: Jika port 80 sudah digunakan (misal oleh IIS), ubah `listen 80` di `nginx.conf` ke port lain.
- **Environment Not Found**: Pastikan file `.env` berada tepat di dalam folder root `backend`.

---
*Dokumen ini dibuat otomatis sebagai panduan standar deployment berbasis Windows.*
