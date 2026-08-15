import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BackupService } from '../backup/backup.service';

@Injectable()
export class BackupCronService {
  private readonly logger = new Logger(BackupCronService.name);

  constructor(private readonly backupService: BackupService) {}

  /**
   * Cron: 2h sáng mỗi ngày → Tự động backup JSON toàn bộ database
   */
  @Cron('0 0 2 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  async runScheduledBackup() {
    if (process.env.ENABLE_SCHEDULED_BACKUP === 'DISABLED') return;

    this.logger.log('═══ BẮT ĐẦU SAO LƯU TỰ ĐỘNG (2:00 AM) ═══');
    try {
      const result = await this.backupService.createJsonBackup();
      this.logger.log(`Sao lưu tự động hoàn tất: ${result.fileName} (${(result.size / 1024 / 1024).toFixed(2)} MB)`);
    } catch (error) {
      this.logger.error(`Sao lưu tự động thất bại: ${error.message}`);
    }
  }

  /**
   * Cron: 3h sáng mỗi ngày → Tự xóa backup cũ hơn 10 ngày, chỉ giữ tối đa 3 bản mới nhất.
   * Vòng lặp: backup mới (2h) → xóa cũ (3h) → 10 ngày sau lại xóa → vòng lặp tiếp.
   */
  @Cron('0 0 3 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  async runRetentionCleanup() {
    if (process.env.ENABLE_SCHEDULED_BACKUP === 'DISABLED') return;

    this.logger.log('═══ BẮT ĐẦU DỌN DẸP FILE BACKUP CŨ (3:00 AM) ═══');
    try {
      const result = await this.backupService.cleanOldBackups(10, 3);
      if (result.deleted.length > 0) {
        this.logger.log(`Đã xóa ${result.deleted.length} file backup cũ: ${result.deleted.join(', ')}`);
      } else {
        this.logger.log('Không có file backup nào cần xóa.');
      }
    } catch (error) {
      this.logger.error(`Dọn dẹp backup thất bại: ${error.message}`);
    }
  }
}
