const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const oldWardsMap = {
  'Thành phố Vinh': [
    'Phường Hồng Sơn', 'Phường Lê Mao', 'Phường Đội Cung', 'Phường Hưng Phúc', 'Xã Hưng Chính',
    'Hồng Sơn', 'Vinh Tân', 'Lê Mao', 'Lê Lợi', 'Quang Trung', 'Đội Cung', 'Bến Thủy', 'Trường Thi', 'Hưng Bình', 'Hưng Phúc', 'Hưng Chính', 'Cửa Nam'
  ],
  'Huyện Thanh Chương': [
    'Thị trấn Dùng', 'Xã Đồng Văn', 'Xã Thanh Ngọc', 'Xã Thanh Phong', 'Xã Đại Đồng', 
    'Xã Mai Giang', 'Xã Thanh Lâm', 'Xã Thanh Tùng', 'Xã Thanh Xuân', 
    'Xã Minh Sơn', 'Xã Cát Văn', 'Xã Phong Thịnh', 
    'Xã Thanh Đức', 'Xã Hạnh Lâm', 
    'Xã Thanh An', 'Xã Thanh Hương', 'Xã Thanh Quả', 'Xã Thanh Thịnh', 
    'Xã Thanh Hà', 'Xã Thanh Thủy', 'Xã Kim Bảng', 
    'Xã Ngọc Lâm', 'Xã Thanh Sơn', 
    'Xã Thanh Liên', 'Xã Thanh Mỹ', 'Xã Thanh Tiên', 
    'Xã Ngọc Sơn', 'Xã Minh Tiến', 'Xã Xuân Dương'
  ],
  'Huyện Nam Đàn': [
    'Xã Hùng Tiến', 'Xã Nam Cát', 'Xã Nam Giang', 'Xã Xuân Hồng', 'Xã Kim Liên', 
    'Thị trấn Nam Đàn', 'Xã Thượng Tân Lộc', 'Xã Xuân Hòa', 
    'Xã Nghĩa Thái', 'Xã Nam Hưng', 'Xã Nam Thanh', 
    'Xã Nam Anh', 'Xã Nam Lĩnh', 'Xã Nam Xuân', 
    'Xã Khánh Sơn', 'Xã Nam Kim', 'Xã Trung Phúc Cường'
  ],
  'Huyện Diễn Châu': [
    'Xã Diễn Thành', 'Thị trấn Diễn Châu', 
    'Xã Diễn Xuân', 'Xã Diễn Tháp', 
    'Xã Diễn Quảng', 'Xã Diễn Hạnh', 
    'Xã Diễn Ngọc', 'Xã Diễn Bích', 
    'Xã Diễn Hùng', 'Xã Diễn Hải',
    'Xã Diễn Bình', 'Xã Diễn Minh', 'Xã Diễn Thắng'
  ],
  'Huyện Quỳnh Lưu': [
    'Xã Quỳnh Nghĩa', 'Xã Tiến Thủy', 
    'Xã Quỳnh Lương', 'Xã Quỳnh Minh', 
    'Xã Quỳnh Thuận', 'Xã Quỳnh Long', 
    'Xã Quỳnh Văn', 'Xã Quỳnh Bảng',
    'Xã Quỳnh Hưng', 'Xã Quỳnh Bá', 'Xã Quỳnh Ngọc'
  ],
  'Huyện Yên Thành': [
    'Xã Khánh Thành', 'Xã Công Thành', 'Xã Vân Tụ', 'Xã Đông Thành'
  ]
};

async function main() {
  console.log('Updating database wards...');
  
  for (const districtName of Object.keys(oldWardsMap)) {
    const district = await prisma.location.findFirst({ where: { name: districtName, type: 'DISTRICT' } });
    if (!district) {
      console.log(`District ${districtName} not found.`);
      continue;
    }
    
    for (let w of oldWardsMap[districtName]) {
      // Find if this ward exists as WARD
      const existingWard = await prisma.location.findFirst({
        where: { name: w, parentId: district.id, type: 'WARD' }
      });
      
      if (existingWard) {
        await prisma.location.update({
          where: { id: existingWard.id },
          data: { type: 'OLD_WARD' }
        });
        console.log(`Updated ${w} in ${districtName} to OLD_WARD`);
      } else {
        // Find if it exists as OLD_WARD
        const existingOld = await prisma.location.findFirst({
          where: { name: w, parentId: district.id, type: 'OLD_WARD' }
        });
        if (!existingOld) {
          // ensure we prefix properly if it doesn't have one
          const nameToInsert = w.match(/^(Xã|Phường|Thị trấn)/i) ? w : 
            (districtName === 'Thành phố Vinh' ? `Phường ${w}` : `Xã ${w}`);
            
          await prisma.location.create({
            data: { name: nameToInsert, type: 'OLD_WARD', parentId: district.id }
          });
          console.log(`Created ${nameToInsert} in ${districtName} as OLD_WARD`);
        }
      }
    }
  }

  console.log('Database wards updated successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
