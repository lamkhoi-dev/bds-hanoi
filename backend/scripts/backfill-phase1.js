const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function calculatePricePerM2(priceMin, priceMax, areaMin, areaMax) {
  let avgPrice = null;
  if (priceMin && priceMax) avgPrice = (priceMin + priceMax) / 2;
  else if (priceMin) avgPrice = priceMin;
  else if (priceMax) avgPrice = priceMax;

  let avgArea = null;
  if (areaMin && areaMax) avgArea = (areaMin + areaMax) / 2;
  else if (areaMin) avgArea = areaMin;
  else if (areaMax) avgArea = areaMax;

  if (avgPrice && avgArea && avgArea > 0) {
    return avgPrice / avgArea;
  }
  return null;
}

function formatPricePerM2(pricePerM2) {
  if (!pricePerM2) return '-';
  const millionPerM2 = pricePerM2 / 1000000;
  return `≈${Math.round(millionPerM2)}tr/m²`;
}

async function main() {
  const properties = await prisma.property.findMany();
  let updatedCount = 0;
  for (const prop of properties) {
    const data = {};
    if (prop.price !== null && prop.priceMin === null) {
      data.priceMin = prop.price;
      data.priceMax = prop.price;
    }
    if (prop.area !== null && prop.areaMin === null) {
      data.areaMin = prop.area;
      data.areaMax = prop.area;
    }
    
    const currentPriceMin = data.priceMin !== undefined ? data.priceMin : prop.priceMin;
    const currentPriceMax = data.priceMax !== undefined ? data.priceMax : prop.priceMax;
    const currentAreaMin = data.areaMin !== undefined ? data.areaMin : prop.areaMin;
    const currentAreaMax = data.areaMax !== undefined ? data.areaMax : prop.areaMax;
    
    if (currentPriceMin || currentAreaMin) {
      const pm2 = calculatePricePerM2(currentPriceMin, currentPriceMax, currentAreaMin, currentAreaMax);
      if (pm2) {
        data.pricePerM2 = pm2;
        data.pricePerM2Display = formatPricePerM2(pm2);
      } else {
        data.pricePerM2Display = '-';
      }
    }
    
    if (Object.keys(data).length > 0) {
      await prisma.property.update({ where: { id: prop.id }, data });
      updatedCount++;
    }
  }
  console.log(`Backfilled ${updatedCount} properties.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
