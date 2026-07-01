import { test, expect } from '@playwright/test';

test.describe('Employee Management', () => {
    test.beforeEach(async ({ page }) => {
        // Login as superadmin
        await page.goto('/login');
        await page.fill('input[name="nik"]', '111111');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*welcome/);
        await page.goto('/hr/employees');
    });

    test('should create a new employee via wizard', async ({ page }) => {
        await page.click('text=Tambah Karyawan');

        // Step 1: Data Personal
        await page.fill('input[name="nomor_induk_karyawan"]', 'E2E' + Date.now());
        await page.fill('input[name="nama_lengkap"]', 'Playwright Test User');

        // Select Divisi (using SearchableSelect which usually has an input or clickable div)
        // Adjust based on SearchableSelect implementation - usually it has a placeholder or label
        await page.click('text=Pilih Divisi');
        await page.click('text=DIVISI IT'); // Example from seed

        await page.click('text=Pilih Departemen');
        await page.click('text=Department IT');

        await page.click('text=Pilih Posisi Jabatan');
        await page.click('text=Software Engineer');

        await page.fill('input[name="tempat_lahir"]', 'Jakarta');
        await page.fill('input[name="tanggal_lahir"]', '1995-12-12');

        await page.click('button:has-text("Lanjut ke Informasi HR")');

        // Step 2: Informasi HR
        await expect(page.locator('text=Informasi HR')).toBeVisible();
        await page.click('text=Pilih Jenis Hubungan Kerja');
        await page.click('text=PKWT');

        await page.fill('input[name="tanggal_masuk"]', '2024-01-01');

        await page.click('button:has-text("Lanjut ke Informasi Keluarga")');

        // Step 3: Data Keluarga
        await expect(page.locator('text=Data Keluarga')).toBeVisible();
        await page.fill('input[name="nama_ayah_kandung"]', 'Father Name');

        await page.click('button:has-text("Simpan Seluruh Data")');

        // Success message and back to list
        await expect(page.locator('text=Karyawan berhasil ditambahkan')).toBeVisible();
        await expect(page).toHaveURL(/.*employees/);
    });

    test('should display employee list', async ({ page }) => {
        await expect(page.locator('h1')).toContainText('Manajemen Karyawan'); // Check header
        // Check for table rows. Virtual table might need specific selector for loaded items.
        // Or wait for a known employee.
    });

    test('should navigate to create employee wizard', async ({ page }) => {
        await page.click('button:has-text("Tambah Karyawan")');
        await expect(page).toHaveURL('/employees/new');
        await expect(page.locator('text=Data Personal')).toBeVisible();
    });

    // Validating full wizard flow requires data entry which is minimal in dummy test
    // test('should complete creating employee', async ({ page }) => { ... });
});
