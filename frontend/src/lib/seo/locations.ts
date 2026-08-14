import { cache } from 'react';
import { serverApiUrl } from '@/lib/server-api';
import { propertyTypeBySlug, transactionBySlug } from './taxonomy';

export type LocationSegmentType = 'CITY' | 'DISTRICT' | 'WARD' | 'OLD_WARD';

export interface LocationSegment {
  name: string;
  shortName: string;
  type: LocationSegmentType;
  /** urlSegment của cấp cha, để dựng breadcrumb mà không cần gọi thêm. */
  parent?: string;
}

export type LocationDictionary = Record<string, LocationSegment>;

/**
 * Từ điển {urlSegment -> tên có dấu} của toàn bộ khu vực đang hoạt động.
 *
 * Thay cho `formatSlugToName` — hàm dựng tên hiển thị bằng cách viết hoa slug, cho ra
 * "phường Truong Vinh" thay vì "phường Trường Vinh" (mục II.4 trong danh sách fix SEO).
 * Dấu tiếng Việt không thể suy ngược từ slug, chỉ có thể tra từ DB.
 *
 * `cache()` gộp các lần gọi trong CÙNG một request — trước đây `getSeoMetadataTexts`
 * chạy hai lần mỗi request (một lần trong generateMetadata, một lần trong thân trang).
 * `revalidate` lo phần cache giữa các request.
 */
export const getLocationDictionary = cache(async (): Promise<LocationDictionary> => {
  try {
    const res = await fetch(serverApiUrl('/locations/segments'), {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return {};
    return (await res.json()) as LocationDictionary;
  } catch {
    // Backend chưa sẵn sàng: trả rỗng để trang vẫn render, chỉ là không có tên đẹp.
    return {};
  }
});

/**
 * Tên hiển thị của một đoạn URL. Trả null khi không nhận diện được — người gọi quyết
 * định 404 hay noindex, thay vì bịa ra một cái tên từ chuỗi rác.
 */
export function formatSegment(segment: string, dict: LocationDictionary): string | null {
  if (!segment) return null;

  let decoded = segment;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    /* giữ nguyên nếu không decode được */
  }

  const location = dict[decoded];
  if (location) return location.name;

  const propertyType = propertyTypeBySlug(decoded);
  if (propertyType) return propertyType.label;

  const transaction = transactionBySlug(decoded);
  if (transaction) return transaction.label;

  if (decoded === 'tat-ca') return 'Tất cả';
  if (decoded === 'toan-quoc') return null;

  return null;
}

/** Chuỗi tổ hợp nhiều đoạn (vd "dat-nen/cau-giay"); null nếu có đoạn không nhận diện được. */
export function formatSegmentPath(path: string, dict: LocationDictionary): string | null {
  const parts = path.split('/').filter(Boolean);
  const names: string[] = [];
  for (const part of parts) {
    const name = formatSegment(part, dict);
    if (!name) return null;
    names.push(name);
  }
  return names.length > 0 ? names.join(' - ') : null;
}
