import { cache } from 'react';
import { serverApiUrl } from '@/lib/server-api';
import type { ListingRoute } from './route';
import type { ParsedListingQuery } from './canonical';
import { LISTING_PAGE_SIZE } from './canonical';
import type { RouteFacts } from './indexability';
import { propertyTypeBySlug, transactionBySlug } from './taxonomy';
import type { LocationDictionary } from './locations';

export interface SeoListingData {
  vips: any[];
  normals: any[];
  total: number;
  page: number;
  limit: number;
  /** Backend đặt cờ này khi đoạn khu vực không tra được. */
  unknownLocation?: string;
}

/**
 * Nơi DUY NHẤT có I/O trong lớp quyết định SEO.
 *
 * `cache()` khoá theo chuỗi truy vấn (kiểu nguyên thuỷ) nên `generateMetadata` và thân
 * trang dùng chung một lần fetch. Trước đây hai chỗ tính lại độc lập, mà route là
 * `force-dynamic` + `cache: 'no-store'` nên không có cache nào che phía sau.
 */
/**
 * Trả `null` CHỈ khi gọi API hỏng thật. Khu vực không có tin nào vẫn trả JSON hợp lệ với
 * `total: 0`, nên trang phân biệt được "lỗi tải" với "chưa có tin" — hai trạng thái đó hiển
 * thị khác nhau.
 *
 * Thử lại MỘT lần: khách báo 25/08 "link khu vực nhiều lúc không tải được tin, F5 hoặc vào
 * lại vài lần thì mới hiện". Đo lại 10 lần liên tiếp đều 200 trong ~0,2s nên đây là lỗi chớp
 * nhoáng chứ không phải hỏng thường trực — nhiều khả năng rơi đúng lúc backend khởi động lại
 * sau một lần deploy. Một lần thử lại nuốt được phần lớn những cú như vậy.
 *
 * Chỉ MỘT lần, và chờ ngắn: đây là render phía máy chủ, thử lại nhiều lần chỉ làm người dùng
 * ngồi nhìn trang trắng lâu hơn rồi vẫn lỗi. Backend restart mất khoảng 20 giây — quá lâu để
 * đợi trong một request, nên ca đó vẫn sẽ hiện thông báo lỗi, đúng như thiết kế.
 */
const fetchSeoListing = cache(async (queryString: string): Promise<SeoListingData | null> => {
  const url = serverApiUrl(`/properties/seo?${queryString}`);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      // 4xx là câu trả lời dứt khoát của backend (truy vấn sai) — thử lại cũng thế.
      // Chỉ thử lại với 5xx và lỗi mạng, là những thứ có thể tự khỏi.
      if (res.ok) return (await res.json()) as SeoListingData;
      if (res.status < 500) return null;
    } catch {
      /* lỗi mạng — rơi xuống nhánh thử lại bên dưới */
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 250));
  }
  return null;
});

/**
 * Dựng truy vấn gửi backend từ route ĐÃ resolve.
 *
 * Điểm mấu chốt: gửi thẳng `transactionType`/`propertyType` dạng enum thay vì để backend
 * tự đoán từ slug. Chính việc mỗi bên tự đoán bằng một danh sách danh mục riêng đã làm
 * `biet-thu` chạy ở frontend mà backend không nhận, và `/cho-thue` bị coi là danh mục.
 */
export function buildBackendQuery(route: ListingRoute, query: ParsedListingQuery): string {
  const params = new URLSearchParams();

  params.set('loaiBds', route.propertyTypeSlug ?? 'tat-ca');
  params.set('khuVuc', route.locationSlug ?? 'toan-quoc');

  const transaction = transactionBySlug(route.transaction);
  if (transaction) params.set('transactionType', transaction.enum);

  const propertyType = propertyTypeBySlug(route.propertyTypeSlug);
  if (propertyType) params.set('propertyType', propertyType.enum);

  params.set('page', String(query.page));
  params.set('limit', String(LISTING_PAGE_SIZE));

  for (const [key, value] of Object.entries(query.filters)) {
    if (value) params.set(key, value);
  }

  return params.toString();
}

export async function getRouteFacts(
  route: ListingRoute,
  query: ParsedListingQuery,
  dict: LocationDictionary,
): Promise<{ facts: RouteFacts; data: SeoListingData | null }> {
  const data = await fetchSeoListing(buildBackendQuery(route, query));

  // Sự tồn tại của khu vực tra ngay trong từ điển đã nạp sẵn — không tốn round-trip.
  const location = route.locationSlug
    ? {
        exists: Boolean(dict[route.locationSlug]) && !data?.unknownLocation,
        name: dict[route.locationSlug]?.name,
      }
    : null;

  return {
    facts: { location, total: data?.total ?? 0 },
    data,
  };
}
