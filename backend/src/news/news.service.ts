import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SeoService } from '../seo/seo.service';
import { slugify } from '../property/property-utils';
import { sanitizeNewsHtml, hasEmbeddedImages } from './news-html';
import { publicNewsWhere } from './news-visibility';

/** Trường KHÁCH VÃNG LAI được đọc ở danh sách — cố tình bỏ `content` (có thể rất dài, và
 * danh sách chỉ cần sapo để hiện tóm tắt, không cần render toàn bài). */
const PUBLIC_LIST_SELECT = {
  id: true,
  title: true,
  sapo: true,
  thumbnail: true,
  thumbnailAlt: true,
  slug: true,
  status: true,
  publishedAt: true,
  contentUpdatedAt: true,
  authorName: true,
  categoryId: true,
  category: { select: { id: true, name: true, slug: true } },
  createdAt: true,
  updatedAt: true,
} as const;

const MAX_PUBLIC_LIMIT = 50;

/** Trường nhận trực tiếp từ client, KHÔNG qua biến đổi gì thêm. */
const PASSTHROUGH_FIELDS = [
  'title', 'sapo', 'thumbnail', 'thumbnailAlt', 'thumbnailCaption', 'thumbnailCredit',
  'thumbnailWidth', 'thumbnailHeight', 'authorName', 'sources',
  'seoTitle', 'metaDescription', 'canonicalUrl', 'relatedPropertyIds',
] as const;

@Injectable()
export class NewsService {
  constructor(
    private prisma: PrismaService,
    private seoService: SeoService,
  ) {}

  /**
   * Sinh slug không dấu và duy nhất.
   *
   * Trước đây chỗ này dùng `title.toLowerCase().replace(/[^a-z0-9]+/g, '-')` — không
   * chuẩn hoá NFD nên mọi ký tự có dấu đều rơi ra ngoài [a-z0-9] và bị xoá:
   *   "Thông qua hồ sơ điều chỉnh" -> "th-ng-qua-h-s-i-u-ch-nh"
   * Dùng chung `slugify` với Property để hai bên không lệch nhau.
   */
  private async generateUniqueSlug(source: string, excludeId?: string): Promise<string> {
    const base = slugify(source) || 'tin-tuc';
    const taken = await this.prisma.news.findUnique({ where: { slug: base } });
    if (!taken || taken.id === excludeId) return base;
    // Gắn hậu tố ngẫu nhiên thay vì vòng lặp đếm, tránh N+1 query khi trùng nhiều.
    return `${base}-${Math.random().toString(36).substring(2, 8)}`;
  }

  private sanitize(content: string): string {
    const internalHosts = (process.env.FRONTEND_URL || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const mediaBaseUrls = [process.env.PUBLIC_UPLOAD_BASE_URL].filter(Boolean) as string[];
    return sanitizeNewsHtml(content, { internalHosts, mediaBaseUrls });
  }

  /** Rỗng chuỗi ('') từ form nghĩa là "bỏ trống trường này" — chuyển thành null cho Prisma. */
  private emptyToNull<T>(value: T | '' | undefined): T | null | undefined {
    if (value === '') return null;
    return value as T | undefined;
  }

  async create(data: any) {
    if (data.content && hasEmbeddedImages(data.content)) {
      throw new BadRequestException(
        'Nội dung chứa ảnh dán trực tiếp (không tải lên được máy chủ) — hãy dùng nút "Chèn ảnh" trong trình soạn thảo rồi thử lại.',
      );
    }

    const now = new Date();
    const slug = await this.generateUniqueSlug(data.slug || data.title);

    // Trạng thái bỏ trống = PUBLISHED ngay — đúng hành vi TRƯỚC KHI có cột `status`, để
    // form cũ (không gửi field này) không âm thầm tạo bài Nháp không ai thấy.
    const status = data.status ?? 'PUBLISHED';
    let publishedAt: Date | undefined;
    if (data.publishedAt) publishedAt = new Date(data.publishedAt);
    else if (status === 'PUBLISHED') publishedAt = now;

    const payload: Record<string, any> = { slug, status };
    for (const f of PASSTHROUGH_FIELDS) if (f in data) payload[f] = data[f];
    if (data.content !== undefined) payload.content = this.sanitize(data.content);
    if (publishedAt !== undefined) payload.publishedAt = publishedAt;
    if ('categoryId' in data) payload.categoryId = this.emptyToNull(data.categoryId);
    // Bài mới luôn có mốc "cập nhật nội dung" — không có gì để so sánh với "trước đó".
    payload.contentUpdatedAt = now;

    const created = await this.prisma.news.create({ data: payload as any });
    await this.seoService.invalidate().catch(() => undefined);
    return created;
  }

  /** Danh sách CÔNG KHAI — chỉ bài đã đăng, tới đúng giờ hẹn. Không có `content`. */
  async findPublicList(page: number = 1, limit: number = 20, categorySlug?: string) {
    const take = Math.min(Math.max(1, limit), MAX_PUBLIC_LIMIT);
    const skip = (Math.max(1, page) - 1) * take;
    const where: any = { ...publicNewsWhere() };
    if (categorySlug) where.category = { slug: categorySlug };

    const [data, total] = await Promise.all([
      this.prisma.news.findMany({
        where,
        skip,
        take,
        orderBy: { publishedAt: 'desc' },
        select: PUBLIC_LIST_SELECT,
      }),
      this.prisma.news.count({ where }),
    ]);
    return { data, total, page, limit: take };
  }

  /**
   * Bài CÔNG KHAI theo id/slug/slug cũ — trả `null` khi không public, KHÔNG phân biệt với
   * "không tồn tại". Nơi gọi (controller công khai) đều quy về 404 như nhau; phân biệt hai
   * ca này chỉ có ích cho quản trị, dùng `findAdminOne`.
   */
  async findPublicOne(idOrSlug: string) {
    const include = { category: { select: { id: true, name: true, slug: true } } } as const;
    const where = { OR: [{ id: idOrSlug }, { slug: idOrSlug }], ...publicNewsWhere() };
    const found = await this.prisma.news.findFirst({ where, include });
    if (found) return found;

    return this.prisma.news.findFirst({
      where: { previousSlugs: { has: idOrSlug }, ...publicNewsWhere() },
      include,
    });
  }

  /** Quản trị — không lọc trạng thái/giờ đăng, để admin luôn xem/sửa được bài của mình. */
  async findAdminList(page: number = 1, limit: number = 20, status?: string, q?: string) {
    const skip = (Math.max(1, page) - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (q) where.title = { contains: q, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.news.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { category: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.news.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findAdminOne(idOrSlug: string) {
    const found = await this.prisma.news.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
    if (found) return found;
    return this.prisma.news.findFirst({ where: { previousSlugs: { has: idOrSlug } } });
  }

  async update(id: string, data: any) {
    const current = await this.prisma.news.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Không tìm thấy bài viết');

    if (data.content && hasEmbeddedImages(data.content)) {
      throw new BadRequestException(
        'Nội dung chứa ảnh dán trực tiếp (không tải lên được máy chủ) — hãy dùng nút "Chèn ảnh" trong trình soạn thảo rồi thử lại.',
      );
    }

    const patch: Record<string, any> = {};
    for (const f of PASSTHROUGH_FIELDS) if (f in data) patch[f] = data[f];
    if ('categoryId' in data) patch.categoryId = this.emptyToNull(data.categoryId);

    const sanitizedContent = data.content !== undefined ? this.sanitize(data.content) : undefined;
    if (sanitizedContent !== undefined) patch.content = sanitizedContent;

    // Đổi tiêu đề (hoặc truyền slug mới) thì sinh lại slug và giữ slug cũ để 301.
    const source = data.slug || data.title;
    if (source && slugify(source) !== current.slug) {
      const next = await this.generateUniqueSlug(source, id);
      if (next !== current.slug) {
        patch.slug = next;
        patch.previousSlugs = Array.from(new Set([...(current.previousSlugs ?? []), current.slug]));
      }
    }

    // Trạng thái & ngày đăng — KHÔNG BAO GIỜ ghi đè một `publishedAt` đã có sẵn chỉ vì admin
    // lưu một thay đổi không liên quan (sửa lỗi chính tả không được đẩy ngày đăng công khai
    // lên "bây giờ"). Chỉ đặt ngày mới khi: admin gửi tường minh, HOẶC bài chuyển sang
    // PUBLISHED lần đầu (trước đó chưa từng có publishedAt).
    const nextStatus = data.status ?? current.status;
    patch.status = nextStatus;
    if (data.publishedAt) {
      patch.publishedAt = new Date(data.publishedAt);
    } else if (nextStatus === 'PUBLISHED' && !current.publishedAt) {
      patch.publishedAt = new Date();
    }

    // "Ngày cập nhật" công khai chỉ nhích khi: (a) có sửa nội dung/tiêu đề/sapo/ảnh đại
    // diện thật sự, (b) bài ĐANG công khai (không đẩy contentUpdatedAt của một bài Nháp lên
    // — không ai đọc được nên "cập nhật lúc nào" vô nghĩa), (c) admin không tích "sửa nhỏ".
    const touchesVisibleContent = ['title', 'sapo', 'content', 'thumbnail'].some((f) => f in data);
    const willBePublic = nextStatus === 'PUBLISHED';
    if (touchesVisibleContent && willBePublic && !data.minorEdit) {
      patch.contentUpdatedAt = new Date();
    }

    const updated = await this.prisma.news.update({ where: { id }, data: patch as any });
    await this.seoService.invalidate().catch(() => undefined);
    return updated;
  }

  async remove(id: string) {
    const current = await this.prisma.news.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Không tìm thấy bài viết');
    const removed = await this.prisma.news.delete({ where: { id } });
    await this.seoService.invalidate().catch(() => undefined);
    return removed;
  }
}
