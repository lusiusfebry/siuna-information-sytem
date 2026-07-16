# Panduan Deployment - Sistem Informasi SDM Bebang

## Daftar Isi
1. [Prasyarat](#prasyarat)
2. [Deployment Backend](#deployment-backend)
3. [Deployment Frontend](#deployment-frontend)
4. [Database Setup](#database-setup)
5. [Environment Variables](#environment-variables)
6. [Production Checklist](#production-checklist)

## Prasyarat

### Software
- **Node.js**: v18+ (LTS)
- **PostgreSQL**: v14+
- **Redis**: v6+ (untuk caching)
- **npm** atau **yarn**
- **PM2** (untuk production backend)

### Akses
- Server dengan akses SSH
- Domain/subdomain yang sudah dikonfigurasi
- Sertifikat SSL (untuk HTTPS)

## Deployment Backend

### 1. Persiapan Server
```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Redis
sudo apt install redis-server
```

### 2. Clone Repository
```bash
cd /var/www
git clone <repository-url> bebang-backend
cd bebang-backend/backend
```

### 3. Install Dependencies
```bash
npm install --production
```

### 4. Environment Variables
Buat file `.env` (lihat [Environment Variables](#environment-variables))

### 5. Database Migration
```bash
npm run migrate
npm run seed
```

### 6. Build
```bash
npm run build
```

### 7. Jalankan dengan PM2
```bash
pm2 start dist/index.js --name bebang-api
pm2 save
pm2 startup
```

### 8. Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name api.bebang.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Deployment Frontend

### 1. Clone & Setup
```bash
cd /var/www
git clone <repository-url> bebang-frontend
cd bebang-frontend/frontend
npm install
```

### 2. Environment Variables
Buat file `.env.production`:
```
VITE_API_URL=https://api.bebang.com/api
```

### 3. Build
```bash
npm run build
```

### 4. Deploy ke Static Server (Nginx)
```nginx
server {
    listen 80;
    server_name bebang.com;
    root /var/www/bebang-frontend/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 5. SSL dengan Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d bebang.com -d api.bebang.com
```

## Database Setup

### PostgreSQL Configuration
```bash
# Login sebagai postgres
sudo -u postgres psql

# Buat database dan user
CREATE DATABASE bebang_db;
CREATE USER bebang_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE bebang_db TO bebang_user;
\q
```

### Backup & Restore
```bash
# Backup
pg_dump bebang_db > backup_$(date +%Y%m%d).sql

# Restore
psql bebang_db < backup_20260131.sql
```

## Environment Variables

### Backend (.env)
```
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bebang_db
DB_USER=bebang_user
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_min_32_chars
CORS_ORIGIN=https://bebang.com
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Frontend (.env.production)
```
VITE_API_URL=https://api.bebang.com/api
```

## Production Checklist

### Security
- [ ] Ganti semua default passwords
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Configure firewall (UFW/iptables)
- [ ] Disable debug mode
- [ ] Set secure JWT_SECRET
- [ ] Configure CORS dengan benar

### Performance
- [ ] Enable Redis caching
- [ ] Configure Nginx gzip compression
- [ ] Set PM2 cluster mode: `pm2 start dist/index.js -i max`
- [ ] Configure database connection pooling
- [ ] Enable CDN untuk static assets (opsional)

### Monitoring
- [ ] Setup PM2 monitoring: `pm2 monit`
- [ ] Configure log rotation
- [ ] Setup error tracking (Sentry, opsional)
- [ ] Setup uptime monitoring

### Backup
- [ ] Setup automated database backup (cron job)
- [ ] Backup uploads folder secara berkala
- [ ] Test restore procedure

---
*Untuk bantuan deployment, hubungi tim DevOps*
