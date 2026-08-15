const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const properties = await prisma.property.findMany();
  const settings = await prisma.systemSettings.findMany();
  const data = {
    properties,
    settings,
  };
  const backupPath = path.join(__dirname, '..', 'backups', `json-backup-${Date.now()}.json`);
  fs.mkdirSync(path.join(__dirname, '..', 'backups'), { recursive: true });
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
  console.log(`Successfully backed up ${properties.length} properties to ${backupPath}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
