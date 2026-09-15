import { CommentService } from './comment.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

describe('CommentService', () => {
  let service: CommentService;
  let prisma: any;
  let notificationService: any;

  beforeEach(() => {
    prisma = {
      property: { findUnique: jest.fn() },
      comment: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
      user: { findUnique: jest.fn() },
    };
    notificationService = { createNotification: jest.fn() };
    service = new CommentService(prisma as unknown as PrismaService, notificationService as unknown as NotificationService);
  });

  describe('getCommentsByProperty — thứ tự hiển thị', () => {
    it('sắp CŨ trước, MỚI sau (asc) — khách yêu cầu 15/9, trước đây "desc" đẩy bình luận mới lên đầu', async () => {
      prisma.property.findUnique.mockResolvedValue({ status: 'APPROVED' });
      await service.getCommentsByProperty('p1');
      expect(prisma.comment.findMany.mock.calls[0][0].orderBy).toEqual({ createdAt: 'asc' });
    });
  });
});
