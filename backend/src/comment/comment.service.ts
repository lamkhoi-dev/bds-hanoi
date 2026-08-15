import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService
  ) {}

  async createComment(userId: string, propertyId: string, content: string, parentId?: string) {
    if (!content || content.trim().length < 2) {
      throw new BadRequestException('Nội dung bình luận quá ngắn');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) throw new NotFoundException('Bất động sản không tồn tại');
    if (!['APPROVED', 'SOLD'].includes(property.status)) {
      throw new NotFoundException('Bất động sản không tồn tại hoặc chưa được hiển thị');
    }

    // Anti-spam: 5 minutes cooldown per property per user
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentComment = await this.prisma.comment.findFirst({
      where: {
        userId,
        propertyId,
        createdAt: { gte: fiveMinutesAgo }
      }
    });

    if (recentComment) {
      throw new BadRequestException('Mỗi người chỉ được bình luận cách nhau 5 phút trên cùng một bài đăng.');
    }

    if (parentId) {
      const parentComment = await this.prisma.comment.findUnique({ where: { id: parentId } });
      if (!parentComment) throw new NotFoundException('Bình luận gốc không tồn tại');
    }

    const comment = await this.prisma.comment.create({
      data: {
        userId,
        propertyId,
        content,
        parentId
      },
      include: { user: { select: { name: true, avatar: true } } }
    });

    // Gửi thông báo cho chủ bài viết
    if (property.userId !== userId) {
      await this.notificationService.createNotification(
        property.userId,
        'Bình luận mới',
        `Có người vừa bình luận vào bài viết "${property.title}" của bạn.`
      );
    }

    return comment;
  }

  async getCommentsByProperty(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { status: true },
    });
    if (!property || !['APPROVED', 'SOLD'].includes(property.status)) {
      throw new NotFoundException('Bất động sản không tồn tại hoặc chưa được hiển thị');
    }

    return this.prisma.comment.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, avatar: true } } }
    });
  }

  async deleteComment(userId: string, propertyId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId }
    });
    
    if (!comment) throw new NotFoundException('Không tìm thấy bình luận');

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId }
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // Quyền xóa bình luận: Người viết, Chủ bài đăng, Admin
    const isCommentOwner = comment.userId === userId;
    const isPropertyOwner = property?.userId === userId;
    const isAdmin = user?.role === 'ADMIN';

    if (!isCommentOwner && !isPropertyOwner && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này');
    }

    return this.prisma.comment.delete({
      where: { id: commentId }
    });
  }
}
