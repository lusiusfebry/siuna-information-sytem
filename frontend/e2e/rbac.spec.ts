import { test, expect } from '@playwright/test';

test.describe('Role Based Access Control', () => {
    test('superadmin should see user management', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="nik"]', '111111'); // Superadmin
        await page.fill('input[name="password"]', 'password123');
        await page.click('button:has-text("Masuk")');
        await page.waitForURL(/.*welcome/);

        // Sidebar should have User Management
        await expect(page.locator('text=Kelola User')).toBeVisible();
        await expect(page.locator('text=Role & Permission')).toBeVisible();
    });

    test('regular employee should NOT see user management', async ({ page }) => {
        // Login as someone else (employee)
        // Assume NIK 123456 is a regular employee in seed
        await page.goto('/login');
        await page.fill('input[name="nik"]', '123456');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button:has-text("Masuk")');
        await page.waitForURL(/.*welcome/);

        // Sidebar should NOT have User Management
        await expect(page.locator('text=Kelola User')).not.toBeVisible();
        await expect(page.locator('text=Role & Permission')).not.toBeVisible();
    });
});
