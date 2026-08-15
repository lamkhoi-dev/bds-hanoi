import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ViewedPropertyService {
  constructor(private readonly prisma: PrismaService) {}

  async logView(userId: string | undefined, propertyId: string) {
    if (!userId) return; // Only log for logged in users
    try {
      await this.prisma.viewedProperty.upsert({
        where: { userId_propertyId: { userId, propertyId } },
        update: { viewedAt: new Date() },
        create: { userId, propertyId, viewedAt: new Date() }
      });
    } catch (err) {
      console.error('Failed to log ViewedProperty', err);
    }
  }

  async getRecentlyViewed(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [viewed, total] = await Promise.all([
      this.prisma.viewedProperty.findMany({
        where: {
          userId,
          property: { status: { in: ['APPROVED', 'SOLD'] }, deletedAt: null },
        },
        orderBy: { viewedAt: 'desc' },
        skip,
        take: limit,
        include: {
          property: {
            include: { user: { select: { name: true, avatar: true } }, imageObjects: true }
          }
        }
      }),
      this.prisma.viewedProperty.count({
        where: {
          userId,
          property: { status: { in: ['APPROVED', 'SOLD'] }, deletedAt: null },
        }
      })
    ]);

    return {
      data: viewed.map(v => v.property).filter(p => p !== null),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}
