import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminActionLogService {
  constructor(private readonly prisma: PrismaService) {}
  //d
  async logAction(
    adminId: string,
    actionType: string,
    targetId?: string,
    targetType?: string,
    description?: string,
    metadata?: any
  ) {
    try {
      await this.prisma.adminActionLog.create({
        data: {
          adminId,
          actionType,
          targetId,
          targetType,
          description,
          metadata: metadata === undefined || metadata === null
            ? null
            : typeof metadata === 'string'
              ? metadata
              : JSON.stringify(metadata),
        }
      });
    } catch (err) {
      console.error('Failed to write AdminActionLog', err);
    }
  }
}
