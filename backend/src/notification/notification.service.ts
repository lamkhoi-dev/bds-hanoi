import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService
  ) {}

  async createNotification(userId: string, title: string, content: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    if (user.status === 'BANNED' || user.status === 'DELETED') return null;
    if (!user.isNotificationEnabled) return null;

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        content
      }
    });

    if (user.email) {
      this.mailService.sendNotificationEmail(user.email, title, content).catch(() => undefined);
    }

    return notification;
  }

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true }
    });
  }

  async updateNotificationSettings(userId: string, isNotificationEnabled: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isNotificationEnabled },
      select: {
        id: true,
        isNotificationEnabled: true,
      }
    });
  }
}
