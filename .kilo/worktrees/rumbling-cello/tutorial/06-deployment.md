# 06 - Deployment

Panduan deploy aplikasi BIS ke production menggunakan Docker.

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

## Langkah Selanjutnya

Lanjut ke **[07 - Maintenance](./07-maintenance.md)** untuk panduan reset data, backup, dan troubleshooting.
