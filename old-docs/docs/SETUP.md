# Setup & Installation

## Prerequisites
- Node.js v18+
- Docker & Docker Compose
- PostgreSQL 15+

## Quick Start
1. Clone repository
2. Copy `.env.example` -> `.env`
3. Backend: `cd backend && npm install`
4. Frontend: `cd frontend && npm install`
5. Database: `docker-compose up -d` (Start database)
6. Backend Dev: `cd backend && npm run dev`
7. Frontend Dev: `cd frontend && npm run dev`

## Deployment
See `docker-compose.prod.yml` and `docker/nginx.conf`.
