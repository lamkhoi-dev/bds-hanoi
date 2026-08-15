import { test, expect } from '@playwright/test';

test.describe('BĐS System E2E Black-box', () => {
  const userEmail = `test_${Date.now()}@example.com`;
  const password = 'Password123!';

  test('Luồng 1: Đăng ký, Đăng nhập và check trang chủ', async ({ page }) => {
    // 1. Đăng ký
    await page.goto('/register');
    await page.fill('input[name="name"]', 'Nguyễn Văn Test');
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    
    // Đợi sang trang login
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');

    // 2. Đăng nhập
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    
    // Đợi sang trang chủ hoặc profile
    await page.waitForLoadState('networkidle');

    // 3. Check trang chủ
    await page.goto('/');
    await expect(page.locator('body')).toContainText('Bất động sản');
  });

  // Note: Để test luồng nạp tiền và đăng tin đầy đủ qua UI, frontend cần phải có các form tương ứng.
  // Vì đây là kiểm thử hộp đen, nếu frontend chưa ráp đủ tính năng thì test UI có thể lỗi, nhưng cơ bản luồng Auth sẽ chạy.
});
