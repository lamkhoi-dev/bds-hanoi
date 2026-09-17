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
    // Khách chốt 16/9: 2 bài (không phải 4) — gọn hơn, đúng khuôn với khối "BĐS liên quan".
    const take = 2;
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

    // Chưa đủ bài cùng chuyên mục — bù bằng bài mới nhất bất kỳ, không để khối trống trơn
    // hoặc chỉ có 1 bài trông như lỗi.
    //
    // BUG ĐÃ SỬA (khách báo 16/9 "không để chính bài đang đọc" — bài hiện tại lại xuất
    // hiện trong danh sách liên quan của CHÍNH NÓ): `{ ...baseWhere, id: {notIn: [...]} }`
    // spread rồi ghi đè cùng khoá `id` — bản cũ MẤT LUÔN điều kiện `not: excludeId` của
    // `baseWhere.id`, JS không tự gộp hai điều kiện trên cùng field. Gộp thẳng vào MỘT
    // object `id` duy nhất để cả hai điều kiện cùng có hiệu lực.
    const filler = await this.prisma.news.findMany({
      where: {
        ...baseWhere,
        id: { notIn: [excludeId, ...sameCategory.map((a) => a.id)] },
      },
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

    // Khách chốt 16/9: chỉ bù bằng tin VIP, bỏ UP khỏi nguồn tự động — tin UP đổi vòng
    // quay liên tục (khối "Tin Được Đẩy Lên" ngày 15/9) nên xen vào đây không ổn định
    // bằng VIP (thời hạn dài, ít đổi hơn).
    const excludeIds = manual.map((p) => p.id);
    const vips = await this.prisma.property.findMany({
      where: {
        ...baseWhere,
        id: { notIn: excludeIds },
        tier: 'VIP',
        OR: [{ tierExpiresAt: null }, { tierExpiresAt: { gt: new Date() } }],
      },
      orderBy: [{ pushedAt: { sort: 'desc', nulls: 'last' } }, { publishedAt: { sort: 'desc', nulls: 'last' } }],
      take: take - manual.length,
      include: PROPERTY_CARD_INCLUDE,
    });

    let combined = [...manual, ...vips];
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
