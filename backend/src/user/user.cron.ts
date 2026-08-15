import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserCronService {
  private readonly logger = new Logger(UserCronService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDataDeletion() {
    this.logger.log('Bắt đầu xử lý xóa tài khoản đã yêu cầu...');
    
    // Tìm các user có dataDeletionRequested = true và đã quá 30 ngày kể từ createdAt (hoặc updatedAt)
    // Giả định `updatedAt` của User là lúc user đó request xóa, 
    // Nếu muốn chính xác hơn có thể tạo field `deletionRequestedAt`.
    // Hiện tại Prisma schema chưa có field deletionRequestedAt, nên ta xóa ngay hoặc xóa những user có status = 'DELETED' 
    // Để giữ dữ liệu theo luật, giả sử ta xóa vĩnh viễn user có yêu cầu > 30 ngày (tạm dùng updatedAt).
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      const requests = await this.prisma.dataDeletionRequest.findMany({
        where: {
          status: 'PENDING',
          createdAt: {
            lte: thirtyDaysAgo
          }
        }
      });

      if (requests.length > 0) {
        for (const req of requests) {
          if (req.userId) {
            await this.prisma.user.delete({ where: { id: req.userId } });
          }
          await this.prisma.dataDeletionRequest.update({ where: { id: req.id }, data: { status: 'COMPLETED' } });
          this.logger.log(`Đã xóa vĩnh viễn tài khoản: (ID: ${req.userId})`);
        }
      } else {
        this.logger.log('Không có tài khoản nào cần xóa vĩnh viễn hôm nay.');
      }
    } catch (error) {
      this.logger.error('Lỗi khi xóa dữ liệu tài khoản', error);
    }
  }
}
