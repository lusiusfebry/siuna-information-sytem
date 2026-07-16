# PLAN — INV-N06: PWA / Offline (read-only lapangan)

**Temuan:** INV-N06 (AUDIT-INVENTORY.md §7, G-22) — PWA/offline sync belum ada. Spec `03_modul_inventory.md` §7 "Mobile-friendly, kamera scan QR/barcode, offline mode" & §11 "offline sync".

**Scope disepakati:** *Read-only lapangan.* App installable (PWA), kamera scan sudah ada (INV-M11). Offline: app shell tetap kebuka + hasil lookup QR/asset tag/produk yang **pernah** diakses tersaji dari cache. **Tidak** ada pembuatan transaksi offline (menghindari risiko integritas stok + approval gating INV-N07).

## Pendekatan

Pakai **`vite-plugin-pwa`** (Workbox di baliknya) — standar untuk Vite 5, generate SW + manifest injection otomatis, minim boilerplate. Registrasi `autoUpdate` dengan prompt update ringan.

### Strategi caching
- **App shell (precache):** semua aset build (JS/CSS/html/svg) di-precache Workbox → app kebuka offline.
- **Runtime cache API lookup:** `GET /api/inventory/label/lookup*` dan `GET /api/inventory/label/**/qr` → **NetworkFirst** (timeout 3 dtk, fallback cache), `cacheName: 'inventory-lookup'`, expiration 100 entri / 7 hari. Ini yang bikin hasil scan yang pernah dibuka tetap tampil offline.
- **Tidak** meng-cache endpoint mutasi atau data sensitif lain. Auth cookie tetap; offline hanya menyajikan yang sudah ter-cache (tak ada bypass permission — data hanya ada di cache kalau sebelumnya berhasil di-fetch saat online & terautentikasi).

### Deteksi & indikator offline
- Hook `useOnlineStatus()` (`navigator.onLine` + event `online`/`offline`).
- Banner offline global tipis (kuning) di layout utama saat offline.
- Di `LabelPage`: badge "Data dari cache (offline)" saat hasil lookup disajikan tanpa jaringan, plus pesan ramah kalau code belum pernah di-cache.

## Perubahan file

1. **`frontend/package.json`** — tambah devDependency `vite-plugin-pwa` (+ `sharp` untuk generate ikon, dev-only).
2. **`frontend/vite.config.ts`** — daftarkan `VitePWA({ registerType:'autoUpdate', manifest, workbox:{ runtimeCaching } })`. `navigateFallback` hormati SPA. Exclude `/api` dari navigateFallback.
3. **`frontend/public/manifest` + ikon** — `pwa-192.png`, `pwa-512.png`, `pwa-maskable-512.png`, `apple-touch-icon.png`. Digenerate sekali dari `public/assets/images/logo-bmi.jpg` via script `scripts/gen-pwa-icons.mjs` (sharp): logo di-fit ke kanvas brand-color berpadding. Ikon hasil di-commit; script disimpan untuk regen.
4. **`frontend/index.html`** — `<link rel="apple-touch-icon">`, `<meta name="theme-color">`, `<meta name="apple-mobile-web-app-*">`. (manifest link di-inject plugin.)
5. **`frontend/src/main.tsx`** — registrasi SW via `virtual:pwa-register` dengan callback `onNeedRefresh` → toast "Versi baru tersedia, muat ulang" (pakai `react-hot-toast` yang sudah ada). Hanya aktif di production build.
6. **`frontend/src/hooks/useOnlineStatus.ts`** — baru.
7. **`frontend/src/components/common/OfflineBanner.tsx`** — baru; dipasang di layout utama (lokasi: cari komponen layout yang membungkus route terautentikasi).
8. **`frontend/src/pages/inventory/stok/LabelPage.tsx`** — badge offline + fallback message saat lookup gagal offline.
9. **React Query offline:** set `networkMode` default agar query pakai cache saat offline (RQ v5 sudah `online` by default; SW yang menyajikan data, jadi query tetap "sukses" dari cache HTTP). Tidak perlu persister — SW-level cache cukup untuk read-only.
10. **`frontend/src/vite-env.d.ts`** — tambah tipe `virtual:pwa-register` bila perlu.

## Verifikasi
- `npm run build` (tsc + vite) sukses; SW & manifest tergenerate di `dist/`.
- `npm run lint` bersih.
- Manual: `npm run preview`, DevTools → Application → Service Worker terdaftar, Manifest valid, "installable". Set Offline → app shell load, lookup code yang sudah dibuka tampil dari cache, code baru tampil pesan offline.
- Cek unit test existing tetap hijau (`npm run test:run`).
- Lighthouse PWA pass (installable + SW) — best-effort, dicatat.

## Dokumen
- Update `AUDIT-INVENTORY.md`: §7 register INV-N06 → FIXED (scope read-only), §5 matriks PWA/Offline → ✅, tambah §9e ringkas, footer.
- Update memory `audit-inventory-control.md` → 22/22 tertangani.

## Catatan risiko
- **Kamera scan (getUserMedia) butuh HTTPS** di produksi — PWA/SW juga. Deployment nginx saat ini `listen 80`. Ini prasyarat operasional (bukan kode app); akan dicatat sebagai catatan, bukan diubah di sini kecuali diminta.
- **`sharp` native dep**: kalau gagal install di environment, fallback generate ikon PNG via kanvas SVG sederhana (monogram "BMI" brand-color) — hasil tetap valid installable. Akan diputuskan saat eksekusi bila install gagal.
