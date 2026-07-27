/* Potret ulang 4 halaman pertama agar rasio seragam 1440x900. */
const path = require('path');
const puppeteer = require('puppeteer');

const BASE = 'http://localhost:5173';
const OUT = path.resolve(__dirname, 'screenshots');
const NIK = '111111';
const PASS = 'password123';
const KILL_ANIM = `*,*::before,*::after{animation:none!important;transition:none!important;` +
  `animation-duration:0s!important;animation-play-state:paused!important;` +
  `scroll-behavior:auto!important;caret-color:transparent!important;}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shoot(page, url, file) {
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle2', timeout: 45000 });
  await sleep(2500);
  await page.addStyleTag({ content: KILL_ANIM }).catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(500);
  await page.screenshot({ path: path.join(OUT, `${file}.png`), fullPage: false });
  console.log(`  OK  ${file}  <- ${url}`);
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    protocolTimeout: 60000,
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(45000);

  // Halaman login (belum auth)
  await shoot(page, '/login', '01-login');

  // Login
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('input', { timeout: 20000 });
  const inputs = await page.$$('input');
  await inputs[0].type(NIK, { delay: 20 });
  await inputs[1].type(PASS, { delay: 20 });
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {}),
    page.click('button[type="submit"], form button'),
  ]);
  await sleep(2500);
  console.log('  URL setelah login:', page.url());

  await shoot(page, '/welcome', '02-welcome-modul');
  await shoot(page, '/dashboard', '03-dashboard-hr');
  await shoot(page, '/hr/employees', '04-hr-karyawan');

  console.log('Selesai.');
  await browser.close();
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
