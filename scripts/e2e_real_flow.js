const fs = require('fs');

async function runE2E() {
  console.log(" Bắt đầu bài Test E2E TOÀN BỘ LUỒNG (Không mock DB)...");
  
  const baseUrl = 'http://localhost:4000'; // Gọi trực tiếp vào backend (Bỏ /api vì nginx map /api/ -> /)
  
  // 1. Đăng ký User
  console.log("\n1️⃣ Đăng ký người dùng mới...");
  const userEmail = `realuser_${Date.now()}@example.com`;
  const registerRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "Khách Hàng Thật",
      phone: "09" + Math.floor(10000000 + Math.random() * 90000000).toString(),
      email: userEmail,
      password: "password123"
    })
  });
  const registerData = await registerRes.json();
  if (!registerRes.ok) throw new Error("Đăng ký lỗi: " + JSON.stringify(registerData));
  console.log(" Đăng ký thành công:", userEmail);

  // 2. Đăng nhập User
  console.log("\n2️⃣ Đăng nhập...");
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail, password: "password123" })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) throw new Error("Đăng nhập lỗi: " + JSON.stringify(loginData));
  const userToken = loginData.access_token;
  console.log(" Đăng nhập thành công, nhận Token.");

  // Lấy User ID
  const profileRes = await fetch(`${baseUrl}/users/profile`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  const profileData = await profileRes.json();
  const userId = profileData.data ? profileData.data.id : profileData.id;
  const initialBalance = profileData.data ? profileData.data.balance : profileData.balance;
  console.log(` Lấy thông tin User ID: ${userId}, Số dư hiện tại: ${initialBalance} VND`);

  // 3. Giả lập SePay gửi Webhook thật qua giao thức HTTP
  console.log("\n3️⃣ SePay gửi Webhook nạp tiền qua HTTP POST...");
  // Đọc sepay webhook token từ DB (cần để nhúng vào header)
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const configArr = await prisma.$queryRaw`SELECT * FROM "SystemSettings" LIMIT 1`;
  const config = configArr[0];
  
  const crypto = require('crypto');
  const rawKey = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012';
  const key = Buffer.from(rawKey.padEnd(32, '0').slice(0, 32));
  
  let token = config.sepayWebhookToken;
  try {
    const [ivHex, encryptedHex] = config.sepayWebhookToken.split(':');
    if (ivHex && encryptedHex) {
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      token = decipher.update(encryptedHex, 'hex', 'utf8') + decipher.final('utf8');
    }
  } catch (err) {
    console.log("Không cần giải mã hoặc lỗi giải mã:", err);
  }

  // Nội dung CK chuẩn như QR code: NAP + mã ID bỏ gạch nối
  const paymentContent = `NAP ${userId.replace(/-/g, '')}`;
  console.log(`   Nội dung chuyển khoản SePay đọc được: "${paymentContent}"`);
  
  const webhookRes = await fetch(`${baseUrl}/payment/webhook/sepay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      id: 99999 + Math.floor(Math.random() * 10000),
      gateway: "Vietcombank",
      transactionDate: new Date().toISOString(),
      accountNumber: config.bankAccount,
      subAccount: null,
      transferAmount: 2000000,
      transferType: "in",
      accumulated: 10000000,
      content: paymentContent,
      referenceCode: `MBB${Date.now()}`
    })
  });
  const webhookData = await webhookRes.json();
  console.log(" Webhook HTTP Status:", webhookRes.status, webhookData);

  // 4. Kiểm tra lại số dư qua API (Không check DB)
  console.log("\n4️⃣ Kiểm tra số dư qua API Wallet...");
  const walletRes = await fetch(`${baseUrl}/users/profile`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  const walletData = await walletRes.json();
  const currentBalance = walletData.data ? walletData.data.balance : walletData.balance;
  console.log(` Số dư mới: ${currentBalance} VND (Tăng ${currentBalance - initialBalance} VND)`);
  if (currentBalance !== initialBalance + 2000000) {
    throw new Error("LỖI: Số dư không được cộng đúng!");
  }

  // 5. Đăng tin BĐS (Trừ tiền)
  console.log("\n5️⃣ Đăng tin BĐS (Phí 10,000 VND)...");
  const postRes = await fetch(`${baseUrl}/properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      title: "Biệt thự siêu VIP E2E",
      description: "Nhà đẹp lung linh",
      price: 5000000000,
      area: 250,
      propertyType: "Nhà riêng",
      transactionType: "Bán",
      city: "Hà Nội",
      district: "Cầu Giấy",
      ward: "Dịch Vọng",
      images: ["/uploads/test.jpg"]
    })
  });
  const postData = await postRes.json();
  if (!postRes.ok) throw new Error("Đăng tin lỗi: " + JSON.stringify(postData));
  const propertyId = postData.id;
  console.log(` Đã tạo bài đăng ID: ${propertyId}. Trạng thái: ${postData.status}`);

  // 6. Đăng ký Admin
  console.log("\n6️⃣ Đăng ký & Cấp quyền Admin...");
  const adminEmail = `admin_${Date.now()}@example.com`;
  await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "System Admin",
      phone: "09" + Math.floor(10000000 + Math.random() * 90000000).toString(),
      email: adminEmail,
      password: "adminpassword"
    })
  });
  
  // Nâng quyền lên ADMIN bằng DB (không có API nâng quyền đăng ký)
  await prisma.user.update({
    where: { email: adminEmail },
    data: { role: 'ADMIN' }
  });

  const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: "adminpassword" })
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.access_token;
  console.log(" Admin đăng nhập thành công.");

  // 7. Admin duyệt bài
  console.log("\n7️⃣ Admin duyệt bài đăng qua API...");
  const approveRes = await fetch(`${baseUrl}/admin/properties/${propertyId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'APPROVED' })
  });
  if (!approveRes.ok) throw new Error("Duyệt bài lỗi: " + await approveRes.text());
  console.log(" Bài đăng đã được DUYỆT (APPROVED).");

  // 8. Khách hàng xem trang chủ
  console.log("\n8️⃣ Khách hàng lấy danh sách bài đăng trang chủ...");
  const feedRes = await fetch(`${baseUrl}/properties?status=APPROVED`);
  const feedData = await feedRes.json();
  const properties = Array.isArray(feedData) ? feedData : feedData.data;
  const found = properties.find(p => p.id === propertyId);
  if (found) {
    console.log(` THÀNH CÔNG: Đã thấy bài đăng "${found.title}" xuất hiện trên trang chủ!`);
  } else {
    throw new Error("LỖI: Không tìm thấy bài đăng trên trang chủ!");
  }

  console.log("\n BÀI KIỂM TRA TOÀN DIỆN HTTP E2E ĐÃ HOÀN TẤT THÀNH CÔNG RỰC RỠ!");
  process.exit(0);
}

runE2E().catch(err => {
  console.error(" E2E Failed:", err);
  process.exit(1);
});
