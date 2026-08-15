const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
async function runTest() {
  console.log("Khởi động trình duyệt để test giao diện...");
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const BASE_URL = 'http://localhost';

  try {
    // 1. Đăng ký tài khoản
    console.log("1. Đang đăng ký tài khoản (browser_user_new1@example.com)...");
    await page.goto(`${BASE_URL}/register`);
    await page.waitForSelector('input[type="text"]', { timeout: 5000 });
    
    const inputs = await page.$$('input');
    await inputs[0].type('UI Tester Real Flow'); // Name
    await inputs[1].type('0999' + Math.floor(100000+Math.random()*900000)); // Phone
    await inputs[2].type('browser_user_new1@example.com'); // Email
    await inputs[3].type('password123'); // Password
    
    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
    
    // 2. Đăng nhập
    console.log("2. Đang đăng nhập...");
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'browser_user_new1@example.com');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
    
    // 3. Vào ví để kích hoạt Webhook
    console.log("3. Truy cập Ví. Đang chờ hệ thống ngân hàng ảo Nạp tiền (Webhook)...");
    await page.goto(`${BASE_URL}/user/wallet`);
    await new Promise(r => setTimeout(r, 6000)); // Đợi auto_funder chạy
    
    // Refresh ví để xem tiền
    await page.goto(`${BASE_URL}/user/wallet`);
    await page.waitForSelector('.bg-white.shadow', { timeout: 10000 }).catch(()=>{});
    await page.screenshot({ path: path.join(__dirname, '..', 'ui_wallet_funded.png') });
    console.log("📸 Đã chụp ảnh màn hình Ví (ui_wallet_funded.png)");

    // 4. Đăng bài
    console.log("4. Tiến hành đăng bài...");
    await page.goto(`${BASE_URL}/post`);
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    await page.type('input[type="text"]', 'Siêu biệt thự View Biển do UI Bot đăng'); // Title
    await page.type('textarea', 'Nhà đẹp lung linh nhìn ra biển lớn.'); // Description
    const numInputs = await page.$$('input[type="number"]');
    if (numInputs.length >= 2) {
      await numInputs[0].type('300'); // Area
      await numInputs[1].type('15000000000'); // Price
    }
    
    // Click submit (ĐĂNG TIN NGAY)
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('ĐĂNG TIN')) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(__dirname, '..', 'ui_post_success.png') });
    console.log("📸 Đã chụp ảnh màn hình Đăng tin (ui_post_success.png)");

    // 5. Vào Admin duyệt bài
    console.log("5. Vào Admin Dashboard (tài khoản đã được nâng cấp Admin bởi auto_funder)...");
    await page.goto(`${BASE_URL}/admin`);
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(__dirname, '..', 'ui_admin_dashboard.png') });
    console.log("📸 Đã chụp ảnh màn hình Admin (ui_admin_dashboard.png)");

    console.log("Hoàn thành bài test UI!");
  } catch (error) {
    console.error("Lỗi trong quá trình test:", error);
    await page.screenshot({ path: path.join(__dirname, '..', 'ui_error.png') });
  } finally {
    await browser.close();
  }
}

runTest();
