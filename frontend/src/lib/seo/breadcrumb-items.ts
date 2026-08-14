import type { BreadcrumbItem } from './schema';
import { listingPath } from './canonical';
import { propertyTypeBySlug, propertyTypeByEnum, transactionByEnum } from './taxonomy';

/**
 * Dựng breadcrumb cho trang chi tiết tin.
 *
 * Cấu trúc khách yêu cầu:
 *   Trang chủ / Giao dịch / Loại BĐS / Quận-Huyện / Phường-Xã / Tiêu đề
 *
 * Quan trọng: dựng TỪ CHÍNH DỮ LIỆU của tin (`wardLocation`, `districtLocation`),
 * không lấy theo URL người dùng đi tới. Nhờ vậy yêu cầu "tin mở từ trang lọc
 * `?gia=2-3-ty` không được kế thừa đoạn lọc vào breadcrumb" thoả mãn tự nhiên —
 * trang là server component, vốn không biết gì về URL giới thiệu.
 *
 * Cấp nào thiếu dữ liệu thì LƯỢC BỎ, không để trống.
 */
export function listingBreadcrumb(property: any): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];

  const tx = transactionByEnum(property?.transactionType);
  const type = propertyTypeByEnum(property?.propertyType);

  if (tx) items.push({ name: tx.label, url: listingSegmentPath(tx.slug) });
  if (tx && type) items.push({ name: type.label, url: listingSegmentPath(tx.slug, type.slug) });

  const district = locationRef(property?.districtLocation);
  if (district && tx && type) {
    items.push({ name: district.name, url: listingSegmentPath(tx.slug, type.slug, district.slug) });
  }

  const ward = locationRef(property?.wardLocation);
  if (ward && tx && type) {
    items.push({ name: ward.name, url: listingSegmentPath(tx.slug, type.slug, ward.slug) });
  }

  // Phần tử cuối: trang hiện tại -> không có url nên render thành text thuần.
  if (property?.title) items.push({ name: property.title });

  return items;
}

/** Breadcrumb cho trang danh mục/khu vực. */
export function landingBreadcrumb(params: {
  transactionSlug?: string | null;
  propertyTypeSlug?: string | null;
  locationName?: string | null;
  /** Đặt true khi đây chính là trang đang mở (phần tử cuối bỏ link). */
  isCurrentPage?: boolean;
}): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];
  const tx = params.transactionSlug;
  const type = propertyTypeBySlug(params.propertyTypeSlug);

  if (tx) {
    items.push({ name: tx === 'cho-thue' ? 'Cho thuê' : 'Bán', url: listingSegmentPath(tx) });
  }
  if (type) {
    items.push({ name: type.label, url: listingSegmentPath(tx ?? 'ban', type.slug) });
  }
  if (params.locationName) {
    items.push({ name: params.locationName });
  }

  if (params.isCurrentPage && items.length > 0) {
    delete items[items.length - 1].url;
  }
  return items;
}

/**
 * Đoạn URL của một cấp khu vực.
 *
 * Phải là `urlSegment` chứ KHÔNG phải `slug`: `Location.slug` chỉ duy nhất trong phạm
 * vi cha (dữ liệu Hà Nội có 125 nhóm tên trùng, chạm 275/736 bản ghi), còn routing tra
 * theo `urlSegment` vốn `@unique` toàn cục. Dùng nhầm cột thì ~37% tin đăng có
 * breadcrumb trỏ sang phường khác hoặc vào URL không tồn tại.
 *
 * Vẫn đọc `slug` làm phương án dự phòng cho dữ liệu cũ chưa backfill `urlSegment`.
 */
function locationRef(node: any): { name: string; slug: string } | null {
  const name = typeof node?.name === 'string' ? node.name.trim() : '';
  const segment =
    (typeof node?.urlSegment === 'string' ? node.urlSegment.trim() : '') ||
    (typeof node?.slug === 'string' ? node.slug.trim() : '');
  if (!name || !segment) return null;
  return { name, slug: segment };
}

/**
 * Nơi DUY NHẤT dựng đường dẫn trang danh mục cho breadcrumb.
 *
 * Uỷ quyền cho `listingPath` — cùng hàm mà canonical, sitemap và điều hướng đang dùng.
 * Trước đây hàm này tự dựng chuỗi theo dạng URL cũ và trả `/tat-ca` khi không có loại
 * BĐS, nên MỌI breadcrumb (cả `<nav>` lẫn JSON-LD `BreadcrumbList`) đều trỏ vào URL đã
 * bị 301 — đúng lỗi khách báo ở mục III.2.
 */
function listingSegmentPath(
  transactionSlug: string,
  propertyTypeSlug?: string,
  locationSlug?: string,
): string {
  return listingPath({
    transaction: transactionSlug === 'cho-thue' ? 'cho-thue' : 'ban',
    propertyTypeSlug,
    locationSlug,
  });
}
