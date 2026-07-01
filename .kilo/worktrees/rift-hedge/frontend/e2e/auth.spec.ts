import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });

    test('should allow user to login with valid credentials', async ({ page }) => {
        // Superadmin NIK from seed data
        await page.fill('input[name="nik"]', '111111');
        await page.fill('input[name="password"]', 'password123'); // Default seed password
        await page.click('button[type="submit"]');

        // Should redirect to welcome or dashboard
        await expect(page).toHaveURL(/.*welcome/);
        await expect(page.locator('text=Selamat Datang')).toBeVisible();
    });

    test('should show error on invalid credentials', async ({ page }) => {
        await page.fill('input[name="nik"]', '999999');
        await page.fill('input[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Check for error message
        await expect(page.locator('text=NIK atau password salah')).toBeVisible();
    });

    test('should logout successfully', async ({ page }) => {
        // Login first
        await page.fill('input[name="nik"]', '111111');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*welcome/);

        // Click logout in sidebar or header (assume Sidebar has it)
        // Check for logout button - usually a button with logout text or icon
        await page.goto('/hr/dashboard'); // Go to a page with sidebar
        await page.click('text=Logout'); // Or selector for logout button

        await expect(page).toHaveURL(/.*login/);
    });
});
