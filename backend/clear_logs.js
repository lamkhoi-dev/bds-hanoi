const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.backupLog.deleteMany({}).then(res => {
  console.log('Deleted ' + res.count + ' logs');
  prisma.$disconnect();
});
