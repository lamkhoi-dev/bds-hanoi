import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { NotificationService } from '../notification/notification.service';
import { CryptoService } from '../shared/crypto.service';
import { AdminActionLogService } from './admin-action-log.service';
import { locationSlug, stripUnitPrefix } from '../location/location-utils';
import { LocationService } from '../location/location.service';
import { SeoService } from '../seo/seo.service';
import { LocationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

type PropertyStatus = string;

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private searchService: SearchService,
    private notificationService: NotificationService,
    private cryptoService: CryptoService,
    private adminActionLogService: AdminActionLogService,
    private locationService: LocationService,
    private seoService: SeoService
  ) {}

  private csvCell(value: any) {
    if (value === null || value === undefined) return '';
    return `"${String(value).replace(/"/g, '""')}"`;
  }

  private restoreUuidFromBankToken(value: string) {
    const normalized = String(value || '').trim();
    if (/^[0-9a-fA-F]{32}$/.test(normalized)) {
      return `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12, 16)}-${normalized.slice(16, 20)}-${normalized.slice(20)}`;
    }
    return normalized;
  }

  private parseBoolean(value: any) {
    if (value === undefined) return undefined;
    return value === true || value === 'true' || value === 1 || value === '1';
  }

  private parseNonNegativeNumber(value: any, field: string) {
    if (value === undefined || value === null || value === '') return undefined;
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue) || numberValue < 0) {
      throw new BadRequestException(`${field} khong hop le`);
    }
    return numberValue;
  }

  private parsePositiveInteger(value: any, field: string) {
    const numberValue = this.parseNonNegativeNumber(value, field);
    if (numberValue === undefined) return undefined;
    if (!Number.isInteger(numberValue) || numberValue <= 0) {
      throw new BadRequestException(`${field} phai la so nguyen duong`);
    }
    return numberValue;
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalProperties,
      totalUsers,
      pendingProperties,
      activeVip,
      activeUp,
      pendingReports,
      todayTransactions,
      recentPendingPosts,
      newUsersToday,
      newPostsToday,
      failedTransactions
    ] = await Promise.all([
      this.prisma.property.count(),
      this.prisma.user.count(),
      this.prisma.property.count({ where: { status: 'PENDING' } }),
      this.prisma.property.count({ where: { tier: 'VIP' } }),
      this.prisma.property.count({ where: { tier: 'UP' } }),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
      this.prisma.transaction.aggregate({
        where: {
          type: 'DEPOSIT',
          status: 'SUCCESS',
          createdAt: { gte: today }
        },
        _sum: { amount: true }
      }),
      this.prisma.property.findMany({
        where: { status: 'PENDING' },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 5,
        include: { user: { select: { name: true } } }
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: today } }
      }),
      this.prisma.property.count({
        where: { createdAt: { gte: today } }
      }),
      this.prisma.transaction.count({
        where: { status: 'FAILED' }
      })
    ]);

    return {
      properties: totalProperties,
      users: totalUsers,
      pendingProperties,
      activeVip,
      activeUp,
      pendingReports,
      todayRevenue: todayTransactions._sum.amount || 0,
      recentPendingPosts,
      newUsersToday,
      newPostsToday,
      failedTransactions
    };
  }

  async getAllUsers(filters: any) {
    const page = filters.page ? parseInt(filters.page, 10) : 1;
    const limit = filters.limit ? parseInt(filters.limit, 10) : 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } }
      ];
    }
    if (filters.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
          bio: true,
          balance: true,
          status: true,
          isNotificationEnabled: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { properties: true } },
        }
      }),
      this.prisma.user.count({ where })
    ]);

    return { data, total, page, limit };
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: { select: { properties: true, transactions: true, reports: true } }
      }
    });
    if (!user) throw new NotFoundException('Không tìm thấy user');
    return user;
  }

  async updateUser(adminId: string, userId: string, data: { role?: string, fullName?: string, phone?: string, bio?: string }) {
    const updateData: any = {};
    if (data.role) updateData.role = data.role;
    if (data.fullName) updateData.name = data.fullName;
    if (data.phone) updateData.phone = data.phone;
    if (data.bio !== undefined) updateData.bio = data.bio;

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: updateData,
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
          bio: true,
          balance: true,
          status: true,
          isNotificationEnabled: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'ADMIN_UPDATE_USER',
          entityType: 'User',
          entityId: userId,
          metadata: JSON.stringify(data),
        },
      });

      return user;
    });

    this.adminActionLogService.logAction(
      adminId,
      'UPDATE_USER',
      userId,
      'User',
      'Admin updated user info',
      data
    );

    return result;
  }

  async changeUserStatus(adminId: string, userId: string, status: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { status },
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

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'ADMIN_CHANGE_USER_STATUS',
          entityType: 'User',
          entityId: userId,
          metadata: JSON.stringify({ status }),
        },
      });

      return user;
    });
    this.adminActionLogService.logAction(
      adminId,
      'CHANGE_USER_STATUS',
      userId,
      'User',
      'Admin changed user status',
      { status }
    );
    return result;
  }

  async resetUserPassword(adminId: string, userId: string) {
    const newPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'ADMIN_RESET_USER_PASSWORD',
          entityType: 'User',
          entityId: userId,
        },
      });

      return { newPassword };
    });
    this.adminActionLogService.logAction(
      adminId,
      'RESET_USER_PASSWORD',
      userId,
      'User',
      'Admin reset user password'
    );
    return result;
  }

  async updateWallet(adminId: string, userId: string, amount: number, description: string) {
    const rawAmount = Number(amount);
    if (!Number.isSafeInteger(rawAmount) || rawAmount <= 0) {
      throw new BadRequestException('Số tiền điều chỉnh ví không hợp lệ (phải là số nguyên > 0)');
    }
    // Convert raw VND (e.g. 50000) to thousands (e.g. 50) because balance is stored in thousands
    const normalizedAmount = rawAmount / 1000;
    const adminNote = description || null;
    let balanceBefore = 0;
    let balanceAfter = 0;

    const result = await this.prisma.$transaction(async (tx) => {
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

      balanceAfter = Number(user.balance);
      balanceBefore = balanceAfter - normalizedAmount;

      if (balanceAfter < 0) {
        throw new BadRequestException('So du khong du de tru tien');
      }

      await tx.transaction.create({
        data: {
          userId,
          type: 'ADMIN_ADJUST',
          amount: normalizedAmount,
          description: description || 'Admin dieu chinh so du',
          balanceBefore,
          balanceAfter,
          adminNote,
          status: 'SUCCESS',
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'ADMIN_ADJUST_BALANCE',
          entityType: 'User',
          entityId: userId,
          metadata: JSON.stringify({ amount: normalizedAmount, balanceBefore, balanceAfter, adminNote }),
        },
      });

      return user;
    });
    this.adminActionLogService.logAction(
      adminId,
      'ADMIN_ADJUST_BALANCE',
      userId,
      'User',
      'Admin adjusted wallet balance',
      { amount: normalizedAmount, balanceBefore, balanceAfter, adminNote }
    );
    return result;
  }

  async getTransactions(filters: any = {}) {
    const page = filters.page ? parseInt(filters.page, 10) : 1;
    const limit = filters.limit ? parseInt(filters.limit, 10) : 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.type) where.type = filters.type; // DEPOSIT, DEDUCT

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { user: { select: { name: true, email: true } } }
      }),
      this.prisma.transaction.count({ where })
    ]);

    return { data, total, page, limit };
  }

  async getReports() {
    return this.prisma.report.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: { user: { select: { name: true, email: true } }, property: { select: { title: true } } }
    });
  }

  async updateReportStatus(adminId: string, id: string, status: string, adminNote?: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const report = await tx.report.update({
        where: { id },
        data: { status, adminNote },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'RESOLVE_REPORT',
          entityType: 'Report',
          entityId: id,
          metadata: JSON.stringify({ status, adminNote }),
        },
      });

      return report;
    });
    this.adminActionLogService.logAction(
      adminId,
      'RESOLVE_REPORT',
      id,
      'Report',
      'Admin resolved report',
      { status, adminNote }
    );
    return result;
  }

  async getPaymentWebhookLogs(filters: any = {}) {
    const page = filters.page ? parseInt(filters.page, 10) : 1;
    const limit = filters.limit ? parseInt(filters.limit, 10) : 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.referenceId) where.referenceId = filters.referenceId;
    if (filters.userId) where.userId = filters.userId;

    const [data, total] = await Promise.all([
      this.prisma.paymentWebhookLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      }),
      this.prisma.paymentWebhookLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async retryPaymentWebhookLog(adminId: string, id: string) {
    const log = await this.prisma.paymentWebhookLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Không tìm thấy webhook log');
    if (!log.referenceId) throw new NotFoundException('Webhook log thiếu referenceId');

    const existingTx = await this.prisma.transaction.findUnique({
      where: { referenceId: log.referenceId },
    });
    if (existingTx) {
      return this.prisma.paymentWebhookLog.update({
        where: { id },
        data: {
          status: 'DUPLICATE',
          reason: 'Giao dịch đã được xử lý trước đó',
          userId: existingTx.userId,
          transactionId: existingTx.id,
          retryCount: { increment: 1 },
        },
      });
    }

    let payload: any = {};
    try {
      payload = JSON.parse(log.payload || '{}');
    } catch {
      payload = {};
    }
    const content = String(payload.content || log.content || '');
    const transferAmount = Number(payload.transferAmount || log.transferAmount || 0);
    const match = content.match(/NAP\s*([a-zA-Z0-9]+)/i);

    if (!match || !Number.isFinite(transferAmount) || transferAmount <= 0) {
      return this.prisma.paymentWebhookLog.update({
        where: { id },
        data: {
          status: 'FAILED',
          reason: 'Không thể retry vì nội dung hoặc số tiền không hợp lệ',
          retryCount: { increment: 1 },
          nextRetryAt: null,
        },
      });
    }

    const parsedUserId = match[1];
    const restoredUserId = this.restoreUuidFromBankToken(parsedUserId);
    const targetUser = await this.prisma.user.findFirst({
      where: { OR: [{ id: restoredUserId }, { id: parsedUserId }] },
      select: { id: true },
    });

    if (!targetUser) {
      return this.prisma.paymentWebhookLog.update({
        where: { id },
        data: {
          status: 'FAILED',
          reason: `Không tìm thấy user cho mã ${parsedUserId}`,
          retryCount: { increment: 1 },
          nextRetryAt: null,
        },
      });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetUser.id },
        data: { balance: { increment: transferAmount } },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId: targetUser.id,
          type: 'DEPOSIT',
          amount: transferAmount,
          description: `Retry nạp tiền SePay (Mã GD: ${log.referenceId})`,
          status: 'SUCCESS',
          referenceId: log.referenceId,
        },
      });

      const updatedLog = await tx.paymentWebhookLog.update({
        where: { id },
        data: {
          status: 'SUCCESS',
          reason: 'Admin retry thành công',
          userId: targetUser.id,
          transactionId: transaction.id,
          retryCount: { increment: 1 },
          nextRetryAt: null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'ADMIN_RETRY_PAYMENT_WEBHOOK',
          entityType: 'PaymentWebhookLog',
          entityId: id,
          metadata: JSON.stringify({ referenceId: log.referenceId, transactionId: transaction.id }),
        },
      });

      return updatedLog;
    });
    this.adminActionLogService.logAction(
      adminId,
      'RETRY_PAYMENT_WEBHOOK',
      id,
      'PaymentWebhookLog',
      'Admin retried payment webhook',
      { referenceId: log.referenceId }
    );
    return result;
  }

  async getComplaints(filters: any = {}) {
    const page = filters.page ? parseInt(filters.page, 10) : 1;
    const limit = filters.limit ? parseInt(filters.limit, 10) : 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;

    const [data, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          transaction: true,
          property: { select: { id: true, title: true } },
        },
      }),
      this.prisma.complaint.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async updateComplaintStatus(adminId: string, id: string, status: string, resolution?: string) {
    return this.prisma.$transaction(async (tx) => {
      const complaint = await tx.complaint.update({
        where: { id },
        data: { status, resolution: resolution || undefined },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'ADMIN_UPDATE_COMPLAINT',
          entityType: 'Complaint',
          entityId: id,
          metadata: JSON.stringify({ status, resolution }),
        },
      });

      return complaint;
    });
  }

  async getAuditLogs(filters: any = {}) {
    const page = filters.page ? parseInt(filters.page, 10) : 1;
    const limit = filters.limit ? parseInt(filters.limit, 10) : 50;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { actor: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // Enhance data with entity names
    const propertyIds = data.filter(d => ['Property', 'PROPERTY', 'POST'].includes(d.entityType || '')).map(d => d.entityId).filter(Boolean);
    const userIds = data.filter(d => ['User', 'USER'].includes(d.entityType || '')).map(d => d.entityId).filter(Boolean);
    const requirementIds = data.filter(d => ['Requirement', 'REQUIREMENT'].includes(d.entityType || '')).map(d => d.entityId).filter(Boolean);

    const [properties, users, requirements] = await Promise.all([
      propertyIds.length > 0 ? this.prisma.property.findMany({ where: { id: { in: propertyIds as string[] } }, select: { id: true, title: true } }) : [],
      userIds.length > 0 ? this.prisma.user.findMany({ where: { id: { in: userIds as string[] } }, select: { id: true, name: true, phone: true } }) : [],
      requirementIds.length > 0 ? this.prisma.requirement.findMany({ where: { id: { in: requirementIds as string[] } }, select: { id: true, name: true, phone: true } }) : [],
    ]);

    const propertyMap = Object.fromEntries(properties.map(p => [p.id, p.title]));
    const userMap = Object.fromEntries(users.map(u => [u.id, u.name || u.phone]));
    const reqMap = Object.fromEntries(requirements.map(r => [r.id, r.name || r.phone]));

    const enhancedData = data.map(log => {
      let entityName = '';
      if (['Property', 'PROPERTY', 'POST'].includes(log.entityType || '') && log.entityId) entityName = propertyMap[log.entityId];
      if (['User', 'USER'].includes(log.entityType || '') && log.entityId) entityName = userMap[log.entityId];
      if (['Requirement', 'REQUIREMENT'].includes(log.entityType || '') && log.entityId) entityName = reqMap[log.entityId];
      
      return {
        ...log,
        entityName: entityName || null
      };
    });

    return { data: enhancedData, total, page, limit };
  }

  async getBackupLogs(filters: any = {}) {
    const page = filters.page ? parseInt(filters.page, 10) : 1;
    const limit = filters.limit ? parseInt(filters.limit, 10) : 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      this.prisma.backupLog.findMany({ where, skip, take: limit, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }),
      this.prisma.backupLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getDataDeletionRequests(filters: any = {}) {
    const page = filters.page ? parseInt(filters.page, 10) : 1;
    const limit = filters.limit ? parseInt(filters.limit, 10) : 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.userId) where.userId = filters.userId;

    const [data, total] = await Promise.all([
      this.prisma.dataDeletionRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      }),
      this.prisma.dataDeletionRequest.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async updateDataDeletionRequest(adminId: string, id: string, status: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.dataDeletionRequest.findUnique({ where: { id } });
      if (!request) throw new NotFoundException('Không tìm thấy yêu cầu xóa dữ liệu');

      if (status === 'COMPLETED' && request.userId) {
        await tx.user.update({
          where: { id: request.userId },
          data: {
            email: null,
            phone: null,
            username: null,
            name: 'Người dùng đã xóa dữ liệu',
            avatar: null,
            bio: null,
            providerId: null,
            status: 'DELETED',
          },
        });
      }

      const updated = await tx.dataDeletionRequest.update({
        where: { id },
        data: {
          status,
          processedAt: status === 'COMPLETED' || status === 'REJECTED' ? new Date() : null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'ADMIN_UPDATE_DATA_DELETION_REQUEST',
          entityType: 'DataDeletionRequest',
          entityId: id,
          metadata: JSON.stringify({ status, userId: request.userId }),
        },
      });

      return updated;
    });
  }

  async getRequirements(filters: any = {}) {
    const page = filters.page ? parseInt(filters.page, 10) : 1;
    const limit = filters.limit ? parseInt(filters.limit, 10) : 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.propertyType) where.propertyType = filters.propertyType;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (filters.sort === 'oldest') orderBy = { createdAt: 'asc' };

    const [data, total] = await Promise.all([
      this.prisma.requirement.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: { name: true, phone: true, email: true }
          },
          location: true
        }
      }),
      this.prisma.requirement.count({ where })
    ]);

    return { data, total, page, limit };
  }

  async updateRequirementStatus(adminId: string, id: string, status: string, adminNote?: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.requirement.update({
        where: { id },
        data: { status, adminNote }
      });
      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'UPDATE_REQUIREMENT_STATUS',
          entityType: 'Requirement',
          entityId: id,
          metadata: JSON.stringify({ status, adminNote })
        }
      });
      return updated;
    });
    this.adminActionLogService.logAction(
      adminId,
      'UPDATE_REQUIREMENT_STATUS',
      id,
      'Requirement',
      'Admin updated requirement status',
      { status, adminNote }
    );
    return result;
  }

  async deleteRequirement(adminId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.requirement.delete({
        where: { id }
      });
      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'ADMIN_DELETE_REQUIREMENT',
          entityType: 'Requirement',
          entityId: id,
          metadata: JSON.stringify({})
        }
      });
      return deleted;
    });
  }

  async getAllProperties(filters: any) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.tier) where.tier = filters.tier;
    if (filters.propertyType) where.propertyType = filters.propertyType;
    if (filters.userId) where.userId = filters.userId;
    if (filters.city) where.city = filters.city;
    if (filters.search) {
      console.log('Admin getAllProperties - search query received:', filters.search);
      try {
        const searchRes = await this.searchService.search(filters.search, [], [], 1, 1000);
        const ids = (searchRes?.hits || []).map((h: any) => h.id);
        if (ids.length > 0) {
          where.OR = [
            { id: { in: ids } },
            { title: { contains: filters.search, mode: 'insensitive' } },
            { propertyCode: { contains: filters.search, mode: 'insensitive' } }
          ];
        } else {
          where.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { propertyCode: { contains: filters.search, mode: 'insensitive' } }
          ];
        }
      } catch (error) {
        console.warn('Meilisearch failed in Admin search, falling back to Prisma', error);
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { propertyCode: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
    }

    const page = filters.page ? parseInt(filters.page, 10) : 1;
    const limit = filters.limit ? parseInt(filters.limit, 10) : 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { user: { select: { name: true, email: true, phone: true } } },
      }),
      this.prisma.property.count({ where })
    ]);

    return { data, total, page, limit };
  }

  async updatePropertyStatus(adminId: string, id: string, status: PropertyStatus) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Không tìm thấy bất động sản');
    const actionType =
      status === 'APPROVED' ? 'APPROVE_PROPERTY' :
      status === 'REJECTED' ? 'REJECT_PROPERTY' :
      status === 'DELETED' ? 'DELETE_PROPERTY' :
      'SET_PROPERTY_STATUS';

    const updateData: any = { 
      status: status as any,
      ...(status === 'APPROVED' ? { publishedAt: new Date(), pushedAt: new Date(), deletedAt: null } : {}),
      ...(status === 'DELETED' ? { deletedAt: new Date() } : {})
    };

    if (status === 'APPROVED' && (property as any).frozenTierMs > 0) {
      updateData.tierExpiresAt = new Date(Date.now() + (property as any).frozenTierMs);
      updateData.frozenTierMs = null;
    }

    const updatedProperty = await this.prisma.property.update({
      where: { id },
      // Duyệt/ẩn/gỡ tin là thay đổi trạng thái hiển thị -> cập nhật mốc cho sitemap.
      data: { ...updateData, contentUpdatedAt: new Date() },
    });
    // Tin vừa đổi trạng thái hiển thị -> sitemap phải phản ánh ngay, không đợi hết TTL.
    await this.seoService.invalidate();

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: actionType,
        entityType: 'Property',
        entityId: id,
        metadata: JSON.stringify({ status }),
      },
    });

    if (status === 'APPROVED' || status === 'SOLD') {
      try {
        await this.searchService.addDocument(updatedProperty);
        if (status === 'APPROVED') {
          await this.notificationService.createNotification(
          updatedProperty.userId,
          'Bài đăng đã được duyệt',
          `Bài đăng "${updatedProperty.title}" của bạn đã được kiểm duyệt thành công và đang hiển thị.`
          );
        }
      } catch (error) {
        console.error('Failed to sync to Meilisearch or send notification', error);
      }
    } else {
      await this.searchService.deleteDocument(id).catch(() => null);
    }

    if (status === 'REJECTED') {
      try {
        await this.notificationService.createNotification(
          updatedProperty.userId,
          'Bài đăng bị từ chối',
          `Bài đăng "${updatedProperty.title}" của bạn đã bị từ chối. Vui lòng kiểm tra lại nội dung.`
        );
      } catch (error) {
        console.error('Failed to send notification', error);
      }
    }

    this.adminActionLogService.logAction(
      adminId,
      actionType,
      id,
      'Property',
      'Admin updated property status',
      { status, previousStatus: property.status }
    );
    return updatedProperty;
  }

  async rejectProperty(adminId: string, id: string, reason: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Không tìm thấy bất động sản');
    
    // Lưu report hoặc gửi thông báo
    await this.notificationService.createNotification(
      property.userId,
      'Bài đăng bị từ chối',
      `Bài đăng "${property.title}" bị từ chối với lý do: ${reason}`
    );
    
    const updated = await this.prisma.property.update({
      where: { id },
      data: { status: 'REJECTED', contentUpdatedAt: new Date() }
    });
    await this.seoService.invalidate();
    await this.searchService.deleteDocument(id).catch(() => null);

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'REJECT_PROPERTY',
        entityType: 'Property',
        entityId: id,
        metadata: JSON.stringify({ reason }),
      },
    });

    this.adminActionLogService.logAction(
      adminId,
      'REJECT_PROPERTY',
      id,
      'Property',
      'Admin rejected property',
      { reason }
    );
    return updated;
  }

  async exportPropertiesCSV(filters: any): Promise<string> {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.tier) where.tier = filters.tier;
    if (filters.propertyType) where.propertyType = filters.propertyType;
    if (filters.userId) where.userId = filters.userId;
    if (filters.city) where.city = filters.city;

    const header = ['ID', 'Tên người bán', 'SĐT', 'Tiêu đề', 'Loại giao dịch', 'Loại BĐS', 'Khu vực', 'Giá', 'Diện tích', 'Giá/m2', 'Trạng thái', 'Ngày đăng'].join(',');
    const rows: string[] = [];
    
    let skip = 0;
    const take = 1000;
    let hasMore = true;

    while (hasMore) {
      const properties = await this.prisma.property.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { user: { select: { name: true, phone: true } } },
        skip,
        take,
      });

      if (properties.length === 0) {
        hasMore = false;
        break;
      }

      const chunkRows = properties.map(p => {
        return [
          p.id,
          `"${p.user?.name || ''}"`,
          `"${p.user?.phone || ''}"`,
          `"${p.title.replace(/"/g, '""')}"`,
          p.transactionType,
          p.propertyType,
          `"${[p.ward, p.district, p.city].filter(Boolean).join(', ')}"`,
          p.price || 0,
          p.area || 0,
          p.pricePerM2 || 0,
          p.status,
          p.createdAt.toISOString()
        ].join(',');
      });

      rows.push(...chunkRows);
      skip += take;
    }

    return [header, ...rows].join('\n');
  }

  async exportRequirementsCSV(filters: any): Promise<string> {
    const header = ['ID', 'Tên người gửi', 'SĐT', 'Loại giao dịch', 'Loại BĐS', 'Khu vực', 'Khoảng giá', 'Diện tích', 'Mô tả', 'Ngày gửi'].join(',');
    const rows: string[] = [];

    let skip = 0;
    const take = 1000;
    let hasMore = true;

    while (hasMore) {
      const requirements = await this.prisma.requirement.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
      });

      if (requirements.length === 0) {
        hasMore = false;
        break;
      }

      const chunkRows = requirements.map(r => {
        return [
          r.id,
          `"${(r.name || '').replace(/"/g, '""')}"`,
          `"${r.phone || ''}"`,
          'BUY',
          r.propertyType || '',
          `"${r.locationId || ''}"`,
          `"${r.priceMin || 0} - ${r.priceMax || 0}"`,
          `"${r.areaMin || 0} - ${r.areaMax || 0}"`,
          `"${(r.content || '').replace(/"/g, '""')}"`,
          r.createdAt.toISOString()
        ].join(',');
      });

      rows.push(...chunkRows);
      skip += take;
    }

    return [header, ...rows].join('\n');
  }

  async exportUsersCSV(filters: any): Promise<string> {
    const where: any = {};
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } }
      ];
    }
    if (filters.status) where.status = filters.status;

    const header = ['ID', 'Email', 'SĐT', 'Tên', 'Vai trò', 'Số dư', 'Trạng thái', 'Số tin', 'Ngày tạo'].join(',');
    const rows: string[] = [];

    let skip = 0;
    const take = 1000;
    let hasMore = true;

    while (hasMore) {
      const users = await this.prisma.user.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          role: true,
          balance: true,
          status: true,
          createdAt: true,
          _count: { select: { properties: true } },
        },
        skip,
        take,
      });

      if (users.length === 0) {
        hasMore = false;
        break;
      }

      const chunkRows = users.map(user => [
        user.id,
        this.csvCell(user.email),
        this.csvCell(user.phone),
        this.csvCell(user.name),
        user.role,
        Number(user.balance),
        user.status,
        user._count.properties,
        user.createdAt.toISOString(),
      ].join(','));

      rows.push(...chunkRows);
      skip += take;
    }

    return [header, ...rows].join('\n');
  }

  async exportTransactionsCSV(filters: any): Promise<string> {
    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;

    const header = ['ID', 'User ID', 'Tên', 'Email', 'SĐT', 'Loại', 'Số tiền', 'Trạng thái', 'Mô tả', 'Mã tham chiếu', 'Ngày tạo'].join(',');
    const rows: string[] = [];

    let skip = 0;
    const take = 1000;
    let hasMore = true;

    while (hasMore) {
      const transactions = await this.prisma.transaction.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { user: { select: { id: true, name: true, email: true, phone: true } } },
        skip,
        take,
      });

      if (transactions.length === 0) {
        hasMore = false;
        break;
      }

      const chunkRows = transactions.map(tx => [
        tx.id,
        tx.userId,
        this.csvCell(tx.user?.name),
        this.csvCell(tx.user?.email),
        this.csvCell(tx.user?.phone),
        tx.type,
        tx.amount,
        tx.status,
        this.csvCell(tx.description),
        this.csvCell(tx.referenceId),
        tx.createdAt.toISOString(),
      ].join(','));

      rows.push(...chunkRows);
      skip += take;
    }

    return [header, ...rows].join('\n');
  }

  async syncMeilisearch() {
    const properties = await this.prisma.property.findMany({
      where: { status: { in: ['APPROVED', 'SOLD'] }, deletedAt: null },
    });
    
    let count = 0;
    for (const prop of properties) {
      try {
        await this.searchService.addDocument(prop);
        count++;
      } catch (err) {
        console.error(`Failed to sync property ${prop.id}`, err);
      }
    }
    
    return { success: true, synced: count };
  }

  // Settings
  async getSettings() {
    let settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default_settings' } });
    if (!settings) {
      settings = await this.prisma.systemSettings.create({ data: { id: 'default_settings' } });
    }
    return {
      ...settings,
      sepayWebhookToken: settings.sepayWebhookToken ? '********-****-****-****-************' : '',
    };
  }

  async updateSettings(data: any) {
    const existing = await this.prisma.systemSettings.findUnique({ where: { id: 'default_settings' } });
    let sepayWebhookToken = existing?.sepayWebhookToken;
    if (data.sepayWebhookToken && !String(data.sepayWebhookToken).includes('****')) {
      sepayWebhookToken = this.cryptoService.encrypt(String(data.sepayWebhookToken));
    }

    const payload = {
      bankBin: data.bankBin,
      bankAccount: data.bankAccount,
      accountName: data.accountName,
      sepayWebhookToken,
      googleSearchConsoleId: data.googleSearchConsoleId !== undefined ? String(data.googleSearchConsoleId) : undefined,
      googleMapsApiKey: data.googleMapsApiKey !== undefined ? String(data.googleMapsApiKey) : undefined,
      googleAdsenseClientId: data.googleAdsenseClientId !== undefined ? String(data.googleAdsenseClientId) : undefined,
      googleAdsenseSlotId: data.googleAdsenseSlotId !== undefined ? String(data.googleAdsenseSlotId) : undefined,
      googleAnalyticsId: data.googleAnalyticsId !== undefined ? String(data.googleAnalyticsId) : undefined,
      facebookPixelId: data.facebookPixelId !== undefined ? String(data.facebookPixelId) : undefined,
      vipPrice: this.parseNonNegativeNumber(data.vipPrice, 'Gia VIP'),
      upPrice: this.parseNonNegativeNumber(data.upPrice, 'Gia UP'),
      vipDurationDays: this.parsePositiveInteger(data.vipDurationDays, 'Thoi han VIP'),
      upDurationDays: this.parsePositiveInteger(data.upDurationDays, 'Thoi han UP'),
      freePostsPerUser: this.parsePositiveInteger(data.freePostsPerUser, 'So tin mien phi'),
      isPreModerationEnabled: this.parseBoolean(data.isPreModerationEnabled),
      freePostsPerDay: data.freePostsPerDay !== undefined ? this.parsePositiveInteger(data.freePostsPerDay, 'So tin mien phi moi ngay') : undefined,
      freeUpsPerDay: data.freeUpsPerDay !== undefined ? this.parsePositiveInteger(data.freeUpsPerDay, 'So up mien phi moi ngay') : undefined,
      maxPostsPerDay: data.maxPostsPerDay !== undefined ? this.parsePositiveInteger(data.maxPostsPerDay, 'Toi da tin moi ngay') : undefined,
      maxUpsPerDay: data.maxUpsPerDay !== undefined ? this.parsePositiveInteger(data.maxUpsPerDay, 'Toi da up moi ngay') : undefined,
      upCooldownMinutes: data.upCooldownMinutes !== undefined ? this.parsePositiveInteger(data.upCooldownMinutes, 'Thoi gian cho up') : undefined,
      forbiddenWords: data.forbiddenWords !== undefined ? String(data.forbiddenWords) : undefined,
      vipPackages: data.vipPackages !== undefined ? data.vipPackages : undefined,
    };

    const settings = await this.prisma.systemSettings.upsert({
      where: { id: 'default_settings' },
      update: payload,
      create: { id: 'default_settings', ...payload }
    });
    return {
      ...settings,
      sepayWebhookToken: settings.sepayWebhookToken ? '********-****-****-****-************' : '',
    };
  }

  // Category CRUD
  async getCategories() {
    return this.prisma.category.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
  }

  async createCategory(data: { name: string, slug: string, isActive?: boolean, parentId?: string | null }) {
    return this.prisma.category.create({ data });
  }

  async updateCategory(id: string, data: { name?: string, slug?: string, isActive?: boolean, parentId?: string | null }) {
    return this.prisma.category.update({ where: { id }, data });
  }

  async deleteCategory(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }

  // Location CRUD
  async getLocations() {
    return this.prisma.location.findMany({
      orderBy: [{ depth: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Sinh các trường dẫn xuất (shortName / slug / urlSegment / path / depth) từ tên và
   * cấp cha. Admin chỉ nhập tên, loại và cha — phần còn lại phải theo đúng quy tắc mà
   * importer dùng, nếu không URL của khu vực tạo tay sẽ lệch với khu vực nhập từ file.
   */
  private async buildLocationFields(input: {
    name: string;
    parentId?: string | null;
    excludeId?: string;
  }) {
    const shortName = stripUnitPrefix(input.name);
    const slug = locationSlug(input.name);
    if (!slug) throw new BadRequestException('Tên khu vực không hợp lệ');

    const parent = input.parentId
      ? await this.prisma.location.findUnique({ where: { id: input.parentId } })
      : null;
    if (input.parentId && !parent) throw new NotFoundException('Không tìm thấy khu vực cha');

    // urlSegment phải duy nhất TOÀN CỤC (nó là một đoạn URL), nên thêm hậu tố khi trùng.
    const candidates = [slug, parent ? `${slug}-${parent.slug}` : ''].filter(Boolean);
    let urlSegment = '';
    for (const candidate of candidates) {
      const taken = await this.prisma.location.findUnique({ where: { urlSegment: candidate } });
      if (!taken || taken.id === input.excludeId) {
        urlSegment = candidate;
        break;
      }
    }
    if (!urlSegment) urlSegment = `${slug}-${Math.random().toString(36).slice(2, 8)}`;

    return {
      shortName,
      slug,
      urlSegment,
      path: parent ? `${parent.path}/${urlSegment}` : urlSegment,
      depth: parent ? parent.depth + 1 : 0,
    };
  }

  async createLocation(data: {
    name: string;
    type: LocationType;
    parentId?: string;
    isFeatured?: boolean;
    isSeoEnabled?: boolean;
  }) {
    const derived = await this.buildLocationFields({ name: data.name, parentId: data.parentId });
    return this.prisma.location.create({
      data: {
        name: data.name.trim(),
        type: data.type,
        parentId: data.parentId ?? null,
        isFeatured: data.isFeatured ?? false,
        isSeoEnabled: data.isSeoEnabled ?? false,
        ...derived,
      },
    });
  }

  async updateLocation(
    id: string,
    data: {
      name?: string;
      type?: LocationType;
      parentId?: string;
      isFeatured?: boolean;
      isSeoEnabled?: boolean;
      isActive?: boolean;
    },
  ) {
    const current = await this.prisma.location.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Không tìm thấy khu vực');

    const patch: any = {
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
      ...(data.isSeoEnabled !== undefined ? { isSeoEnabled: data.isSeoEnabled } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    };

    // Đổi tên hoặc đổi cha thì phải sinh lại slug/urlSegment/path.
    if (data.name !== undefined || data.parentId !== undefined) {
      const name = data.name ?? current.name;
      const parentId = data.parentId !== undefined ? data.parentId : current.parentId;
      Object.assign(patch, { name: name.trim(), parentId }, await this.buildLocationFields({ name, parentId, excludeId: id }));
    }

    return this.prisma.location.update({ where: { id }, data: patch });
  }

  async deleteLocation(id: string) {
    // Xoá cứng sẽ null hoá Property.wardId/districtId/locationId (mọi FK là SetNull).
    // Tắt là đủ để khu vực biến mất khỏi bộ lọc, sitemap và trang danh mục.
    return this.prisma.location.update({ where: { id }, data: { isActive: false } });
  }
}
