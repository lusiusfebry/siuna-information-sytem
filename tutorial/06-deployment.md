# 06 - Deployment

Panduan deploy aplikasi BIS ke production. Tersedia 3 opsi: Docker (Linux), Manual (Linux), dan **Windows**.

---

## Arsitektur Production

```
                    ┌──────────────┐
  Browser ────────► │   Nginx :80  │
                    │  (reverse    │
                    │   proxy)     │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
        Static Files              /api/*
        (frontend build)               │
                              ┌────────▼────────┐
                              │  Backend :3000   │
                              │  (Node.js)       │
                              └────────┬─────────┘
                                       │
                         ┌─────────────┴──────────────┐
                         │                            │
                  ┌──────▼──────┐            ┌───────▼───────┐
                  │ PostgreSQL  │            │    Redis      │
                  │   :5432     │            │   :6379       │
                  └─────────────┘            └───────────────┘
```

---

## Docker Compose Production

### 1. Siapkan Environment

Buat file `.env` di root project dengan konfigurasi production:

```env
NODE_ENV=production
PORT=3000

DB_HOST=postgres
DB_PORT=5432
DB_NAME=bebang_db
DB_USER=postgres
DB_PASSWORD=ganti-dengan-password-kuat

JWT_SECRET=ganti-dengan-secret-key-yang-panjang-dan-random

UPLOAD_DIR=./uploads
CORS_ORIGIN=https://yourdomain.com

VITE_API_URL=/api
VITE_APP_NAME=Bebang Sistem Informasi
```

### 2. Build Frontend

```bash
cd frontend
npm run build
```

Output build akan berada di `frontend/dist/`.

### 3. Jalankan Production Stack

```bash
cd docker
docker-compose -f docker-compose.prod.yml up -d
```

File `docker-compose.prod.yml` menjalankan:

| Service | Image | Port | Keterangan |
|---------|-------|------|------------|
| **app** | Backend Dockerfile | 3000 (internal) | Node.js production |
| **nginx** | nginx:stable-alpine | **80** (public) | Reverse proxy + static files |
| **postgres** | postgres:15-alpine | Internal only | Database (tidak diekspos ke public) |

### 4. Jalankan Migration & Seed

```bash
# Masuk ke container backend
docker exec -it bebang-app sh

# Di dalam container:
npm run migrate
npm run seed           # Minimal: hanya credentials
# atau
npm run seed:complete  # Lengkap: dengan data demo
```

---

## Konfigurasi Nginx

File: `docker/nginx.conf`

```nginx
server {
    listen 80;
    server_name _;

    # Frontend static files
    root /usr/share/nginx/html;
    index index.html;

    # API reverse proxy
    location /api {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Upload files
    location /uploads {
        proxy_pass http://app:3000;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Nginx melayani:
- `/` — File statis frontend (React build)
- `/api/*` — Proxy ke backend Node.js
- `/uploads/*` — Proxy ke backend untuk file upload
- SPA fallback — Semua route dikembalikan ke `index.html`

---

## Manual Deployment (Tanpa Docker)

Jika ingin deploy tanpa Docker:

### Backend

```bash
cd backend
npm install --production
npm run build
npm run migrate
npm run seed

# Jalankan dengan process manager
npm install -g pm2
pm2 start dist/index.js --name bis-backend
```

### Frontend

```bash
cd frontend
npm install
npm run build

# Copy dist/ ke web server (Nginx/Apache)
cp -r dist/* /var/www/html/
```

### Nginx Config (Manual)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/html;
    index index.html;

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /uploads {
        proxy_pass http://127.0.0.1:3000;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Checklist Production

- [ ] Ganti `DB_PASSWORD` dengan password yang kuat
- [ ] Ganti `JWT_SECRET` dengan string random yang panjang (min 32 karakter)
- [ ] Set `NODE_ENV=production`
- [ ] Set `CORS_ORIGIN` ke domain yang benar
- [ ] PostgreSQL tidak diekspos ke public (internal only)
- [ ] Backup database secara berkala
- [ ] Setup HTTPS (SSL certificate) via Nginx atau reverse proxy

---

## Deploy di Windows (Tanpa Docker)

Panduan lengkap untuk deploy BIS di server Windows. Cocok untuk lingkungan kantor yang menggunakan Windows Server.

### Langkah 1: Install Node.js

1. Download Node.js LTS dari [https://nodejs.org/](https://nodejs.org/)
2. Jalankan installer, ikuti wizard (gunakan default)
3. Verifikasi:
   ```powershell
   node --version
   npm --version
   ```

### Langkah 2: Install PostgreSQL

1. Download installer dari [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Jalankan installer:
   - Pilih komponen: **PostgreSQL Server**, **pgAdmin 4**, **Command Line Tools**
   - Set password untuk user `postgres` — **catat password ini**
   - Port biarkan default: **5432**
3. Setelah selesai, buka **pgAdmin 4** dan buat database baru:
   - Klik kanan **Databases** > **Create** > **Database**
   - Nama: `bebang_db`
   - Klik **Save**

### Langkah 3: Install Redis (Opsional)

Redis digunakan untuk caching. Ada beberapa opsi di Windows:

**Opsi A: Memurai (Direkomendasikan)**
1. Download dari [https://www.memurai.com/](https://www.memurai.com/)
2. Install — Memurai berjalan sebagai Windows Service otomatis
3. Verifikasi: `memurai-cli ping` → harus muncul `PONG`

**Opsi B: Tanpa Redis**
Aplikasi tetap berjalan tanpa Redis — fitur caching akan di-skip. Untuk development dan deployment kecil, ini sudah cukup.

### Langkah 4: Siapkan Kode Aplikasi

```powershell
# Clone atau copy kode project ke server
cd D:\apps
git clone <repository-url> bis
cd bis

# Install dependencies
cd backend
npm install --production
cd ..\frontend
npm install
```

### Langkah 5: Konfigurasi Environment

Buat file `.env` di root project:

```powershell
copy .env.example .env
notepad .env
```

Edit nilai-nilai berikut untuk production:

```env
NODE_ENV=production
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=bebang_db
DB_USER=postgres
DB_PASSWORD=password-postgresql-anda

JWT_SECRET=ganti-dengan-string-random-minimal-32-karakter

UPLOAD_DIR=./uploads
CORS_ORIGIN=http://alamat-server-anda

VITE_API_URL=/api
```

### Langkah 6: Build Aplikasi

```powershell
# Build backend (TypeScript → JavaScript)
cd backend
npm run build

# Build frontend (React → static files)
cd ..\frontend
npm run build
```

### Langkah 7: Jalankan Migration & Seed

```powershell
cd backend
npm run migrate
npm run seed:complete    # Data demo lengkap
# atau
npm run seed             # Hanya credentials
```

### Langkah 8: Install PM2 (Process Manager)

PM2 menjaga backend tetap berjalan meskipun terminal ditutup, dan otomatis restart jika crash.

```powershell
npm install -g pm2

# Jalankan backend dengan PM2
cd D:\apps\bis\backend
pm2 start dist/index.js --name bis-backend

# Verifikasi
pm2 status
pm2 logs bis-backend
```

### Langkah 9: Serve Frontend

**Opsi A: Menggunakan `serve` (Paling Mudah)**

```powershell
npm install -g serve
cd D:\apps\bis\frontend
pm2 start "serve -s dist -l 5173" --name bis-frontend
```

**Opsi B: Menggunakan Nginx for Windows**

1. Download Nginx dari [https://nginx.org/en/download.html](https://nginx.org/en/download.html) (Windows zip)
2. Extract ke `C:\nginx`
3. Edit `C:\nginx\conf\nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;

    # Frontend static files
    root D:/apps/bis/frontend/dist;
    index index.html;

    # API reverse proxy
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Upload files
    location /uploads {
        proxy_pass http://127.0.0.1:3000;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

4. Jalankan Nginx:
```powershell
cd C:\nginx
start nginx
```

### Langkah 10: Konfigurasi Windows Firewall

Agar aplikasi bisa diakses dari komputer lain di jaringan:

```powershell
# Buka port 80 (Nginx) — jalankan sebagai Administrator
netsh advfirewall firewall add rule name="BIS Web" dir=in action=allow protocol=TCP localport=80

# Atau jika tidak pakai Nginx, buka port 3000 dan 5173
netsh advfirewall firewall add rule name="BIS Backend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="BIS Frontend" dir=in action=allow protocol=TCP localport=5173
```

### Langkah 11: Jalankan Otomatis Saat Startup (Opsional)

Agar PM2 otomatis start saat Windows boot:

**Opsi A: Menggunakan pm2-windows-startup**
```powershell
npm install -g pm2-windows-startup
pm2-startup install

# Simpan konfigurasi PM2 saat ini
pm2 save
```

**Opsi B: Menggunakan NSSM (Non-Sucking Service Manager)**
1. Download NSSM dari [https://nssm.cc/](https://nssm.cc/)
2. Extract ke `C:\nssm`
3. Jalankan:
```powershell
C:\nssm\nssm.exe install bis-backend "C:\Program Files\nodejs\node.exe" "D:\apps\bis\backend\dist\index.js"
C:\nssm\nssm.exe start bis-backend
```

### Checklist Production Windows

- [ ] Node.js LTS terinstal
- [ ] PostgreSQL terinstal dan database `bebang_db` sudah dibuat
- [ ] File `.env` sudah dikonfigurasi dengan password kuat
- [ ] `JWT_SECRET` menggunakan string random panjang
- [ ] Backend sudah di-build (`npm run build`)
- [ ] Frontend sudah di-build (`npm run build`)
- [ ] Migration sudah dijalankan (`npm run migrate`)
- [ ] PM2 menjalankan backend
- [ ] Frontend bisa diakses dari browser
- [ ] Windows Firewall sudah dikonfigurasi
- [ ] Backup database terjadwal (lihat [07 - Maintenance](./07-maintenance.md))

---

## Langkah Selanjutnya

Lanjut ke **[07 - Maintenance](./07-maintenance.md)** untuk panduan reset data, backup, dan troubleshooting.
