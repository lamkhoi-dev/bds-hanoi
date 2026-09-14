import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { publicNewsWhere } from './news-visibility';
import { parsePropertyRefList } from './news-related';

/** Cùng hình dạng `PropertyCard` (frontend) đang đọc — id/slug/shortCode/tên/avatar người đăng, ảnh. */
const PROPERTY_CARD_INCLUDE = {
  user: { select: { id: true, slug: true, shortCode: true, name: true, avatar: true } },
  imageObjects: true,
} as const;

const ARTICLE_CARD_SELECT = {
  id: true,
  title: true,
  sapo: true,
  thumbnail: true,
  thumbnailAlt: true,
  slug: true,
  publishedAt: true,
  category: { select: { id: true, name: true, slug: true } },
} as const;

/**
 * "BĐS liên quan" dưới mỗi bài tin, và tra cứu tin đăng khi admin dán link/mã vào ô liên
 * quan. Tách khỏi `NewsService` vì đây là hai việc khác hẳn (đọc `Property`, không đọc
 * `News` là chính) — và để không phải import cả `PropertyModule` chỉ để lấy vài cột hiển
 * thị (dễ vòng phụ thuộc: Property -> News nếu sau này News cần biết về Property nhiều hơn).
 */
@Injectable()
export class NewsRelatedService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tra một danh sách link/mã (admin dán vào ô "BĐS liên quan") thành tin đăng thật.
   * Giữ nguyên THỨ TỰ đầu tiên xuất hiện — admin sắp xếp có ý nghĩa, tin hiện trước/sau.
   */
  async resolveProperties(rawRefs: string[]) {
    const refs = Array.from(new Set((rawRefs ?? []).flatMap((r) => parsePropertyRefList(r))));
    if (refs.length === 0) return { found: [], notFound: [] };

    const rows = await this.prisma.property.findMany({
      where: { OR: [{ id: { in: refs } }, { shortCode: { in: refs } }] },
      select: { id: true, shortCode: true, slug: true, title: true, status: true, deletedAt: true },
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const byCode = new Map(rows.filter((r) => r.shortCode).map((r) => [r.shortCode as string, r]));

    const found: Array<{ ref: string; id: string; shortCode: string | null; slug: string | null; title: string; status: string; isRemoved: boolean }> = [];
    const notFound: string[] = [];
    for (const ref of refs) {
      const row = byId.get(ref) ?? byCode.get(ref);
      if (!row) {
        notFound.push(ref);
        continue;
      }
      found.push({
        ref,
        id: row.id,
        shortCode: row.shortCode,
        slug: row.slug,
        title: row.title,
        status: row.status,
        // Vẫn trả về để admin THẤY và tự quyết định bỏ đi — tin đã xoá mềm không nên bị
        // âm thầm biến mất khỏi danh sách đang sửa mà không giải thích vì sao.
        isRemoved: Boolean(row.deletedAt),
      });
    }
    return { found, notFound };
  }

  /** Khối "Có thể bạn quan tâm" dưới một bài — bài cùng chuyên mục + BĐS liên quan. */
  async findRelated(newsId: string) {
    const news = await this.prisma.news.findUnique({
      where: { id: newsId },
      select: { categoryId: true, relatedPropertyIds: true },
    });
    if (!news) return { articles: [], properties: [] };

    const [articles, properties] = await Promise.all([
      this.findRelatedArticles(newsId, news.categoryId),
      this.findRelatedProperties(news.relatedPropertyIds),
    ]);
    return { articles, properties };
  }

  private async findRelatedArticles(excludeId: string, categoryId: string | null) {
    const take = 4;
    const baseWhere = { id: { not: excludeId }, ...publicNewsWhere() };

    const sameCategory = categoryId
      ? await this.prisma.news.findMany({
          where: { ...baseWhere, categoryId },
          orderBy: { publishedAt: 'desc' },
          take,
          select: ARTICLE_CARD_SELECT,
        })
      : [];
    if (sameCategory.length >= take) return sameCategory;

    // Chưa đủ 4 bài cùng chuyên mục — bù bằng bài mới nhất bất kỳ, không để khối trống trơn
    // hoặc chỉ có 1-2 bài trông như lỗi.
    const filler = await this.prisma.news.findMany({
      where: { ...baseWhere, id: { notIn: sameCategory.map((a) => a.id) } },
      orderBy: { publishedAt: 'desc' },
      take: take - sameCategory.length,
      select: ARTICLE_CARD_SELECT,
    });
    return [...sameCategory, ...filler];
  }

  private async findRelatedProperties(relatedIds: string[]) {
    const take = 6;
    const baseWhere = { status: { in: ['APPROVED', 'SOLD'] as ('APPROVED' | 'SOLD')[] }, deletedAt: null };

    const manualRows = relatedIds.length
      ? await this.prisma.property.findMany({ where: { id: { in: relatedIds }, ...baseWhere }, include: PROPERTY_CARD_INCLUDE })
      : [];
    // `findMany` với `id: {in:[]}` KHÔNG giữ thứ tự — tự sắp lại theo đúng thứ tự admin chọn.
    const manual = relatedIds.map((id) => manualRows.find((p) => p.id === id)).filter((p): p is (typeof manualRows)[number] => Boolean(p));
    if (manual.length >= take) return manual.slice(0, take);

    const excludeIds = manual.map((p) => p.id);
    const vipUp = await this.prisma.property.findMany({
      where: {
        ...baseWhere,
        id: { notIn: excludeIds },
        tier: { in: ['VIP', 'UP'] },
        OR: [{ tierExpiresAt: null }, { tierExpiresAt: { gt: new Date() } }],
      },
      orderBy: [{ pushedAt: { sort: 'desc', nulls: 'last' } }, { publishedAt: { sort: 'desc', nulls: 'last' } }],
      take: take - manual.length,
      include: PROPERTY_CARD_INCLUDE,
    });

    let combined = [...manual, ...vipUp];
    if (combined.length < take) {
      const already = combined.map((p) => p.id);
      const newest = await this.prisma.property.findMany({
        where: { ...baseWhere, id: { notIn: already } },
        orderBy: { publishedAt: 'desc' },
        take: take - combined.length,
        include: PROPERTY_CARD_INCLUDE,
      });
      combined = [...combined, ...newest];
    }
    return combined;
  }
}
