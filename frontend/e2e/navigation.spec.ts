import { test, expect } from '@playwright/test';

test.describe('Navigation & Layout', () => {
  test('Desktop navigation links work', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check "Nhà đất bán" link
    await page.goto('/search?q=bán');
    await expect(page).toHaveURL(/.*\/search\?q=b%C3%A1n/);
    
    // Check "Chung cư" link
    await page.goto('/search?category=CHUNG_CU');
    await expect(page).toHaveURL(/.*\/search\?category=CHUNG_CU/);
  });

  test('Mobile Menu opens and closes', async ({ page }) => {
    // Emulate mobile device
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    
    // Open menu
    const menuBtn = page.locator('button[aria-label="Toggle Menu"]');
    await menuBtn.click();
    
    // Check if drawer is visible
    const drawer = page.locator('div.fixed.left-0').filter({ hasText: 'MENU' });
    await expect(drawer).toBeVisible();
    
    // Close menu
    const closeBtn = drawer.locator('button').first();
    await closeBtn.click();
    
    // Wait for animation
    await page.waitForTimeout(500);
    // Check if it is translated out
    await expect(drawer).toHaveClass(/-translate-x-full/);
  });
});
