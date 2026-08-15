const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log('Resetting _prisma_migrations...');
  execSync('npx prisma db execute --schema prisma/schema.prisma --stdin', { input: 'DELETE FROM "_prisma_migrations";', env: process.env, stdio: 'inherit' });

  console.log('Removing old migrations...');
  fs.rmSync('prisma/migrations', { recursive: true, force: true });
  fs.mkdirSync('prisma/migrations/0_init', { recursive: true });

  console.log('Generating diff...');
  const sql = execSync('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script', { encoding: 'utf8', env: process.env });
  fs.writeFileSync('prisma/migrations/0_init/migration.sql', sql, 'utf8');

  console.log('Resolving 0_init...');
  execSync('npx prisma migrate resolve --applied 0_init', { stdio: 'inherit', env: process.env });
  
  console.log('Done baseline');
} catch (error) {
  console.error(error);
}
