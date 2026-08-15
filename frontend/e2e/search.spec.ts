import { test, expect } from '@playwright/test';

test.describe('Search Flow', () => {
  test('Search from home page works', async ({ page }) => {
    await page.goto('/');
    
    // Fill search input in hero section
    await page.fill('input[placeholder*="Nhập từ khóa"]', 'Hà Nội');
    await page.click('button:has-text("Tìm kiếm")');
    
    // Should navigate to /search?q=Hà Nội
    await expect(page).toHaveURL(/.*\/search\?q=H%C3%A0\+N%E1%BB%99i/);
    
    // Should see results page
    await expect(page.locator('h1').first()).toContainText('Bất động sản tại Hà Nội');
  });

  test('Mobile Search Filter Toggle', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/search');
    
    // Check if filters are hidden initially
    const categorySelect = page.locator('select[name="category"]');
    await expect(categorySelect).not.toBeVisible();
    
    // Click toggle
    await page.click('text=Lọc tìm kiếm');
    
    // Now it should be visible
    await expect(categorySelect).toBeVisible();
  });
});
