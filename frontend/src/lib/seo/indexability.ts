import type { RouteParse, ListingRoute } from './route';
import type { ParsedListingQuery } from './canonical';
import { MAX_INDEXABLE_PAGE, buildListingUrl, totalPages } from './canonical';

/**
 * Nơi DUY NHẤT quyết định một URL trang danh mục được index, noindex, 301 hay 404.
 *
 * Thuần và đồng bộ, nên `generateMetadata`, thân trang và bộ sinh sitemap gọi cùng một
 * hàm với cùng dữ kiện — chúng không thể lệch nhau. Trước đây frontend và backend mỗi
 * bên tự phân tích slug với hai danh sách danh mục khác nhau, nên `biet-thu` chạy được
 * ở frontend nhưng backend không nhận.
 */

export type SeoMode = 'report' | 'enforce';

/** Dữ kiện lấy từ backend. Đây là phần DUY NHẤT cần I/O. */
export interface RouteFacts {
  /** null khi URL không có đoạn khu vực. */
  location:
    | null
    | {
        exists: boolean;
        name?: string;
        /** Khu vực đã đổi/nghỉ hưu -> 301 sang đây. */
        redirectTo?: string;
      };
  /** Tổng số tin khớp bộ lọc hiện tại. */
  total: number;
}

export type IndexDecision =
  | { action: 'index' }
  | { action: 'noindex'; reason: string }
  | { action: 'redirect'; to: string; reason: string }
  | { action: 'notFound'; reason: string };

export interface DecideInput {
  parse: RouteParse;
  query: ParsedListingQuery;
  facts: RouteFacts;
  /**
   * Bật khi P5 triển khai: URL dạng cũ `/{loại}/{khu-vực}` sẽ 301 sang
   * `/ban/{loại}/{khu-vực}`. Để tắt trong P4 vì nếu không, mọi URL đang được Google
   * index sẽ dời chỗ trước khi bảng redirect và link nội bộ kịp cập nhật.
   */
  redirectLegacyShape?: boolean;
}

/** Thứ tự các luật là có hiệu lực — đừng đổi khi chưa cân nhắc. */
export function decideIndexability(input: DecideInput): IndexDecision {
  const { parse, query, facts } = input;

  // 1. Cú pháp sai: ký tự lạ, quá sâu, đoạn đầu là route dành riêng.
  if (parse.kind === 'reject') {
    return { action: 'notFound', reason: `bad-route:${parse.reason}` };
  }

  // 2. Dạng URL cần chuẩn hoá: chữ hoa, alias loại BĐS.
  if (parse.kind === 'redirect') {
    return { action: 'redirect', to: parse.to, reason: parse.reason };
  }

  const route: ListingRoute = parse.route;

  // 3. Khu vực không tồn tại trong CSDL.
  //    Trước đây backend âm thầm chuyển sang tìm kiếm toàn văn nên MỌI chuỗi rác đều
  //    thành một trang 200 index được.
  if (route.locationSlug && facts.location && !facts.location.exists) {
    return { action: 'notFound', reason: 'unknown-location' };
  }

  // 4. Khu vực đã đổi tên/gộp -> chuyển sang khu vực kế nhiệm.
  if (facts.location?.redirectTo) {
    return {
      action: 'redirect',
      to: buildListingUrl(
        `/${[route.transaction, route.propertyTypeSlug, facts.location.redirectTo].filter(Boolean).join('/')}`,
        query.page,
        query.filters,
      ),
      reason: 'location-moved',
    };
  }

  // 5. Query không chuẩn: page=1, page sai định dạng, khoá lạ, limit=...
  if (query.hasNonCanonicalQuery) {
    const base = input.redirectLegacyShape ? route.canonicalPath : route.currentPath;
    return {
      action: 'redirect',
      to: buildListingUrl(base, query.page, query.filters),
      reason: 'non-canonical-query',
    };
  }

  // 6. URL dạng cũ -> dạng mới (chỉ khi P5 đã bật).
  if (route.isLegacyShape && input.redirectLegacyShape) {
    return {
      action: 'redirect',
      to: buildListingUrl(route.canonicalPath, query.page, query.filters),
      reason: 'legacy-shape',
    };
  }

  const pages = totalPages(facts.total);

  // 7. Trang vượt quá số trang thật -> 404 chứ không phải noindex.
  //    151 URL "đã phát hiện – chưa được lập chỉ mục" trong Search Console chính là dạng
  //    này: truy cập được, trả 200, không có giá trị. noindex 200 giữ chúng trong hàng
  //    đợi thu thập mãi mãi; 404 mới loại hẳn.
  //    Ngoại lệ: trang 1 của facet rỗng phải giữ 200 để luật 9 tự lật lại được khi có tin.
  if (query.page > 1 && query.page > Math.max(pages, 1)) {
    return { action: 'notFound', reason: 'page-out-of-range' };
  }

  // 8. Có bộ lọc -> facet, không index, canonical trỏ về URL không lọc.
  if (query.hasFilters) {
    return { action: 'noindex', reason: 'filtered' };
  }

  // 9. Không có tin nào -> noindex,follow và loại khỏi sitemap.
  //    KHÔNG 404: giữ crawl được để khi có tin đầu tiên thì tự lật lại thành index.
  if (facts.total === 0) {
    return { action: 'noindex', reason: 'empty' };
  }

  // 10. Đuôi dài phân trang.
  if (query.page > MAX_INDEXABLE_PAGE) {
    return { action: 'noindex', reason: 'deep-page' };
  }

  return { action: 'index' };
}

export function getSeoMode(): SeoMode {
  return process.env.NEXT_PUBLIC_SEO_MODE === 'enforce' ? 'enforce' : 'report';
}

/**
 * Ở chế độ `report`, tính đủ quyết định nhưng CHỈ áp noindex — chưa 404, chưa 301.
 *
 * Đây là chốt giảm rủi ro của cả phase: deploy, quan sát log một tuần, đối chiếu
 * Search Console, rồi mới đặt NEXT_PUBLIC_SEO_MODE=enforce.
 */
export function applyMode(decision: IndexDecision, mode: SeoMode): IndexDecision {
  if (mode === 'enforce') return decision;
  if (decision.action === 'notFound') {
    return { action: 'noindex', reason: `report-only:${decision.reason}` };
  }
  if (decision.action === 'redirect') {
    return { action: 'noindex', reason: `report-only:${decision.reason}` };
  }
  return decision;
}
