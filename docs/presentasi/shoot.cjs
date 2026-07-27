/* Skrip screenshot otomatis untuk presentasi BIS.
 * Menggunakan Puppeteer (dependency backend). Login sebagai superadmin,
 * lalu memotret setiap halaman kunci ke docs/presentasi/screenshots.
 *
 * Jalankan dari folder backend:  node ../docs/presentasi/shoot.cjs
 */
const path = require('path');
const puppeteer = require('puppeteer');

const BASE = 'http://localhost:5173';
const OUT = path.resolve(__dirname, 'screenshots');
const NIK = '111111';
const PASS = 'password123';

// Daftar halaman yang dipotret. `wait` = teks/selektor opsional sebelum jepret.
const PAGES = [
  { file: '05-inventory-dashboard', url: '/inventory/dashboard' },
  { file: '06-inventory-produk',    url: '/inventory/master-data/produk' },
  { file: '07-inventory-stok',      url: '/inventory/stok' },
  { file: '08-inventory-transaksi', url: '/inventory/transaksi' },
  { file: '09-inventory-opname',    url: '/inventory/opname' },
  { file: '10-inventory-label',     url: '/inventory/label' },
  { file: '11-inventory-kartu-stok',url: '/inventory/kartu-stok' },
  { file: '12-facility-dashboard',  url: '/facility/dashboard' },
  { file: '13-facility-assets',     url: '/facility/assets' },
  { file: '14-facility-occupants',  url: '/facility/occupants' },
  { file: '15-admin-users',         url: '/settings/users' },
  { file: '16-admin-roles',         url: '/settings/roles' },
];

const KILL_ANIM = `*,*::before,*::after{animation:none!important;transition:none!important;` +
  `animation-duration:0s!important;animation-play-state:paused!important;` +
  `scroll-behavior:auto!important;caret-color:transparent!important;}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    protocolTimeout: 60000,
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(45000);

  // --- LOGIN ---
  console.log('Login...');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('input', { timeout: 20000 });
  const inputs = await page.$$('input');
  // input[0] = NIK, input[1] = password (sesuai urutan form)
  await inputs[0].type(NIK, { delay: 20 });
  await inputs[1].type(PASS, { delay: 20 });
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {}),
    page.click('button[type="submit"], form button'),
  ]);
  await sleep(2500);
  console.log('  URL setelah login:', page.url());

  // --- SHOOT ---
  let ok = 0, fail = 0;
  for (const p of PAGES) {
    try {
      await page.goto(`${BASE}${p.url}`, { waitUntil: 'networkidle2', timeout: 45000 });
      await sleep(2500);
      await page.addStyleTag({ content: KILL_ANIM }).catch(() => {});
      await page.evaluate(() => window.scrollTo(0, 0));
      await sleep(500);
      const out = path.join(OUT, `${p.file}.png`);
      await page.screenshot({ path: out, fullPage: false });
      console.log(`  OK  ${p.file}  <- ${p.url}`);
      ok++;
    } catch (e) {
      console.log(`  ERR ${p.file}  <- ${p.url}  :: ${e.message}`);
      fail++;
    }
  }
  console.log(`\nSelesai: ${ok} ok, ${fail} gagal.`);
  await browser.close();
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
