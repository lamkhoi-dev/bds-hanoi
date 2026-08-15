require('dotenv').config({ path: './backend/.env' });
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();
const API_URL = 'http://127.0.0.1:4000';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

function decrypt(text) {
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

async function runTest() {
  try {
    console.log('1. Đang tạo User test...');
    const user = await prisma.user.create({
      data: {
        email: `sepay_test_${Date.now()}@test.com`,
        password: '123',
        name: 'SePay Tester',
        balance: 0,
      }
    });
    console.log(` Đã tạo user: ${user.id} với số dư ban đầu: ${user.balance} VND`);

    console.log('\n2. Đang đọc cấu hình SePay từ DB...');
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'default_settings' }
    });
    
    let tokenToUse = 'E4ACMX43EW3PWQ6ZZYDIL59FFYWN8D51A9MTUFKXGYFEKGPHYULNJSOBRIDHNX1Q';
    console.log('️ Cấu hình Webhook Token thành token do người dùng cung cấp...');
    // Mã hóa token
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(tokenToUse);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const encryptedToken = iv.toString('hex') + ':' + encrypted.toString('hex');
    
    await prisma.systemSettings.upsert({
      where: { id: 'default_settings' },
      create: { sepayWebhookToken: encryptedToken },
      update: { sepayWebhookToken: encryptedToken }
    });
    console.log(' Đã chuẩn bị Webhook Token xác thực.');

    console.log('\n3. Mô phỏng SePay gửi Webhook nạp 500,000 VND...');
    const sepayPayload = {
      id: Math.floor(Math.random() * 1000000), // ID Giao dịch ngẫu nhiên
      gateway: 'Vietcombank',
      transactionDate: '2026-05-23 10:00:00',
      accountNumber: '123456789',
      subAccount: null,
      transferAmount: 500000,
      transferType: 'in',
      accumulated: 1500000,
      content: `NAP ${user.id.replace(/-/g, '')}`, // Nội dung cú pháp chuẩn
      referenceCode: 'MBB123456',
    };

    const response = await fetch(`${API_URL}/payment/webhook/sepay`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenToUse}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sepayPayload)
    });
    
    const responseData = await response.json();
    console.log(' Kết quả từ Webhook API:', responseData);

    console.log('\n4. Kiểm tra lại số dư trong Database...');
    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    console.log(` Số dư của User hiện tại: ${updatedUser.balance} VND`);

    if (updatedUser.balance === 500000) {
      console.log(' BÀI KIỂM TRA SEPAY HOÀN TOÀN THÀNH CÔNG!');
    } else {
      console.log(' THẤT BẠI: Số dư không được cập nhật đúng!');
    }
    
    // Cleanup
    await prisma.user.delete({ where: { id: user.id } });
  } catch (err) {
    console.error(' Lỗi:', err.response ? err.response.data : err.message);
  }
}

runTest();
