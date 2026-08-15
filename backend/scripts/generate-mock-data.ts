import { PrismaClient, PropertyStatus, PropertyTier, Role, TransactionType, TransactionStatus } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function generateSlug(text: string): string {
  return text.toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randElement<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng'];
const middleNames = ['Văn', 'Thị', 'Đức', 'Hữu', 'Ngọc', 'Thanh', 'Minh', 'Hải', 'Xuân'];
const lastNames = ['Hùng', 'Hương', 'Linh', 'Long', 'Anh', 'Bình', 'Dũng', 'Hà', 'Khang', 'Khoa'];

function randName() {
  return `${randElement(firstNames)} ${randElement(middleNames)} ${randElement(lastNames)}`;
}

async function main() {
  console.log('Starting manual mock data generation...');

  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!adminUser) throw new Error('No admin user found. Please run seed first.');

  const categories = await prisma.category.findMany();
  const locations = await prisma.location.findMany();
  
  const wards = locations.filter(l => l.type === 'WARD');
  if (categories.length === 0 || wards.length === 0) {
    throw new Error('Categories or Wards are empty. Run seed first.');
  }

  console.log('Generating Users...');
  const users: any[] = [];
  for (let i = 0; i < 15; i++) {
    const user = await prisma.user.create({
      data: {
        email: `mockuser${i}@example.com`,
        phone: `09${randInt(10000000, 99999999)}`,
        username: `mockuser${i}`,
        name: randName(),
        slug: crypto.randomUUID(),
        role: i < 2 ? Role.MOD : Role.USER,
        balance: randInt(1, 100) * 100000,
        status: 'ACTIVE'
      }
    });
    users.push(user);
  }

  console.log('Generating Properties...');
  const properties: any[] = [];
  const propertyTypes = ['DAT_NEN', 'NHA_RIENG', 'CHUNG_CU', 'DU_AN'];
  const mockImages = [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'
  ];

  for (let i = 0; i < 50; i++) {
    const user = randElement(users);
    const category = randElement(categories);
    const ward = randElement(wards);
    const district = locations.find(l => l.id === ward.parentId);
    const city = locations.find(l => l.id === district?.parentId);
    
    const isSale = Math.random() > 0.3;
    const transactionType = isSale ? 'BAN' : 'CHO_THUE';
    const propertyType = randElement(propertyTypes);

    const title = `${isSale ? 'Bán' : 'Cho thuê'} ${propertyType === 'DAT_NEN' ? 'lô đất cực đẹp' : 'căn nhà đầy đủ tiện nghi'} tại ${ward.name}`;
    const price = randInt(500, 10000) * 1000000;
    const area = randInt(40, 200);

    const pImgs = [randElement(mockImages), randElement(mockImages), randElement(mockImages)];

    const property = await prisma.property.create({
      data: {
        title,
        description: `Bất động sản chính chủ, pháp lý rõ ràng. Diện tích ${area}m2. Vị trí vô cùng đắc địa tại ${ward.name}, ${district?.name}. Liên hệ ngay để xem nhà: ${user.phone}`,
        transactionType,
        propertyType,
        categoryId: category.id,
        city: city?.name,
        district: district?.name,
        ward: ward.name,
        provinceId: city?.id,
        districtId: district?.id,
        wardId: ward.id,
        locationId: ward.id,
        price,
        area,
        priceMin: price,
        priceMax: price,
        areaMin: area,
        areaMax: area,
        pricePerM2: price / area,
        pricePerM2Display: `≈${Math.round((price / area) / 1000000)}tr/m²`,
        status: randElement([PropertyStatus.APPROVED, PropertyStatus.APPROVED, PropertyStatus.PENDING, PropertyStatus.SOLD]),
        tier: randElement([PropertyTier.NORMAL, PropertyTier.UP, PropertyTier.VIP]),
        userId: user.id,
        slug: generateSlug(title) + '-' + crypto.randomBytes(3).toString('hex'),
        propertyCode: 'BDS-' + crypto.randomBytes(3).toString('hex').toUpperCase(),
        publishedAt: new Date(),
        pushedAt: new Date(),
        views: randInt(10, 500),
        likes: randInt(0, 50),
        isNegotiable: Math.random() > 0.5,
        images: pImgs,
        thumbnail: pImgs[0]
      }
    });
    properties.push(property);

    await prisma.propertyImage.createMany({
      data: property.images.map((url, idx) => ({
        propertyId: property.id,
        url,
        sortOrder: idx,
        isThumbnail: idx === 0
      }))
    });
  }

  console.log('Generating Transactions...');
  for (const user of users) {
    const txCount = randInt(1, 4);
    for (let i = 0; i < txCount; i++) {
      const amount = randInt(10, 500) * 1000;
      const type = randElement([TransactionType.DEPOSIT, TransactionType.DEDUCT]);
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type,
          amount,
          description: type === TransactionType.DEPOSIT ? 'Nạp tiền vào tài khoản' : 'Thanh toán dịch vụ',
          status: TransactionStatus.SUCCESS,
          referenceId: 'TX-' + crypto.randomBytes(4).toString('hex').toUpperCase()
        }
      });
    }
  }

  console.log('Generating Interactions...');
  for (const user of users) {
    const numSaved = randInt(0, 3);
    for (let i = 0; i < numSaved; i++) {
      await prisma.savedPost.create({ data: { userId: user.id, propertyId: randElement(properties).id } }).catch(() => {});
    }

    const numViewed = randInt(2, 5);
    for (let i = 0; i < numViewed; i++) {
      await prisma.viewedProperty.create({ data: { userId: user.id, propertyId: randElement(properties).id } }).catch(() => {});
    }
  }

  console.log('Generating Comments and Reports...');
  for (let i = 0; i < 20; i++) {
    await prisma.comment.create({
      data: {
        userId: randElement(users).id,
        propertyId: randElement(properties).id,
        content: randElement(['Nhà đẹp quá!', 'Cho mình xin thêm ảnh sổ', 'Giá có bớt không?', 'Vị trí này ngập nước không?'])
      }
    });

    if (Math.random() > 0.7) {
      await prisma.report.create({
        data: {
          userId: randElement(users).id,
          propertyId: randElement(properties).id,
          reason: randElement(['Spam', 'Sai thông tin', 'Lừa đảo', 'Đã bán']),
          status: 'PENDING'
        }
      });
    }
  }

  console.log('Generating Admin Logs...');
  for (let i = 0; i < 10; i++) {
    const prop = randElement(properties);
    await prisma.adminActionLog.create({
      data: {
        adminId: adminUser.id,
        actionType: 'APPROVE_PROPERTY',
        targetId: prop.id,
        targetType: 'PROPERTY',
        description: `Đã duyệt bài đăng ${prop.title}`
      }
    });
  }

  console.log('Mock data generation completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
