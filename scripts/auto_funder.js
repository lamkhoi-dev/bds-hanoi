const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function fundUser() {
  console.log("Waiting for browser_user_new1@example.com to register...");
  let user = null;
  while (!user) {
    user = await prisma.user.findUnique({ where: { email: 'browser_user_new1@example.com' } });
    if (!user) await new Promise(r => setTimeout(r, 2000));
  }
  console.log("User found! ID:", user.id);
  
  // Fund user via Webhook simulation
  const configArr = await prisma.$queryRaw`SELECT * FROM "SystemSettings" LIMIT 1`;
  const config = configArr[0];
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
  } catch (err) {}

  const paymentContent = `NAP ${user.id.replace(/-/g, '')}`;
  const webhookRes = await fetch(`http://localhost:4000/payment/webhook/sepay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      id: 88888 + Math.floor(Math.random() * 10000),
      gateway: "Vietcombank",
      transactionDate: new Date().toISOString(),
      accountNumber: config.bankAccount,
      subAccount: null,
      transferAmount: 5000000,
      transferType: "in",
      content: paymentContent,
      referenceCode: `MBB${Date.now()}`
    })
  });
  console.log("Webhook status:", webhookRes.status);
  
  // Make user ADMIN so they can approve their own post
  await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } });
  console.log("User funded and made ADMIN!");
}
fundUser();
