import { test, expect } from '@playwright/test';

test.describe('Property Details Flow', () => {
  test('Can view property details from home page', async ({ page }) => {
    await page.goto('/');
    
    // Find the first property card and click it
    const firstProperty = page.locator('.card-lift').first();
    
    // Check if there are properties loaded
    if (await firstProperty.count() > 0) {
      await firstProperty.click();
      
      // Wait for navigation
      await expect(page).toHaveURL(/.*\/tin\/.+/);
      
      // Check for elements in property page
      await expect(page.locator('h1')).toBeVisible(); // Title
      await expect(page.locator('text=Thông tin mô tả')).toBeVisible();
    } else {
      console.log('No properties found on homepage to click.');
    }
  });
});
