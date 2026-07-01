import { test, expect } from '@playwright/test';
import path from 'path';
import process from 'process';

test.describe('Import Management', () => {
    test.beforeEach(async ({ page }) => {
        // Login as superadmin
        await page.goto('/login');
        await page.fill('input[name="nik"]', '111111');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*welcome/);
        await page.goto('/hr/import');
    });

    test('should upload and preview excel file', async ({ page }) => {
        // Use path relative to project root (process.cwd())
        const filePath = path.join(process.cwd(), 'e2e/fixtures/BMI-kosong.xlsx');

        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(filePath);

        // Click upload/preview button
        await page.click('button:has-text("Upload & Preview")');

        // Verify preview table visible (assuming it contains data or header)
        await expect(page.locator('table')).toBeVisible();
        await expect(page.locator('text=Preview Data')).toBeVisible();
    });
});
