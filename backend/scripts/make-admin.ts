import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'duyatd2@gmail.com'; // Normalize to lowercase
  const password = await bcrypt.hash('123456', 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password,
      role: 'ADMIN',
      status: 'FORCE_CHANGE_PASSWORD',
      emailVerified: true,
    },
    create: {
      email,
      name: 'Admin',
      password,
      role: 'ADMIN',
      status: 'FORCE_CHANGE_PASSWORD',
      emailVerified: true,
    },
  });

  console.log(`User ${email} has been set to ADMIN. Please login to change password.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
