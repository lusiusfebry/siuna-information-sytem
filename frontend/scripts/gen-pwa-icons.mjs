// Generates PWA icons from the company logo (INV-N06).
// Run once (or after the logo changes): `node scripts/gen-pwa-icons.mjs`.
// Output PNGs live in public/icons and are committed to the repo.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(root, '../public/assets/images/logo-bmi.jpg');
const OUT = path.resolve(root, '../public/icons');

const BRAND = '#135bec'; // tailwind `primary`

async function makeIcon(size, { maskable = false, file }) {
    // Maskable icons need ~20% safe-zone padding so the logo survives the
    // platform's circular/rounded mask. Standard "any" icons use less padding.
    const pad = maskable ? Math.round(size * 0.2) : Math.round(size * 0.12);
    const inner = size - pad * 2;

    const logo = await sharp(SRC)
        .resize(inner, inner, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toBuffer();

    await sharp({
        create: {
            width: size,
            height: size,
            channels: 4,
            background: maskable ? BRAND : { r: 255, g: 255, b: 255, alpha: 1 },
        },
    })
        .composite([{ input: logo, top: pad, left: pad }])
        .png()
        .toFile(path.join(OUT, file));

    console.log('wrote', file);
}

await mkdir(OUT, { recursive: true });
await makeIcon(192, { file: 'pwa-192.png' });
await makeIcon(512, { file: 'pwa-512.png' });
await makeIcon(512, { maskable: true, file: 'pwa-maskable-512.png' });
await makeIcon(180, { file: 'apple-touch-icon.png' });
console.log('done');
