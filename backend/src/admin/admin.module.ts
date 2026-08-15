import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SearchModule } from '../search/search.module';
import { NotificationModule } from '../notification/notification.module';
import { CryptoService } from '../shared/crypto.service';
import { AdminActionLogService } from './admin-action-log.service';

@Module({
  imports: [PrismaModule, SearchModule, NotificationModule],
  controllers: [AdminController],
  providers: [AdminService, CryptoService, AdminActionLogService],
})
export class AdminModule {}
