import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting location seed...');
  const filePath = path.join(__dirname, 'locations.utf8.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n').filter(l => l.trim().length > 0);
  
  const dataLines = lines.slice(1);

  const cityMap = new Map<string, string>();
  const districtMap = new Map<string, string>();

  for (const line of dataLines) {
    const cols = line.split(',');
    if (cols.length < 9) continue;

    const cityName = cols[2].trim();
    const districtName = cols[5].trim();
    const wardName = cols[8].trim();

    let cityId = cityMap.get(cityName);
    if (!cityId) {
      let city = await prisma.location.findFirst({ where: { name: cityName, type: 'CITY' } });
      if (!city) {
        city = await prisma.location.create({ data: { name: cityName, type: 'CITY' } });
      }
      cityId = city.id;
      cityMap.set(cityName, cityId);
    }

    const districtKey = `${cityName}-${districtName}`;
    let districtId = districtMap.get(districtKey);
    if (!districtId) {
      let district = await prisma.location.findFirst({ where: { name: districtName, type: 'DISTRICT', parentId: cityId } });
      if (!district) {
        district = await prisma.location.create({ data: { name: districtName, type: 'DISTRICT', parentId: cityId } });
      }
      districtId = district.id;
      districtMap.set(districtKey, districtId);
    }

    const wardExists = await prisma.location.findFirst({ where: { name: wardName, type: 'WARD', parentId: districtId } });
    if (!wardExists) {
      await prisma.location.create({ data: { name: wardName, type: 'WARD', parentId: districtId } });
      console.log(`Created ward: ${wardName} - ${districtName}`);
    }
  }

  console.log('Location seeding completed!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
