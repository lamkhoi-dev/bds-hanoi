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
  ups: any[];
  normals: any[];
  total: number;
  page: number;
  limit: number;
  /** Backend đặt cờ này khi đoạn khu vực không tra được. */
  unknownLocation?: string;
  /**
   * Tin của khu vực CHA (huyện/tỉnh), backend tự bù khi khu vực đang xem có thật nhưng
   * chưa có tin nào (`total === 0`). Khách yêu cầu 12/9: khu vực trống phải đưa tin GẦN ĐÚNG
   * nhất tìm được và NÓI RÕ đó là tin của khu vực khác — không lặng lẽ hiện như tin toàn
   * site (khối "Tin đăng mới nhất" cũ dễ đọc nhầm thành đúng khu vực) và càng không được lẫn
   * vào danh sách chính (đó là lỗi khác — xem `locationMatch` ở backend).
   */
  nearby?: {
    locationType: 'CITY' | 'DISTRICT';
    locationName: string;
    locationUrlSegment: string;
    listings: any[];
  };
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
 * Thử lại: khách báo 25/08 rồi lại 15/9 và 18/9 "link khu vực (và giờ cả link loại BĐS)
 * nhiều lúc không tải được tin, F5 lại thì mới đúng". GỐC LỖI TÌM RA 18/9: mọi fetch này
 * chạy PHÍA SERVER, gọi thẳng `http://backend:4000` qua mạng nội bộ Docker (không qua
 * Caddy) — nên request của MỌI khách ghé site cùng lúc đều chung MỘT địa chỉ IP nguồn (IP
 * container frontend). `ThrottlerGuard` mặc định (100 req/phút) tính theo IP đó, bị tính
 * DỒN cho cả site chứ không phải riêng từng khách — gọi thử 130 lần liên tiếp là dính
 * `429` ngay. Đã sửa tận gốc: bỏ giới hạn tần suất ở các route đọc công khai
 * (`property.controller.ts`, `location.controller.ts`, `news.controller.ts`...). Giữ
 * nguyên cơ chế thử lại + log ở đây làm lưới an toàn thứ hai, và để BIẾT NGAY nếu còn kiểu
 * lỗi nào khác xảy ra sau này thay vì lại phải suy đoán từ đầu.
 */
const RETRY_DELAYS_MS = [300, 800];

const fetchSeoListing = cache(async (queryString: string): Promise<SeoListingData | null> => {
  const url = serverApiUrl(`/properties/seo?${queryString}`);
  let lastReason = '';

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) return (await res.json()) as SeoListingData;
      // 4xx thường là câu trả lời dứt khoát (truy vấn sai) — NGOẠI TRỪ 429 (quá tải tạm
      // thời, đúng thứ cơ chế thử lại này sinh ra để nuốt).
      lastReason = `HTTP ${res.status}`;
      if (res.status < 500 && res.status !== 429) return null;
    } catch (err) {
      lastReason = err instanceof Error ? err.message : String(err);
    }
    if (attempt < RETRY_DELAYS_MS.length) await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
  }
  // Hết cả 3 lần thử vẫn lỗi — ghi log để lần sau (nếu còn xảy ra) có bằng chứng thật thay
  // vì phải đoán mò như đợt 18/9 vừa rồi. Vào `docker logs bds-frontend-prod`.
  console.error(`[fetchSeoListing] Hết ${RETRY_DELAYS_MS.length + 1} lần thử, vẫn lỗi: ${lastReason}. url=${url}`);
  return null;
});

/**
 * Vài tin mới nhất toàn site, dùng khi trang khu vực không có tin nào để hiển thị.
 *
 * Khách yêu cầu 25/08: "nếu không có tin thì giao diện vẫn hiện quảng cáo, hoặc tin liên
 * quan, không hiện thông báo này" — thay vì để trơ một dòng chữ báo lỗi trên trang trống.
 *
 * Hỏng thì trả mảng rỗng, KHÔNG ném lỗi: đây là phần trang trí cho một trang vốn đã không
 * có gì: để nó làm sập cả trang là đổi một trang nghèo nội dung thành một trang lỗi.
 */
export const fetchFallbackListings = cache(async (): Promise<any[]> => {
  try {
    const res = await fetch(serverApiUrl('/properties/seo?loaiBds=tat-ca&khuVuc=toan-quoc&page=1&limit=8'), {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as SeoListingData;
    return [...(data.vips ?? []), ...(data.normals ?? [])].slice(0, 8);
  } catch {
    return [];
  }
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
