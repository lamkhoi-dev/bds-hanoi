const { existsSync } = require('fs');
const { spawnSync } = require('child_process');
const { resolve } = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function logRestore(status, filePath, message) {
  try {
    await prisma.backupLog.create({
      data: {
        type: 'RESTORE',
        status,
        filePath,
        message,
      },
    });
  } catch (error) {
    console.error('[restore] Failed to write BackupLog:', error.message);
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const fileArg = process.argv[2];

  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  if (!fileArg) throw new Error('Usage: npm run db:restore -- <backup-file>');
  if (process.env.CONFIRM_RESTORE !== 'YES') {
    throw new Error('Set CONFIRM_RESTORE=YES to run restore. This operation can replace existing database objects.');
  }

  const filePath = resolve(fileArg);
  if (!existsSync(filePath)) throw new Error(`Backup file not found: ${filePath}`);

  const result = spawnSync('pg_restore', ['--clean', '--if-exists', '--no-owner', '--no-acl', '--dbname', databaseUrl, filePath], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    await logRestore('FAILED', filePath, `pg_restore exited with code ${result.status}`);
    process.exit(result.status || 1);
  }

  await logRestore('SUCCESS', filePath, 'Restore completed');
  console.log(`[restore] Restored ${filePath}`);
}

main()
  .catch(async (error) => {
    await logRestore('FAILED', process.argv[2] ? resolve(process.argv[2]) : null, error.message);
    console.error('[restore]', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
