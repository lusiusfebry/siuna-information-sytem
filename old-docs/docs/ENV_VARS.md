# Variabel Lingkungan (Environment Variables)

Proyek ini memerlukan beberapa variabel lingkungan agar dapat berjalan dengan benar. Salin file `.env.example` menjadi `.env` di masing-masing folder.

## Backend (.env)
| Variabel | Deskripsi | Default |
| :--- | :--- | :--- |
| `PORT` | Port server backend | `3000` |
| `NODE_ENV` | Mode lingkungan (development/production) | `development` |
| `DB_HOST` | Host database PostgreSQL | `localhost` |
| `DB_PORT` | Port database PostgreSQL | `5432` |
| `DB_USER` | Username database | `postgres` |
| `DB_PASS` | Password database | - |
| `DB_NAME` | Nama database | `bebang_db` |
| `JWT_SECRET` | Secret key untuk token JWT | - |
| `JWT_EXPIRES_IN` | Durasi masa berlaku token | `1d` |

## Frontend (.env)
| Variabel | Deskripsi | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | URL dasar API Backend | `http://localhost:3000/api` |

> [!IMPORTANT]
> Jangan pernah memberikan file `.env` ke repository publik. Gunakan vault atau secret management untuk lingkungan produksi.
