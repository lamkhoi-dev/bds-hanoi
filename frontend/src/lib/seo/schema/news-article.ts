import { siteConfig } from '@/lib/site-config';
import { toMediaUrl } from '@/lib/media';
import { ORGANIZATION_ID } from './organization';
import { WEBSITE_ID } from './website';
import type { JsonLdNode } from './types';

export interface NewsArticleSchemaOptions {
  /** URL canonical tuyệt đối của trang bài viết. */
  url: string;
  description: string;
}

/**
 * NewsArticle — khác `buildArticle` (Article chung, dùng `createdAt`/`updatedAt`): tin tức
 * có `publishedAt`/`contentUpdatedAt` RIÊNG (hẹn giờ đăng, "sửa lỗi nhỏ" không tính là cập
 * nhật) nên phải đọc đúng 2 cột đó — dùng `createdAt` sẽ ra ngày TẠO NHÁP thay vì ngày đăng
 * thật, y hệt lỗi `RealEstateListing.datePosted` đã sửa cho tin đăng (xem `listing.ts`).
 *
 * Ảnh 1200×675 (khuyến nghị `checkFeaturedImageSize`) đúng khổ Google yêu cầu tối thiểu
 * 1200px chiều rộng để đủ điều kiện vào Top Stories/Discover.
 */
export function buildNewsArticle(news: any, opts: NewsArticleSchemaOptions): JsonLdNode {
  const thumb = typeof news?.thumbnail === 'string' ? toMediaUrl(news.thumbnail) : '';
  const image = thumb ? siteConfig.absolute(thumb) : '';
  const headline = String(news?.title ?? '').slice(0, 110);

  const authorName = typeof news?.authorName === 'string' ? news.authorName.trim() : '';
  const author = authorName ? { '@type': 'Person', name: authorName } : { '@id': ORGANIZATION_ID };

  return {
    '@type': 'NewsArticle',
    '@id': `${opts.url}#article`,
    headline,
    description: opts.description,
    url: opts.url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': opts.url },
    inLanguage: 'vi-VN',
    ...(image ? { image: [image] } : {}),
    ...(news?.publishedAt ? { datePublished: news.publishedAt } : {}),
    ...(news?.contentUpdatedAt || news?.publishedAt
      ? { dateModified: news.contentUpdatedAt || news.publishedAt }
      : {}),
    author,
    publisher: { '@id': ORGANIZATION_ID },
    isPartOf: { '@id': WEBSITE_ID },
    ...(news?.category?.name ? { articleSection: news.category.name } : {}),
  };
}
