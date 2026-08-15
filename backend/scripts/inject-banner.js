const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.systemSettings.update({
    where: { id: 'default_settings' },
    data: {
      homeBannerUrl: '/images/banner.png',
      homeBannerLink: '/post',
      isHomeBannerActive: true
    }
  });
  console.log('Banner injected successfully');
}
main().catch(console.error).finally(() => prisma.$disconnect());
