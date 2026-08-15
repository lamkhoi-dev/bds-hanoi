import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const loc = await prisma.location.findFirst({ where: { name: 'Phường Thành Vinh' } });
  const user = await prisma.user.findFirst();
  
  const prop = await prisma.property.create({
    data: {
      title: 'Bán đất đẹp tại Phường Thành Vinh (Vinh Tân cũ) Nghệ An',
      slug: 'ban-dat-dep-phuong-thanh-vinh-vinh-tan-' + Date.now(),
      description: 'Test property description with Phường Thành Vinh and Vinh Tân',
      transactionType: 'BAN',
      propertyType: 'DAT_NEN',
      city: 'Tỉnh Nghệ An',
      district: 'Thành phố Vinh',
      ward: 'Phường Thành Vinh',
      oldWard: 'Vinh Tân',
      street: 'Đường Lê Mao',
      price: 2500000000,
      priceMin: 2500000000,
      priceMax: 2500000000,
      area: 100,
      areaMin: 100,
      areaMax: 100,
      status: 'APPROVED',
      publishedAt: new Date(),
      locationId: loc ? loc.id : null,
      userId: user ? user.id : '',
      images: ['https://nhadatxunghe.vn/og-image.jpg']
    }
  });
  console.log('Created Property:', prop.id);

  const req = await prisma.requirement.create({
    data: {
      transactionType: 'CAN_MUA',
      propertyType: 'NHA_RIENG',
      name: 'Nguyễn Văn Nam',
      phone: '0987654321',
      content: 'Cần mua nhà để ở',
      status: 'PENDING',
      locationId: loc ? loc.id : null,
    }
  });
  console.log('Created Requirement:', req.id);
}
main().catch(console.error).finally(() => prisma.$disconnect());
