import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function main() {
  console.log('=== BẮT ĐẦU SEED DỮ LIỆU ===');

  // ============ LOCATIONS ============
  console.log('Seeding locations...');
  await prisma.location.deleteMany();

  const city = await prisma.location.create({
    data: { name: 'Nghệ An', type: 'CITY' }
  });

  const districts = [
    {
      "name": "Huyện Anh Sơn",
      "wards": ["Xã Anh Sơn", "Xã Yên Xuân", "Xã Nhân Hoà", "Xã Anh Sơn Đông", "Xã Vĩnh Tường", "Xã Thành Bình Thọ"]
    },
    {
      "name": "Huyện Con Cuông",
      "wards": ["Xã Con Cuông", "Xã Môn Sơn", "Xã Mậu Thạch", "Xã Cam Phục", "Xã Châu Khê", "Xã Bình Chuẩn"]
    },
    {
      "name": "Huyện Diễn Châu",
      "wards": ["Xã Diễn Châu", "Xã Đức Châu", "Xã Quảng Châu", "Xã Hải Châu", "Xã Tân Châu", "Xã An Châu", "Xã Minh Châu", "Xã Hùng Châu"]
    },
    {
      "name": "Huyện Đô Lương",
      "wards": ["Xã Đô Lương", "Xã Bạch Ngọc", "Xã Văn Hiến", "Xã Bạch Hà", "Xã Thuần Trung", "Xã Lương Sơn"]
    },
    {
      "name": "Thị xã Hoàng Mai",
      "wards": ["Phường Hoàng Mai", "Phường Tân Mai", "Phường Quỳnh Mai"]
    },
    {
      "name": "Huyện Hưng Nguyên",
      "wards": ["Xã Hưng Nguyên", "Xã Yên Trung", "Xã Hưng Nguyên Nam", "Xã Lam Thành"]
    },
    {
      "name": "Huyện Kỳ Sơn",
      "wards": ["Xã Mường Xén", "Xã Hữu Kiệm", "Xã Nậm Cắn", "Xã Chiêu Lưu", "Xã Na Loi", "Xã Mường Típ", "Xã Na Ngoi", "Xã Mỹ Lý", "Xã Bắc Lý", "Xã Keng Đu", "Xã Huồi Tụ", "Xã Mường Lống"]
    },
    {
      "name": "Huyện Nam Đàn",
      "wards": ["Xã Vạn An", "Xã Nam Đàn", "Xã Đại Huệ", "Xã Thiên Nhẫn", "Xã Kim Liên"]
    },
    {
      "name": "Huyện Nghĩa Đàn",
      "wards": ["Xã Nghĩa Đàn", "Xã Nghĩa Thọ", "Xã Nghĩa Lâm", "Xã Nghĩa Mai", "Xã Nghĩa Hưng", "Xã Nghĩa Khánh", "Xã Nghĩa Lộc"]
    },
    {
      "name": "Huyện Nghi Lộc",
      "wards": ["Xã Nghi Lộc", "Xã Phúc Lộc", "Xã Đông Lộc", "Xã Trung Lộc", "Xã Thần Lĩnh", "Xã Hải Lộc", "Xã Văn Kiều"]
    },
    {
      "name": "Huyện Quế Phong",
      "wards": ["Xã Quế Phong", "Xã Tiền Phong", "Xã Tri Lễ", "Xã Mường Quàng", "Xã Thông Thụ"]
    },
    {
      "name": "Huyện Quỳ Châu",
      "wards": ["Xã Quỳ Châu", "Xã Châu Tiến", "Xã Hùng Chân", "Xã Châu Bình"]
    },
    {
      "name": "Huyện Quỳ Hợp",
      "wards": ["Xã Quỳ Hợp", "Xã Tam Hợp", "Xã Châu Lộc", "Xã Châu Hồng", "Xã Mường Ham", "Xã Mường Chọng", "Xã Minh Hợp"]
    },
    {
      "name": "Huyện Quỳnh Lưu",
      "wards": ["Xã Quỳnh Lưu", "Xã Quỳnh Văn", "Xã Quỳnh Anh", "Xã Quỳnh Tam", "Xã Quỳnh Phú", "Xã Quỳnh Sơn", "Xã Quỳnh Thắng"]
    },
    {
      "name": "Huyện Tân Kỳ",
      "wards": ["Xã Tân Kỳ", "Xã Tân Phú", "Xã Tân An", "Xã Nghĩa Đồng", "Xã Giai Xuân", "Xã Nghĩa Hành", "Xã Tiên Đồng"]
    },
    {
      "name": "Thị xã Thái Hoà",
      "wards": ["Phường Thái Hoà", "Phường Tây Hiếu", "Xã Đông Hiếu"]
    },
    {
      "name": "Huyện Thanh Chương",
      "wards": ["Xã Cát Ngạn", "Xã Tam Đồng", "Xã Hạnh Lâm", "Xã Sơn Lâm", "Xã Hoa Quân", "Xã Kim Bảng", "Xã Bích Hào", "Xã Đại Đồng", "Xã Xuân Lâm"]
    },
    {
      "name": "Huyện Tương Dương",
      "wards": ["Xã Tam Quang", "Xã Tam Thái", "Xã Tương Dương", "Xã Lượng Minh", "Xã Yên Na", "Xã Yên Hoà", "Xã Nga My", "Xã Hữu Khuông", "Xã Nhôn Mai"]
    },
    {
      "name": "Thành phố Vinh",
      "wards": ["Phường Trường Vinh", "Phường Thành Vinh", "Phường Vinh Hưng", "Phường Vinh Phú", "Phường Vinh Lộc", "Phường Cửa Lò"]
    },
    {
      "name": "Huyện Yên Thành",
      "wards": ["Xã Yên Thành", "Xã Quan Thành", "Xã Hợp Minh", "Xã Vân Tụ", "Xã Vân Du", "Xã Quang Đồng", "Xã Giai Lạc", "Xã Bình Minh", "Xã Đông Thành"]
    }
  ];

  // Build location map for property references
  const locationMap: Record<string, { districtId: string; wards: Record<string, string> }> = {};

  for (const d of districts) {
    const districtNode = await prisma.location.create({
      data: {
        name: d.name,
        type: 'DISTRICT',
        parentId: city.id
      }
    });

    locationMap[d.name] = { districtId: districtNode.id, wards: {} };

    for (const w of d.wards) {
      const wardNode = await prisma.location.create({
        data: {
          name: w,
          type: 'WARD',
          parentId: districtNode.id
        }
      });
      locationMap[d.name].wards[w] = wardNode.id;
    }
  }

  // Seed old wards for specific districts
  const oldWardsMap: Record<string, string[]> = {
    'Thành phố Vinh': ['Hồng Sơn', 'Vinh Tân', 'Lê Mao', 'Lê Lợi', 'Quang Trung', 'Đội Cung', 'Bến Thủy', 'Trường Thi', 'Hưng Bình'],
    'Huyện Diễn Châu': ['Xã Diễn Bình', 'Xã Diễn Minh', 'Xã Diễn Thắng', 'Xã Diễn Ngọc', 'Xã Diễn Bích'],
    'Huyện Quỳnh Lưu': ['Xã Quỳnh Hưng', 'Xã Quỳnh Bá', 'Xã Quỳnh Ngọc']
  };

  for (const [districtName, oldWards] of Object.entries(oldWardsMap)) {
    if (locationMap[districtName]) {
      const districtId = locationMap[districtName].districtId;
      for (const w of oldWards) {
        await prisma.location.create({
          data: {
            name: w,
            type: 'OLD_WARD',
            parentId: districtId
          }
        });
      }
    }
  }

  console.log('Seed Location Nghệ An thành công (Bao gồm Phường/Xã cũ)!');

  // ============ ADMIN ACCOUNT ============
  console.log('Seeding admin account...');
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@bds.com';
  let adminPassword = process.env.SEED_ADMIN_PASSWORD;

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    if (!adminPassword) {
      const crypto = require('crypto');
      adminPassword = crypto.randomBytes(9).toString('base64').replace(/\+/g, 'x').replace(/\//g, 'y');
    }

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Quản trị viên',
        phone: '0987654321',
        role: 'ADMIN',
        slug: 'admin-bds',
        status: 'FORCE_CHANGE_PASSWORD',
      }
    });
    console.log(`Admin account created: ${adminEmail} / ${adminPassword}`);
    console.log('IMPORTANT: Please save this password. You will be forced to change it on your first login.');
  }

  // ============ SEED USERS ============
  console.log('Seeding users...');
  const bcrypt = require('bcrypt');
  const defaultPass = await bcrypt.hash('Test@1234', 10);

  const usersData = [
    { name: 'Nguyễn Văn An', email: 'nguyen.an@test.com', phone: '0901234001', slug: 'nguyen-van-an' },
    { name: 'Trần Thị Bích', email: 'tran.bich@test.com', phone: '0901234002', slug: 'tran-thi-bich' },
    { name: 'Lê Hoàng Cường', email: 'le.cuong@test.com', phone: '0901234003', slug: 'le-hoang-cuong' },
    { name: 'Phạm Minh Đức', email: 'pham.duc@test.com', phone: '0901234004', slug: 'pham-minh-duc' },
    { name: 'Hoàng Thị E', email: 'hoang.e@test.com', phone: '0901234005', slug: 'hoang-thi-e' },
    { name: 'Vũ Quang Phát', email: 'vu.phat@test.com', phone: '0901234006', slug: 'vu-quang-phat' },
    { name: 'Đặng Ngọc Giang', email: 'dang.giang@test.com', phone: '0901234007', slug: 'dang-ngoc-giang' },
    { name: 'Bùi Thanh Hà', email: 'bui.ha@test.com', phone: '0901234008', slug: 'bui-thanh-ha' },
    { name: 'Ngô Anh Khoa', email: 'ngo.khoa@test.com', phone: '0901234009', slug: 'ngo-anh-khoa' },
    { name: 'Đinh Thị Lan', email: 'dinh.lan@test.com', phone: '0901234010', slug: 'dinh-thi-lan' },
  ];

  const users: any[] = [];
  for (const u of usersData) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      const created = await prisma.user.create({
        data: {
          email: u.email,
          password: defaultPass,
          name: u.name,
          phone: u.phone,
          slug: u.slug,
          role: 'USER',
          status: 'ACTIVE',
          emailVerified: true,
        }
      });
      users.push(created);
    } else {
      users.push(existing);
    }
  }
  console.log(`Created/Found ${users.length} users`);

  // ============ SEED PROPERTIES ============
  console.log('Seeding properties...');

  const propertiesData = [
    // ===== TP VINH (khu vực hot nhất) =====
    {
      title: 'Bán đất nền mặt tiền đường Quang Trung, Phường Trường Vinh, TP Vinh',
      description: 'Lô đất nền mặt tiền đường Quang Trung, vị trí đắc địa, phù hợp kinh doanh buôn bán. Đất sổ đỏ chính chủ, pháp lý rõ ràng. Xung quanh có đầy đủ tiện ích: gần bệnh viện, trường học, chợ. Đường trước mặt rộng 12m, thuận tiện đi lại. Giá cả hợp lý, liên hệ trực tiếp để được tư vấn.',
      transactionType: 'BAN', propertyType: 'DAT_NEN', district: 'Thành phố Vinh', ward: 'Phường Trường Vinh',
      priceRangeKey: '2B_3B', areaRangeKey: '100_150', direction: 'Đông Nam', legal: 'Có sổ đỏ',
      frontage: 5, roadWidth: 12, surroundings: 'Gần bệnh viện, Gần trường học, Gần chợ',
    },
    {
      title: 'Bán nhà riêng 3 tầng tại Phường Thành Vinh, TP Vinh',
      description: 'Nhà riêng 3 tầng kiên cố, thiết kế hiện đại, nội thất đầy đủ. 4 phòng ngủ, 3 phòng vệ sinh. Sân rộng để xe ô tô. Khu dân cư an ninh, yên tĩnh. Gần trung tâm thành phố, đi bộ 5 phút đến chợ, gần trường tiểu học. Sổ đỏ đầy đủ, sang tên nhanh chóng.',
      transactionType: 'BAN', propertyType: 'NHA_RIENG', district: 'Thành phố Vinh', ward: 'Phường Thành Vinh',
      priceRangeKey: '3B_5B', areaRangeKey: '80_100', direction: 'Nam', legal: 'Đầy đủ',
      bedrooms: 4, bathrooms: 3, floors: 3, furniture: 'Đầy đủ', frontage: 4.5, roadWidth: 6,
      surroundings: 'Gần trường học, Gần chợ, Gần UBND',
    },
    {
      title: 'Cho thuê căn hộ chung cư Vinh Hưng, 2PN, nội thất cơ bản',
      description: 'Cho thuê căn hộ chung cư tại Phường Vinh Hưng, tầng 8, view đẹp nhìn ra thành phố. 2 phòng ngủ, 1 phòng khách rộng rãi, bếp và vệ sinh riêng biệt. Nội thất cơ bản bao gồm điều hòa, bình nóng lạnh, tủ bếp. An ninh 24/7, có thang máy, bãi đỗ xe rộng.',
      transactionType: 'CHO_THUE', propertyType: 'CHUNG_CU', district: 'Thành phố Vinh', ward: 'Phường Vinh Hưng',
      priceRangeKey: '5M_10M', areaRangeKey: '50_80', direction: 'Đông', legal: 'Có hợp đồng',
      bedrooms: 2, bathrooms: 1, floors: 8, furniture: 'Cơ bản',
      surroundings: 'Gần bệnh viện, Gần đường lớn',
    },
    {
      title: 'Bán đất nền KDC Vinh Phú, giá tốt, sổ đỏ trao tay',
      description: 'Bán lô đất nền khu dân cư Vinh Phú, TP Vinh. Vị trí đẹp, đường rộng 8m. Đất đã san lấp bằng phẳng, hạ tầng hoàn thiện: điện, nước, cống thoát nước. Phù hợp xây nhà ở hoặc đầu tư sinh lời. Giá rẻ hơn thị trường 10%, sổ đỏ trao tay ngay.',
      transactionType: 'BAN', propertyType: 'DAT_NEN', district: 'Thành phố Vinh', ward: 'Phường Vinh Phú',
      priceRangeKey: '1B_2B', areaRangeKey: '80_100', direction: 'Bắc', legal: 'Có sổ đỏ',
      frontage: 5, roadWidth: 8, surroundings: 'Gần đường lớn, Gần trường học',
    },
    {
      title: 'Cho thuê mặt bằng kinh doanh Phường Vinh Lộc, TP Vinh',
      description: 'Cho thuê mặt bằng kinh doanh vị trí đắc địa tại Phường Vinh Lộc. Diện tích rộng rãi, phù hợp mở quán cà phê, nhà hàng, cửa hàng thời trang. Mặt tiền rộng 8m, đường trước 15m. Khu vực đông dân cư, nhiều khách qua lại. Giá thuê hợp lý, hợp đồng dài hạn.',
      transactionType: 'CHO_THUE', propertyType: 'MAT_BANG', district: 'Thành phố Vinh', ward: 'Phường Vinh Lộc',
      priceRangeKey: '10M_40M', areaRangeKey: '100_150', direction: 'Đông Nam', legal: 'Có hợp đồng',
      frontage: 8, roadWidth: 15, surroundings: 'Gần chợ, Gần đường lớn, Gần UBND',
    },
    {
      title: 'Bán nhà mặt phố Cửa Lò, kinh doanh homestay',
      description: 'Nhà mặt phố Cửa Lò, phù hợp kinh doanh homestay, khách sạn mini. 5 phòng ngủ rộng rãi, 4 phòng vệ sinh. View biển đẹp. Khu vực du lịch sầm uất, lượng khách quanh năm. Đã hoạt động homestay được 3 năm, doanh thu ổn định. Sổ đỏ, pháp lý hoàn chỉnh.',
      transactionType: 'BAN', propertyType: 'NHA_RIENG', district: 'Thành phố Vinh', ward: 'Phường Cửa Lò',
      priceRangeKey: '5B_7B', areaRangeKey: '150_200', direction: 'Đông', legal: 'Đầy đủ',
      bedrooms: 5, bathrooms: 4, floors: 4, furniture: 'Đầy đủ', frontage: 6, roadWidth: 10,
      surroundings: 'Gần đường lớn',
    },

    // ===== THỊ XÃ HOÀNG MAI =====
    {
      title: 'Bán đất nền Phường Hoàng Mai, gần trung tâm thị xã',
      description: 'Lô đất nền tại Phường Hoàng Mai, Thị xã Hoàng Mai. Vị trí thuận lợi gần trung tâm hành chính, bệnh viện, trường học. Đất sổ đỏ, hạ tầng đầy đủ. Mặt tiền rộng, đường nhựa 6m. Phù hợp xây nhà ở, kinh doanh nhỏ.',
      transactionType: 'BAN', propertyType: 'DAT_NEN', district: 'Thị xã Hoàng Mai', ward: 'Phường Hoàng Mai',
      priceRangeKey: '500M_1B', areaRangeKey: '100_150', direction: 'Nam', legal: 'Có sổ đỏ',
      frontage: 5, roadWidth: 6, surroundings: 'Gần bệnh viện, Gần trường học, Gần UBND',
    },
    {
      title: 'Bán nhà 2 tầng mới xây Phường Tân Mai, Hoàng Mai',
      description: 'Nhà 2 tầng mới xây, thiết kế hiện đại, thoáng mát. 3 phòng ngủ, 2 WC. Sân trước rộng, có vườn cây xanh. Khu vực yên tĩnh, an ninh tốt. Gần chợ, trường học. Giá bán tốt cho gia đình trẻ.',
      transactionType: 'BAN', propertyType: 'NHA_RIENG', district: 'Thị xã Hoàng Mai', ward: 'Phường Tân Mai',
      priceRangeKey: '1B_2B', areaRangeKey: '80_100', direction: 'Tây Nam', legal: 'Có sổ đỏ',
      bedrooms: 3, bathrooms: 2, floors: 2, furniture: 'Cơ bản', frontage: 4, roadWidth: 5,
      surroundings: 'Gần chợ, Gần trường học',
    },
    {
      title: 'Cho thuê nhà nguyên căn Phường Quỳnh Mai, Hoàng Mai',
      description: 'Cho thuê nhà nguyên căn 2 tầng, 3 phòng ngủ, 2 WC. Nội thất cơ bản, điều hòa, bình nóng lạnh. Phù hợp gia đình hoặc văn phòng nhỏ. Gần chợ Hoàng Mai, đi bộ 10 phút đến UBND.',
      transactionType: 'CHO_THUE', propertyType: 'NHA_RIENG', district: 'Thị xã Hoàng Mai', ward: 'Phường Quỳnh Mai',
      priceRangeKey: '3M_5M', areaRangeKey: '80_100', direction: 'Bắc', legal: 'Có hợp đồng',
      bedrooms: 3, bathrooms: 2, floors: 2, furniture: 'Cơ bản',
      surroundings: 'Gần chợ, Gần UBND',
    },

    // ===== THỊ XÃ THÁI HOÀ =====
    {
      title: 'Bán đất nền trung tâm Phường Thái Hoà, TX Thái Hoà',
      description: 'Lô đất nền vị trí vàng tại trung tâm Phường Thái Hoà. Gần UBND, bệnh viện, trường học. Đường nhựa 8m, hạ tầng hoàn thiện. Sổ đỏ chính chủ, pháp lý rõ ràng. Giá hợp lý, đầu tư sinh lời tốt.',
      transactionType: 'BAN', propertyType: 'DAT_NEN', district: 'Thị xã Thái Hoà', ward: 'Phường Thái Hoà',
      priceRangeKey: '500M_1B', areaRangeKey: '100_150', direction: 'Đông Bắc', legal: 'Có sổ đỏ',
      frontage: 5, roadWidth: 8, surroundings: 'Gần bệnh viện, Gần UBND, Gần trường học',
    },
    {
      title: 'Bán nhà riêng Phường Tây Hiếu, gần KCN Nghĩa Đàn',
      description: 'Nhà riêng 2 tầng, 3PN, 2WC. Gần khu công nghiệp Nghĩa Đàn, phù hợp cho công nhân, gia đình trẻ. Nội thất đầy đủ, có sân phơi. Đường trước nhà rộng 5m, ô tô đỗ cửa.',
      transactionType: 'BAN', propertyType: 'NHA_RIENG', district: 'Thị xã Thái Hoà', ward: 'Phường Tây Hiếu',
      priceRangeKey: '1B_2B', areaRangeKey: '80_100', direction: 'Nam', legal: 'Có sổ đỏ',
      bedrooms: 3, bathrooms: 2, floors: 2, furniture: 'Đầy đủ', frontage: 4, roadWidth: 5,
      surroundings: 'Gần đường lớn',
    },

    // ===== HUYỆN DIỄN CHÂU =====
    {
      title: 'Bán đất nền giá rẻ Xã Diễn Châu, Huyện Diễn Châu',
      description: 'Bán lô đất nền 200m2 tại xã Diễn Châu. Đất bằng phẳng, thổ cư 100%. Gần đường quốc lộ 1A, thuận tiện đi lại. Phù hợp xây nhà ở, trồng cây. Giá rẻ, thỏa thuận trực tiếp.',
      transactionType: 'BAN', propertyType: 'DAT_NEN', district: 'Huyện Diễn Châu', ward: 'Xã Diễn Châu',
      priceRangeKey: 'LT_500M', areaRangeKey: '200_250', direction: 'Tây', legal: 'Có sổ đỏ',
      frontage: 8, roadWidth: 5, surroundings: 'Gần đường lớn',
    },
    {
      title: 'Bán nhà cấp 4 mặt đường xã Đức Châu, Diễn Châu',
      description: 'Nhà cấp 4 mặt đường liên xã, diện tích rộng rãi. 2 phòng ngủ, 1 WC. Có sân vườn rộng, ao cá. Phù hợp nghỉ dưỡng hoặc kinh doanh nông nghiệp. Không khí trong lành, yên tĩnh.',
      transactionType: 'BAN', propertyType: 'NHA_RIENG', district: 'Huyện Diễn Châu', ward: 'Xã Đức Châu',
      priceRangeKey: 'LT_500M', areaRangeKey: '200_250', direction: 'Đông', legal: 'Có sổ đỏ',
      bedrooms: 2, bathrooms: 1, floors: 1, furniture: 'Không có', frontage: 6, roadWidth: 4,
      surroundings: 'Gần trường học',
    },
    {
      title: 'Cho thuê kho xưởng 500m2 Xã Hải Châu, Diễn Châu',
      description: 'Cho thuê kho xưởng diện tích lớn tại Xã Hải Châu. Mặt bằng phẳng, nền bê tông chắc chắn. Có hệ thống điện 3 pha, nước giếng khoan. Đường xe tải vào tận nơi. Phù hợp sản xuất, chế biến nông sản.',
      transactionType: 'CHO_THUE', propertyType: 'MAT_BANG', district: 'Huyện Diễn Châu', ward: 'Xã Hải Châu',
      priceRangeKey: '10M_40M', areaRangeKey: 'GT_500', direction: 'Tây Bắc', legal: 'Có hợp đồng',
      frontage: 15, roadWidth: 6, surroundings: 'Gần đường lớn',
    },

    // ===== HUYỆN NGHI LỘC =====
    {
      title: 'Bán đất thổ cư Xã Nghi Lộc, gần KCN Nam Cấm',
      description: 'Bán lô đất thổ cư 150m2 gần KCN Nam Cấm, Huyện Nghi Lộc. Vị trí đắc địa, nhiều công nhân qua lại. Phù hợp xây nhà trọ, kinh doanh. Sổ đỏ chính chủ, giá thỏa thuận.',
      transactionType: 'BAN', propertyType: 'DAT_NEN', district: 'Huyện Nghi Lộc', ward: 'Xã Nghi Lộc',
      priceRangeKey: '500M_1B', areaRangeKey: '100_150', direction: 'Đông Nam', legal: 'Có sổ đỏ',
      frontage: 5, roadWidth: 6, surroundings: 'Gần đường lớn, Gần chợ',
    },
    {
      title: 'Bán nhà 2 tầng Xã Phúc Lộc, Nghi Lộc, giá hấp dẫn',
      description: 'Nhà 2 tầng xây kiên cố, 3PN, 2WC. Gần chợ Phúc Lộc, trường tiểu học. Nội thất cơ bản, thoáng mát. Giá bán hấp dẫn, thích hợp cho gia đình nhỏ.',
      transactionType: 'BAN', propertyType: 'NHA_RIENG', district: 'Huyện Nghi Lộc', ward: 'Xã Phúc Lộc',
      priceRangeKey: '1B_2B', areaRangeKey: '80_100', direction: 'Nam', legal: 'Có sổ đỏ',
      bedrooms: 3, bathrooms: 2, floors: 2, furniture: 'Cơ bản', frontage: 4, roadWidth: 5,
      surroundings: 'Gần chợ, Gần trường học',
    },

    // ===== HUYỆN NAM ĐÀN =====
    {
      title: 'Bán đất vườn Xã Kim Liên, Nam Đàn - quê Bác Hồ',
      description: 'Bán đất vườn tại Xã Kim Liên, quê hương Bác Hồ. Diện tích rộng, phù hợp làm trang trại, vườn cây ăn quả. Không khí trong lành, cảnh quan đẹp. Gần khu di tích Kim Liên, tiềm năng du lịch sinh thái.',
      transactionType: 'BAN', propertyType: 'BDS_KHAC', district: 'Huyện Nam Đàn', ward: 'Xã Kim Liên',
      priceRangeKey: 'LT_500M', areaRangeKey: 'GT_500', direction: 'Đông', legal: 'Có sổ đỏ',
      surroundings: 'Gần đường lớn',
    },
    {
      title: 'Bán nhà cấp 4 có vườn Xã Vạn An, Nam Đàn',
      description: 'Nhà cấp 4 có vườn rộng tại Xã Vạn An. 2PN, 1WC. Vườn cây ăn quả sum suê. Đường bê tông trước nhà 3m. Gần trường học, UBND xã. An ninh tốt, hàng xóm thân thiện.',
      transactionType: 'BAN', propertyType: 'NHA_RIENG', district: 'Huyện Nam Đàn', ward: 'Xã Vạn An',
      priceRangeKey: 'LT_500M', areaRangeKey: '200_250', direction: 'Tây Nam', legal: 'Có sổ đỏ',
      bedrooms: 2, bathrooms: 1, floors: 1, furniture: 'Không có', frontage: 5, roadWidth: 3,
      surroundings: 'Gần trường học, Gần UBND',
    },

    // ===== HUYỆN ĐÔ LƯƠNG =====
    {
      title: 'Bán đất nền Xã Đô Lương, vị trí đẹp gần chợ',
      description: 'Lô đất nền 120m2 tại trung tâm Xã Đô Lương. Gần chợ, trường học, bệnh viện đa khoa. Đường nhựa 6m, hạ tầng đầy đủ. Sổ đỏ chính chủ. Giá 600 triệu, thương lượng cho khách thiện chí.',
      transactionType: 'BAN', propertyType: 'DAT_NEN', district: 'Huyện Đô Lương', ward: 'Xã Đô Lương',
      priceRangeKey: '500M_1B', areaRangeKey: '100_150', direction: 'Đông', legal: 'Có sổ đỏ',
      frontage: 5, roadWidth: 6, surroundings: 'Gần chợ, Gần trường học, Gần bệnh viện',
    },
    {
      title: 'Cho thuê nhà trọ Xã Lương Sơn, Đô Lương',
      description: 'Cho thuê phòng trọ mới xây, sạch sẽ, thoáng mát. Có bếp riêng, WC riêng. Diện tích 20m2. Gần khu công nghiệp, chợ, trường học. Giá thuê 800K/tháng, bao gồm nước.',
      transactionType: 'CHO_THUE', propertyType: 'NHA_RIENG', district: 'Huyện Đô Lương', ward: 'Xã Lương Sơn',
      priceRangeKey: 'LT_1M', areaRangeKey: 'LT_30', direction: 'Nam', legal: 'Có hợp đồng',
      bedrooms: 1, bathrooms: 1, floors: 1, furniture: 'Không có',
      surroundings: 'Gần chợ, Gần trường học',
    },

    // ===== HUYỆN YÊN THÀNH =====
    {
      title: 'Bán đất ruộng chuyển đổi Xã Yên Thành, Yên Thành',
      description: 'Bán đất ruộng chuyển đổi mục đích sử dụng. Diện tích rộng, phù hợp làm trang trại chăn nuôi, trồng cây. Giao thông thuận lợi, xe tải vào được. Giá rẻ, thỏa thuận trực tiếp.',
      transactionType: 'BAN', propertyType: 'BDS_KHAC', district: 'Huyện Yên Thành', ward: 'Xã Yên Thành',
      priceRangeKey: 'LT_500M', areaRangeKey: 'GT_500', direction: 'Bắc', legal: 'Chưa có',
      surroundings: 'Gần đường lớn',
    },
    {
      title: 'Bán nhà vườn Xã Bình Minh, Yên Thành, an yên nghỉ dưỡng',
      description: 'Nhà vườn rộng rãi tại Xã Bình Minh. Nhà cấp 4 kiên cố, 3PN, 1WC. Vườn rộng trồng cây ăn quả, ao cá. Không khí trong lành, phong cảnh đẹp. Phù hợp nghỉ dưỡng cuối tuần hoặc an cư tuổi già.',
      transactionType: 'BAN', propertyType: 'NHA_RIENG', district: 'Huyện Yên Thành', ward: 'Xã Bình Minh',
      priceRangeKey: '500M_1B', areaRangeKey: '300_500', direction: 'Đông Nam', legal: 'Có sổ đỏ',
      bedrooms: 3, bathrooms: 1, floors: 1, furniture: 'Cơ bản', frontage: 8, roadWidth: 4,
      surroundings: 'Gần trường học',
    },

    // ===== HUYỆN QUỲNH LƯU =====
    {
      title: 'Bán đất nền trung tâm Xã Quỳnh Lưu, gần UBND',
      description: 'Đất nền vị trí trung tâm xã Quỳnh Lưu, gần UBND, bệnh viện, chợ, trường học. Diện tích 120m2, sổ đỏ, giá 500 triệu. Hạ tầng đầy đủ, đường nhựa 6m.',
      transactionType: 'BAN', propertyType: 'DAT_NEN', district: 'Huyện Quỳnh Lưu', ward: 'Xã Quỳnh Lưu',
      priceRangeKey: 'LT_500M', areaRangeKey: '100_150', direction: 'Tây', legal: 'Có sổ đỏ',
      frontage: 5, roadWidth: 6, surroundings: 'Gần UBND, Gần bệnh viện, Gần chợ',
    },
    {
      title: 'Bán nhà 2 tầng Xã Quỳnh Văn, Quỳnh Lưu',
      description: 'Nhà 2 tầng mới xây năm 2023, 3PN, 2WC. Thiết kế hiện đại, nội thất đầy đủ. Sân trước để xe rộng rãi. Khu dân cư đông đúc, gần chợ, trường học.',
      transactionType: 'BAN', propertyType: 'NHA_RIENG', district: 'Huyện Quỳnh Lưu', ward: 'Xã Quỳnh Văn',
      priceRangeKey: '1B_2B', areaRangeKey: '80_100', direction: 'Đông Bắc', legal: 'Có sổ đỏ',
      bedrooms: 3, bathrooms: 2, floors: 2, furniture: 'Đầy đủ', frontage: 4.5, roadWidth: 5,
      surroundings: 'Gần chợ, Gần trường học',
    },

    // ===== HUYỆN HƯNG NGUYÊN =====
    {
      title: 'Bán đất thổ cư Xã Hưng Nguyên, gần TP Vinh',
      description: 'Bán đất thổ cư 150m2, giáp TP Vinh. Vị trí thuận lợi, đường QL46 rộng rãi. Phù hợp xây nhà, kinh doanh. Sổ đỏ trao tay, giá cả hợp lý.',
      transactionType: 'BAN', propertyType: 'DAT_NEN', district: 'Huyện Hưng Nguyên', ward: 'Xã Hưng Nguyên',
      priceRangeKey: '500M_1B', areaRangeKey: '100_150', direction: 'Nam', legal: 'Có sổ đỏ',
      frontage: 5, roadWidth: 10, surroundings: 'Gần đường lớn, Gần chợ',
    },

    // ===== HUYỆN THANH CHƯƠNG =====
    {
      title: 'Bán đất vườn đồi Xã Hạnh Lâm, Thanh Chương',
      description: 'Bán đất vườn đồi diện tích lớn, trồng keo, chè. Có nguồn nước tự nhiên. Đường bê tông vào tận nơi. Phù hợp làm trang trại, farm du lịch. Giá rẻ, thỏa thuận.',
      transactionType: 'BAN', propertyType: 'BDS_KHAC', district: 'Huyện Thanh Chương', ward: 'Xã Hạnh Lâm',
      priceRangeKey: 'LT_500M', areaRangeKey: 'GT_500', direction: 'Đông', legal: 'Có sổ đỏ',
      surroundings: 'Gần đường lớn',
    },
    {
      title: 'Bán nhà 2 tầng Xã Cát Ngạn, Thanh Chương',
      description: 'Nhà 2 tầng mặt đường liên xã. 3PN, 2WC. Có sân rộng, gara ô tô. Gần UBND xã, trường học, chợ. Nội thất cơ bản, sổ đỏ đầy đủ.',
      transactionType: 'BAN', propertyType: 'NHA_RIENG', district: 'Huyện Thanh Chương', ward: 'Xã Cát Ngạn',
      priceRangeKey: '1B_2B', areaRangeKey: '100_150', direction: 'Tây Nam', legal: 'Có sổ đỏ',
      bedrooms: 3, bathrooms: 2, floors: 2, furniture: 'Cơ bản', frontage: 5, roadWidth: 6,
      surroundings: 'Gần UBND, Gần trường học, Gần chợ',
    },

    // ===== HUYỆN TÂN KỲ =====
    {
      title: 'Bán đất nền Xã Tân Kỳ, gần trung tâm huyện',
      description: 'Lô đất nền 100m2 gần trung tâm huyện Tân Kỳ. Đường nhựa 5m, hạ tầng đầy đủ. Gần chợ, bệnh viện, trường học. Sổ đỏ chính chủ, giá cả phải chăng.',
      transactionType: 'BAN', propertyType: 'DAT_NEN', district: 'Huyện Tân Kỳ', ward: 'Xã Tân Kỳ',
      priceRangeKey: 'LT_500M', areaRangeKey: '80_100', direction: 'Đông Bắc', legal: 'Có sổ đỏ',
      frontage: 4.5, roadWidth: 5, surroundings: 'Gần chợ, Gần bệnh viện, Gần trường học',
    },

    // ===== HUYỆN NGHĨA ĐÀN =====
    {
      title: 'Bán đất nền Xã Nghĩa Đàn, gần KCN Nghĩa Đàn',
      description: 'Lô đất nền 200m2 gần khu công nghiệp Nghĩa Đàn. Vị trí thuận lợi, phù hợp xây nhà trọ cho công nhân hoặc kinh doanh. Đường bê tông 4m, sổ đỏ chính chủ.',
      transactionType: 'BAN', propertyType: 'DAT_NEN', district: 'Huyện Nghĩa Đàn', ward: 'Xã Nghĩa Đàn',
      priceRangeKey: 'LT_500M', areaRangeKey: '150_200', direction: 'Nam', legal: 'Có sổ đỏ',
      frontage: 6, roadWidth: 4, surroundings: 'Gần đường lớn',
    },

    // ===== HUYỆN QUỲ HỢP =====
    {
      title: 'Bán nhà vườn Xã Quỳ Hợp, không gian yên tĩnh',
      description: 'Nhà vườn rộng rãi tại trung tâm Xã Quỳ Hợp. Nhà cấp 4, 2PN, 1WC. Vườn cây ăn quả, ao cá. Gần chợ, UBND xã. An ninh tốt, hàng xóm thân thiện. Giá bán rẻ.',
      transactionType: 'BAN', propertyType: 'NHA_RIENG', district: 'Huyện Quỳ Hợp', ward: 'Xã Quỳ Hợp',
      priceRangeKey: 'LT_500M', areaRangeKey: '200_250', direction: 'Đông Nam', legal: 'Có sổ đỏ',
      bedrooms: 2, bathrooms: 1, floors: 1, furniture: 'Không có', frontage: 6, roadWidth: 4,
      surroundings: 'Gần chợ, Gần UBND',
    },

    // ===== HUYỆN ANH SƠN =====
    {
      title: 'Bán đất nền Xã Anh Sơn, huyện Anh Sơn',
      description: 'Bán lô đất nền 120m2 tại trung tâm xã Anh Sơn. Gần chợ, trường học, bệnh viện đa khoa huyện. Đường nhựa 5m, sổ đỏ trao tay. Giá cả thỏa thuận.',
      transactionType: 'BAN', propertyType: 'DAT_NEN', district: 'Huyện Anh Sơn', ward: 'Xã Anh Sơn',
      priceRangeKey: 'LT_500M', areaRangeKey: '100_150', direction: 'Tây', legal: 'Có sổ đỏ',
      frontage: 5, roadWidth: 5, surroundings: 'Gần chợ, Gần trường học, Gần bệnh viện',
    },

    // ===== HUYỆN CON CUÔNG =====
    {
      title: 'Bán đất vườn Xã Môn Sơn, Con Cuông - gần VQG Pù Mát',
      description: 'Bán đất vườn diện tích lớn tại Xã Môn Sơn, gần Vườn Quốc Gia Pù Mát. Khí hậu mát mẻ, phong cảnh đẹp. Phù hợp phát triển du lịch sinh thái, homestay. Có suối tự nhiên chảy qua.',
      transactionType: 'BAN', propertyType: 'BDS_KHAC', district: 'Huyện Con Cuông', ward: 'Xã Môn Sơn',
      priceRangeKey: 'LT_500M', areaRangeKey: 'GT_500', direction: 'Đông', legal: 'Có sổ đỏ',
      surroundings: 'Gần đường lớn',
    },

    // ===== HUYỆN QUẾ PHONG =====
    {
      title: 'Bán đất nền Xã Quế Phong, vị trí trung tâm',
      description: 'Lô đất nền tại trung tâm xã Quế Phong. Gần UBND huyện, chợ huyện. Đường nhựa, hạ tầng tốt. Phù hợp xây nhà ở, kinh doanh. Sổ đỏ đầy đủ.',
      transactionType: 'BAN', propertyType: 'DAT_NEN', district: 'Huyện Quế Phong', ward: 'Xã Quế Phong',
      priceRangeKey: 'LT_500M', areaRangeKey: '100_150', direction: 'Nam', legal: 'Có sổ đỏ',
      frontage: 5, roadWidth: 5, surroundings: 'Gần UBND, Gần chợ',
    },

    // ===== HUYỆN QUỲ CHÂU =====
    {
      title: 'Bán nhà cấp 4 Xã Quỳ Châu, huyện Quỳ Châu',
      description: 'Nhà cấp 4 kiên cố tại trung tâm xã Quỳ Châu. 2PN, 1WC. Sân rộng, vườn cây. Gần chợ, trường học. Giá bán hấp dẫn, phù hợp gia đình nhỏ.',
      transactionType: 'BAN', propertyType: 'NHA_RIENG', district: 'Huyện Quỳ Châu', ward: 'Xã Quỳ Châu',
      priceRangeKey: 'LT_500M', areaRangeKey: '100_150', direction: 'Tây Bắc', legal: 'Có sổ đỏ',
      bedrooms: 2, bathrooms: 1, floors: 1, furniture: 'Không có', frontage: 5, roadWidth: 4,
      surroundings: 'Gần chợ, Gần trường học',
    },

    // ===== HUYỆN KỲ SƠN =====
    {
      title: 'Bán đất rẫy Xã Mường Xén, Kỳ Sơn',
      description: 'Bán đất rẫy diện tích lớn tại Xã Mường Xén, Huyện Kỳ Sơn. Đất bằng phẳng, có nguồn nước. Phù hợp trồng cây lâu năm, dược liệu. Gần đường quốc lộ 7.',
      transactionType: 'BAN', propertyType: 'BDS_KHAC', district: 'Huyện Kỳ Sơn', ward: 'Xã Mường Xén',
      priceRangeKey: 'LT_500M', areaRangeKey: 'GT_500', direction: 'Bắc', legal: 'Chưa có',
      surroundings: 'Gần đường lớn',
    },

    // ===== HUYỆN TƯƠNG DƯƠNG =====
    {
      title: 'Bán nhà cấp 4 Xã Tam Quang, Tương Dương',
      description: 'Nhà cấp 4 tại trung tâm Xã Tam Quang. 2PN, 1WC. Gần UBND xã, chợ, trường học. Đường bê tông trước nhà 4m. An ninh tốt, hàng xóm thân thiện.',
      transactionType: 'BAN', propertyType: 'NHA_RIENG', district: 'Huyện Tương Dương', ward: 'Xã Tam Quang',
      priceRangeKey: 'LT_500M', areaRangeKey: '100_150', direction: 'Đông', legal: 'Có sổ đỏ',
      bedrooms: 2, bathrooms: 1, floors: 1, furniture: 'Không có', frontage: 5, roadWidth: 4,
      surroundings: 'Gần UBND, Gần chợ, Gần trường học',
    },

    // ===== THÊM CÁC TIN CHO THUÊ =====
    {
      title: 'Cho thuê phòng trọ gần ĐH Vinh, Phường Trường Vinh',
      description: 'Cho thuê phòng trọ sạch sẽ, thoáng mát, gần Đại học Vinh. Diện tích 25m2, có gác lửng. Bếp và WC riêng. Điện nước giá dân. An ninh tốt, có chỗ để xe. Giá 1.5 triệu/tháng.',
      transactionType: 'CHO_THUE', propertyType: 'NHA_RIENG', district: 'Thành phố Vinh', ward: 'Phường Trường Vinh',
      priceRangeKey: '1M_3M', areaRangeKey: 'LT_30', direction: 'Nam', legal: 'Có hợp đồng',
      bedrooms: 1, bathrooms: 1, floors: 1, furniture: 'Không có',
      surroundings: 'Gần trường học, Gần chợ',
    },
    {
      title: 'Cho thuê văn phòng tầng 2, trung tâm TP Vinh',
      description: 'Cho thuê văn phòng diện tích 60m2 tại tầng 2, trung tâm TP Vinh. Có điều hòa, internet cáp quang. Bãi đỗ xe rộng. Phù hợp mở công ty, văn phòng đại diện. Giá 8 triệu/tháng.',
      transactionType: 'CHO_THUE', propertyType: 'MAT_BANG', district: 'Thành phố Vinh', ward: 'Phường Thành Vinh',
      priceRangeKey: '5M_10M', areaRangeKey: '50_80', direction: 'Đông', legal: 'Có hợp đồng',
      furniture: 'Cơ bản', surroundings: 'Gần đường lớn, Gần UBND',
    },

    // ===== THÊM CÁC TIN VIP/UP =====
    {
      title: '⭐ Bán gấp nhà 3 tầng mặt tiền Phường Vinh Hưng, TP Vinh',
      description: 'CẦN BÁN GẤP - Nhà 3 tầng mặt tiền đường lớn Phường Vinh Hưng. Diện tích sử dụng 240m2. 5PN, 4WC. Nội thất cao cấp, thiết kế sang trọng. Mặt tiền rộng 7m, đường trước 12m. Vị trí kinh doanh vàng. Sổ đỏ, pháp lý hoàn chỉnh. Giá thương lượng cho khách thiện chí.',
      transactionType: 'BAN', propertyType: 'NHA_RIENG', district: 'Thành phố Vinh', ward: 'Phường Vinh Hưng',
      priceRangeKey: '7B_10B', areaRangeKey: '80_100', direction: 'Đông Nam', legal: 'Đầy đủ',
      bedrooms: 5, bathrooms: 4, floors: 3, furniture: 'Đầy đủ', frontage: 7, roadWidth: 12,
      surroundings: 'Gần bệnh viện, Gần trường học, Gần chợ, Gần đường lớn',
      tier: 'VIP',
    },
    {
      title: '🔥 Đất nền vàng Phường Vinh Phú, cơ hội đầu tư',
      description: 'LÔ ĐẤT VÀNG - Vị trí đắc địa tại Phường Vinh Phú, TP Vinh. Mặt tiền rộng 6m, đường 10m. Hạ tầng hoàn thiện: điện, nước, cống. Sổ đỏ trao tay. Đầu tư sinh lời cao. Giá chỉ từ 2 tỷ.',
      transactionType: 'BAN', propertyType: 'DAT_NEN', district: 'Thành phố Vinh', ward: 'Phường Vinh Phú',
      priceRangeKey: '2B_3B', areaRangeKey: '100_150', direction: 'Đông', legal: 'Có sổ đỏ',
      frontage: 6, roadWidth: 10, surroundings: 'Gần đường lớn, Gần trường học, Gần chợ',
      tier: 'UP',
    },
    {
      title: '⭐ Cho thuê mặt bằng kinh doanh vị trí đắc địa TP Vinh',
      description: 'VỊ TRÍ VÀNG - Mặt bằng kinh doanh tầng 1, mặt tiền đường lớn TP Vinh. Diện tích 100m2, mặt tiền 8m. Phù hợp showroom, nhà hàng, quán cà phê cao cấp. Có bãi đỗ xe riêng. Giá thuê 25 triệu/tháng.',
      transactionType: 'CHO_THUE', propertyType: 'MAT_BANG', district: 'Thành phố Vinh', ward: 'Phường Thành Vinh',
      priceRangeKey: '10M_40M', areaRangeKey: '100_150', direction: 'Đông Nam', legal: 'Có hợp đồng',
      frontage: 8, roadWidth: 15, surroundings: 'Gần đường lớn, Gần UBND',
      tier: 'VIP',
    },

    // ===== THÊM CÁC LOẠI DỰ ÁN =====
    {
      title: 'Bán căn hộ dự án mới xây, Phường Vinh Lộc, TP Vinh',
      description: 'Bán căn hộ tại dự án mới xây tại Phường Vinh Lộc. 2PN, 1WC, diện tích 65m2. Tầng 10, view đẹp. Tiện ích nội khu đầy đủ: hồ bơi, gym, công viên. Giao nhà hoàn thiện, nhận nhà ngay.',
      transactionType: 'BAN', propertyType: 'CHUNG_CU', district: 'Thành phố Vinh', ward: 'Phường Vinh Lộc',
      priceRangeKey: '1B_2B', areaRangeKey: '50_80', direction: 'Tây Nam', legal: 'Có hợp đồng',
      bedrooms: 2, bathrooms: 1, floors: 10, furniture: 'Cơ bản',
      surroundings: 'Gần đường lớn, Gần trường học',
    },
    {
      title: 'Bán đất dự án khu đô thị mới, Phường Vinh Phú',
      description: 'Bán lô đất thuộc dự án khu đô thị mới Vinh Phú. Hạ tầng hoàn thiện, đường rộng 12m. Quy hoạch đồng bộ, có công viên, trường học trong khu. Sổ đỏ riêng từng lô. Giá gốc chủ đầu tư.',
      transactionType: 'BAN', propertyType: 'DU_AN', district: 'Thành phố Vinh', ward: 'Phường Vinh Phú',
      priceRangeKey: '3B_5B', areaRangeKey: '100_150', direction: 'Đông', legal: 'Có sổ đỏ',
      frontage: 5.5, roadWidth: 12, surroundings: 'Gần trường học, Gần đường lớn',
    },

    // ===== THÊM CÁC TIN GIÁ THỎA THUẬN =====
    {
      title: 'Bán đất mặt tiền QL1A, Xã Quảng Châu, Diễn Châu',
      description: 'Bán đất mặt tiền Quốc Lộ 1A, vị trí kinh doanh tuyệt vời. Mặt tiền rộng 15m, diện tích lớn. Phù hợp xây showroom, nhà hàng, trạm xăng. Sổ đỏ đầy đủ, giá thỏa thuận.',
      transactionType: 'BAN', propertyType: 'DAT_NEN', district: 'Huyện Diễn Châu', ward: 'Xã Quảng Châu',
      priceRangeKey: 'THOA_THUAN', areaRangeKey: '300_500', direction: 'Đông Nam', legal: 'Có sổ đỏ',
      frontage: 15, roadWidth: 20, surroundings: 'Gần đường lớn',
      isNegotiable: true,
    },
    {
      title: 'Cho thuê nhà nguyên căn 4 tầng, Phường Cửa Lò, TP Vinh',
      description: 'Cho thuê nhà nguyên căn 4 tầng khu vực biển Cửa Lò. 8PN, 6WC. Đã trang bị nội thất cho từng phòng. Phù hợp kinh doanh homestay, nhà nghỉ. Giá thỏa thuận theo mùa.',
      transactionType: 'CHO_THUE', propertyType: 'NHA_RIENG', district: 'Thành phố Vinh', ward: 'Phường Cửa Lò',
      priceRangeKey: 'THOA_THUAN', areaRangeKey: '150_200', direction: 'Đông', legal: 'Có hợp đồng',
      bedrooms: 8, bathrooms: 6, floors: 4, furniture: 'Đầy đủ',
      surroundings: 'Gần đường lớn',
      isNegotiable: true,
    },

    // ===== THÊM NHIỀU TIN ĐA DẠNG =====
    {
      title: 'Bán đất nền Xã Tân Châu, Diễn Châu, giá chỉ 350 triệu',
      description: 'Lô đất nền 100m2 tại Xã Tân Châu, giá cực kỳ hấp dẫn. Đường bê tông 4m, sổ đỏ đầy đủ. Phù hợp xây nhà ở cho gia đình trẻ.',
      transactionType: 'BAN', propertyType: 'DAT_NEN', district: 'Huyện Diễn Châu', ward: 'Xã Tân Châu',
      priceRangeKey: 'LT_500M', areaRangeKey: '80_100', direction: 'Bắc', legal: 'Có sổ đỏ',
      frontage: 4, roadWidth: 4, surroundings: 'Gần trường học',
    },
    {
      title: 'Bán nhà mặt phố Xã Nghĩa Hưng, Nghĩa Đàn',
      description: 'Nhà mặt phố 2 tầng tại trung tâm Xã Nghĩa Hưng. 3PN, 2WC. Mặt tiền đường lớn. Đang cho thuê kinh doanh, thu nhập ổn định. Sổ đỏ, pháp lý rõ ràng.',
      transactionType: 'BAN', propertyType: 'NHA_RIENG', district: 'Huyện Nghĩa Đàn', ward: 'Xã Nghĩa Hưng',
      priceRangeKey: '1B_2B', areaRangeKey: '100_150', direction: 'Đông', legal: 'Có sổ đỏ',
      bedrooms: 3, bathrooms: 2, floors: 2, furniture: 'Cơ bản', frontage: 5, roadWidth: 6,
      surroundings: 'Gần chợ, Gần đường lớn',
    },
    {
      title: 'Cho thuê đất làm bãi xe, kho bãi, Xã Đông Lộc, Nghi Lộc',
      description: 'Cho thuê đất trống diện tích lớn, phù hợp làm bãi đỗ xe, kho bãi chứa hàng. Mặt bằng phẳng, xe tải ra vào dễ dàng. Gần đường lớn, KCN.',
      transactionType: 'CHO_THUE', propertyType: 'MAT_BANG', district: 'Huyện Nghi Lộc', ward: 'Xã Đông Lộc',
      priceRangeKey: '5M_10M', areaRangeKey: 'GT_500', direction: 'Tây', legal: 'Có hợp đồng',
      frontage: 20, roadWidth: 8, surroundings: 'Gần đường lớn',
    },
    {
      title: 'Bán đất nền Xã Đông Hiếu, TX Thái Hoà, giá tốt',
      description: 'Bán lô đất nền tại Xã Đông Hiếu, TX Thái Hoà. Diện tích 150m2, đường bê tông 5m. Gần khu dân cư đông đúc, chợ, trường học. Sổ đỏ trao tay.',
      transactionType: 'BAN', propertyType: 'DAT_NEN', district: 'Thị xã Thái Hoà', ward: 'Xã Đông Hiếu',
      priceRangeKey: 'LT_500M', areaRangeKey: '100_150', direction: 'Đông Nam', legal: 'Có sổ đỏ',
      frontage: 5, roadWidth: 5, surroundings: 'Gần chợ, Gần trường học',
    },
    {
      title: 'Bán đất nền Xã Tam Hợp, Quỳ Hợp',
      description: 'Bán lô đất nền 200m2 tại Xã Tam Hợp, huyện Quỳ Hợp. Đường bê tông 4m. Gần chợ, UBND xã. Giá 250 triệu, thương lượng.',
      transactionType: 'BAN', propertyType: 'DAT_NEN', district: 'Huyện Quỳ Hợp', ward: 'Xã Tam Hợp',
      priceRangeKey: 'LT_500M', areaRangeKey: '150_200', direction: 'Bắc', legal: 'Có sổ đỏ',
      frontage: 6, roadWidth: 4, surroundings: 'Gần chợ, Gần UBND',
    },
    {
      title: 'Cho thuê nhà 3 tầng Phường Hoàng Mai, TX Hoàng Mai',
      description: 'Cho thuê nhà nguyên căn 3 tầng, 4PN, 3WC. Nội thất đầy đủ, thoáng mát. Khu dân cư an ninh. Gần chợ, bệnh viện, trường học. Giá thuê 7 triệu/tháng.',
      transactionType: 'CHO_THUE', propertyType: 'NHA_RIENG', district: 'Thị xã Hoàng Mai', ward: 'Phường Hoàng Mai',
      priceRangeKey: '5M_10M', areaRangeKey: '80_100', direction: 'Tây Nam', legal: 'Có hợp đồng',
      bedrooms: 4, bathrooms: 3, floors: 3, furniture: 'Đầy đủ',
      surroundings: 'Gần chợ, Gần bệnh viện, Gần trường học',
    },
    {
      title: 'Bán nhà 2 tầng Xã Yên Trung, Hưng Nguyên',
      description: 'Nhà 2 tầng mới xây, 3PN, 2WC tại Xã Yên Trung. Thiết kế đẹp, nội thất cơ bản. Sân rộng để xe ô tô. Gần QL46, giao thông thuận lợi. Sổ đỏ đầy đủ.',
      transactionType: 'BAN', propertyType: 'NHA_RIENG', district: 'Huyện Hưng Nguyên', ward: 'Xã Yên Trung',
      priceRangeKey: '1B_2B', areaRangeKey: '80_100', direction: 'Đông Bắc', legal: 'Có sổ đỏ',
      bedrooms: 3, bathrooms: 2, floors: 2, furniture: 'Cơ bản', frontage: 4.5, roadWidth: 5,
      surroundings: 'Gần đường lớn',
    },
  ];

  // Price range to actual price mapping
  const priceMap: Record<string, { min: number; max: number }> = {
    'THOA_THUAN': { min: 0, max: 0 },
    'LT_500M': { min: 200_000_000, max: 499_000_000 },
    'LT_1M': { min: 500_000, max: 999_000 },
    '500M_1B': { min: 500_000_000, max: 999_000_000 },
    '1M_3M': { min: 1_000_000, max: 2_999_000 },
    '1B_2B': { min: 1_000_000_000, max: 1_999_000_000 },
    '2B_3B': { min: 2_000_000_000, max: 2_999_000_000 },
    '3M_5M': { min: 3_000_000, max: 4_999_000 },
    '3B_5B': { min: 3_000_000_000, max: 4_999_000_000 },
    '5M_10M': { min: 5_000_000, max: 9_999_000 },
    '5B_7B': { min: 5_000_000_000, max: 6_999_000_000 },
    '7B_10B': { min: 7_000_000_000, max: 9_999_000_000 },
    '10M_40M': { min: 10_000_000, max: 39_999_000 },
    '10B_20B': { min: 10_000_000_000, max: 19_999_000_000 },
    'GT_40M': { min: 40_000_000, max: 80_000_000 },
    'GT_20B': { min: 20_000_000_000, max: 50_000_000_000 },
  };

  const areaMap: Record<string, { min: number; max: number }> = {
    'LT_30': { min: 15, max: 29 },
    '30_50': { min: 30, max: 50 },
    '50_80': { min: 50, max: 80 },
    '80_100': { min: 80, max: 100 },
    '100_150': { min: 100, max: 150 },
    '150_200': { min: 150, max: 200 },
    '200_250': { min: 200, max: 250 },
    '250_300': { min: 250, max: 300 },
    '300_500': { min: 300, max: 500 },
    'GT_500': { min: 500, max: 1500 },
  };

  function randomBetween(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  let createdCount = 0;
  for (let i = 0; i < propertiesData.length; i++) {
    const p = propertiesData[i];
    const userIdx = i % users.length;
    const userId = users[userIdx].id;

    const loc = locationMap[p.district];
    if (!loc) {
      console.log(`Skipping: district "${p.district}" not found`);
      continue;
    }
    const wardId = loc.wards[p.ward];
    if (!wardId) {
      console.log(`Skipping: ward "${p.ward}" not found in "${p.district}"`);
      continue;
    }

    const priceRange = priceMap[p.priceRangeKey] || { min: 500_000_000, max: 1_000_000_000 };
    const areaRange = areaMap[p.areaRangeKey] || { min: 80, max: 100 };
    const area = randomBetween(areaRange.min, areaRange.max);
    const price = (p as any).isNegotiable ? null : randomBetween(priceRange.min, priceRange.max);

    const propSlug = slugify(p.title) + '-' + Date.now().toString(36) + i;
    const propertyCode = `BDS-${String(i + 1).padStart(4, '0')}`;

    // Random views, likes
    const views = randomBetween(10, 500);
    const likes = randomBetween(0, Math.floor(views * 0.3));
    const callClicks = randomBetween(0, 20);
    const zaloClicks = randomBetween(0, 15);

    // Random publishedAt in last 30 days
    const daysAgo = randomBetween(0, 30);
    const publishedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const tier = (p as any).tier || 'NORMAL';
    let tierExpiresAt: Date | null = null;
    if (tier === 'VIP') {
      tierExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    } else if (tier === 'UP') {
      tierExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    }

    const pricePerM2 = price && area ? Math.round(price / area) : null;

    await prisma.property.create({
      data: {
        title: p.title,
        description: p.description,
        transactionType: p.transactionType,
        propertyType: p.propertyType,
        city: 'Nghệ An',
        district: p.district,
        ward: p.ward,
        provinceId: city.id,
        districtId: loc.districtId,
        wardId: wardId,
        price: price ? price : null,
        area: area,
        pricePerM2: pricePerM2,
        priceRangeKey: p.priceRangeKey,
        priceMin: priceRange.min,
        priceMax: priceRange.max,
        areaRangeKey: p.areaRangeKey,
        areaMin: areaRange.min,
        areaMax: areaRange.max,
        direction: p.direction || null,
        legal: p.legal || null,
        furniture: (p as any).furniture || null,
        bedrooms: (p as any).bedrooms || null,
        bathrooms: (p as any).bathrooms || null,
        floors: (p as any).floors || null,
        frontage: (p as any).frontage || null,
        roadWidth: (p as any).roadWidth || null,
        surroundings: p.surroundings || null,
        isNegotiable: (p as any).isNegotiable || false,
        slug: propSlug,
        propertyCode: propertyCode,
        status: 'APPROVED',
        tier: tier as any,
        tierExpiresAt: tierExpiresAt,
        views: views,
        likes: likes,
        callClicks: callClicks,
        zaloClicks: zaloClicks,
        publishedAt: publishedAt,
        userId: userId,
        images: [],
      }
    });
    createdCount++;
  }

  console.log(`Created ${createdCount} properties`);

  // ============ SYSTEM SETTINGS ============
  console.log('Seeding system settings...');
  const existingSettings = await prisma.systemSettings.findUnique({ where: { id: 'default_settings' } });
  if (!existingSettings) {
    await prisma.systemSettings.create({
      data: {
        id: 'default_settings',
        vipPrice: 10000,
        upPrice: 3000,
        vipDurationDays: 4,
        upDurationDays: 2,
        freePostsPerUser: 2,
        freePostsPerDay: 2,
        freeUpsPerUserPerDay: 1,
        maxTotalPostsPerUser: 60,
        maxPostsPerDay: 50,
        maxUpsPerDay: 10,
        upCooldownMinutes: 10,
        extraPostPrice: 5000,
        isPreModerationEnabled: true,
        isAutoApprove: false,
        contactPhone: '0987654321',
        contactEmail: 'contact@nhadatxunghe.vn',
      }
    });
    console.log('System settings created');
  }

  console.log('=== SEED HOÀN TẤT ===');
  console.log(`Summary:`);
  console.log(`  - Locations: 1 city, ${districts.length} districts, ${districts.reduce((sum, d) => sum + d.wards.length, 0)} wards`);
  console.log(`  - Users: ${users.length} users + 1 admin`);
  console.log(`  - Properties: ${createdCount} listings`);
  console.log(`  - Default user password: Test@1234`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
