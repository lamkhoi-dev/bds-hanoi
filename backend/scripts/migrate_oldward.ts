import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting oldWard migration...');
  
  // Find properties where ward contains '( ... cũ)'
  const properties = await prisma.property.findMany({
    where: {
      ward: {
        contains: ' cũ)',
      }
    },
    select: { id: true, ward: true, oldWard: true }
  });

  console.log(`Found ${properties.length} properties to migrate.`);

  let migratedCount = 0;

  for (const property of properties) {
    if (!property.ward) continue;

    // e.g. "Phường Thành Vinh (Vinh Tân cũ)"
    const match = property.ward.match(/(.*)\s*\((.*)\s*cũ\)/i);
    let newWard = property.ward;
    let oldWard = property.oldWard || '';

    if (match) {
      newWard = match[1].trim();
      oldWard = match[2].trim();
    } else {
      const fallbackMatch = property.ward.match(/(.*)\s*\((.*)\)/i);
      if (fallbackMatch && fallbackMatch[2].toLowerCase().includes('cũ')) {
        newWard = fallbackMatch[1].trim();
        oldWard = fallbackMatch[2].replace(/cũ/i, '').trim();
      }
    }

    if (newWard !== property.ward || oldWard !== property.oldWard) {
      await prisma.property.update({
        where: { id: property.id },
        data: {
          ward: newWard,
          oldWard: oldWard
        }
      });
      console.log(`Migrated property ${property.id}: ${property.ward} -> ward: ${newWard}, oldWard: ${oldWard}`);
      migratedCount++;
    }
  }

  console.log(`Migration complete. Successfully migrated ${migratedCount} properties.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
