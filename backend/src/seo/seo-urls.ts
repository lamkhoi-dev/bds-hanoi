/**
 * Dựng URL và tuần tự hoá XML cho sitemap.
 *
 * Phải khớp `frontend/src/lib/seo/canonical.ts#listingPath` — cùng đọc một cờ
 * SEO_MODE, nếu không sitemap sẽ liệt kê những URL mà site đang 301 đi chỗ khác.
 */

export type Transaction = 'ban' | 'cho-thue';

export function isEnforceMode(): boolean {
  return (process.env.SEO_MODE || process.env.NEXT_PUBLIC_SEO_MODE) === 'enforce';
}

export function listingPath(opts: {
  transaction?: Transaction;
  propertyTypeSlug?: string | null;
  locationSlug?: string | null;
}): string {
  const transaction = opts.transaction ?? 'ban';
  const parts: string[] = [];

  if (transaction === 'cho-thue' || isEnforceMode()) parts.push(transaction);
  if (opts.propertyTypeSlug) parts.push(opts.propertyTypeSlug);
  if (opts.locationSlug) parts.push(opts.locationSlug);
  if (parts.length === 0) parts.push('ban');

  return '/' + parts.join('/');
}

/** Enum loại BĐS -> slug URL. Giữ khớp với taxonomy phía frontend. */
export const PROPERTY_TYPE_SLUG: Record<string, string> = {
  DAT_NEN: 'dat-nen',
  NHA_RIENG: 'nha-rieng',
  CHUNG_CU: 'chung-cu',
  DU_AN: 'du-an',
  MAT_BANG: 'mat-bang-kho-xuong',
  BIET_THU: 'biet-thu',
  BDS_KHAC: 'bds-khac',
};

export const TRANSACTION_SLUG: Record<string, Transaction> = {
  BAN: 'ban',
  CHO_THUE: 'cho-thue',
};

export interface SitemapUrl {
  loc: string;
  lastmod?: Date | string | null;
  changefreq?: string;
  priority?: number;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isoDate(value?: Date | string | null): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function renderUrlSet(urls: SitemapUrl[]): string {
  const body = urls
    .map((u) => {
      const lastmod = isoDate(u.lastmod);
      return [
        '  <url>',
        `    <loc>${escapeXml(u.loc)}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
        u.changefreq ? `    <changefreq>${u.changefreq}</changefreq>` : null,
        u.priority !== undefined ? `    <priority>${u.priority.toFixed(1)}</priority>` : null,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function renderSitemapIndex(items: { loc: string; lastmod?: Date | string | null }[]): string {
  const body = items
    .map((item) => {
      const lastmod = isoDate(item.lastmod);
      return [
        '  <sitemap>',
        `    <loc>${escapeXml(item.loc)}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
        '  </sitemap>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}
