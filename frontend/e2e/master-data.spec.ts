import { test, expect } from '@playwright/test';

test.describe('Master Data Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="nik"]', '111111');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*welcome/);
        await page.goto('/hr/master/divisi');
    });

    test('should display master data table', async ({ page }) => {
        await expect(page.locator('table')).toBeVisible();
        await expect(page.locator('text=Daftar Divisi')).toBeVisible();
    });

    test('should allow creating new master data', async ({ page }) => {
        await page.click('text=Tambah');
        await page.fill('input[name="nama"]', 'E2E New Divisi');
        await page.fill('input[name="keterangan"]', 'E2E Test Description');
        await page.click('button[type="submit"]');

        await expect(page.locator('text=Data berhasil disimpan')).toBeVisible();
        await expect(page.locator('text=E2E New Divisi')).toBeVisible();
    });
});
