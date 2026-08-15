import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createWriteStream, createReadStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join, resolve, extname } from 'path';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;

  // Thứ tự bảng tôn trọng FK dependencies (bảng cha trước, bảng con sau)
  private readonly TABLE_ORDER = [
    'user',
    'category',
    'location',
    'systemSettings',
    'property',
    'propertyImage',
    'propertyHistory',
    'savedPost',
    'transaction',
    'paymentWebhookLog',
    'notification',
    'report',
    'complaint',
    'comment',
    'requirement',
    'auditLog',
    'dataDeletionRequest',
    'backupLog',
    'searchHistory',
    'adminActionLog',
    'viewedProperty',
  ];

  constructor(private readonly prisma: PrismaService) {
    this.backupDir = resolve(process.env.BACKUP_DIR || join(__dirname, '..', '..', 'backups'));
    mkdirSync(this.backupDir, { recursive: true });
  }

  // ═══════════════════════════════════════════
  // JSON BACKUP — Export toàn bộ database
  // ═══════════════════════════════════════════

  async createJsonBackup(): Promise<{ filePath: string; fileName: string; size: number }> {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `bds-full-backup-${stamp}.json.gz`;
    const filePath = join(this.backupDir, fileName);

    try {
      this.logger.log('Bắt đầu JSON backup toàn bộ database...');

      const data: Record<string, any[]> = {};
      for (const table of this.TABLE_ORDER) {
        try {
          data[table] = await (this.prisma as any)[table].findMany();
          this.logger.log(`  → ${table}: ${data[table].length} bản ghi`);
        } catch (err) {
          this.logger.warn(`  → Bỏ qua bảng ${table}: ${err.message}`);
          data[table] = [];
        }
      }

      // Thêm metadata
      const backup = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        tables: data,
        counts: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, v.length]),
        ),
      };

      const jsonStr = JSON.stringify(backup);
      const readable = Readable.from([jsonStr]);
      const gzip = createGzip({ level: 6 });
      const writable = createWriteStream(filePath);

      await pipeline(readable, gzip, writable);

      const size = statSync(filePath).size;
      this.logger.log(`Backup JSON hoàn tất: ${fileName} (${(size / 1024 / 1024).toFixed(2)} MB)`);

      await this.logBackup('BACKUP', 'SUCCESS', filePath, 'JSON backup completed');
      return { filePath, fileName, size };
    } catch (error) {
      await this.logBackup('BACKUP', 'FAILED', filePath, error.message);
      throw error;
    }
  }

  // ═══════════════════════════════════════════
  // JSON RESTORE — Khôi phục từ file JSON.gz
  // ═══════════════════════════════════════════

  async restoreFromJson(fileName: string): Promise<{ message: string; counts: Record<string, number> }> {
    const filePath = this.getBackupFilePath(fileName);
    if (!filePath) {
      throw new Error(`File backup không tồn tại hoặc tên file không hợp lệ: ${fileName}`);
    }

    try {
      this.logger.log(`Bắt đầu restore từ ${fileName}...`);

      // Đọc và decompress
      const chunks: Buffer[] = [];
      const readable = createReadStream(filePath);
      const gunzip = createGunzip();

      await new Promise<void>((resolve, reject) => {
        readable
          .pipe(gunzip)
          .on('data', (chunk: Buffer) => chunks.push(chunk))
          .on('end', () => resolve())
          .on('error', (err) => reject(err));
      });

      const backup = JSON.parse(Buffer.concat(chunks).toString('utf-8'));

      if (!backup.tables) {
        throw new Error('File backup không hợp lệ: thiếu trường "tables"');
      }

      // Restore theo thứ tự ngược FK (xóa bảng con trước, bảng cha sau)
      const reverseOrder = [...this.TABLE_ORDER].reverse();
      const counts: Record<string, number> = {};

      // Bước 1: Xóa toàn bộ dữ liệu (thứ tự ngược)
      this.logger.log('Bước 1: Xóa dữ liệu cũ...');
      for (const table of reverseOrder) {
        try {
          await (this.prisma as any)[table].deleteMany();
          this.logger.log(`  → Xóa ${table}`);
        } catch (err) {
          this.logger.warn(`  → Bỏ qua xóa ${table}: ${err.message}`);
        }
      }

      // Bước 2: Insert dữ liệu mới (thứ tự xuôi)
      this.logger.log('Bước 2: Nhập dữ liệu mới...');
      for (const table of this.TABLE_ORDER) {
        const records = backup.tables[table];
        if (!records || records.length === 0) {
          counts[table] = 0;
          continue;
        }

        try {
          // Insert theo batch 500 records
          const batchSize = 500;
          for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize).map((record: any) => {
              // Chuyển đổi DateTime strings thành Date objects
              const processed: any = {};
              for (const [key, value] of Object.entries(record)) {
                if (value !== null && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
                  processed[key] = new Date(value);
                } else {
                  processed[key] = value;
                }
              }
              return processed;
            });

            await (this.prisma as any)[table].createMany({
              data: batch,
              skipDuplicates: true,
            });
          }
          counts[table] = records.length;
          this.logger.log(`  → ${table}: ${records.length} bản ghi`);
        } catch (err) {
          this.logger.error(`  → Lỗi khi nhập ${table}: ${err.message}`);
          counts[table] = 0;
        }
      }

      await this.logBackup('RESTORE', 'SUCCESS', filePath, `Restored from ${fileName}`);
      return { message: `Khôi phục thành công từ ${fileName}`, counts };
    } catch (error) {
      await this.logBackup('RESTORE', 'FAILED', filePath, error.message);
      throw error;
    }
  }

  // ═══════════════════════════════════════════
  // QUẢN LÝ FILE BACKUP
  // ═══════════════════════════════════════════

  listBackupFiles(): Array<{ name: string; size: number; sizeFormatted: string; createdAt: Date; type: string }> {
    if (!existsSync(this.backupDir)) return [];

    return readdirSync(this.backupDir)
      .filter((f) => f.endsWith('.json.gz') || f.endsWith('.dump'))
      .map((name) => {
        const stat = statSync(join(this.backupDir, name));
        return {
          name,
          size: stat.size,
          sizeFormatted: this.formatBytes(stat.size),
          createdAt: stat.birthtime,
          type: name.endsWith('.json.gz') ? 'JSON' : 'PG_DUMP',
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getBackupFilePath(name: string): string | null {
    const resolvedPath = resolve(this.backupDir, name);
    const resolvedBackupDir = resolve(this.backupDir);
    // Bảo vệ path traversal
    if (!resolvedPath.startsWith(resolvedBackupDir + require('path').sep) && resolvedPath !== resolvedBackupDir) {
      return null;
    }
    if (!existsSync(resolvedPath)) return null;
    return resolvedPath;
  }

  deleteBackupFile(name: string): boolean {
    const filePath = this.getBackupFilePath(name);
    if (!filePath) return false;
    unlinkSync(filePath);
    this.logger.log(`Đã xóa file backup: ${name}`);
    return true;
  }

  /**
   * Retention policy: Xóa file backup cũ hơn maxDays ngày,
   * và chỉ giữ lại tối đa maxFiles bản mới nhất.
   */
  async cleanOldBackups(maxDays: number = 10, maxFiles: number = 3): Promise<{ deleted: string[] }> {
    const files = this.listBackupFiles();
    const deleted: string[] = [];
    const cutoff = new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000);

    // Xóa file quá hạn
    for (const file of files) {
      if (file.createdAt < cutoff) {
        this.deleteBackupFile(file.name);
        deleted.push(file.name);
      }
    }

    // Nếu vẫn còn quá maxFiles, xóa file cũ nhất
    const remaining = this.listBackupFiles();
    if (remaining.length > maxFiles) {
      const toDelete = remaining.slice(maxFiles);
      for (const file of toDelete) {
        this.deleteBackupFile(file.name);
        deleted.push(file.name);
      }
    }

    if (deleted.length > 0) {
      this.logger.log(`Retention: Đã xóa ${deleted.length} file backup cũ`);
      await this.logBackup('BACKUP', 'SUCCESS', null, `Retention cleaned ${deleted.length} files`);
    }

    return { deleted };
  }

  // ═══════════════════════════════════════════
  // UPLOAD FILE BACKUP
  // ═══════════════════════════════════════════

  async saveUploadedFile(file: Express.Multer.File): Promise<{ fileName: string; size: number }> {
    const ext = extname(file.originalname).toLowerCase();
    const allowed = ['.gz', '.dump'];

    if (!allowed.some((a) => file.originalname.endsWith(a === '.gz' ? '.json.gz' : a))) {
      throw new Error('Chỉ chấp nhận file .json.gz hoặc .dump');
    }

    const fileName = `uploaded-${Date.now()}-${file.originalname}`;
    const filePath = join(this.backupDir, fileName);

    const writable = createWriteStream(filePath);
    writable.write(file.buffer);
    writable.end();

    await new Promise<void>((resolve, reject) => {
      writable.on('finish', resolve);
      writable.on('error', reject);
    });

    this.logger.log(`File backup đã upload: ${fileName}`);
    return { fileName, size: file.size };
  }

  // ═══════════════════════════════════════════
  // BACKUP LOG
  // ═══════════════════════════════════════════

  async getBackupLogs(filters: any = {}) {
    const page = filters.page ? parseInt(filters.page, 10) : 1;
    const limit = filters.limit ? parseInt(filters.limit, 10) : 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      this.prisma.backupLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.backupLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ═══════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════

  private async logBackup(type: string, status: string, filePath: string | null, message: string) {
    try {
      await this.prisma.backupLog.create({
        data: { type, status, filePath, message },
      });
    } catch (err) {
      this.logger.error(`Không thể ghi BackupLog: ${err.message}`);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
