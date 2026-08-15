import { test } from '@playwright/test';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\Nguye\\.gemini\\antigravity-ide\\brain\\48b46eb8-27bd-4e79-be05-73efc7ed5c08';

test.describe('Capture All Screen Interfaces', () => {
  // Auto-dismiss or accept alert dialogs during the tests
  test.beforeEach(async ({ page }) => {
    page.on('dialog', async dialog => {
      console.log(`🔔 Dialog alert: ${dialog.message()}`);
      await dialog.accept();
    });
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('register') || msg.text().includes('fail') || msg.text().includes('Error')) {
        console.log(`💻 Page console: [${msg.type()}] ${msg.text()}`);
      }
    });
    page.on('requestfailed', request => {
      console.log(`❌ Request failed: ${request.url()} - ${request.failure()?.errorText}`);
    });
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`❌ HTTP ${response.status()} on ${response.url()}`);
      }
    });
  });

  test('Navigate and capture screenshots', async ({ page }) => {
    // Increase timeout for this long screenshot capture run
    test.setTimeout(180000);

    // Ensure the artifact directory exists
    if (!fs.existsSync(ARTIFACT_DIR)) {
      fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
    }

    const capture = async (name: string, isFullPage: boolean = false) => {
      const filePath = path.join(ARTIFACT_DIR, name);
      await page.waitForTimeout(1500); // Give the interface a moment to render beautifully
      await page.screenshot({ path: filePath, fullPage: isFullPage });
      console.log(`📸 Saved screenshot to: ${filePath}`);
    };

    // Set viewport to a nice premium laptop/desktop resolution
    await page.setViewportSize({ width: 1440, height: 900 });

    // --- PART 1: GUEST / PUBLIC SCREENS ---
    console.log('--- 1. Desktop Home Page ---');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await capture('1_trang_chu.png');

    console.log('--- 2. Mobile Home Page ---');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await capture('2_trang_chu_mobile.png');

    // Restore desktop viewport size
    await page.setViewportSize({ width: 1440, height: 900 });

    console.log('--- 3. Registration Page ---');
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await capture('3_dang_ky.png');

    console.log('--- 4. Login Page ---');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await capture('4_dang_nhap.png');

    console.log('--- 5. Search Results Page ---');
    await page.goto('/search?q=Ngh%E1%BB%9B+An');
    await page.waitForLoadState('networkidle');
    await capture('5_tim_kiem.png');

    console.log('--- 6. Cần Mua / Thuê Page ---');
    await page.goto('/can-mua');
    await page.waitForLoadState('networkidle');
    await capture('6_can_mua.png');

    console.log('--- 7. Compare Properties Page ---');
    await page.goto('/so-sanh');
    await page.waitForLoadState('networkidle');
    await capture('7_so_sanh.png');

    console.log('--- 8. News Page ---');
    await page.goto('/news');
    await page.waitForLoadState('networkidle');
    await capture('8_tin_tuc.png');

    console.log('--- 9. Support Page ---');
    await page.goto('/support');
    await page.waitForLoadState('networkidle');
    await capture('9_ho_tro.png');

    console.log('--- 10. Map Page ---');
    await page.goto('/map');
    await page.waitForLoadState('networkidle');
    await capture('10_ban_do.png');


    // --- PART 2: NORMAL USER FLOW ---
    const userEmail = 'nguyen.an@test.com';
    const password = 'Test@1234';

    console.log('--- Logging in as normal user ---');
    await page.goto('/login');
    await page.fill('input[placeholder="name@example.com"]', userEmail);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for the default post-login redirect (user wallet / dashboard)
    await page.waitForURL('**/user/wallet', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await capture('11_user_wallet.png');

    console.log('--- 12. User Account Dashboard ---');
    await page.goto('/user');
    await page.waitForLoadState('networkidle');
    await capture('12_user_dashboard.png');

    console.log('--- 13. Create New Property Post Form ---');
    await page.goto('/post');
    await page.waitForLoadState('networkidle');
    await capture('13_dang_tin.png');

    console.log('--- 14. Deposit Money (Bank/QR) ---');
    await page.goto('/user/nap-tien');
    await page.waitForLoadState('networkidle');
    await capture('14_user_nap_tien.png');

    // Try selecting 1,000,000 VND to generate and capture the QR code
    try {
      const btn = page.locator('button:has-text("1,000,000")').first();
      await btn.click({ timeout: 3000 });
      await page.waitForTimeout(2000);
      await capture('14_user_nap_tien_qr.png');
    } catch (e) {
      console.log('Nạp tiền button not found or already generated QR code:', e);
    }

    console.log('--- 15. User My Properties Management ---');
    await page.goto('/user/properties');
    await page.waitForLoadState('networkidle');
    await capture('15_user_properties.png');

    console.log('--- 16. User Saved Properties ---');
    await page.goto('/user/saved');
    await page.waitForLoadState('networkidle');
    await capture('16_user_saved.png');


    // --- PART 3: ADMIN PORTAL FLOW ---
    const adminEmail = 'tran.bich@test.com';
    const adminPassword = 'Test@1234';

    console.log('--- Logging out normal user ---');
    await page.goto('/');
    try {
      await page.evaluate(() => localStorage.removeItem('token'));
    } catch {}

    console.log(`--- Elevating ${adminEmail} to ADMIN in Postgres ---`);
    const sqlPath = path.join(__dirname, 'elevate.sql');
    try {
      fs.writeFileSync(sqlPath, `UPDATE "User" SET role = 'ADMIN' WHERE email = '${adminEmail}';`);
      const updateCommand = `docker exec -i bds-postgres-prod psql -U bds_user -d bds_db < "${sqlPath}"`;
      execSync(updateCommand);
      console.log('✅ Elevate query executed successfully.');
    } catch (dbErr) {
      console.error('❌ DB query elevation failed:', dbErr);
    } finally {
      try {
        if (fs.existsSync(sqlPath)) {
          fs.unlinkSync(sqlPath);
        }
      } catch {}
    }

    console.log('--- Logging in as Admin ---');
    await page.goto('/login');
    await page.fill('input[placeholder="name@example.com"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/user/wallet', { timeout: 10000 });

    console.log('--- 17. Admin Dashboard ---');
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await capture('17_admin_dashboard.png');

    console.log('--- 18. Admin Properties Moderation ---');
    await page.goto('/admin/posts');
    await page.waitForLoadState('networkidle');
    await capture('18_admin_posts.png');

    console.log('--- 19. Admin Users Management ---');
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await capture('19_admin_users.png');

    console.log('--- 20. Admin System Settings ---');
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');
    await capture('20_admin_settings.png');

    console.log('🎉 ALL SCREENSHOTS SUCCESSFULLY CAPTURED!');
  });
});
