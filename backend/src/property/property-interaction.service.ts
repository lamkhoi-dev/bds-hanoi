import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class PropertyInteractionService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async saveProperty(userId: string, propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { status: true, deletedAt: true },
    });
    if (!property || property.deletedAt || !['APPROVED', 'SOLD'].includes(property.status)) {
      throw new NotFoundException('Tin dang khong ton tai hoac chua duoc hien thi');
    }

    try {
      return await this.prisma.savedPost.create({
        data: { userId, propertyId }
      });
    } catch (e: any) {
      if (e.code === 'P2002') return { message: 'Đã lưu' };
      throw e;
    }
  }

  async unsaveProperty(userId: string, propertyId: string) {
    return this.prisma.savedPost.deleteMany({
      where: { userId, propertyId }
    });
  }

  async removeFavorite(userId: string, propertyId: string) {
    const existing = await this.prisma.savedPost.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
    });
    if (!existing) {
      throw new NotFoundException('Property not found in favorites');
    }
    return this.prisma.savedPost.delete({
      where: { userId_propertyId: { userId, propertyId } },
    });
  }

  async getSavedProperties(userId: string) {
    return this.prisma.savedPost.findMany({
      where: {
        userId,
        property: { status: { in: ['APPROVED', 'SOLD'] }, deletedAt: null },
      },
      include: { property: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async compareProperties(ids: string[]) {
    return this.prisma.property.findMany({
      where: { id: { in: ids }, status: { in: ['APPROVED', 'SOLD'] }, deletedAt: null },
      include: { user: { select: { name: true, avatar: true } } }
    });
  }

  async reportProperty(userId: string, propertyId: string, reason: string) {
    if (!reason || reason.trim().length < 5) {
      throw new BadRequestException('Ly do bao cao phai co it nhat 5 ky tu');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { status: true, deletedAt: true },
    });
    if (!property || property.deletedAt || !['APPROVED', 'SOLD'].includes(property.status)) {
      throw new NotFoundException('Tin dang khong ton tai hoac chua duoc hien thi');
    }

    const existing = await this.prisma.report.findFirst({
      where: { userId, propertyId, status: 'PENDING' },
    });
    if (existing) {
      throw new BadRequestException('Ban da bao cao tin nay va bao cao dang cho xu ly');
    }

    return this.prisma.report.create({
      data: { userId, propertyId, reason }
    });
  }

  async trackContact(propertyId: string, viewerUserId?: string, channel: 'PHONE_REVEAL' | 'CALL' | 'ZALO' = 'PHONE_REVEAL') {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, title: true, userId: true, status: true, deletedAt: true },
    });
    if (!property) throw new NotFoundException('Không tìm thấy bất động sản');
    if (property.deletedAt || !['APPROVED', 'SOLD'].includes(property.status)) {
      throw new NotFoundException('Bất động sản không tồn tại hoặc chưa được hiển thị');
    }

    // Raw SQL để Prisma không áp @updatedAt: bộ đếm tương tác không phải là thay đổi
    // nội dung, mà updatedAt lại là nguồn <lastmod> của sitemap.
    if (channel === 'CALL') {
      await this.prisma
        .$executeRaw`UPDATE "Property" SET "callClicks" = "callClicks" + 1 WHERE "id" = ${propertyId}`;
    } else if (channel === 'ZALO') {
      await this.prisma
        .$executeRaw`UPDATE "Property" SET "zaloClicks" = "zaloClicks" + 1 WHERE "id" = ${propertyId}`;
    }

    // Track via PropertyHistory
    await this.prisma.propertyHistory.create({
      data: {
        propertyId,
        changedBy: viewerUserId || 'SYSTEM',
        changes: JSON.stringify({
          action: 'CONTACT',
          channel,
          viewerUserId: viewerUserId || null,
          trackedAt: new Date().toISOString(),
        }),
      },
    });

    // Write to AuditLog
    await this.prisma.auditLog.create({
      data: {
        action: 'PROPERTY_PHONE_REVEAL',
        metadata: JSON.stringify({ channel }),
        entityType: 'PROPERTY',
        entityId: propertyId,
        actorId: viewerUserId || null,
      }
    }).catch(e => console.error('Failed to write AuditLog', e));

    if (property.userId !== viewerUserId) {
      await this.notificationService.createNotification(
        property.userId,
        'Có người liên hệ',
        `Có người vừa quan tâm tin "${property.title}" qua kênh ${channel}.`
      );
    }

    return { success: true };
  }

  async incrementView(id: string) {
    // Xem chi tiết 3.3 trong plan: `prisma.property.update` áp @updatedAt, nên mỗi lượt
    // xem trang đẩy Property.updatedAt và làm <lastmod> của mọi tin đổi liên tục —
    // Google coi lastmod đó là vô nghĩa. Raw SQL bỏ qua @updatedAt.
    await this.prisma
      .$executeRaw`UPDATE "Property" SET "views" = "views" + 1 WHERE "id" = ${id}`;
    return { success: true };
  }
}
