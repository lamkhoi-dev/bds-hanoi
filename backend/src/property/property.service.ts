import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { LocationType } from '@prisma/client';
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
  applyProjectLocation,
  type NormalizedFilters,
} from './property-utils';
import { listingPath, PROPERTY_TYPE_LABEL, PROPERTY_TYPE_SLUG } from '../seo/seo-urls';
import { HOMEPAGE_LAYOUTS, LOCATION_BLOCK_TITLES, resolveLayout, homepageCacheKey, type SectionId } from './homepage-layout';

type PropertyWhereInput = any;

/**
 * Số card tin mỗi khối/chuyên mục trên trang chủ.
 *
 * Đặt thành hằng số vì con số này lặp ở 4 chỗ: khối danh mục, tin VIP, tin UP và các tab
 * khu vực — sửa lẻ từng chỗ là chắc chắn lệch.
 *
 * Khách chốt 3, rồi đính chính 19-8 (mục 13): trên PC lưới là 4 cột nên 3 card để thừa
 * một ô trống — nâng lên **4** cho PC. Mobile/tablet vẫn phải là 3 như cũ, việc đó xử lý
 * ở frontend bằng cách ẩn card thứ 4 dưới ngưỡng `xl` (PropertyBlock/PropertyTabs), chứ
 * không cắt ở backend — cắt ở đây thì PC lại thiếu.
 */
const HOMEPAGE_ITEMS_PER_BLOCK = 4;

/**
 * Số TAB khu vực hiện ra mỗi khối trên trang chủ (khác `HOMEPAGE_ITEMS_PER_BLOCK` —
 * đó là số CARD tin trong 1 tab). Khách chốt 9 tab + 1 tab "Tất cả các khu vực" ở cuối
 * cho mọi khối (quận/huyện, phường/xã mới, phường/xã cũ) — dùng chung cho mọi tỉnh.
 */
const HOMEPAGE_TABS_PER_BLOCK = 9;

/**
 * 3 loại khối "khu vực" trên trang chủ — CÙNG một cơ chế xếp hạng (xem
 * `buildDynamicLocationBlock`), chỉ khác field groupBy và có bắt buộc `isFeatured` hay
 * không. KHÔNG rẽ nhánh theo tỉnh: Nghệ An và Hà Nội chạy chung định nghĩa này, khối
 * nào 0 dữ liệu thì tự ẩn (xem chỗ dùng ở `getHomepageProperties`).
 *
 * `requireFeatured: false` cho DISTRICT vì cấp quận/huyện của một tỉnh vốn LÀ toàn bộ
 * danh sách hành chính, không có khái niệm "được chọn nổi bật" như 736 phường/xã —
 * khác WARD/OLD_WARD cần một tập ứng viên đã chọn lọc qua `isFeatured`.
 */
const LOCATION_BLOCK_DEFS = [
  { type: 'DISTRICT', groupField: 'districtId', requireFeatured: false, key: 'districts', title: 'Bất động sản theo quận, huyện' },
  { type: 'WARD', groupField: 'wardId', requireFeatured: true, key: 'wards-new', title: 'Bất động sản theo phường, xã mới' },
  // groupField 'oldWardId' (KHÔNG phải 'wardId'): Property.wardId chỉ được gán từ
  // phường/xã MỚI (xem resolveLocationIds() trong LocationPicker.tsx). Trước khi có FK
  // riêng (migration 20260818000000), khối này groupBy nhầm 'wardId' nên gần như luôn
  // rỗng — kiểm chứng trên Nghệ An: wardId trỏ OLD_WARD chỉ 3/158 tin, còn 33 tin lưu
  // xã cũ ở cột `oldWard` (chuỗi, không FK).
  { type: 'OLD_WARD', groupField: 'oldWardId', requireFeatured: true, key: 'wards-old', title: 'Bất động sản theo phường, xã cũ' },
] as const;

/** Nhận dạng UUID v4 để phân biệt URL tin dạng cũ với mã ngắn dạng mới. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Thứ tự tab của khối "Cho thuê" trên trang chủ, đúng như khách liệt kê. */
const RENT_TAB_TYPES = ['NHA_RIENG', 'CHUNG_CU', 'MAT_BANG', 'DAT_NEN', 'BDS_KHAC'] as const;

/**
 * 5 tab của khối "Bán" trong bố cục `grouped` (PHẦN II mục 25) — gộp 6 loại BĐS thành 1
 * khối tab ngang thay vì 4 khối rời + 2 tab riêng như bố cục `classic`. CHỈ lọc đúng
 * `transactionType: 'BAN'` — khác `categoryBlocks` (bố cục classic) hiện KHÔNG lọc
 * transactionType nên đang lẫn cả tin cho thuê; đây là bug có sẵn, CỐ TÌNH không sửa
 * cho classic ở đợt này vì đó là thay đổi nội dung trên site Nghệ An đã duyệt.
 */
const SALE_TAB_TYPES = ['DAT_NEN', 'NHA_RIENG', 'CHUNG_CU', 'MAT_BANG', 'BDS_KHAC'] as const;

/** Tiêu đề + đường dẫn của một khối theo loại BĐS, lấy từ một nguồn duy nhất. */
function blockMeta(propertyTypeEnum: string, transaction: 'ban' | 'cho-thue' = 'ban') {
  return {
    title: PROPERTY_TYPE_LABEL[propertyTypeEnum] ?? 'Bất động sản',
    href: listingPath({ transaction, propertyTypeSlug: PROPERTY_TYPE_SLUG[propertyTypeEnum] }),
  };
}

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

    const normalizedData = await applyProjectLocation(this.prisma, normalizePropertyPayload(data));
    
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

    const normalizedData = await applyProjectLocation(this.prisma, normalizePropertyPayload(data));
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
    const shortCode = await this.nextShortCode();
    return this.prisma.property.create({ data: { ...propertyData, shortCode, contentUpdatedAt: new Date() } });
  }

  /**
   * Mã ngắn dùng trong URL `/tin/{slug}-{shortCode}`.
   *
   * Lấy từ sequence Postgres nên duy nhất tuyệt đối — không cần vòng lặp thử lại như
   * `generateUniquePropertyCode` (mã nội bộ BDS-xxxxxx, khác mục đích). base36 của
   * 1.700.000 là 5 ký tự, ngắn hơn nhiều so với UUID 36 ký tự của URL cũ.
   */
  private async nextShortCode(): Promise<string> {
    // Chỉ lấy SỐ từ sequence rồi tự đổi cơ số ở đây, không gọi hàm SQL `bds_to_base36`
    // — hàm đó chỉ tồn tại để backfill một lần trong migration, ứng dụng không nên phụ
    // thuộc vào việc nó còn nằm trong CSDL hay không.
    const rows = await this.prisma.$queryRaw<
      { n: bigint | number }[]
    >`SELECT nextval('property_short_code_seq') AS n`;
    const n = rows?.[0]?.n;
    if (n === undefined || n === null) {
      throw new Error('Không sinh được shortCode cho tin đăng.');
    }
    return BigInt(n).toString(36);
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

    const normalizedData = await applyProjectLocation(this.prisma, normalizePropertyPayload(data));
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
    // Lấy ngoài transaction: nextval() không bị rollback nên nằm trong hay ngoài đều
    // không tái sử dụng số, mà để ngoài thì transaction ngắn hơn.
    const shortCode = await this.nextShortCode();

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

      return tx.property.create({ data: { ...propertyData, shortCode, contentUpdatedAt: new Date() } });
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

    // Giữ nguyên quy tắc "2 tin mới nhất + phần còn lại ngẫu nhiên", chỉ hạ tổng số
    // xuống HOMEPAGE_ITEMS_PER_BLOCK theo yêu cầu 3 card mỗi khối.
    const newestVips = allVips.slice(0, 2);
    const remainingVips = allVips.slice(2);
    const randomVips = remainingVips
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.max(0, HOMEPAGE_ITEMS_PER_BLOCK - newestVips.length));
    return [...newestVips, ...randomVips];
  }

  /**
   * Chọn ĐÚNG N khu vực (trong danh sách ứng viên của MỘT type) để làm tab trên trang chủ.
   *
   * Thứ tự xếp hạng (khách đính chính 19-8, mục 11):
   *   1. Khu vực thuộc TỈNH CHÍNH trước — tỉnh khai đầu tiên trong `ACTIVE_PROVINCE_SLUG`.
   *   2. Rồi tới SỐ TIN nhiều hơn.
   *   3. Cuối cùng mới tới tin mới nhất (chỉ để phân định khi bằng điểm).
   *
   * Vì sao đổi: bản cũ xếp thuần theo `_max(publishedAt)` nên trên site Nghệ An, huyện
   * Nghi Xuân (Hà Tĩnh, **1 tin**) đứng thứ 2 chỉ vì tin đó mới nhất, trong khi TX Hoàng
   * Mai (7 tin) và Nghi Lộc (4 tin) — đều thuộc Nghệ An — bị cắt khỏi top 9. Khách yêu cầu
   * đúng 3 việc: kéo Nghi Xuân xuống cuối, thêm Nghi Lộc, thêm TX Hoàng Mai; quy tắc trên
   * đáp ứng cả 3 mà không cần ghim tay khu vực nào.
   *
   * Khu vực ứng viên nhưng 0 tin vẫn tự động bị loại: Prisma `groupBy` chỉ trả nhóm có ≥1
   * dòng khớp `where`.
   */
  private async buildDynamicLocationBlock(
    def: { type: LocationType; groupField: 'districtId' | 'wardId' | 'oldWardId'; requireFeatured: boolean },
    limit: number,
    getItems: (where: any) => Promise<any>,
  ) {
    const candidates = await this.prisma.location.findMany({
      where: {
        type: def.type,
        isActive: true,
        ...(def.requireFeatured ? { isFeatured: true } : {}),
      },
      select: { id: true, type: true, urlSegment: true, name: true, path: true },
    });
    if (candidates.length === 0) return [];

    const candidateIds = candidates.map((c) => c.id);

    const groups = await this.prisma.property.groupBy({
      by: [def.groupField],
      where: {
        [def.groupField]: { in: candidateIds },
        status: { in: [...this.publicStatuses] },
        deletedAt: null,
      } as any,
      _max: { publishedAt: true },
      _count: { _all: true },
    });

    // Tỉnh chính = tỉnh khai TRƯỚC trong ACTIVE_PROVINCE_SLUG. Site "xứ Nghệ" phục vụ cả
    // Nghệ An lẫn Hà Tĩnh ("nghe-an,ha-tinh") nên phải phân biệt; site một tỉnh thì mọi
    // khu vực đều thuộc tỉnh chính và điều kiện này thành vô hại.
    const primaryProvince = (process.env.ACTIVE_PROVINCE_SLUG || 'ha-noi')
      .split(',')[0]
      .trim();
    const pathById = new Map(candidates.map((c) => [c.id, c.path ?? '']));
    const isPrimary = (id: string) => {
      const path = pathById.get(id) ?? '';
      return path === primaryProvince || path.startsWith(`${primaryProvince}/`);
    };

    const rankedIds = groups
      .filter((g: any) => g[def.groupField])
      .sort((a: any, b: any) => {
        const aPrimary = isPrimary(a[def.groupField]) ? 1 : 0;
        const bPrimary = isPrimary(b[def.groupField]) ? 1 : 0;
        if (aPrimary !== bPrimary) return bPrimary - aPrimary;

        const ac = a._count?._all ?? 0;
        const bc = b._count?._all ?? 0;
        if (ac !== bc) return bc - ac;

        const at = a._max.publishedAt?.getTime() ?? 0;
        const bt = b._max.publishedAt?.getTime() ?? 0;
        return bt - at;
      })
      .slice(0, limit)
      .map((g: any) => g[def.groupField] as string);

    if (rankedIds.length === 0) return [];

    const byId = new Map(candidates.map((c) => [c.id, c]));
    // Giữ ĐÚNG thứ tự đã xếp hạng, không theo thứ tự findMany trả về.
    const orderedLocations = rankedIds.map((id) => byId.get(id)).filter(Boolean) as typeof candidates;

    return Promise.all(
      orderedLocations.map((loc) =>
        getItems(
          loc.type === 'WARD'
            ? { wardId: loc.id }
            : loc.type === 'OLD_WARD'
              ? { oldWardId: loc.id }
              : { districtId: loc.id },
        ).then((items: any) => ({
          key: loc.urlSegment,
          title: loc.name,
          // Qua listingPath để chế độ enforce có tiền tố /ban, chế độ report giữ dạng
          // phẳng đang chạy — cùng một build phục vụ cả hai site.
          href: listingPath({ locationSlug: loc.urlSegment }),
          items,
        })),
      ),
    );
  }

  /**
   * Danh sách projectId xếp hạng theo tin mới nhất — CÙNG thuật toán với
   * `ProjectService.findLatestForHomepage()`, viết lại tại đây thay vì gọi chéo sang
   * `ProjectModule` để tránh vòng phụ thuộc (`ProjectModule` đã `imports:
   * [PropertyModule]`, chiều ngược lại sẽ phải `forwardRef`). Đúng khuôn với
   * `buildDynamicLocationBlock` gọi thẳng `this.prisma.location` thay vì inject
   * `LocationService`.
   */
  private async rankedProjectIds(limit: number): Promise<string[]> {
    const groups = await this.prisma.property.groupBy({
      by: ['projectId'],
      where: {
        projectId: { not: null },
        status: { in: [...this.publicStatuses] },
        deletedAt: null,
        project: { status: 'VISIBLE' },
      } as any,
      _max: { publishedAt: true },
    });
    return groups
      .filter((g: any) => g.projectId)
      .sort((a: any, b: any) => (b._max.publishedAt?.getTime() ?? 0) - (a._max.publishedAt?.getTime() ?? 0))
      .slice(0, limit)
      .map((g: any) => g.projectId as string);
  }

  /** Khối "Dự án nổi bật" dạng grid ảnh (bố cục `classic`) — N dự án có tin mới nhất. */
  private async buildProjectGrid(limit: number) {
    const ids = await this.rankedProjectIds(limit);
    if (ids.length === 0) return [];
    const projects = await this.prisma.project.findMany({ where: { id: { in: ids } } });
    const byId = new Map(projects.map((p) => [p.id, p]));
    return ids.map((id) => byId.get(id)).filter(Boolean);
  }

  /** Khối "Dự án" dạng tab động (bố cục `grouped`, mục 9 PHẦN II) — mỗi tab là 1 dự án
   *  kèm tin đăng thuộc dự án đó. */
  private async buildProjectTabsBlock(limit: number, getItems: (where: any) => Promise<any>) {
    const ids = await this.rankedProjectIds(limit);
    if (ids.length === 0) return [];
    const projects = await this.prisma.project.findMany({ where: { id: { in: ids } } });
    const byId = new Map(projects.map((p) => [p.id, p]));
    const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as typeof projects;
    return Promise.all(
      ordered.map((p) =>
        getItems({ projectId: p.id }).then((items: any) => ({
          key: p.shortCode,
          title: p.name,
          href: `/du-an/${p.slug}-${p.shortCode}`,
          items,
        })),
      ),
    );
  }

  /** Xoá cache trang chủ — gọi khi một tin chuyển sang APPROVED để các khối phản ánh
   *  ngay, không chờ hết TTL 60s thụ động. Xoá CẢ HAI cache key (classic + grouped): một
   *  site chỉ chạy 1 layout tại một thời điểm nên xoá dư 1 key không tốn kém, còn xoá
   *  thiếu (do quên đổi theo layout đang cấu hình) sẽ để lại cache cũ — bug đã từng gặp
   *  với key không đổi theo tham số. */
  async invalidateHomepageCache() {
    await Promise.all(
      (Object.keys(HOMEPAGE_LAYOUTS) as Array<keyof typeof HOMEPAGE_LAYOUTS>).map((layout) =>
        this.cacheManager.del(homepageCacheKey(layout)).catch(() => null),
      ),
    );
  }

  async getHomepageProperties() {
    // Bố cục trang chủ — cơ chế rẽ nhánh DUY NHẤT giữa 2 site cho phần này (xem
    // homepage-layout.ts). Không đọc qua NEXT_PUBLIC_* nên không bị bake lúc build.
    const layout = resolveLayout();
    const cacheKey = homepageCacheKey(layout);
    const cached: any = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const baseWhere = { status: { in: [...this.publicStatuses] }, deletedAt: null };
    const includeOptions = { user: { select: { id: true, slug: true, name: true, avatar: true } }, imageObjects: true };

    const getItems = (where: any) => this.prisma.property.findMany({
      where: { ...baseWhere, ...where, tier: 'NORMAL' },
      orderBy: [{ status: 'asc' }, { publishedAt: { sort: 'desc', nulls: 'last' } }, { pushedAt: { sort: 'desc', nulls: 'last' } }],
      take: HOMEPAGE_ITEMS_PER_BLOCK,
      include: includeOptions
    });

    // 3 khối "khu vực" (quận/huyện, phường/xã mới, phường/xã cũ) — Nghệ An hiện chỉ đủ
    // dữ liệu cho 2 khối (OLD_WARD chưa có ứng viên/tin), Hà Nội đủ cả 3 — không có
    // dòng code nào rẽ nhánh theo tỉnh, khối 0 dữ liệu tự ẩn ở bước lọc bên dưới.
    const locationBlocksRaw = await Promise.all(
      LOCATION_BLOCK_DEFS.map((def) => this.buildDynamicLocationBlock(def, HOMEPAGE_TABS_PER_BLOCK, getItems)),
    );

    const [
      featuredVip,
      datNen, nhaRieng, chungCu, duAn,
      matBang, bdsKhac,
      rentItems,
      totalProperties, totalUsers, totalProjects
    ] = await Promise.all([
      this.getHomepageVipItems(baseWhere, includeOptions),
      getItems({ propertyType: 'DAT_NEN' }),
      getItems({ propertyType: 'NHA_RIENG' }),
      getItems({ propertyType: 'CHUNG_CU' }),
      getItems({ propertyType: 'DU_AN' }),
      getItems({ propertyType: 'MAT_BANG' }),
      getItems({ propertyType: 'BDS_KHAC' }),
      // "Cho thuê" trước đây là MỘT khối gộp mọi loại BĐS. Khách yêu cầu tách thành
      // tab ngang theo loại, nên lấy song song một truy vấn cho mỗi tab.
      Promise.all(
        RENT_TAB_TYPES.map((type) =>
          getItems({ transactionType: 'CHO_THUE', propertyType: type }),
        ),
      ),
      this.prisma.property.count({ where: baseWhere }),
      this.prisma.user.count(),
      this.prisma.project.count({ where: { status: 'VISIBLE' } }),
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
    const randomUpItems = remainingUpItems
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.max(0, HOMEPAGE_ITEMS_PER_BLOCK - newestUpItems.length));
    const upTabItems = [...newestUpItems, ...randomUpItems];

    // Khối "Dành cho bạn" đã được KHÁCH YÊU CẦU BỎ HẲN khỏi trang chủ (PHẦN I).
    // Xoá luôn phần tính toán chứ không chỉ ngừng render: nó chạy 4 truy vấn phụ mỗi
    // lần tải trang chủ của người đã đăng nhập (lịch sử xem, lịch sử tìm, tin đã lưu,
    // rồi một truy vấn gợi ý) — giữ lại là tốn công vô ích.

    // Dữ liệu RIÊNG cho bố cục `grouped` (PHẦN II) — chỉ tính khi thật sự cần, để
    // Nghệ An (`classic`) không phải trả thêm 5 truy vấn `sale-type-tabs`/`project-tabs`
    // vô ích mỗi lần rebuild cache. `project-grid` ngược lại chỉ `classic` mới dùng.
    const isGrouped = layout === 'grouped';
    const [projectGridRows, projectTabsRaw, saleItems] = await Promise.all([
      isGrouped ? Promise.resolve([]) : this.buildProjectGrid(4),
      isGrouped ? this.buildProjectTabsBlock(5, getItems) : Promise.resolve([]),
      isGrouped
        ? Promise.all(SALE_TAB_TYPES.map((type) => getItems({ transactionType: 'BAN', propertyType: type })))
        : Promise.resolve([] as any[]),
    ]);

    // ---- Lắp ráp `sections[]` theo đúng thứ tự của layout đang chạy ----
    // Đây là NƠI DUY NHẤT quyết định khối nào hiện, hiện theo thứ tự gì — xem
    // HOMEPAGE_LAYOUTS. Các field cũ bên dưới (`categoryBlocks`, `rentTabs`...) VẪN giữ
    // nguyên để không phá consumer hiện tại trong 1 đợt release, sẽ dọn ở đợt sau.
    const locationBlocksByKey = new Map(LOCATION_BLOCK_DEFS.map((def, i) => [def.key, locationBlocksRaw[i]]));
    const catchAllLocationTab = { key: 'khu-vuc-khac', title: 'Tất cả các khu vực', href: '/khu-vuc', items: otherLocationItems };
    const locationSection = (key: 'districts' | 'wards-new' | 'wards-old') => {
      const tabsRaw = locationBlocksByKey.get(key) ?? [];
      if (tabsRaw.length === 0) return null;
      // Tiêu đề lấy theo layout (Nghệ An dùng tên địa danh cụ thể, xem
      // LOCATION_BLOCK_TITLES) chứ không lấy `def.title` dùng chung nữa.
      return {
        id: key as SectionId,
        kind: 'tabs' as const,
        title: LOCATION_BLOCK_TITLES[layout][key],
        tabs: [...tabsRaw, catchAllLocationTab],
      };
    };

    const sectionBuilders: Record<SectionId, () => any> = {
      vip: () => ({ id: 'vip', kind: 'block', title: 'Tin nổi bật', href: '/search?tier=VIP', items: featuredVip }),
      up: () => (upTabItems.length > 0 ? { id: 'up', kind: 'block', title: 'Tin UP Mới Nhất', href: '/search?tier=UP', items: upTabItems } : null),
      ad: () => ({ id: 'ad', kind: 'ad' }),
      districts: () => locationSection('districts'),
      'wards-new': () => locationSection('wards-new'),
      'wards-old': () => locationSection('wards-old'),
      // Chờ khách trả lời câu A4 (khối "khu vực hot" là Dự án hay thực thể riêng) — xem
      // plan/cau-hoi-gui-khach-2026-08-18.txt. Đã đăng ký ĐÚNG vị trí thứ 5 trong
      // HOMEPAGE_LAYOUTS.grouped, khi có câu trả lời chỉ cần viết lại builder này.
      'hot-areas': () => null,
      'cat-DAT_NEN': () => ({ id: 'cat-DAT_NEN', kind: 'block', ...blockMeta('DAT_NEN'), items: datNen }),
      'cat-NHA_RIENG': () => ({ id: 'cat-NHA_RIENG', kind: 'block', ...blockMeta('NHA_RIENG'), items: nhaRieng }),
      'cat-CHUNG_CU': () => ({ id: 'cat-CHUNG_CU', kind: 'block', ...blockMeta('CHUNG_CU'), items: chungCu }),
      'cat-DU_AN': () => ({ id: 'cat-DU_AN', kind: 'block', ...blockMeta('DU_AN'), items: duAn }),
      'sale-type-tabs': () =>
        saleItems.length > 0
          ? {
              id: 'sale-type-tabs',
              kind: 'tabs',
              title: 'Nhà đất bán',
              tabs: SALE_TAB_TYPES.map((type, i) => ({ key: type, ...blockMeta(type, 'ban'), items: saleItems[i] })),
            }
          : null,
      'project-grid': () =>
        projectGridRows.length > 0
          ? { id: 'project-grid', kind: 'project-grid', title: 'Dự án nổi bật', href: '/du-an', projects: projectGridRows }
          : null,
      'project-tabs': () =>
        projectTabsRaw.length > 0
          ? {
              id: 'project-tabs',
              kind: 'tabs',
              title: 'Dự án',
              tabs: [...projectTabsRaw, { key: 'xem-toan-bo', title: 'Xem toàn bộ', href: '/du-an', items: [], asLink: true }],
            }
          : null,
      'rent-type-tabs': () => ({
        id: 'rent-type-tabs',
        kind: 'tabs',
        title: 'Cho thuê',
        tabs: RENT_TAB_TYPES.map((type, i) => ({ key: type, ...blockMeta(type, 'cho-thue'), items: rentItems[i] })),
      }),
      'other-type-tabs': () => ({
        id: 'other-type-tabs',
        kind: 'tabs',
        title: 'Bất động sản khác',
        tabs: [
          { key: 'MAT_BANG', ...blockMeta('MAT_BANG'), items: matBang },
          { key: 'BDS_KHAC', ...blockMeta('BDS_KHAC'), items: bdsKhac },
        ],
      }),
    };

    const sections = HOMEPAGE_LAYOUTS[layout]
      .map((id) => sectionBuilders[id]())
      .filter((section): section is NonNullable<typeof section> => section !== null);

    const result = {
      sections,
      featuredVip: { title: 'Tin nổi bật', href: '/search?tier=VIP', items: featuredVip },
      
      upTab: upTabItems,

      // Tiêu đề khối lấy từ PROPERTY_TYPE_LABEL và đường dẫn từ listingPath. Trước đây
      // cả hai đều viết cứng ở đây: nhãn lệch với 10 nơi khác ("Mặt bằng, kho xưởng"),
      // còn href là dạng URL cũ (`/dat-nen`) đã bị 301, riêng "Cho thuê" thì trỏ vào
      // `/search` vốn noindex. Payload này do backend dựng nên sửa ở frontend không tới.
      categoryBlocks: [
        { key: 'DAT_NEN', ...blockMeta('DAT_NEN'), items: datNen },
        { key: 'NHA_RIENG', ...blockMeta('NHA_RIENG'), items: nhaRieng },
        { key: 'CHUNG_CU', ...blockMeta('CHUNG_CU'), items: chungCu },
        { key: 'DU_AN', ...blockMeta('DU_AN'), items: duAn },
      ],

      // Khách yêu cầu Cho thuê thành TAB NGANG gồm: nhà riêng, chung cư, mặt bằng–kho,
      // đất nền, BĐS khác — đúng thứ tự này.
      rentTabs: RENT_TAB_TYPES.map((type, i) => ({
        key: type,
        ...blockMeta(type, 'cho-thue'),
        items: rentItems[i],
      })),

      otherRealEstateTabs: [
        { key: 'MAT_BANG', ...blockMeta('MAT_BANG'), items: matBang },
        { key: 'BDS_KHAC', ...blockMeta('BDS_KHAC'), items: bdsKhac },
      ],
      // Khối "khu vực" — quận/huyện, phường/xã mới, phường/xã cũ. Mỗi khối là "tab
      // động": 9 khu vực có tin MỚI NHẤT (xem buildDynamicLocationBlock), kèm 1 tab
      // "Tất cả các khu vực" ở cuối. Khối 0 dữ liệu (0 ứng viên hoặc ứng viên toàn 0
      // tin) bị loại nguyên khối — vì vậy Nghệ An/Hà Nội tự nhiên có số khối khác nhau
      // mà không cần dòng code nào rẽ nhánh theo tỉnh.
      locationBlocks: LOCATION_BLOCK_DEFS
        .map((def, i) => ({ key: def.key, title: LOCATION_BLOCK_TITLES[layout][def.key], tabs: locationBlocksRaw[i] }))
        .filter((block) => block.tabs.length > 0)
        .map((block) => ({
          ...block,
          tabs: [
            ...block.tabs,
            { key: 'khu-vuc-khac', title: 'Tất cả các khu vực', href: '/khu-vuc', items: otherLocationItems },
          ],
        })),
      // "projects" trước đây hard-code 15 — site trắng (0 dự án thật) vẫn khoe "15+ dự
      // án". Đếm thật để không nói sai với site mới dựng.
      stats: { properties: totalProperties, users: totalUsers, projects: totalProjects, satisfaction: 99 },
      adsSlots: []
    };

    await this.cacheManager.set(cacheKey, result, 60000); // 60s TTL
    return result;
  }

  async getHotLocations() {
    const cacheKey = 'getHotLocations';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    // Gom theo `wardId` (quan hệ) chứ KHÔNG theo chuỗi `ward` (tên phi chuẩn hoá).
    // Bản cũ gom theo tên nên không có đoạn URL nào để trả về, và frontend phải suy
    // bằng generateSlug(tên): "Phường Yên Hòa" -> "phuong-yen-hoa" trong khi urlSegment
    // thật là "yen-hoa" — mọi card "Khu vực hot" trên trang chủ đều dẫn vào 404.
    const topWards = await this.prisma.property.groupBy({
      by: ['wardId'],
      where: {
        status: { in: [...this.publicStatuses] },
        deletedAt: null,
        wardId: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 4,
    });

    const wardIds = topWards
      .map((w) => w.wardId)
      .filter((id): id is string => typeof id === 'string');
    if (wardIds.length === 0) return [];

    const [wards, samples] = await Promise.all([
      this.prisma.location.findMany({
        where: { id: { in: wardIds } },
        select: { id: true, name: true, urlSegment: true, parent: { select: { name: true } } },
      }),
      this.prisma.property.findMany({
        where: {
          status: { in: [...this.publicStatuses] },
          deletedAt: null,
          wardId: { in: wardIds },
          images: { isEmpty: false },
        },
        select: { wardId: true, images: true, thumbnail: true },
        orderBy: { publishedAt: { sort: 'desc', nulls: 'last' } },
        distinct: ['wardId'],
      }),
    ]);

    const wardById = new Map(wards.map((w) => [w.id, w]));

    const result = topWards.flatMap((w) => {
      const ward = w.wardId ? wardById.get(w.wardId) : undefined;
      // Khu vực đã bị vô hiệu hoá/xoá thì bỏ hẳn card chứ không dựng link đoán được.
      if (!ward) return [];

      const sample = samples.find((s) => s.wardId === w.wardId);
      const image =
        sample?.thumbnail ||
        sample?.images?.[0] ||
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

      return [{
        name: ward.name,
        district: ward.parent?.name ?? null,
        slug: ward.urlSegment,
        href: listingPath({ locationSlug: ward.urlSegment }),
        count: w._count.id,
        image: this.toPublicMediaUrl(image),
      }];
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
    // Nhận CẢ HAI: `shortCode` (URL mới, 5 ký tự) và `id` UUID (URL cũ đang được
    // Google index). Frontend so tham số với shortCode để phát 301 về dạng mới.
    const property = await this.prisma.property.findFirst({
      where: UUID_PATTERN.test(id) ? { OR: [{ id }, { shortCode: id }] } : { shortCode: id },
      include: {
        user: { select: { id: true, slug: true, name: true, avatar: true, phone: true, isPhoneVisible: true, createdAt: true } },
        imageObjects: true,
        // Cần đoạn URL thật của tỉnh/quận/phường để dựng breadcrumb. Không suy được từ
        // tên: slugify("Phường Trường Vinh") = "phuong-truong-vinh" trong khi urlSegment
        // là "truong-vinh". Quan hệ có thể null (dữ liệu cũ) — frontend sẽ lược cấp đó.
        province: locationFields,
        districtLocation: locationFields,
        wardLocation: locationFields,
        // Tin thuộc Dự án có breadcrumb RIÊNG (Trang chủ / Dự án / {tên dự án} / tiêu
        // đề tin), không theo huyện/xã — xem listingBreadcrumb() ở frontend.
        project: { select: { id: true, name: true, slug: true, shortCode: true } },
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
      await this.invalidateHomepageCache();
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
    const normalizedData = await applyProjectLocation(this.prisma, normalizePropertyPayload(data));
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
    // Admin sửa tin của NGƯỜI KHÁC (đường /admin/posts → /post?editId=). Admin sửa tin
    // do chính mình đăng thì vẫn đi luồng người đăng bình thường.
    const isAdminEditor = user?.role === 'ADMIN' && property.userId !== userId;
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
    } else if (property.status === 'AWAITING_AUTHOR') {
      // Sửa từ trạng thái "chờ người đăng kiểm tra lại" LUÔN là hành động "gửi duyệt
      // lại" (khách: "Người đăng kiểm tra và nhấn Đăng tin lần nữa. Tin quay lại trạng
      // thái Chờ duyệt") — không phụ thuộc có đổi field "quan trọng" hay không, khác
      // với nhánh isPreModerationEnabled bên dưới (chỉ áp cho tin APPROVED/PENDING).
      status = 'PENDING';
    } else if (isAdminEditor) {
      // ADMIN tự sửa thì GIỮ NGUYÊN trạng thái — người duyệt và người sửa là một, hạ về
      // PENDING chỉ khiến admin phải tự duyệt lại tin của chính mình, và tin biến mất
      // khỏi site trong lúc đó. Nhánh này phải đứng TRƯỚC isPreModerationEnabled.
      // (Đường sửa của admin là nút "Sửa tin" ở /admin/posts → /post?editId=, thêm theo
      // phản hồi khách 19-8 mục 21-23.)
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
