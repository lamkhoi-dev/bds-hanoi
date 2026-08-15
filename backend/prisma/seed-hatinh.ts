import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding Hà Tĩnh...');
  
  // Create or find Hà Tĩnh province
  let ht = await prisma.location.findFirst({
    where: { name: 'Hà Tĩnh', type: 'CITY' }
  });

  if (!ht) {
    ht = await prisma.location.create({
      data: { name: 'Hà Tĩnh', type: 'CITY', slug: 'ha-tinh' }
    });
  }

  const districts = [
    'Thành phố Hà Tĩnh', 'Thị xã Hồng Lĩnh', 'Thị xã Kỳ Anh',
    'Huyện Can Lộc', 'Huyện Cẩm Xuyên', 'Huyện Đức Thọ',
    'Huyện Hương Khê', 'Huyện Hương Sơn', 'Huyện Kỳ Anh',
    'Huyện Nghi Xuân', 'Huyện Thạch Hà', 'Huyện Vũ Quang'
  ];

  for (const d of districts) {
    const slug = d.toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
    const existing = await prisma.location.findFirst({
      where: { name: d, type: 'DISTRICT', parentId: ht.id }
    });
    if (!existing) {
      await prisma.location.create({
        data: {
          name: d,
          type: 'DISTRICT',
          parentId: ht.id,
          slug: slug
        }
      });
    }
  }

  console.log('Finished seeding Hà Tĩnh!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
