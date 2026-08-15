const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@bds.com';
  const plainPassword = 'admin';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN', password: hashedPassword },
    create: {
      email,
      password: hashedPassword,
      name: 'Admin User',
      phone: '0123456789',
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });

  console.log('Admin created: ' + admin.email + ' / ' + plainPassword);
}
main().catch(console.error).finally(() => prisma.$disconnect());
