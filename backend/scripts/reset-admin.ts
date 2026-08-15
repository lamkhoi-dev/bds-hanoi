import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('12345678', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@bds.com' },
    update: { password: hashedPassword, status: 'APPROVED' },
    create: {
      email: 'admin@bds.com',
      password: hashedPassword,
      name: 'Quản trị viên',
      phone: '0987654321',
      role: 'ADMIN',
      slug: 'admin-bds',
      status: 'APPROVED',
    }
  });
  console.log('Password reset successfully for admin@bds.com to 12345678');
}

main().catch(console.error).finally(() => prisma.$disconnect());
