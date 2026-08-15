import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, '../tinh-Nghe-An.xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  // Bỏ qua dòng header (dòng đầu tiên)
  const rows = data.slice(1);

  // Tạo "Nghệ An" City
  let city = await prisma.location.findFirst({
    where: { name: 'Nghệ An', type: 'CITY' }
  });

  if (!city) {
    city = await prisma.location.create({
      data: {
        name: 'Nghệ An',
        type: 'CITY',
        slug: 'nghe-an',
        isFeatured: true
      }
    });
  }

  const districtMap = new Map<string, string>(); // Tên quận/huyện -> ID

  console.log(`Bắt đầu nhập dữ liệu ${rows.length} dòng...`);

  for (const row of rows) {
    if (!row || row.length < 9) continue;
    
    // row[5]: Tên Quận huyện TMS (cũ)
    // row[8]: Tên Phường/Xã mới
    let districtName = row[5]?.toString().trim();
    let wardName = row[8]?.toString().trim();

    if (!districtName || !wardName) continue;

    // Remove "Huyện ", "Thị xã ", "Thành phố " if needed. The frontend uses formatLocationName which handles some strings. Let's keep them exact or strip them? 
    // Usually people prefer "Anh Sơn", "Vinh" instead of "Huyện Anh Sơn", "Thành phố Vinh". 
    // Let's strip standard prefixes for cleaner names.
    districtName = districtName.replace(/^(Huyện|Thị xã|Thành phố)\s+/i, '');
    wardName = wardName.replace(/^(Xã|Phường|Thị trấn)\s+/i, '');

    // Tạo / Lấy District
    let districtId = districtMap.get(districtName);
    if (!districtId) {
      let district = await prisma.location.findFirst({
        where: { name: districtName, type: 'DISTRICT', parentId: city.id }
      });
      if (!district) {
        district = await prisma.location.create({
          data: {
            name: districtName,
            type: 'DISTRICT',
            parentId: city.id,
            slug: districtName.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          }
        });
      }
      districtId = district.id;
      districtMap.set(districtName, districtId);
    }

    // Tạo Ward
    const existingWard = await prisma.location.findFirst({
      where: { name: wardName, type: 'WARD', parentId: districtId }
    });

    if (!existingWard) {
      await prisma.location.create({
        data: {
          name: wardName,
          type: 'WARD',
          parentId: districtId,
          slug: wardName.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        }
      });
    }
  }

  console.log('Nhập dữ liệu thành công!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
