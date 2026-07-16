# Panduan Pengujian (Testing Guide)

Aplikasi ini menggunakan beberapa level pengujian untuk memastikan stabilitas dan kualitas kode.

## 1. Unit & Integration Testing (Backend)
Backend menggunakan **Jest** dan **Supertest** untuk pengujian API.

- **Menjalankan Tes:**
  ```bash
  cd backend
  npm test
  ```
- **File Tes:** Terletak di `src/modules/*/services/__tests__` atau `src/__tests__`.
- **Database:** Tes backend menggunakan database PostgreSQL terpisah (biasanya dikonfigurasi di `.env.test`).

## 2. Unit Testing (Frontend)
Frontend menggunakan **Vitest** dan **React Testing Library** untuk pengujian komponen.

- **Menjalankan Tes:**
  ```bash
  cd frontend
  npm run test
  ```
- **Menjalankan Tes UI (Watch Mode):**
  ```bash
  npm run test:ui
  ```

## 3. End-to-End (E2E) Testing
E2E testing menggunakan **Playwright** untuk mensimulasikan interaksi pengguna dari frontend hingga database.

- **Persiapan:**
  Pastikan database dalam keadaan bersih atau sudah di-seed.
  ```bash
  cd backend
  npm run migrate
  npm run seed
  ```
- **Menjalankan E2E:**
  ```bash
  cd frontend
  npx playwright test
  ```
- **Report Pengujian:**
  Setelah pengujian selesai, laporan HTML akan dibuat di `frontend/playwright-report/`.

## 4. Best Practices
- Selalu tambahkan tes baru saat menambahkan fitur (TDD direkomendasikan).
- Pastikan cakupan tes (coverage) tetap tinggi.
- Tes tidak boleh bergantung pada data eksternal yang berubah-ubah (gunakan fixtures atau seeding).
