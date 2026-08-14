import { PROPERTY_TYPES, TRANSACTIONS, propertyTypeBySlug, transactionBySlug } from './taxonomy';

/**
 * Phân tích đường dẫn trang danh mục. Thuần và ĐỒNG BỘ — không I/O.
 *
 * Tính chất này chịu lực: `generateMetadata`, thân trang và bộ sinh sitemap gọi cùng
 * một hàm mà không tốn round-trip nào, và unit-test được mà không cần dựng server.
 *
 * Trước đây `parseSlug` chỉ kiểm đoạn 0 với một mảng danh mục cứng, còn TẤT CẢ phần
 * sau bị gom thành "khu vực" ở độ sâu tuỳ ý — nên `/a/b/c/d/e` là một trang 200 hợp lệ,
 * và Search Console đã thu thập cả `/nha-rieng/$`, `/chung-cu/&`, `/du-an/&`.
 */

/** Đoạn đầu trùng route thật hoặc đích chuyển hướng — catch-all không được nuốt. */
export const RESERVED_FIRST_SEGMENTS: ReadonlySet<string> = new Set([
  'sitemap',
  'sitemap.xml',
  'sitemaps',
  'robots.txt',
  'api',
  '_next',
  'favicon.ico',
  'tin',
  'news',
  'tin-tuc',
  'search',
  'user',
  'tai-khoan',
  'admin',
  'post',
  'map',
  'so-sanh',
  'khu-vuc',
  'support',
  'login',
  'register',
  'forgot-password',
  'change-password',
  'auth-success',
  'requirements',
  'toan-bo-tin',
]);

const SEGMENT_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SEGMENTS = 3;
const MAX_SEGMENT_LENGTH = 64;
const MAX_PATH_LENGTH = 160;

export interface ListingRoute {
  transaction: 'ban' | 'cho-thue';
  /** null = mọi loại BĐS. */
  propertyTypeSlug: string | null;
  /** null = toàn tỉnh. */
  locationSlug: string | null;
  /** URL còn ở dạng cũ `/{loại}/{khu-vực}`, chưa có đoạn giao dịch dẫn đầu. */
  isLegacyShape: boolean;
  /** Dạng đích `/ban/dat-nen/cau-giay`. */
  canonicalPath: string;
  /** Dạng đang phục vụ, để không tự đổi URL trước khi P5 bật redirect. */
  currentPath: string;
}

export type RouteParse =
  | { kind: 'listing'; route: ListingRoute }
  | { kind: 'redirect'; to: string; reason: string }
  | { kind: 'reject'; reason: string };

function buildPath(parts: (string | null)[]): string {
  return '/' + parts.filter(Boolean).join('/');
}

function listing(
  transaction: 'ban' | 'cho-thue',
  propertyTypeSlug: string | null,
  locationSlug: string | null,
  isLegacyShape: boolean,
  currentPath: string,
): RouteParse {
  return {
    kind: 'listing',
    route: {
      transaction,
      propertyTypeSlug,
      locationSlug,
      isLegacyShape,
      canonicalPath: buildPath([transaction, propertyTypeSlug, locationSlug]),
      currentPath,
    },
  };
}

export function parseListingPath(segments: string[]): RouteParse {
  if (!Array.isArray(segments) || segments.length === 0) {
    return { kind: 'reject', reason: 'empty' };
  }
  if (segments.length > MAX_SEGMENTS) {
    // Dạng sâu nhất hợp lệ là /{giao-dịch}/{loại}/{khu-vực}. Không có gì chính đáng
    // sâu hơn — chặn ở đây là hết cả không gian URL vô hạn kiểu /a/b/c/d/e.
    return { kind: 'reject', reason: 'too-deep' };
  }

  const raw = segments.map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });

  const joined = raw.join('/');
  if (joined.length > MAX_PATH_LENGTH) return { kind: 'reject', reason: 'path-too-long' };

  // Chữ hoa -> chuyển hướng về thường thay vì phục vụ hai URL cho cùng nội dung.
  if (raw.some((s) => s !== s.toLowerCase())) {
    return { kind: 'redirect', to: '/' + raw.map((s) => s.toLowerCase()).join('/'), reason: 'uppercase' };
  }

  for (const segment of raw) {
    if (segment.length > MAX_SEGMENT_LENGTH) return { kind: 'reject', reason: 'segment-too-long' };
    // Một luật này quét sạch `$`, `&`, `%24`, `..`, gạch nối kép, đoạn rỗng.
    if (!SEGMENT_PATTERN.test(segment)) return { kind: 'reject', reason: 'bad-charset' };
  }

  if (RESERVED_FIRST_SEGMENTS.has(raw[0])) {
    // Thay cho cái hack notFound() cho riêng 'sitemap' trước đây, và bảo vệ khỏi việc
    // catch-all che mất một route thật nếu file route đó bị xoá.
    return { kind: 'reject', reason: 'reserved' };
  }

  const currentPath = '/' + joined;
  const transaction = transactionBySlug(raw[0]);

  // ---- Dạng MỚI: đoạn đầu là loại giao dịch ----
  if (transaction) {
    const tx = transaction.slug as 'ban' | 'cho-thue';
    if (raw.length === 1) return listing(tx, null, null, false, currentPath);

    const second = propertyTypeBySlug(raw[1]);
    if (raw.length === 2) {
      if (second) {
        if (second.slug !== raw[1]) {
          // Alias (vd nha-mat-pho) -> gộp về slug chính, bớt một cặp URL cạnh tranh canonical.
          return { kind: 'redirect', to: buildPath([tx, second.slug]), reason: 'type-alias' };
        }
        return listing(tx, second.slug, null, false, currentPath);
      }
      return listing(tx, null, raw[1], false, currentPath);
    }

    // 3 đoạn: bắt buộc /{giao-dịch}/{loại}/{khu-vực}
    if (!second) return { kind: 'reject', reason: 'unknown-property-type' };
    if (second.slug !== raw[1]) {
      return { kind: 'redirect', to: buildPath([tx, second.slug, raw[2]]), reason: 'type-alias' };
    }
    return listing(tx, second.slug, raw[2], false, currentPath);
  }

  // ---- Dạng CŨ: chưa có đoạn giao dịch ----
  // Vẫn phục vụ bình thường cho tới khi P5 bật 301, nếu không mọi URL đang được
  // Google index sẽ 404 ngay khi deploy.
  if (raw.length > 2) return { kind: 'reject', reason: 'legacy-too-deep' };

  // `cho-thue` từng bị coi là một "danh mục" — đây là gốc của `isRent = false` gán cứng
  // sinh title "Bán cho thuê ..." trên ~800 URL sitemap. Giờ nó là đoạn giao dịch.
  const first = propertyTypeBySlug(raw[0]);

  if (first) {
    if (first.slug !== raw[0]) {
      const rest = raw.length === 2 ? raw[1] : null;
      return { kind: 'redirect', to: buildPath([first.slug, rest]), reason: 'type-alias' };
    }
    return listing('ban', first.slug, raw.length === 2 ? raw[1] : null, true, currentPath);
  }

  if (raw[0] === 'tat-ca') {
    return listing('ban', null, raw.length === 2 ? raw[1] : null, true, currentPath);
  }

  // Đoạn đầu là khu vực: /{khu-vực}. Dạng /{khu-vực}/{gì đó} không có nghĩa.
  if (raw.length === 2) return { kind: 'reject', reason: 'location-with-trailing-segment' };
  return listing('ban', null, raw[0], true, currentPath);
}

/** Dùng cho sitemap và các bài test. */
export const ALL_TRANSACTION_SLUGS = TRANSACTIONS.map((t) => t.slug);
export const ALL_PROPERTY_TYPE_SLUGS = PROPERTY_TYPES.map((t) => t.slug);
