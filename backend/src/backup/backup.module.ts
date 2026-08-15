import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { BackupCronService } from '../maintenance/backup-cron.service';

@Module({
  imports: [PrismaModule],
  controllers: [BackupController],
  providers: [BackupService, BackupCronService],
  exports: [BackupService],
})
export class BackupModule {}
