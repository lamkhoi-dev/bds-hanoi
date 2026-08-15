const { spawnSync } = require('child_process');
const { mkdirSync } = require('fs');
const { join, resolve } = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function logBackup(status, filePath, message) {
  try {
    await prisma.backupLog.create({
      data: {
        type: 'BACKUP',
        status,
        filePath,
        message,
      },
    });
  } catch (error) {
    console.error('[backup] Failed to write BackupLog:', error.message);
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const backupDir = resolve(process.env.BACKUP_DIR || join(__dirname, '..', 'backups'));
  mkdirSync(backupDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = join(backupDir, `bds-backup-${stamp}.dump`);
  const result = spawnSync('pg_dump', ['--format=custom', '--no-owner', '--no-acl', '--file', filePath, databaseUrl], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    await logBackup('FAILED', filePath, `pg_dump exited with code ${result.status}`);
    process.exit(result.status || 1);
  }

  await logBackup('SUCCESS', filePath, 'Backup completed');
  console.log(`[backup] Created ${filePath}`);
}

main()
  .catch(async (error) => {
    await logBackup('FAILED', null, error.message);
    console.error('[backup]', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
