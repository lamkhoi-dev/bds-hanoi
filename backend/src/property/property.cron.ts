import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PropertyCronService {
  private readonly logger = new Logger(PropertyCronService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleVipExpiration() {
    this.logger.log('Checking for expired VIP and UP properties...');
    const now = new Date();

    const expiredCount = await this.prisma.property.updateMany({
      where: {
        tier: { in: ['VIP', 'UP'] },
        tierExpiresAt: {
          lt: now,
        },
      },
      data: {
        tier: 'NORMAL',
      },
    });

    if (expiredCount.count > 0) {
      this.logger.log(`Downgraded ${expiredCount.count} properties from VIP/UP to NORMAL.`);
    }

    this.logger.log('Cronjob checking finished.');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handlePostExpiration() {
    this.logger.log('Checking for 1-year expired properties...');
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const expiredCount = await this.prisma.property.updateMany({
      where: {
        createdAt: {
          lt: oneYearAgo,
        },
        status: {
          not: 'EXPIRED'
        }
      },
      data: {
        status: 'EXPIRED',
      },
    });

    if (expiredCount.count > 0) {
      this.logger.log(`Expired ${expiredCount.count} properties older than 1 year.`);
    }
  }
}
