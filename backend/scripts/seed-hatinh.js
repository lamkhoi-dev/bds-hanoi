const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const generateSlugLocal = (text) => {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

async function main() {
  console.log('Starting Ha Tinh seeding...');

  let city = await prisma.location.findFirst({
    where: { name: 'Hà Tĩnh', type: 'CITY' }
  });

  if (!city) {
    city = await prisma.location.create({
      data: { name: 'Hà Tĩnh', type: 'CITY', slug: 'ha-tinh' }
    });
    console.log('Created city: Hà Tĩnh');
  }

  const districts = [
    'Thành phố Hà Tĩnh',
    'Thị xã Hồng Lĩnh',
    'Thị xã Kỳ Anh',
    'Huyện Cẩm Xuyên',
    'Huyện Can Lộc',
    'Huyện Đức Thọ',
    'Huyện Hương Khê',
    'Huyện Hương Sơn',
    'Huyện Kỳ Anh',
    'Huyện Nghi Xuân',
    'Huyện Thạch Hà',
    'Huyện Vũ Quang'
  ];

  for (const d of districts) {
    let district = await prisma.location.findFirst({
      where: { name: d, type: 'DISTRICT', parentId: city.id }
    });

    if (!district) {
      await prisma.location.create({
        data: {
          name: d,
          type: 'DISTRICT',
          slug: generateSlugLocal(d),
          parentId: city.id
        }
      });
      console.log('Created district: ' + d);
    } else {
      console.log('Already exists: ' + d);
    }
  }

  console.log('Ha Tinh seeding completed!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
