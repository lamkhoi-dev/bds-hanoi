import { test, expect } from '@playwright/test';

test.describe('Dashboard & Post Flow', () => {
  test('Unauthenticated user is redirected to login when accessing dashboard', async ({ page }) => {
    // Assuming /user is protected
    // If not protected by middleware, it might just show a login message, but usually protected
    await page.goto('/user');
    
    // Check if redirected to login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Unauthenticated user sees login prompt when accessing post page', async ({ page }) => {
    await page.goto('/post');
    // The post page shows a login prompt instead of redirecting
    await expect(page.locator('text=Bạn cần đăng nhập để có thể đăng tin')).toBeVisible();
  });
});
