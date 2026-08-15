const { execSync } = require('child_process');
const fs = require('fs');

try {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('No DATABASE_URL');
  
  console.log('Generating diff from DB to schema...');
  const sql = execSync(`npx prisma migrate diff --from-url "${dbUrl}" --to-schema-datamodel prisma/schema.prisma --script`, { encoding: 'utf8', env: process.env });
  
  const migrationPath = 'prisma/migrations/20260531_phase1/migration.sql';
  fs.writeFileSync(migrationPath, sql, 'utf8');
  console.log('Wrote migration to', migrationPath);
  
  if (sql.trim().length === 0 || sql.includes('This is an empty migration')) {
    console.log('No changes to apply.');
  } else {
    console.log('Applying migration manually...');
    execSync(`npx prisma db execute --url "${dbUrl}" --file ${migrationPath}`, { stdio: 'inherit', env: process.env });
    console.log('Migration applied successfully.');
  }
} catch (e) {
  console.error(e);
}
