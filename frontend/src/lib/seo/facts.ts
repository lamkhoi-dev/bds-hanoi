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
const fetchSeoListing = cache(async (queryString: string): Promise<SeoListingData | null> => {
  try {
    const res = await fetch(serverApiUrl(`/properties/seo?${queryString}`), { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as SeoListingData;
  } catch {
    return null;
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
