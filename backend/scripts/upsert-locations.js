const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

function slugify(str) {
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
  const dataPath = './backend/prisma/real-locations.json';
  if (!fs.existsSync(dataPath)) {
    console.error('File not found:', dataPath);
    return;
  }
  
  const cities = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  for (const cityData of cities) {
    console.log(`Syncing city: ${cityData.name}`);
    // Find or create city
    let city = await prisma.location.findFirst({ where: { name: cityData.name, type: 'CITY' } });
    if (!city) {
      city = await prisma.location.create({ data: { name: cityData.name, type: 'CITY' } });
    }
    
    for (const distData of cityData.districts) {
      console.log(`  Syncing district: ${distData.name}`);
      // Find or create district
      let district = await prisma.location.findFirst({
        where: { name: distData.name, type: 'DISTRICT', parentId: city.id }
      });
      if (!district) {
        district = await prisma.location.create({
          data: { name: distData.name, type: 'DISTRICT', parentId: city.id }
        });
      }
      
      // Upsert wards
      for (const wardName of distData.wards) {
        const existingWard = await prisma.location.findFirst({
          where: { name: wardName, type: 'WARD', parentId: district.id }
        });
        if (!existingWard) {
          await prisma.location.create({
            data: { name: wardName, type: 'WARD', parentId: district.id }
          });
        }
      }
    }
  }
  
  console.log('Location sync completed successfully!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
