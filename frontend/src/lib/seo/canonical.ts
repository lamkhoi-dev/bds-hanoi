/**
 * Chuẩn hoá truy vấn và phân trang cho trang danh mục. Thuần và đồng bộ.
 *
 * Các lỗi đang có:
 *   - `?page=1` tạo một URL riêng trùng hệt trang gốc, và canonical giữ nguyên `?page=1`.
 *   - `?page=abc` -> parseInt ra NaN -> render "Trang NaN", canonical `?page=abc`.
 *   - `?page=99999` trả 200 kèm "Chưa có bài đăng nào" và canonical tự trỏ.
 *   - Link phân trang trải nguyên `...resolvedSearchParams` nên MỌI tham số rác
 *     được nhân bản sang từng trang.
 */

export const LISTING_PAGE_SIZE = 20;

/** Quá ngưỡng này thì noindex để không đốt ngân sách thu thập vào đuôi dài. */
export const MAX_INDEXABLE_PAGE = 20;

/** Tham số lọc được phép tồn tại trên URL trang danh mục. Ngoài danh sách này là rác. */
export const CANONICAL_FILTER_KEYS = [
  'priceRangeKey',
  'areaRangeKey',
  'direction',
  'bedrooms',
  'bathrooms',
  'sort',
  'q',
] as const;

export type CanonicalFilters = Partial<Record<(typeof CANONICAL_FILTER_KEYS)[number], string>>;

export interface ParsedListingQuery {
  page: number;
  filters: CanonicalFilters;
  /** Có tham số lọc -> trang là một facet, không index. */
  hasFilters: boolean;
  /** Query cần 301 về dạng chuẩn (page=1, page sai định dạng, khoá lạ, limit=...). */
  hasNonCanonicalQuery: boolean;
}

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseListingQuery(searchParams: RawSearchParams): ParsedListingQuery {
  const filters: CanonicalFilters = {};
  let hasNonCanonicalQuery = false;

  const rawPage = first(searchParams.page);
  let page = 1;
  if (rawPage !== undefined) {
    // Chỉ chấp nhận số nguyên dương viết chuẩn. "01", "1.0", "abc", "-3" đều không chuẩn.
    if (/^[1-9][0-9]*$/.test(rawPage)) {
      page = Number(rawPage);
      // page=1 phải nằm ở URL không có tham số page.
      if (page === 1) hasNonCanonicalQuery = true;
    } else {
      hasNonCanonicalQuery = true;
    }
  }

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'page') continue;
    const v = first(value);
    if (v === undefined || v === '') continue;

    if ((CANONICAL_FILTER_KEYS as readonly string[]).includes(key)) {
      filters[key as keyof CanonicalFilters] = v;
    } else {
      // `limit`, `utm_*`, tham số bịa... -> không thuộc URL chuẩn.
      hasNonCanonicalQuery = true;
    }
  }

  return {
    page,
    filters,
    hasFilters: Object.keys(filters).length > 0,
    hasNonCanonicalQuery,
  };
}

/** Ghép URL trang danh mục: chỉ phát tham số nằm trong danh sách trắng. */
export function buildListingUrl(basePath: string, page: number, filters: CanonicalFilters): string {
  const params = new URLSearchParams();
  for (const key of CANONICAL_FILTER_KEYS) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function totalPages(total: number, pageSize = LISTING_PAGE_SIZE): number {
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.ceil(total / pageSize);
}

/**
 * Nơi DUY NHẤT dựng đường dẫn trang danh mục.
 *
 * Dạng URL phụ thuộc trạng thái di chuyển:
 *   - report  (mặc định): dạng cũ `/{loại}/{khu-vực}` — đang được Google index
 *   - enforce            : dạng mới `/{giao-dịch}/{loại}/{khu-vực}`
 *
 * Cùng một cờ điều khiển cả bảng redirect trong next.config.mjs lẫn hàm này, nên link
 * nội bộ luôn trỏ thẳng vào URL trả 200 chứ không trỏ vào một 301. Link nội bộ trỏ vào
 * 301 làm mỗi lượt thu thập tốn thêm một chặng.
 */
export function listingPath(opts: {
  transaction?: 'ban' | 'cho-thue';
  propertyTypeSlug?: string | null;
  locationSlug?: string | null;
}): string {
  const transaction = opts.transaction ?? 'ban';
  const parts: string[] = [];

  // `cho-thue` vốn đã là đoạn dẫn đầu hợp lệ ở CẢ HAI dạng, nên luôn giữ. Chỉ đoạn
  // `ban` mới là phần được thêm khi bật enforce.
  if (transaction === 'cho-thue' || process.env.NEXT_PUBLIC_SEO_MODE === 'enforce') {
    parts.push(transaction);
  }
  if (opts.propertyTypeSlug) parts.push(opts.propertyTypeSlug);
  if (opts.locationSlug) parts.push(opts.locationSlug);

  // Không có gì cả -> trang danh sách gốc. Dùng /ban chứ không /tat-ca vì /tat-ca
  // đã được 301 sang /ban.
  if (parts.length === 0) parts.push('ban');

  return '/' + parts.join('/');
}

/**
 * Đường dẫn trang chi tiết tin: `/tin/{slug}-{shortCode}`.
 *
 * Bản sao của `backend/src/seo/seo-urls.ts` — hai workspace có Docker build context
 * tách nhau nên không import chéo được. Lệch nhau thì canonical và sitemap sẽ khai
 * hai URL khác nhau cho cùng một tin, nên có test đối chiếu ở cả hai phía.
 */
export function listingDetailPath(
  slug: string,
  shortCode?: string | null,
  id?: string,
): string {
  if (shortCode) return `/tin/${slug}-${shortCode}`;
  return `/tin/${slug}--${id ?? ''}`;
}

/**
 * Tách đoạn định danh khỏi tham số `[slug_id]`.
 *
 * Dạng cũ `{slug}--{uuid}` nhận ra nhờ dấu `--`; dạng mới `{slug}-{shortCode}` lấy
 * đoạn sau dấu `-` cuối cùng. Không đoán mã hợp lệ hay không — cứ tra, không thấy thì 404.
 */
export function parseListingRef(slugId: string): { ref: string; isLegacy: boolean } {
  if (!slugId) return { ref: '', isLegacy: false };
  const legacy = slugId.split('--');
  if (legacy.length > 1) return { ref: legacy[legacy.length - 1], isLegacy: true };
  const i = slugId.lastIndexOf('-');
  return { ref: i >= 0 ? slugId.slice(i + 1) : slugId, isLegacy: false };
}
