import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { NotificationService } from '../notification/notification.service';
import { AdminActionLogService } from '../admin/admin-action-log.service';
import { PropertyInteractionService } from './property-interaction.service';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import {
  buildPrismaOrder,
  buildPrismaWhere,
  normalizeSearchFilters,
  normalizePropertyPayload,
  normalizePropertyType,
  normalizeTransactionType,
  propertyTypeVariants,
  transactionTypeVariants,
  slugify,
  applyRangeKeys,
  type NormalizedFilters,
} from './property-utils';

type PropertyWhereInput = any;

@Injectable()
export class PropertyService {
  private readonly logger = new Logger(PropertyService.name);
  private readonly publicStatuses = ['APPROVED', 'SOLD'] as const;

  constructor(
    private prisma: PrismaService,
    private searchService: SearchService,
    private notificationService: NotificationService,
    private adminActionLogService: AdminActionLogService,
    private interactionService: PropertyInteractionService,
    @InjectQueue('property_up') private propertyUpQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  private validatePropertyPayload(data: Record<string, any>, partial = false) {
    if (!partial) {
      for (const field of ['title', 'description', 'transactionType', 'propertyType']) {
        if (!data[field] || String(data[field]).trim() === '') {
          throw new BadRequestException(`Thieu thong tin bat buoc: ${field}`);
        }
      }
    }

    for (const field of ['price', 'area', 'pricePerM2', 'lat', 'lng']) {
      if (data[field] !== undefined && data[field] !== null && !Number.isFinite(data[field])) {
        throw new BadRequestException(`Gia tri ${field} khong hop le`);
      }
    }

    if (data.price !== undefined && data.price !== null && data.price < 0) {
      throw new BadRequestException('Gia bat dong san khong duoc la so am');
    }
    if (data.area !== undefined && data.area !== null && data.area <= 0) {
      throw new BadRequestException('Dien tich bat dong san phai lon hon 0');
    }
  }

  private toPublicMediaUrl(mediaPath?: string | null) {
    if (!mediaPath) return mediaPath;
    if (/^(https?:|data:|blob:)/i.test(mediaPath)) return mediaPath;

    const baseUrl =
      process.env.PUBLIC_UPLOAD_BASE_URL ||
      process.env.PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000');

    if (!baseUrl) return mediaPath;
    const normalizedBase = baseUrl.replace(/\/$/, '');
    const normalizedPath = mediaPath.startsWith('/') ? mediaPath : `/${mediaPath}`;
    return `${normalizedBase}${normalizedPath}`;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCronJobs() {
    this.logger.log('Running background cron jobs for properties...');
    const now = new Date();

    // 6.1: VIP/UP -> NORMAL (nếu hết hạn tier)
    // CHÚ Ý: Chỉ hạ cấp các tin không PENDING. Tin PENDING đã được đóng băng thời gian VIP
    // qua frozenTierMs và sẽ được khôi phục khi Admin duyệt lại.
    const propertiesToDowngrade = await this.prisma.property.findMany({
      where: {
        tier: { in: ['VIP', 'UP'] },
        tierExpiresAt: { lte: now },
        status: { not: 'PENDING' },
      },
      select: { id: true },
    });

    if (propertiesToDowngrade.length > 0) {
      const ids = propertiesToDowngrade.map(p => p.id);
      await this.prisma.property.updateMany({
        where: { id: { in: ids } },
        data: { tier: 'NORMAL' }
      });
      
      const updatedProperties = await this.prisma.property.findMany({
        where: { id: { in: ids } },
        include: { user: true }
      });
      
      for (const p of updatedProperties) {
        await this.searchService.addDocument(p as any).catch(e => {
           this.logger.warn(`Failed to update downgraded property ${p.id} in Meilisearch: ${e.message}`);
        });
      }

      this.logger.log(`Downgraded ${ids.length} properties to NORMAL.`);
    }

    // 6.2: APPROVED -> EXPIRED sau 1 năm, giữ dữ liệu để còn lịch sử/khôi phục.
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const propertiesToExpire = await this.prisma.property.findMany({
      where: {
        status: 'APPROVED',
        publishedAt: { lte: oneYearAgo }
      },
      select: { id: true },
    });
    const expired = await this.prisma.property.updateMany({
      where: {
        status: 'APPROVED',
        publishedAt: { lte: oneYearAgo }
      },
      data: {
        status: 'EXPIRED'
      }
    });
    if (expired.count > 0) {
      this.logger.log(`Expired ${expired.count} properties (older than 365 days).`);
      
      // Delete from Meilisearch in chunks to avoid overwhelming the service
      const chunkSize = 100;
      for (let i = 0; i < propertiesToExpire.length; i += chunkSize) {
        const chunk = propertiesToExpire.slice(i, i + chunkSize).map(p => p.id);
        await this.searchService.deleteDocuments(chunk).catch(e => {
           this.logger.warn(`Failed to delete chunk of properties from Meilisearch: ${e.message}`);
        });
      }
    }
  }

  async getStats() {
    const [totalProperties, totalUsers, totalProjects, complaintStats] = await Promise.all([
      this.prisma.property.count({ where: { status: { in: [...this.publicStatuses] }, deletedAt: null } }),
      this.prisma.user.count(),
      this.prisma.property.count({
        where: {
          status: { in: [...this.publicStatuses] },
          deletedAt: null,
          propertyType: { in: propertyTypeVariants('DU_AN') },
        },
      }),
      this.prisma.complaint.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const complaintTotal = complaintStats.reduce((sum, row) => sum + row._count.id, 0);
    const resolvedComplaints = complaintStats
      .filter((row) => row.status === 'RESOLVED')
      .reduce((sum, row) => sum + row._count.id, 0);
    const satisfaction = complaintTotal > 0 ? Math.round((resolvedComplaints / complaintTotal) * 100) : 100;

    return {
      properties: totalProperties,
      users: totalUsers,
      projects: totalProjects,
      satisfaction
    };
  }

  async getMyDrafts(userId: string) {
    return this.prisma.property.findMany({
      where: { userId, status: 'DRAFT' },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async updateDraft(userId: string, id: string, data: any) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Không tìm thấy bản nháp');
    if (property.userId !== userId) throw new ForbiddenException('Không có quyền sửa bản nháp này');
    if (property.status !== 'DRAFT') throw new BadRequestException('Chỉ có thể cập nhật bản nháp');

    const normalizedData = normalizePropertyPayload(data);
    
    if (normalizedData.transactionType === 'CAN_MUA' || normalizedData.transactionType === 'CAN_THUE') {
      throw new BadRequestException('Không thể cập nhật tin thành CẦN MUA hoặc CẦN THUÊ.');
    }

    const updateData: any = {
      ...normalizedData,
      status: 'DRAFT',
    };

    if (normalizedData.title && normalizedData.title !== property.title) {
       updateData.slug = await this.generateUniqueSlug(normalizedData.title, id);
    }

    if (Array.isArray(normalizedData.images)) {
      const imagesArr = normalizedData.images;
      updateData.images = imagesArr;
      updateData.imageObjects = {
        deleteMany: {},
        create: imagesArr.map((url: string, idx: number) => ({ url, sortOrder: idx, isThumbnail: idx === 0 }))
      };
    }
    
    updateData.transactionType = updateData.transactionType || property.transactionType;
    applyRangeKeys(updateData);
    if (Array.isArray(normalizedData.images)) {
      updateData.images = normalizedData.images;
    }

    return this.prisma.property.update({
      where: { id },
      data: updateData,
    });
  }


  async createDraft(userId: string, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.emailVerified) {
      throw new ForbiddenException('Vui lòng xác thực email trước khi tạo nháp.');
    }

    const normalizedData = normalizePropertyPayload(data);
    this.validatePropertyPayload(normalizedData, true);

    if (normalizedData.transactionType === 'CAN_MUA' || normalizedData.transactionType === 'CAN_THUE') {
      throw new BadRequestException('Không thể đăng tin với hình thức CẦN MUA hoặc CẦN THUÊ.');
    }

    // Chống spam tạo draft vô hạn: áp dụng cùng giới hạn đăng bài/ngày
    await this.checkDailyPostLimit(userId);
    
    // propertyCode
    const propertyCode = await this.generateUniquePropertyCode();
    // slug
    const slug = await this.generateUniqueSlug(normalizedData.title || 'draft');

    const imagesArr = Array.isArray(normalizedData.images) ? normalizedData.images : [];
    const propertyData: any = {
      ...normalizedData,
      userId,
      status: 'DRAFT',
      tier: 'NORMAL',
      propertyCode,
      slug,
      images: imagesArr,
      imageObjects: imagesArr.length > 0 ? {
        create: imagesArr.map((url, idx) => ({ url, sortOrder: idx, isThumbnail: idx === 0 }))
      } : undefined,
    };
    applyRangeKeys(propertyData);
    delete propertyData.images; // Prisma property has string[] images but we migrate to imageObjects if using new schema. Actually, schema still has string[] images. Let's keep both for now if needed. Or just leave it as it works. Wait, schema.prisma has `images String[]`.
    return this.prisma.property.create({ data: { ...propertyData, contentUpdatedAt: new Date() } });
  }

  private async generateUniquePropertyCode(): Promise<string> {
    let isUnique = false;
    let code = '';
    let retryCount = 0;
    while (!isUnique && retryCount < 10) {
      code = `BDS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const existing = await this.prisma.property.findUnique({ where: { propertyCode: code } });
      if (!existing) isUnique = true;
      retryCount++;
    }
    return code;
  }

  private async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    const baseSlug = slugify(title);
    // Thử slug gốc trước
    const existing = await this.prisma.property.findUnique({ where: { slug: baseSlug } });
    if (!existing || (excludeId && existing.id === excludeId)) {
      return baseSlug;
    }
    // Nếu trùng, gắn chuỗi ngẫu nhiên 6 ký tự thay vì vòng lặp while(true)
    // Tránh DoS khi kẻ tấn công tạo hàng ngàn bài cùng title gây N+1 queries
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${randomSuffix}`;
  }

  async create(userId: string, data: any): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.emailVerified) {
      throw new ForbiddenException('Vui lòng xác thực email trước khi đăng tin.');
    }

    const normalizedData = normalizePropertyPayload(data);
    this.validatePropertyPayload(normalizedData);

    if (normalizedData.transactionType === 'CAN_MUA' || normalizedData.transactionType === 'CAN_THUE') {
      throw new BadRequestException('Không thể đăng tin với hình thức CẦN MUA hoặc CẦN THUÊ.');
    }

    await this.checkDailyPostLimit(userId);

    const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default_settings' } });

    const startOfDayPost = new Date();
    startOfDayPost.setHours(0, 0, 0, 0);
    const todayPostsCount = await this.prisma.property.count({
      where: { userId, createdAt: { gte: startOfDayPost }, status: { notIn: ['DRAFT', 'DELETED'] } },
    });

    const freePostsPerDay = settings?.freePostsPerDay ?? 2;
    const postPrice = Number(settings?.extraPostPrice ?? 0);
    const postCost = todayPostsCount < freePostsPerDay ? 0 : postPrice;
    const postCostInPoints = Math.floor(postCost / 1000);

    const userBalance = Number(user.balance);
    if (userBalance < postCostInPoints) {
      throw new BadRequestException({ message: `Số dư trong ví không đủ để đăng tin (Phí: ${postCost}đ). Vui lòng nạp thêm tiền.`, requiresPayment: true });
    }

    // 1. Lọc từ khóa nhạy cảm (Bad Words Filter)
    const forbiddenWordsStr = settings?.forbiddenWords || 'chửi bậy,nhạy cảm,spam,lừa đảo,phản động';
    const badWords = forbiddenWordsStr.split(',').map(w => w.trim().toLowerCase());
    const contentToCheck = `${normalizedData.title} ${normalizedData.description}`.toLowerCase();
    const hasBadWord = badWords.some(word => contentToCheck.includes(word));
    if (hasBadWord) {
      throw new BadRequestException('Nội dung bài đăng chứa từ khóa không hợp lệ hoặc nhạy cảm.');
    }

    // 2. Chống trùng lặp nội dung (Duplicate Content Check)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const recentPosts = await this.prisma.property.findMany({
      where: {
        userId,
        createdAt: { gte: twentyFourHoursAgo }
      },
      orderBy: { createdAt: 'desc' }
    });

    for (const post of recentPosts) {
      if (post.title.trim().toLowerCase() === normalizedData.title.trim().toLowerCase() ||
          post.description.trim().toLowerCase() === normalizedData.description.trim().toLowerCase()) {
        throw new BadRequestException('Nội dung bài viết trùng lặp với một bài bạn đã đăng gần đây.');
      }
    }

    const isPreModerationEnabled = settings?.isPreModerationEnabled ?? true;
    
    const status = isPreModerationEnabled ? 'PENDING' : 'APPROVED';

    const propertyCode = await this.generateUniquePropertyCode();
    const slug = await this.generateUniqueSlug(normalizedData.title);

    const imagesArr = Array.isArray(normalizedData.images) ? normalizedData.images : [];
    const propertyData: any = {
      ...normalizedData,
      userId,
      status,
      tier: 'NORMAL',
      propertyCode,
      slug,
      pushedAt: status === 'APPROVED' ? new Date() : undefined,
      publishedAt: status === 'APPROVED' ? new Date() : undefined,
      images: imagesArr,
      imageObjects: imagesArr.length > 0 ? {
        create: imagesArr.map((url: string, idx: number) => ({ url, sortOrder: idx, isThumbnail: idx === 0 }))
      } : undefined,
    };

    applyRangeKeys(propertyData);

    const createdProperty = await this.prisma.$transaction(async (tx) => {
      if (postCostInPoints > 0) {
        // Trừ tiền đăng tin
        const charged = await tx.user.updateMany({
          where: { id: userId, balance: { gte: postCostInPoints } },
          data: { balance: { decrement: postCostInPoints } },
        });
        if (charged.count === 0) {
          throw new BadRequestException({ message: 'Số dư không đủ để thanh toán phí đăng tin.', requiresPayment: true });
        }

        await tx.transaction.create({
          data: {
            userId,
            balanceBefore: userBalance,
            balanceAfter: userBalance - postCostInPoints,
            type: 'DEDUCT',
            amount: postCostInPoints,
            description: `Phí đăng tin: ${normalizedData.title}`,
            status: 'SUCCESS',
          },
        });
      }

      return tx.property.create({ data: { ...propertyData, contentUpdatedAt: new Date() } });
    });

    if (status === 'APPROVED') {
      try {
        await this.searchService.addDocument(createdProperty);
      } catch (err) {
        console.error('Failed to sync to meilisearch', err);
      }
    }
    return createdProperty;
  }

  async findAll(filters: any) {
    const normalizedFilters = normalizeSearchFilters(filters);
    return this.searchDatabase(normalizedFilters);
  }

  async searchDatabase(filters: NormalizedFilters) {
    const where = buildPrismaWhere(filters);
    const page = filters.page;
    const limit = filters.limit;
    const skip = (page - 1) * limit;

    const [normals, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: buildPrismaOrder(filters.sort),
        include: { user: { select: { id: true, slug: true, name: true, avatar: true } }, imageObjects: true },
      }),
      this.prisma.property.count({ where })
    ]);

    // Build appliedFilters & chips for frontend consumption
    const appliedFilters = filters;
    const chips: Array<{key: string, label: string}> = [];
    if (filters.q) chips.push({ key: 'q', label: `Từ khóa: ${filters.q}` });
    if (filters.propertyType) chips.push({ key: 'propertyType', label: `Loại: ${filters.propertyType}` });
    if (filters.transactionType) chips.push({ key: 'transactionType', label: `Hình thức: ${filters.transactionType === 'CHO_THUE' ? 'Cho thuê' : 'Bán'}` });
    if (filters.city) chips.push({ key: 'city', label: `Tỉnh/Thành: ${filters.city}` });
    if (filters.district) chips.push({ key: 'district', label: `Quận/Huyện: ${filters.district}` });
    if (filters.ward) chips.push({ key: 'ward', label: `Phường/Xã: ${filters.ward}` });
    if (filters.direction) chips.push({ key: 'direction', label: `Hướng: ${filters.direction}` });
    if (filters.priceRangeKey) chips.push({ key: 'priceRangeKey', label: `Giá: ${filters.priceRangeKey}` }); 
    if (filters.areaRangeKey) chips.push({ key: 'areaRangeKey', label: `Diện tích: ${filters.areaRangeKey}` });

    let vipsToReturn: any[] = [];
    if (!(filters as any).tier || (filters as any).tier === 'VIP') {
      const vipWhere = {
        ...where,
        tier: 'VIP',
        status: 'APPROVED',
      };
      const allVips = await this.prisma.property.findMany({
        where: vipWhere,
        orderBy: [{ pushedAt: { sort: 'desc', nulls: 'last' }}, {publishedAt: {sort: 'desc', nulls: 'last'}}],
        take: 50,
        include: { user: { select: { id: true, slug: true, name: true, avatar: true } }, imageObjects: true },
      });
      const newestVips = allVips.slice(0, 2);
      const remainingVips = allVips.slice(2);
      const randomVips = remainingVips.sort(() => 0.5 - Math.random()).slice(0, 3);
      vipsToReturn = [...newestVips, ...randomVips];
    }

    return { vips: vipsToReturn, ups: [], normals, total, page, limit, appliedFilters, chips };
  }



  async getHomepageVipItems(baseWhere: any, includeOptions: any) {
    const vipWhere = {
      ...baseWhere,
      tier: 'VIP',
      status: 'APPROVED'
    };

    const allVips = await this.prisma.property.findMany({
      where: vipWhere,
      orderBy: [{pushedAt: { sort: 'desc', nulls: 'last' }}, {publishedAt: {sort: 'desc', nulls: 'last'}}],
      take: 50,
      include: includeOptions
    });

    const newestVips = allVips.slice(0, 2);
    const remainingVips = allVips.slice(2);
    const randomVips = remainingVips.sort(() => 0.5 - Math.random()).slice(0, 3);
    return [...newestVips, ...randomVips];
  }

  async getHomepageProperties(userId?: string) {
    const cacheKey = userId ? `homepage:structured:${userId}` : `homepage:structured`;
    const cached: any = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const baseWhere = { status: { in: [...this.publicStatuses] }, deletedAt: null };
    const includeOptions = { user: { select: { id: true, slug: true, name: true, avatar: true } }, imageObjects: true };

    const getItems = (where: any) => this.prisma.property.findMany({
      where: { ...baseWhere, ...where, tier: 'NORMAL' },
      orderBy: [{ status: 'asc' }, { publishedAt: { sort: 'desc', nulls: 'last' } }, { pushedAt: { sort: 'desc', nulls: 'last' } }],
      take: 5,
      include: includeOptions
    });

    const featuredLocations = await this.prisma.location.findMany({
      where: { isFeatured: true },
      take: 6
    });

    // Trước đây có mảng fallback 6 phường của TP Vinh kèm một hàm slugify viết nội tuyến
    // và trường hợp đặc biệt 'Phường Cửa Lò' -> 'tx-cua-lo'. Slug tự chế đó lệch với
    // urlSegment thật trong DB, và mảng cứng thì vô nghĩa khi đổi tỉnh.
    // Không có khu vực nào được đánh dấu nổi bật thì trả rỗng, trang chủ tự ẩn khối.
    const mainWardBlocksData = await Promise.all(
      featuredLocations.map(async (loc) => {
        const items = await getItems(
          loc.type === 'WARD' || loc.type === 'OLD_WARD'
            ? { wardId: loc.id }
            : loc.type === 'DISTRICT'
              ? { districtId: loc.id }
              : { provinceId: loc.id },
        );
        return {
          key: loc.urlSegment,
          title: loc.name,
          href: `/${loc.urlSegment}`,
          items,
        };
      }),
    );

    const [
      featuredVip,
      datNen, nhaRieng, chungCu, duAn, choThue,
      matBang, bdsKhac,
      totalProperties, totalUsers
    ] = await Promise.all([
      this.getHomepageVipItems(baseWhere, includeOptions),
      getItems({ propertyType: 'DAT_NEN' }),
      getItems({ propertyType: 'NHA_RIENG' }),
      getItems({ propertyType: 'CHUNG_CU' }),
      getItems({ propertyType: 'DU_AN' }),
      getItems({ transactionType: 'CHO_THUE' }),
      getItems({ propertyType: 'MAT_BANG' }),
      getItems({ propertyType: 'BDS_KHAC' }),
      this.prisma.property.count({ where: baseWhere }),
      this.prisma.user.count()
    ]);

    
    const otherLocationItems = await this.prisma.property.findMany({
      where: { ...baseWhere, tier: 'NORMAL' },
      orderBy: [{ status: 'asc' }, { publishedAt: { sort: 'desc', nulls: 'last' } }, { pushedAt: { sort: 'desc', nulls: 'last' } }],
      take: 12,
      include: includeOptions
    });

    const allUpItems = await this.prisma.property.findMany({
      where: { ...baseWhere, tier: 'UP', status: 'APPROVED' },
      orderBy: [{pushedAt: { sort: 'desc', nulls: 'last' }}, {publishedAt: {sort: 'desc', nulls: 'last'}}],
      take: 50,
      include: includeOptions
    });
    const newestUpItems = allUpItems.slice(0, 2);
    const remainingUpItems = allUpItems.slice(2);
    const randomUpItems = remainingUpItems.sort(() => 0.5 - Math.random()).slice(0, 3);
    const upTabItems = [...newestUpItems, ...randomUpItems];

    let personalizedItems: any[] = [];
    if (userId) {
      const recentViews = await this.prisma.viewedProperty.findMany({
        where: { userId },
        orderBy: { viewedAt: 'desc' },
        take: 10,
        include: { property: true }
      });
      const recentSearches = await this.prisma.searchHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      const savedPosts = await this.prisma.savedPost.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { property: true }
      });

      const preferredTypes = new Set<string>();
      const preferredDistricts = new Set<string>();

      recentViews.forEach(v => {
        if (v.property?.propertyType) preferredTypes.add(v.property.propertyType);
        if (v.property?.district) preferredDistricts.add(v.property.district);
      });

      savedPosts.forEach(sp => {
        if (sp.property?.propertyType) preferredTypes.add(sp.property.propertyType);
        if (sp.property?.district) preferredDistricts.add(sp.property.district);
      });

      recentSearches.forEach(s => {
        if (s.filters) {
          try {
            const f = JSON.parse(s.filters);
            if (f.propertyType) preferredTypes.add(f.propertyType);
            if (f.district) preferredDistricts.add(f.district);
          } catch (e) {}
        }
      });

      const pWhere: any = { ...baseWhere };
      if (preferredTypes.size > 0 || preferredDistricts.size > 0) {
        pWhere.OR = [];
        if (preferredTypes.size > 0) {
          pWhere.OR.push({ propertyType: { in: Array.from(preferredTypes) } });
        }
        if (preferredDistricts.size > 0) {
          pWhere.OR.push({ district: { in: Array.from(preferredDistricts) } });
        }
      }

      const userItems = await this.prisma.property.findMany({
        where: pWhere,
        orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { pushedAt: { sort: 'desc', nulls: 'last' } }],
        take: 20,
        include: includeOptions
      });

      const viewedIds = new Set(recentViews.map(v => v.propertyId));
      personalizedItems = userItems.filter(p => !viewedIds.has(p.id)).slice(0, 8);
    }

    if (personalizedItems.length < 8) {
      const fallbackItems = await this.prisma.property.findMany({
        where: baseWhere,
        orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { pushedAt: { sort: 'desc', nulls: 'last' } }],
        take: 30, // Fetch more items to shuffle for random exploration
        include: includeOptions
      });
      
      // Lấy tin mới nhất thay vì xáo trộn ngẫu nhiên theo yêu cầu
      const shuffledFallback = fallbackItems;
      
      const existingIds = new Set(personalizedItems.map(p => p.id));
      for (const item of shuffledFallback) {
        if (!existingIds.has(item.id) && personalizedItems.length < 8) {
          personalizedItems.push(item);
        }
      }
    }




    const result = {
      featuredVip: { title: 'Tin nổi bật', href: '/search?tier=VIP', items: featuredVip },
      
      upTab: upTabItems,
      personalizedRecommendations: personalizedItems,

      categoryBlocks: [
        { key: 'DAT_NEN', title: 'Đất nền', href: '/dat-nen', items: datNen },
        { key: 'NHA_RIENG', title: 'Nhà riêng', href: '/nha-rieng', items: nhaRieng },
        { key: 'CHUNG_CU', title: 'Chung cư', href: '/chung-cu', items: chungCu },
        { key: 'DU_AN', title: 'Dự án', href: '/du-an', items: duAn },
        { key: 'CHO_THUE', title: 'Cho thuê', href: '/search?transactionType=CHO_THUE', items: choThue }
      ],
      otherRealEstateTabs: [
        { key: 'MAT_BANG', title: 'Mặt bằng, kho xưởng', href: '/mat-bang-kho-xuong', items: matBang },
        { key: 'BDS_KHAC', title: 'Bất động sản khác', href: '/bds-khac', items: bdsKhac },
      ],
      // Các tab khu vực trên trang chủ giờ lấy từ Location.isFeatured (do importer đặt
      // theo sheet "hot" của khách) thay vì 4 khối gán cứng TP Vinh / Diễn Châu /
      // Thái Hòa / Hà Tĩnh với href trỏ vào slug tự chế.
      mainWardBlocks: mainWardBlocksData,
      otherLocationTabs: [
        { key: 'khu-vuc-khac', title: 'Khu vực khác', href: '/khu-vuc', items: otherLocationItems }
      ],
      stats: { properties: totalProperties, users: totalUsers, projects: 15, satisfaction: 99 },
      adsSlots: []
    };

    await this.cacheManager.set(cacheKey, result, 60000); // 60s TTL
    return result;
  }

  async getHotLocations() {
    const cacheKey = 'getHotLocations';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    // Top 4 wards with the most approved posts
    const topWards = await this.prisma.property.groupBy({
      by: ['ward', 'district', 'city'],
      where: { status: { in: [...this.publicStatuses] }, deletedAt: null, ward: { not: '' } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 4
    });

    const wardNames = topWards.map(w => w.ward).filter((w): w is string => typeof w === 'string' && w !== '');
    const samples = await this.prisma.property.findMany({
      where: {
        status: { in: [...this.publicStatuses] },
        deletedAt: null,
        ward: { in: wardNames },
        images: { isEmpty: false },
      },
      select: { ward: true, images: true, thumbnail: true },
      orderBy: { publishedAt: { sort: 'desc', nulls: 'last' } },
      distinct: ['ward'],
    });

    const result = topWards.map(w => {
      const sample = samples.find(s => s.ward === w.ward);
      const image = sample?.thumbnail || sample?.images?.[0] || 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

      return {
        name: w.ward,
        district: w.district,
        city: w.city,
        count: w._count.id,
        image: this.toPublicMediaUrl(image)
      };
    });

    await this.cacheManager.set(cacheKey, result, 3600000); // 1 hour TTL
    return result;
  }

  async getMapProperties(filters: any = {}) {
    const normalized = normalizeSearchFilters({ ...filters, limit: filters.limit || 100 });
    const where: PropertyWhereInput = {
      ...buildPrismaWhere(normalized),
      lat: { not: null },
      lng: { not: null },
    };

    const north = filters.north !== undefined ? Number(filters.north) : undefined;
    const south = filters.south !== undefined ? Number(filters.south) : undefined;
    const east = filters.east !== undefined ? Number(filters.east) : undefined;
    const west = filters.west !== undefined ? Number(filters.west) : undefined;

    if ([north, south, east, west].every((value) => Number.isFinite(value))) {
      where.lat = { gte: south, lte: north };
      where.lng = { gte: west, lte: east };
    }

    return this.prisma.property.findMany({
      where,
      take: normalized.limit,
      orderBy: [
        { pushedAt: { sort: 'desc', nulls: 'last' } },
        { publishedAt: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
      include: { user: { select: { id: true, slug: true, name: true, avatar: true } } },
    });
  }

  private async clearPropertyCache(id: string) { await this.cacheManager.del(`property:${id}`).catch(() => {}); }

  async findOne(id: string) {
    const cacheKey = `property:${id}`;
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    // `urlSegment` mới là cột dựng URL — nó `@unique` toàn cục, còn `slug` chỉ duy nhất
    // trong phạm vi cha (dữ liệu Hà Nội có 125 nhóm tên trùng, chạm 275/736 bản ghi).
    // Trả cả hai: frontend ưu tiên `urlSegment`, `slug` giữ lại cho chỗ gọi cũ.
    const locationFields = {
      select: { id: true, name: true, shortName: true, slug: true, urlSegment: true, type: true },
    };
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, slug: true, name: true, avatar: true, phone: true, isPhoneVisible: true, createdAt: true } },
        imageObjects: true,
        // Cần đoạn URL thật của tỉnh/quận/phường để dựng breadcrumb. Không suy được từ
        // tên: slugify("Phường Trường Vinh") = "phuong-truong-vinh" trong khi urlSegment
        // là "truong-vinh". Quan hệ có thể null (dữ liệu cũ) — frontend sẽ lược cấp đó.
        province: locationFields,
        districtLocation: locationFields,
        wardLocation: locationFields,
      },
    });
    if (!property) throw new NotFoundException('Không tìm thấy bất động sản');

    if (property.user && property.user.isPhoneVisible === false) {
      property.user.phone = 'Đã ẩn';
    }

    // Trước đây chỉ ĐỌC cache mà không bao giờ GHI, nên cacheKey và clearPropertyCache
    // đều vô tác dụng và mọi lượt xem đều truy vấn DB.
    await this.cacheManager.set(cacheKey, property, 60_000).catch(() => undefined);

    return property;
  }

  // --- Delegated to PropertyInteractionService ---

  async incrementView(id: string) {
    return this.interactionService.incrementView(id);
  }



  async promote(userId: string, propertyId: string, type: 'VIP' | 'UP', packageId?: string, customDays?: number) {
    const updatedProperty = await this.prisma.$transaction(async (tx) => {
      // Sử dụng pessimistic locking để ngăn chặn Race Condition (trừ tiền âm, vượt giới hạn)
      const userRaw: any[] = await tx.$queryRaw`SELECT * FROM "User" WHERE id = ${userId} FOR UPDATE`;
      const user = userRaw[0];
      const property = await tx.property.findUnique({ where: { id: propertyId } });

      if (!property || property.userId !== userId) throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
      if (property.status !== 'APPROVED') throw new BadRequestException('Chỉ tin đã duyệt mới có thể UP hoặc lên VIP');

      const settings = await tx.systemSettings.findUnique({ where: { id: 'default_settings' } });
      const currentSettings = settings || { vipPrice: 10000, upPrice: 3000, vipDurationDays: 4, upDurationDays: 3, vipPackages: null };

      let cost = 0;
      let expiration = new Date();
      let durationMs = 0;

      if (type === 'VIP') {
        const durationDays = customDays || 1;
        const dailyPrice = Number(currentSettings.vipPrice || 5000);
        cost = Math.floor(dailyPrice * durationDays);

        durationMs = durationDays * 24 * 60 * 60 * 1000;
        expiration = new Date(Date.now() + durationMs);
      } else if (type === 'UP') {
        // Cooldown check for UP tin
        const cooldownMinutes = (currentSettings as any).upCooldownMinutes || 10;
        const cooldownMs = cooldownMinutes * 60 * 1000;
        const cooldownAgo = new Date(Date.now() - cooldownMs);
        if (property.pushedAt && property.pushedAt > cooldownAgo) {
          const remainingSeconds = Math.ceil((property.pushedAt.getTime() + cooldownMs - Date.now()) / 1000);
          throw new BadRequestException({
            message: 'Bạn vừa up tin. Vui lòng chờ thêm vài phút trước khi up lại.',
            remainingSeconds
          });
        }

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todayUpForPost = await tx.transaction.count({
          where: {
            propertyId,
            type: 'DEDUCT',
            description: { startsWith: 'Nâng cấp UP' },
            createdAt: { gte: startOfDay }
          }
        });

        const maxUpPerPostPerDay = (currentSettings as any).maxUpPerPostPerDay ?? 10;
        if (todayUpForPost >= maxUpPerPostPerDay) {
          throw new BadRequestException(`BẠN ĐÃ ĐẠT GIỚI HẠN: Tối đa ${maxUpPerPostPerDay} lượt UP/ngày cho mỗi tin đăng.`);
        }

        const todayUpTransactions = await tx.transaction.count({
          where: {
            userId,
            type: 'DEDUCT',
            description: { startsWith: 'Nâng cấp UP' },
            createdAt: { gte: startOfDay }
          }
        });

        const maxUpsPerDay = (currentSettings as any).maxUpsPerDay ?? 50;
        if (todayUpTransactions >= maxUpsPerDay) {
          throw new BadRequestException(`BẠN ĐÃ ĐẠT GIỚI HẠN: Tối đa ${maxUpsPerDay} lượt UP/ngày.`);
        }

        const freeUpsPerDay = (currentSettings as any).freeUpsPerUserPerDay ?? 1;
        const upPrice = Number(currentSettings.upPrice ?? 3000);
        cost = todayUpTransactions < freeUpsPerDay ? 0 : upPrice;

        durationMs = currentSettings.upDurationDays * 24 * 60 * 60 * 1000;
        expiration = new Date(Date.now() + durationMs);
      } else {
        throw new BadRequestException('Loại dịch vụ không hợp lệ');
      }

      if (!user) throw new ForbiddenException('Người dùng không tồn tại');

      const costInPoints = Math.floor(cost / 1000);
      const userBalance = Number(user.balance);
      if (userBalance < costInPoints) {
        throw new BadRequestException({ message: 'Số dư trong ví không đủ. Vui lòng nạp thêm tiền.', requiresPayment: true });
      }

      if (costInPoints > 0) {
        const charged = await tx.user.updateMany({
          where: { id: userId, balance: { gte: costInPoints } },
          data: { balance: { decrement: costInPoints } },
        });

        if (charged.count === 0) {
          throw new BadRequestException({ message: 'S  dư trong ví không  ủ. Vui lòng nạp thêm tiền.', requiresPayment: true });
        }
      }

      // Log transaction
      await tx.transaction.create({
        data: {
          userId,
          propertyId,
          balanceBefore: userBalance,
          balanceAfter: userBalance - costInPoints,
          type: 'DEDUCT',
          amount: costInPoints,
          description: `Nâng cấp ${type} tin: ${property.title}`,
          status: 'SUCCESS',
        },
      });

      // Update property
      let newTier: 'NORMAL' | 'UP' | 'VIP' = type as 'NORMAL' | 'UP' | 'VIP';
      let newExpiration: Date | null = expiration;
      
      if (type === 'UP' && property.tier === 'VIP' && property.tierExpiresAt && property.tierExpiresAt > new Date()) {
        // Giữ nguyên VIP, chỉ bump lên đầu
        newTier = 'VIP';
        newExpiration = property.tierExpiresAt;
      } else if (property.tierExpiresAt && property.tierExpiresAt > new Date() && property.tier === type) {
        // Cộng dồn thời gian nếu cùng loại tier
        newExpiration = new Date(property.tierExpiresAt.getTime() + durationMs);
      }

      const updateData: any = {
        tier: newTier,
        tierExpiresAt: newExpiration,
        pushedAt: new Date(),
        publishedAt: new Date(), // Bumps it to top
      };

      return tx.property.update({
        where: { id: propertyId },
        data: updateData,
        include: { user: { select: { id: true, slug: true, name: true, avatar: true } }, imageObjects: true } as any
      });
    });

    if (updatedProperty.status === 'APPROVED') {
      await this.searchService.addDocument(updatedProperty).catch(() => null);
      await this.cacheManager.del('homepage:structured').catch(() => null);
    }
    await this.clearPropertyCache(updatedProperty.id);
    return updatedProperty;
  }

  async unpromote(userId: string, propertyId: string) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Không tìm thấy bất động sản');
    if (property.userId !== userId) throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    
    const updatedProperty = await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        tier: 'NORMAL',
        tierExpiresAt: null
      },
      include: { user: { select: { id: true, slug: true, name: true, avatar: true } }, imageObjects: true } as any
    });

    if (updatedProperty.status === 'APPROVED') {
      await this.searchService.addDocument(updatedProperty).catch(() => null);
    }
    await this.clearPropertyCache(updatedProperty.id);
    return updatedProperty;
  }

  async updateStatus(userId: string, id: string, status: 'HIDDEN' | 'SOLD' | 'APPROVED') {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Không tìm thấy bất động sản');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (property.userId !== userId && user?.role !== 'ADMIN') throw new ForbiddenException('Không có quyền sửa bài này');

    const updated = await this.prisma.property.update({
      where: { id },
      data: { status, contentUpdatedAt: new Date() }
    });

    if (status === 'APPROVED') {
      await this.searchService.addDocument(updated).catch(() => null);
    } else {
      await this.searchService.deleteDocument(id).catch(() => null);
    }
    await this.clearPropertyCache(updated.id);
    return updated;
  }

  async extendProperty(userId: string, id: string) {
    const property = await this.findOne(id);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (property.userId !== userId && user?.role !== 'ADMIN') {
      throw new ForbiddenException('Không có quyền gia hạn bài này');
    }

    if (property.status !== 'EXPIRED' && property.status !== 'APPROVED') {
      throw new BadRequestException('Chỉ có thể gia hạn bài viết đã hết hạn hoặc đang hiển thị');
    }

    const extended = await this.prisma.property.update({
      where: { id },
      data: { status: 'APPROVED', createdAt: new Date(), contentUpdatedAt: new Date() }
    });
    
    await this.searchService.addDocument(extended).catch(() => null);

    await this.clearPropertyCache(extended.id);
    return extended;
  }

  async update(userId: string, id: string, data: any) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Không tìm thấy bất động sản');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (property.userId !== userId && user?.role !== 'ADMIN') throw new ForbiddenException('Không có quyền sửa bài này');
    const normalizedData = normalizePropertyPayload(data);
    this.validatePropertyPayload(normalizedData, true);

    if (normalizedData.transactionType === 'CAN_MUA' || normalizedData.transactionType === 'CAN_THUE') {
      throw new BadRequestException('Không thể đăng tin với hình thức CẦN MUA hoặc CẦN THUÊ.');
    }

    // 1. Lọc từ khóa nhạy cảm (Bad Words Filter)
    const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default_settings' } });
    const forbiddenWordsStr = settings?.forbiddenWords || 'chửi bậy,nhạy cảm,spam,lừa đảo,phản động';
    const badWords = forbiddenWordsStr.split(',').map(w => w.trim().toLowerCase());
    const title = normalizedData.title || property.title;
    const desc = normalizedData.description || property.description;
    const contentToCheck = `${title} ${desc}`.toLowerCase();
    
    if (badWords.some(word => contentToCheck.includes(word))) {
      throw new BadRequestException('Nội dung bài đăng chứa từ khóa không hợp lệ hoặc nhạy cảm.');
    }

    const isPreModerationEnabled = settings?.isPreModerationEnabled ?? true;
    let status = property.status;
    let postCostInPoints = 0;
    let userBalance = 0;

    if (property.status === 'DRAFT') {
      await this.checkDailyPostLimit(userId);
      status = isPreModerationEnabled ? 'PENDING' : 'APPROVED';

      const startOfDayPost = new Date();
      startOfDayPost.setHours(0, 0, 0, 0);
      const todayPostsCount = await this.prisma.property.count({
        where: { userId, createdAt: { gte: startOfDayPost }, status: { notIn: ['DRAFT', 'DELETED'] } },
      });
  
      const freePostsPerDay = settings?.freePostsPerDay ?? 2;
      const postPrice = Number(settings?.extraPostPrice ?? 0);
      const postCost = todayPostsCount < freePostsPerDay ? 0 : postPrice;
      postCostInPoints = Math.floor(postCost / 1000);
  
      userBalance = Number(user?.balance || 0);
      if (userBalance < postCostInPoints) {
        throw new BadRequestException({ message: `Số dư trong ví không đủ để đăng tin (Phí: ${postCost}đ). Vui lòng nạp thêm tiền.`, requiresPayment: true });
      }
    } else if (isPreModerationEnabled) {
      const criticalFieldsChanged = 
        (normalizedData.title !== undefined && normalizedData.title !== property.title) ||
        (normalizedData.price !== undefined && Number(normalizedData.price) !== Number(property.price)) ||
        (normalizedData.area !== undefined && Number(normalizedData.area) !== Number(property.area)) ||
        (normalizedData.categoryId !== undefined && normalizedData.categoryId !== property.categoryId) ||
        (normalizedData.locationId !== undefined && normalizedData.locationId !== property.locationId) ||
        (normalizedData.city !== undefined && normalizedData.city !== property.city) ||
        (normalizedData.district !== undefined && normalizedData.district !== property.district) ||
        (normalizedData.ward !== undefined && normalizedData.ward !== property.ward);
      
      if (criticalFieldsChanged) {
        status = 'PENDING';
      }
    }

    const updateData: any = {
      ...normalizedData,
      status,
    };

    if (status === 'PENDING' && property.status === 'APPROVED' && property.tier !== 'NORMAL' && property.tierExpiresAt) {
      const now = new Date();
      if (property.tierExpiresAt > now) {
        updateData.frozenTierMs = property.tierExpiresAt.getTime() - now.getTime();
      }
    }
    
    if (normalizedData.title && normalizedData.title !== property.title) {
       updateData.slug = await this.generateUniqueSlug(normalizedData.title, id);
    }

    if (Array.isArray(normalizedData.images)) {
      const imagesArr = normalizedData.images;
      updateData.images = imagesArr;
      updateData.imageObjects = {
        deleteMany: {},
        create: imagesArr.map((url: string, idx: number) => ({ url, sortOrder: idx, isThumbnail: idx === 0 }))
      };
    }
    
    applyRangeKeys(updateData);
    delete updateData.images; // Optionally keep images array sync, but we use imageObjects primarily now. Let's keep images array to not break UI.
    if (Array.isArray(normalizedData.images)) {
      updateData.images = normalizedData.images;
    }

    const updatedProperty = await this.prisma.$transaction(async (tx: any) => {
      if (postCostInPoints > 0) {
        const charged = await tx.user.updateMany({
          where: { id: userId, balance: { gte: postCostInPoints } },
          data: { balance: { decrement: postCostInPoints } },
        });
        if (charged.count === 0) {
          throw new BadRequestException({ message: 'Số dư không đủ để thanh toán phí đăng tin.', requiresPayment: true });
        }
        await tx.transaction.create({
          data: {
            userId,
            balanceBefore: userBalance,
            balanceAfter: userBalance - postCostInPoints,
            amount: postCostInPoints,
            type: 'DEDUCT',
            description: `Phí đăng tin: ${updateData.title || property.title}`
          }
        });
      }

      // Save history
      await tx.propertyHistory.create({
        data: {
          propertyId: id,
          changedBy: userId,
          changes: JSON.stringify({ action: 'EDIT', data: property }),
        }
      });
  
      return tx.property.update({
        where: { id },
        // contentUpdatedAt là mốc "nội dung thực sự đổi" dùng cho <lastmod> của sitemap.
        data: { ...updateData, contentUpdatedAt: new Date() },
      });
    });

    if (status === 'APPROVED') {
      try {
        await this.searchService.addDocument(updatedProperty);
      } catch (err) {
        console.error('Failed to sync to meilisearch', err);
      }
    } else {
      await this.searchService.deleteDocument(updatedProperty.id).catch(() => null);
    }

    await this.clearPropertyCache(updatedProperty.id);
    return updatedProperty;
  }

  async findRelated(id: string) {
    const property: any = await this.prisma.property.findFirst({
      where: { id, status: { in: [...this.publicStatuses] }, deletedAt: null },
      select: { city: true, district: true, ward: true, propertyType: true, locationId: true, areaRangeKey: true, priceRangeKey: true } as any
    });

    if (!property) return [];

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 15);

    // Build OR conditions - not requiring all to match (too narrow)
    const orConditions: any[] = [];
    if (property.propertyType) orConditions.push({ propertyType: property.propertyType });
    if (property.locationId) orConditions.push({ locationId: property.locationId });
    if (property.ward) orConditions.push({ ward: property.ward });
    if (property.areaRangeKey) orConditions.push({ areaRangeKey: property.areaRangeKey });
    if (property.priceRangeKey) orConditions.push({ priceRangeKey: property.priceRangeKey });

    // Fallback: if no OR conditions, just find any recent approved
    const whereClause: any = {
      id: { not: id },
      status: { in: ['APPROVED', 'SOLD'] },
      deletedAt: null,
      // 15-day window: use publishedAt if available, else createdAt
      OR: [
        { publishedAt: { gte: thresholdDate } },
        { publishedAt: null, createdAt: { gte: thresholdDate } },
      ],
    };

    // Wrap the main OR filter and the date OR in AND
    const finalWhere: any = {
      AND: [
        whereClause,
        orConditions.length > 0 ? { OR: orConditions } : {},
      ],
    };

    return this.prisma.property.findMany({
      where: finalWhere,
      take: 9,
      orderBy: [
        { pushedAt: { sort: 'desc', nulls: 'last' } },
        { publishedAt: { sort: 'desc', nulls: 'last' } }
      ],
      include: {
        user: { select: { id: true, slug: true, name: true, avatar: true } },
        imageObjects: { orderBy: { sortOrder: 'asc' } },
        location: true,
      } as any
    });
  }

  async remove(userId: string, id: string) {
    const property = await this.findOne(id);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    // Both property owner and admin can delete
    if (property.userId !== userId && user?.role !== 'ADMIN') {
      throw new ForbiddenException('Không có quyền xoá bài này');
    }
    
    const removed = await this.prisma.property.update({
      where: { id },
      data: { status: 'DELETED', deletedAt: new Date(), contentUpdatedAt: new Date() }
    });
    await this.searchService.deleteDocument(id).catch(() => null);
    if (user?.role === 'ADMIN') {
      await this.adminActionLogService.logAction(
        userId,
        'DELETE_PROPERTY',
        id,
        'Property',
        'Admin deleted property',
        { previousStatus: property.status }
      );
    }
    return removed;
  }

  async restore(userId: string, id: string) {
    const property = await this.findOne(id);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // Both property owner and admin can restore
    if (property.userId !== userId && user?.role !== 'ADMIN') {
      throw new ForbiddenException('Không có quyền khôi phục bài này');
    }

    if (property.status !== 'DELETED' && property.status !== 'EXPIRED') {
      throw new BadRequestException('Chỉ có thể khôi phục bài viết đã xoá hoặc hết hạn');
    }

    const restored = await this.prisma.property.update({
      where: { id },
      data: { status: 'HIDDEN', deletedAt: null, contentUpdatedAt: new Date() } // Restore to HIDDEN so user can review and publish again
    });
    await this.searchService.deleteDocument(id).catch(() => null);
    if (user?.role === 'ADMIN') {
      await this.adminActionLogService.logAction(
        userId,
        'RESTORE_PROPERTY',
        id,
        'Property',
        'Admin restored property',
        { previousStatus: property.status }
      );
    }
    return restored;
  }

  // --- Delegated to PropertyInteractionService ---

  async removeFavorite(userId: string, propertyId: string) {
    return this.interactionService.removeFavorite(userId, propertyId);
  }

  async saveProperty(userId: string, propertyId: string) {
    return this.interactionService.saveProperty(userId, propertyId);
  }

  async unsaveProperty(userId: string, propertyId: string) {
    return this.interactionService.unsaveProperty(userId, propertyId);
  }

  async getSavedProperties(userId: string) {
    return this.interactionService.getSavedProperties(userId);
  }

  async compareProperties(ids: string[]) {
    return this.interactionService.compareProperties(ids);
  }

  async reportProperty(userId: string, propertyId: string, reason: string) {
    return this.interactionService.reportProperty(userId, propertyId, reason);
  }

  async trackContact(propertyId: string, viewerUserId?: string, channel: 'PHONE_REVEAL' | 'CALL' | 'ZALO' = 'PHONE_REVEAL') {
    return this.interactionService.trackContact(propertyId, viewerUserId, channel);
  }

  async getSitemap() {
    return this.prisma.property.findMany({
      where: {
        status: { in: [...this.publicStatuses] },
        deletedAt: null,
      },
      // Sắp xếp và lấy lastmod theo contentUpdatedAt: updatedAt bị đẩy bởi lượt xem,
      // đếm click và cron gia hạn VIP nên không phản ánh thay đổi nội dung.
      orderBy: [
        { contentUpdatedAt: 'desc' },
      ],
      take: 50000,
      select: {
        id: true,
        title: true,
        contentUpdatedAt: true,
        publishedAt: true,
        createdAt: true,
        tier: true,
      },
    });
  }

  async checkDailyPostLimit(userId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default_settings' } });
    const maxPostsPerDay = settings?.hardPostsPerUserPerDay ?? 2;
    const maxTotalPostsPerUser = (settings as any)?.maxTotalPostsPerUser ?? 20;

    const [todayPostsCount, totalPostsCount] = await Promise.all([
      this.prisma.property.count({
        where: {
          userId,
          createdAt: {
            gte: startOfDay,
          },
          status: { notIn: ['DRAFT', 'DELETED'] },
        },
      }),
      this.prisma.property.count({
        where: {
          userId,
          status: { notIn: ['DELETED', 'DRAFT'] },
        },
      }),
    ]);

    if (totalPostsCount >= maxTotalPostsPerUser) {
      throw new BadRequestException(`BẠN ĐÃ ĐẠT GIỚI HẠN: Tối đa ${maxTotalPostsPerUser} tin/tài khoản.`);
    }

    if (todayPostsCount >= maxPostsPerDay) {
      throw new BadRequestException(`BẠN ĐÃ ĐẠT GIỚI HẠN: Tối đa ${maxPostsPerDay} tin/ngày.`);
    }

    const freePostsLimit = settings?.freePostsPerDay ?? 2;

    // Let create/update methods handle payment if over free limit

  }
  async getSeoProperties(loaiBdsSlug: string, khuVucSlug: string, allQueries: any) {
    const filters = normalizeSearchFilters(allQueries || {});
    
    // Default pagination if not provided in queries
    filters.page = filters.page || 1;
    filters.limit = filters.limit || 20;

    // Caller (P4) đã resolve sẵn transactionType/propertyType từ taxonomy dùng chung.
    // Chỉ đoán từ slug khi caller chưa truyền — giữ tương thích một release.
    const hasResolvedTransaction = Boolean(filters.transactionType);
    const hasResolvedPropertyType = Boolean(filters.propertyType);

    if (!hasResolvedTransaction) {
      filters.transactionType =
        loaiBdsSlug === 'cho-thue' || khuVucSlug === 'cho-thue' || loaiBdsSlug?.includes('cho-thue')
          ? 'CHO_THUE'
          : 'BAN';
    }

    let actualLoaiBdsSlug = loaiBdsSlug;
    let actualKhuVucSlug = khuVucSlug;

    if (khuVucSlug === 'toan-quoc') {
      // Tra theo urlSegment, KHÔNG theo slug: sau khi có dữ liệu Hà Nội, `slug` chỉ còn
      // duy nhất trong phạm vi cha (125 nhóm tên trùng nhau), nên findFirst theo slug
      // có thể trả về nhầm khu vực của quận khác.
      const locMatch = await this.prisma.location.findFirst({
        where: { urlSegment: loaiBdsSlug, isActive: true },
      });
      if (locMatch) {
        actualKhuVucSlug = loaiBdsSlug;
        actualLoaiBdsSlug = 'tat-ca';
      }
    }

    // Danh sách này thiếu 'biet-thu' nên trang /biet-thu chạy ở frontend mà backend
    // không lọc đúng loại. Nay chỉ dùng làm đường lui khi caller chưa resolve.
    if (
      !hasResolvedPropertyType &&
      actualLoaiBdsSlug &&
      actualLoaiBdsSlug !== 'tat-ca' &&
      actualLoaiBdsSlug !== 'ban' &&
      !actualLoaiBdsSlug.includes('cho-thue')
    ) {
      const categoryCandidates = ['dat-nen', 'nha-rieng', 'chung-cu', 'du-an', 'mat-bang-kho-xuong', 'biet-thu', 'bds-khac'];
      const matchedCategory = categoryCandidates.find((candidate) => actualLoaiBdsSlug.includes(candidate));
      filters.propertyType = normalizePropertyType(matchedCategory || actualLoaiBdsSlug) as any;
    }

    // 2. Map `khu-vuc` slug to Location
    if (actualKhuVucSlug && actualKhuVucSlug !== 'toan-quoc') {
      const matchedLocation = await this.prisma.location.findFirst({
        where: { urlSegment: actualKhuVucSlug, isActive: true }
      });

      if (matchedLocation) {
        // Lọc theo TÊN vì các cột city/district/ward/oldWard trên Property là văn bản
        // tự do và là nguồn sự thật cho hiển thị lẫn tìm kiếm.
        if (matchedLocation.type === 'WARD') filters.ward = matchedLocation.name;
        if (matchedLocation.type === 'OLD_WARD') filters.oldWard = matchedLocation.name;
        if (matchedLocation.type === 'DISTRICT') filters.district = matchedLocation.name;
        if (matchedLocation.type === 'CITY') filters.city = matchedLocation.name;
      } else {
        // Trước đây rơi về tìm kiếm toàn văn `filters.q = slug.replace(/-/g,' ')`, nên
        // MỌI URL rác (/nha-rieng/$, /chung-cu/&) đều ra một trang 200 index được.
        // Nay trả rỗng kèm cờ để frontend quyết định 404.
        return {
          vips: [],
          normals: [],
          total: 0,
          page: filters.page,
          limit: filters.limit,
          unknownLocation: actualKhuVucSlug,
        };
      }
    }
    
    (filters as any).status = { in: ['APPROVED', 'SOLD'] };
    (filters as any).deletedAt = null;

    return this.searchDatabase(filters);
  }
}
