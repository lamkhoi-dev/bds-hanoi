import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type UserRecord = any;

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    if (!email) return null;
    return this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  }

  async findByEmailOrPhone(identifier: string): Promise<UserRecord | null> {
    if (!identifier) return null;
    const normalizedIdentifier = identifier.trim();
    const emailIdentifier = normalizedIdentifier.includes('@') ? normalizedIdentifier.toLowerCase() : normalizedIdentifier;
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: emailIdentifier },
          { phone: normalizedIdentifier },
        ],
      },
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        phone: true,
        username: true,
        name: true,
        slug: true,
        bio: true,
        provider: true,
        avatar: true,
        role: true,
        balance: true,
        status: true,
        isPhoneVisible: true,
        isNotificationEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(data: any): Promise<UserRecord> {
    if (data.email) {
      data.email = String(data.email).trim().toLowerCase();
      const existingUser = await this.findByEmail(data.email);
      if (existingUser) {
        throw new ConflictException('Tài khoản đã tồn tại. Vui lòng đăng nhập bằng tài khoản này.');
      }
    }
    if (data.phone) {
      data.phone = String(data.phone).trim();
      const existingPhone = await this.prisma.user.findUnique({ where: { phone: data.phone } });
      if (existingPhone) {
        throw new ConflictException('Số điện thoại đã được đăng ký. Vui lòng đăng nhập bằng số điện thoại này.');
      }
    }
    return this.prisma.user.create({ data });
  }

  async updateProfile(userId: string, data: any): Promise<UserRecord> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.isNotificationEnabled !== undefined) updateData.isNotificationEnabled = data.isNotificationEnabled;
    if (data.isPhoneVisible !== undefined) updateData.isPhoneVisible = data.isPhoneVisible;

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  async deposit(userId: string, amount: number) {
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      throw new BadRequestException('So tien nap phai lon hon 0');
    }
    const normalizedAmount = Number(amount);
    
    // Using Prisma Interactive Transaction to ensure balance and transaction log are consistent
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: normalizedAmount } },
        select: {
          id: true,
          email: true,
          phone: true,
          username: true,
          name: true,
          slug: true,
          provider: true,
          avatar: true,
          role: true,
          balance: true,
          status: true,
          isNotificationEnabled: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: 'DEPOSIT',
          amount: normalizedAmount,
          description: `Nạp ${normalizedAmount} điểm`,
          status: 'SUCCESS',
        },
      });

      return { user, transaction };
    });
  }

  async findAllPropertiesForAdmin() {
    return this.prisma.property.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { savedBy: true }
        }
      }
    });
  }

  async findMyProperties(userId: string) {
    return this.prisma.property.findMany({
      where: { userId },
      include: {
        _count: {
          select: { savedBy: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyRequirements(userId: string) {
    return this.prisma.requirement.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOrCreateOAuthUser(profile: any): Promise<UserRecord> {
    const { email, name, avatar, provider, providerId } = profile;
    const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
    
    let user;

    // 1. Cố gắng tìm bằng providerId trước
    if (providerId) {
      user = await this.prisma.user.findFirst({
        where: {
          provider,
          providerId,
        },
      });
    }

    // 2. Nếu không thấy, và có email, tìm bằng email
    if (!user && normalizedEmail) {
      user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    }

    if (user) {
      // Cập nhật thông tin OAuth nếu cần
      if (user.provider !== provider || user.providerId !== providerId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { provider, providerId, avatar: user.avatar || avatar },
        });
      }
      return user;
    }
    
    // 3. Nếu vẫn không thấy, tạo user mới
    return this.prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name || 'Người dùng ẩn danh',
        avatar,
        provider,
        providerId,
        emailVerified: !!normalizedEmail,
      },
    });
  }

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
        data: { userId, propertyId },
      });
    } catch (e: any) {
      if (e.code === 'P2002') return { message: 'Đã lưu' };
      throw e;
    }
  }

  async unsaveProperty(userId: string, propertyId: string) {
    return this.prisma.savedPost.deleteMany({
      where: { userId, propertyId },
    });
  }

  async getSavedProperties(userId: string) {
    const saved = await this.prisma.savedPost.findMany({
      where: {
        userId,
        property: { status: { in: ['APPROVED', 'SOLD'] }, deletedAt: null },
      },
      include: {
        property: {
          include: { user: { select: { name: true, avatar: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return saved.map(s => s.property);
  }

  async getTransactions(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async exportMyData(userId: string) {
    const profile = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        username: true,
        name: true,
        slug: true,
        bio: true,
        provider: true,
        avatar: true,
        role: true,
        balance: true,
        status: true,
        isNotificationEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!profile) throw new NotFoundException('Nguoi dung khong ton tai');

    const [properties, savedPosts, transactions, comments, complaints, notifications, searchHistories, dataDeletionRequests] = await Promise.all([
      this.prisma.property.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.savedPost.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { property: { select: { id: true, title: true, status: true } } },
      }),
      this.prisma.transaction.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.comment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { property: { select: { id: true, title: true } } },
      }),
      this.prisma.complaint.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.searchHistory.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.dataDeletionRequest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      profile,
      properties,
      savedPosts,
      transactions,
      comments,
      complaints,
      notifications,
      searchHistories,
      dataDeletionRequests,
    };
  }

  async createComplaint(userId: string, data: any) {
    const content = data.content || data.reason || '';
    if (!content || String(content).trim().length < 5) {
      throw new BadRequestException('Noi dung khieu nai phai co it nhat 5 ky tu');
    }

    return this.prisma.complaint.create({
      data: {
        userId,
        transactionId: data.transactionId || null,
        propertyId: data.propertyId || null,
        type: data.type || 'GENERAL',
        subject: data.subject || 'Khiếu nại người dùng',
        content,
      },
    });
  }

  async requestDataDeletion(userId: string, reason?: string) {
    const existingPending = await this.prisma.dataDeletionRequest.findFirst({
      where: { userId, status: 'PENDING' },
      select: { id: true },
    });
    if (existingPending) {
      throw new BadRequestException('Da co yeu cau xoa du lieu dang cho xu ly');
    }

    return this.prisma.dataDeletionRequest.create({
      data: {
        userId,
        reason: reason || null,
      },
    });
  }

  async getPublicProfile(idOrSlug: string) {
    let user = await this.prisma.user.findFirst({
      where: { id: idOrSlug, status: { notIn: ['BANNED', 'DELETED'] } },
      select: {
        id: true,
        name: true,
        avatar: true,
        phone: true,
        createdAt: true,
        slug: true,
        bio: true,
        isPhoneVisible: true,
      }
    });

    if (!user) {
      user = await this.prisma.user.findFirst({
        where: { slug: idOrSlug, status: { notIn: ['BANNED', 'DELETED'] } },
        select: {
          id: true,
          name: true,
          avatar: true,
          phone: true,
          createdAt: true,
          slug: true,
          bio: true,
          isPhoneVisible: true,
        }
      });
    }

    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    const properties = await this.prisma.property.findMany({
      where: {
        userId: user.id,
        status: { in: ['APPROVED', 'SOLD'] },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    const soldCount = await this.prisma.property.count({
      where: {
        userId: user.id,
        status: 'SOLD',
        deletedAt: null,
      },
    });

    return {
      ...user,
      properties,
      soldCount,
      _count: {
        properties: properties.length
      }
    };
  }
}
