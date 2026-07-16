# Panduan Kontribusi (Contributing Guide)

Terima kasih telah berkontribusi pada proyek Bebang Sistem Informasi!

## Alur Kerja Git
1.  **Branching:** Buat branch baru dari `main` untuk setiap fitur atau perbaikan.
    - Format: `feature/nama-fitur` atau `fix/nama-bug`.
2.  **Commits:** Gunakan pesan commit yang deskriptif (disarankan mengikuti Conventional Commits).
    - Contoh: `feat: add employee wizard`, `fix: resolve login crash`.
3.  **Pull Request:** Setelah selesai, buat PR ke branch `main`. Pastikan semua tes lulus di lokal sebelum push.

## Standar Kode
- **TypeScript:** Gunakan tipe data yang ketat (avoid `any`).
- **Linting:** Jalankan `npm run lint` sebelum commit.
- **Formating:** Disarankan menggunakan Prettier dengan konfigurasi proyek.
- **JSDoc:** Tambahkan komentar untuk fungsi dan endpoint API yang kompleks (terutama untuk Swagger).

## Struktur Proyek
- `backend/`: Repository API (Node.js/Express/Sequelize).
- `frontend/`: Repository UI (React/Vite/Tailwind).
- `docs/`: Dokumentasi teknis tambahan.

## Pengembangan Fitur Baru
1. Pastikan fitur baru sudah direncanakan dalam `implementation_plan.md`.
2. Implementasikan logic backend beserta tes integritasnya.
3. Update Swagger documentation.
4. Implementasikan UI di frontend.
5. Tambahkan tes E2E untuk flow krusial.
