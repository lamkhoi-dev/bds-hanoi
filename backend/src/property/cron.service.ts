import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PropertyCronService {
  private readonly logger = new Logger(PropertyCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.debug('Running VIP expiration check...');
    
    const now = new Date();
    
    // Find all expired VIP properties
    const expiredProperties = await this.prisma.property.updateMany({
      where: {
        tier: 'VIP',
        tierExpiresAt: {
          lt: now
        }
      },
      data: {
        tier: 'NORMAL'
      }
    });

    if (expiredProperties.count > 0) {
      this.logger.log(`Downgraded ${expiredProperties.count} expired VIP properties to NORMAL.`);
    }
  }
}
