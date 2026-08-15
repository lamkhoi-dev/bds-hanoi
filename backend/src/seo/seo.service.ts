import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { LocationService } from '../location/location.service';
import {
  PROPERTY_TYPE_SLUG,
  TRANSACTION_SLUG,
  listingDetailPath,
  listingPath,
  renderSitemapIndex,
  renderUrlSet,
  type SitemapUrl,
} from './seo-urls';
import { generateSlug } from './slug';

/**
 * Trạng thái được XEM công khai. Dùng cho roll-up trang danh mục: một phường có tin đã
 * bán vẫn là trang có nội dung thật, và `total` mà frontend đọc từ `/properties/seo`
 * cũng đếm `SOLD` — hai bên phải cùng tập thì luật "0 tin ⇒ noindex" mới nhất quán.
 */
const PUBLIC_STATUSES = ['APPROVED', 'SOLD'] as const;

/**
 * Trạng thái được ĐƯA VÀO SITEMAP. Hẹp hơn: tin đã bán không còn là đích đến hữu ích
 * cho người tìm mua nên loại khỏi sitemap (yêu cầu I.15 "Tin đã bán… loại khỏi
 * sitemap"), trang vẫn mở được nhưng phát `noindex` — xem `app/tin/[slug_id]/page.tsx`.
 * Tin `EXPIRED`/`DELETED` vốn đã 404 vì không nằm trong `publicStatuses` của
 * `PropertyService`.
 */
const INDEXABLE_STATUSES = ['APPROVED'] as const;
const URLS_PER_FILE = 10000;
const CACHE_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class SeoService {
  private readonly logger = new Logger(SeoService.name);

  constructor(
    private prisma: PrismaService,
    private locationService: LocationService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  private get siteUrl(): string {
    return (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
  }

  private abs(path: string): string {
    return `${this.siteUrl}${path}`;
  }

  /** Gọi khi tin được tạo/duyệt/ẩn/xoá để sitemap phản ánh trong lần refresh kế tiếp. */
  async invalidate(): Promise<void> {
    await Promise.all(
      ['seo:landing', 'seo:listings', 'seo:news', 'seo:projects', 'seo:index'].map((key) =>
        this.cache.del(key).catch(() => undefined),
      ),
    );
  }

  private async cached<T>(key: string, build: () => Promise<T>): Promise<T> {
    const hit = await this.cache.get<T>(key).catch(() => undefined);
    if (hit) return hit;
    const value = await build();
    await this.cache.set(key, value, CACHE_TTL_MS).catch(() => undefined);
    return value;
  }

  /**
   * URL trang danh mục — chỉ những tổ hợp THỰC SỰ có tin.
   *
   * Sitemap cũ sinh mọi tổ hợp khu vực × loại BĐS mà không kiểm có tin hay không:
   * ~4.000 URL trên dữ liệu Nghệ An, và sẽ thành ~5.900 với 736 khu vực Hà Nội.
   * Phần lớn trong số đó chính là nhóm "Đã phát hiện thấy – chưa được lập chỉ mục"
   * (151 URL) trong Search Console.
   *
   * Một truy vấn groupBy cho cả số lượng lẫn mốc thời gian; `lastmod` = MAX(publishedAt)
   * đã roll-up nên đúng sự thật và MIỄN NHIỄM với lượt xem trang.
   */
  async getLandingUrls(): Promise<SitemapUrl[]> {
    return this.cached('seo:landing', async () => {
      const groups = await this.prisma.property.groupBy({
        by: ['transactionType', 'propertyType', 'wardId', 'districtId', 'provinceId'],
        where: { status: { in: [...PUBLIC_STATUSES] }, deletedAt: null },
        _count: { id: true },
        _max: { publishedAt: true },
      });

      // key -> { count, lastmod }
      const acc = new Map<string, { count: number; lastmod: Date | null; url: string }>();
      const segmentOf = await this.locationSegmentMap();

      const add = (
        transaction: string,
        typeSlug: string | null,
        locationSlug: string | null,
        count: number,
        lastmod: Date | null,
      ) => {
        const txSlug = TRANSACTION_SLUG[transaction];
        if (!txSlug) return;
        const key = `${txSlug}|${typeSlug ?? ''}|${locationSlug ?? ''}`;
        const url = listingPath({ transaction: txSlug, propertyTypeSlug: typeSlug, locationSlug });
        const current = acc.get(key);
        if (current) {
          current.count += count;
          if (lastmod && (!current.lastmod || lastmod > current.lastmod)) current.lastmod = lastmod;
        } else {
          acc.set(key, { count, lastmod, url });
        }
      };

      for (const g of groups) {
        const count = g._count.id;
        if (count <= 0) continue;
        const lastmod = g._max.publishedAt ?? null;
        const typeSlug = PROPERTY_TYPE_SLUG[g.propertyType] ?? null;

        // Mỗi tin đóng góp cho URL của phường, quận và tỉnh của nó — cộng với biến thể
        // không kèm loại BĐS.
        const locations: (string | null)[] = [null];
        for (const id of [g.wardId, g.districtId, g.provinceId]) {
          const seg = id ? segmentOf.get(id) : undefined;
          if (seg) locations.push(seg);
        }

        for (const loc of locations) {
          add(g.transactionType, typeSlug, loc, count, lastmod);
          if (typeSlug) add(g.transactionType, null, loc, count, lastmod);
        }
      }

      const urls: SitemapUrl[] = [];
      for (const entry of acc.values()) {
        if (entry.count <= 0) continue;
        urls.push({
          loc: this.abs(entry.url),
          lastmod: entry.lastmod,
          changefreq: 'daily',
          priority: 0.8,
        });
      }

      this.logger.log(`Sitemap: ${urls.length} URL trang danh mục (từ ${groups.length} nhóm)`);
      return urls;
    });
  }

  private async locationSegmentMap(): Promise<Map<string, string>> {
    const tree = await this.locationService.getTree();
    const map = new Map<string, string>();
    if (!tree) return map;
    map.set(tree.id, tree.urlSegment);
    for (const district of tree.districts) {
      map.set(district.id, district.urlSegment);
      for (const ward of [...district.wards, ...district.oldWards]) {
        map.set(ward.id, ward.urlSegment);
      }
    }
    return map;
  }

  async getListingUrls(): Promise<SitemapUrl[]> {
    return this.cached('seo:listings', async () => {
      const properties = await this.prisma.property.findMany({
        where: { status: { in: [...INDEXABLE_STATUSES] }, deletedAt: null },
        select: {
          id: true,
          shortCode: true,
          title: true,
          tier: true,
          contentUpdatedAt: true,
          publishedAt: true,
          createdAt: true,
        },
        orderBy: [{ contentUpdatedAt: 'desc' }],
        take: 50000,
      });

      return properties.map((p) => ({
        loc: this.abs(listingDetailPath(generateSlug(p.title), p.shortCode, p.id)),
        // updatedAt bị đẩy bởi lượt xem và cron gia hạn VIP nên không dùng được.
        lastmod: p.contentUpdatedAt ?? p.publishedAt ?? p.createdAt,
        changefreq: 'daily',
        priority: p.tier === 'VIP' ? 0.9 : 0.7,
      }));
    });
  }

  async getNewsUrls(): Promise<SitemapUrl[]> {
    return this.cached('seo:news', async () => {
      const items = await this.prisma.news.findMany({
        select: { slug: true, updatedAt: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 50000,
      });
      return items.map((n) => ({
        loc: this.abs(`/news/${n.slug}`),
        lastmod: n.updatedAt ?? n.createdAt,
        changefreq: 'weekly',
        priority: 0.6,
      }));
    });
  }

  /**
   * URL trang Dự án — chỉ dự án VISIBLE và có ít nhất 1 tin đang hiển thị công khai.
   *
   * "Có nội dung" dùng đúng PUBLIC_STATUSES (APPROVED + SOLD) — cùng định nghĩa với
   * `total` mà trang `/du-an/{slug}` đọc để quyết định noindex, để quyết định index ở
   * trang và quyết định có mặt trong sitemap không bao giờ lệch nhau (rule 9 chung của
   * mọi trang danh mục rỗng, xem indexability.ts phía frontend).
   */
  async getProjectUrls(): Promise<SitemapUrl[]> {
    return this.cached('seo:projects', async () => {
      const [projects, counts] = await Promise.all([
        this.prisma.project.findMany({
          where: { status: 'VISIBLE' },
          select: { id: true, slug: true, shortCode: true, contentUpdatedAt: true, updatedAt: true, createdAt: true },
        }),
        this.prisma.property.groupBy({
          by: ['projectId'],
          where: { projectId: { not: null }, status: { in: [...PUBLIC_STATUSES] }, deletedAt: null },
          _count: { id: true },
        }),
      ]);

      const countByProject = new Map(counts.map((c) => [c.projectId as string, c._count.id]));

      return projects
        .filter((p) => (countByProject.get(p.id) ?? 0) > 0)
        .map((p) => ({
          loc: this.abs(`/du-an/${p.slug}-${p.shortCode}`),
          lastmod: p.contentUpdatedAt ?? p.updatedAt ?? p.createdAt,
          changefreq: 'weekly',
          priority: 0.6,
        }));
    });
  }

  getStaticUrls(): SitemapUrl[] {
    const support = [
      'pricing',
      'terms',
      'privacy',
      'rules',
      'posting-policy',
      'payment-policy',
      'refund-policy',
      'complaints',
      'data-deletion',
      'how-to-post',
    ];
    return [
      { loc: this.abs('/'), changefreq: 'always', priority: 1 },
      { loc: this.abs(listingPath({})), changefreq: 'always', priority: 0.9 },
      { loc: this.abs(listingPath({ transaction: 'cho-thue' })), changefreq: 'daily', priority: 0.8 },
      { loc: this.abs('/news'), changefreq: 'daily', priority: 0.6 },
      { loc: this.abs('/du-an'), changefreq: 'daily', priority: 0.6 },
      { loc: this.abs('/khu-vuc'), changefreq: 'weekly', priority: 0.5 },
      ...support.map((s) => ({
        loc: this.abs(`/support/${s}`),
        changefreq: 'monthly',
        priority: 0.3,
      })),
    ];
  }

  private chunk<T>(items: T[], size = URLS_PER_FILE): T[][] {
    if (items.length === 0) return [[]];
    const out: T[][] = [];
    for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
    return out;
  }

  async renderIndex(): Promise<string> {
    const [landing, listings, news, projects] = await Promise.all([
      this.getLandingUrls(),
      this.getListingUrls(),
      this.getNewsUrls(),
      this.getProjectUrls(),
    ]);

    const entries: { loc: string; lastmod?: Date | string | null }[] = [
      { loc: this.abs('/sitemaps/static.xml') },
    ];
    this.chunk(landing).forEach((_, i) =>
      entries.push({ loc: this.abs(`/sitemaps/landing-${i}.xml`) }),
    );
    this.chunk(listings).forEach((_, i) =>
      entries.push({ loc: this.abs(`/sitemaps/listings-${i}.xml`) }),
    );
    if (news.length > 0) entries.push({ loc: this.abs('/sitemaps/news.xml') });
    if (projects.length > 0) entries.push({ loc: this.abs('/sitemaps/projects.xml') });

    return renderSitemapIndex(entries);
  }

  async renderStatic(): Promise<string> {
    return renderUrlSet(this.getStaticUrls());
  }

  async renderLanding(index: number): Promise<string> {
    return renderUrlSet(this.chunk(await this.getLandingUrls())[index] ?? []);
  }

  async renderListings(index: number): Promise<string> {
    return renderUrlSet(this.chunk(await this.getListingUrls())[index] ?? []);
  }

  async renderNews(): Promise<string> {
    return renderUrlSet(await this.getNewsUrls());
  }

  async renderProjects(): Promise<string> {
    return renderUrlSet(await this.getProjectUrls());
  }

  /** Số tin theo từng tổ hợp — để đối chiếu trước/sau khi đổi sitemap. */
  async getFacetSummary() {
    const landing = await this.getLandingUrls();
    return {
      landingUrls: landing.length,
      listingUrls: (await this.getListingUrls()).length,
      newsUrls: (await this.getNewsUrls()).length,
      projectUrls: (await this.getProjectUrls()).length,
      staticUrls: this.getStaticUrls().length,
      mode: process.env.SEO_MODE || 'report',
    };
  }
}
