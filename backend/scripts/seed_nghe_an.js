const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');

const prisma = new PrismaClient();

function toSlug(str) {
  if (!str) return '';
  str = str.replace(/^\s+|\s+$/g, ''); 
  str = str.toLowerCase();
  
  const from = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ";
  const to   = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd";
  for (let i=0, l=from.length ; i<l ; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }
  
  str = str.replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
    
  return str;
}

async function main() {
  const filePath = 'C:\\Users\\Nguye\\OneDrive\\Desktop\\Website-BDS\\tinh-Nghe-An.xlsx';
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);

  console.log(`Loaded ${data.length} rows from Excel.`);

  let cityNode = await prisma.location.findFirst({
    where: { name: 'Tỉnh Nghệ An', type: 'CITY' }
  });

  if (!cityNode) {
    let slug = toSlug('Tỉnh Nghệ An');
    // Check if slug exists
    const existing = await prisma.location.findUnique({ where: { slug } });
    if (existing) slug += '-1';
    cityNode = await prisma.location.create({
      data: {
        name: 'Tỉnh Nghệ An',
        type: 'CITY',
        slug: slug
      }
    });
    console.log(`Created CITY: ${cityNode.name}`);
  } else {
    console.log(`Found CITY: ${cityNode.name}`);
  }

  const districts = new Map();
  for (const row of data) {
    const districtName = row['Tên Quận huyện TMS (cũ)'];
    const wardName = row['Tên Phường/Xã mới'];
    
    if (!districtName) continue;

    if (!districts.has(districtName)) {
      districts.set(districtName, new Set());
    }
    if (wardName) {
      districts.get(districtName).add(wardName);
    }
  }

  for (const [districtName, wards] of districts.entries()) {
    let districtSlug = toSlug(districtName + '-' + cityNode.slug);
    let districtNode = await prisma.location.findFirst({
      where: { name: districtName, parentId: cityNode.id, type: 'DISTRICT' }
    });

    if (!districtNode) {
      // Avoid slug collision
      const existing = await prisma.location.findUnique({ where: { slug: districtSlug } });
      if (existing) districtSlug += '-' + Math.floor(Math.random() * 1000);
      
      districtNode = await prisma.location.create({
        data: {
          name: districtName,
          type: 'DISTRICT',
          slug: districtSlug,
          parentId: cityNode.id
        }
      });
      console.log(`Created DISTRICT: ${districtNode.name}`);
    } else {
       console.log(`Found DISTRICT: ${districtNode.name}`);
    }

    for (const wardName of wards) {
      let wardSlug = toSlug(wardName + '-' + districtSlug);
      
      let wardNode = await prisma.location.findFirst({
        where: { name: wardName, parentId: districtNode.id, type: 'WARD' }
      });

      if (!wardNode) {
        // Avoid slug collision
        let existing = await prisma.location.findUnique({ where: { slug: wardSlug } });
        if (existing) wardSlug += '-' + Math.floor(Math.random() * 10000);
        
        try {
          await prisma.location.create({
            data: {
              name: wardName,
              type: 'WARD',
              slug: wardSlug,
              parentId: districtNode.id
            }
          });
          console.log(`  Created WARD: ${wardName}`);
        } catch (err) {
          if (err.code === 'P2002') {
             wardSlug = wardSlug + '-' + Math.floor(Math.random() * 10000);
             await prisma.location.create({
              data: {
                name: wardName,
                type: 'WARD',
                slug: wardSlug,
                parentId: districtNode.id
              }
            });
            console.log(`  Created WARD: ${wardName} (with random slug)`);
          } else {
            console.error(`Error creating ward ${wardName}:`, err);
          }
        }
      }
    }
  }

  console.log('Done parsing and seeding! You can now check the Location table.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
