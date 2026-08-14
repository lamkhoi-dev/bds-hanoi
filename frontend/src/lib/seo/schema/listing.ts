import { siteConfig } from '@/lib/site-config';
import { getAreaRange, getPriceRange } from '@/constants/ranges';
import { toMediaUrl } from '@/lib/media';
import { propertyTypeLabel } from '../taxonomy';
import { ORGANIZATION_ID } from './organization';
import { WEBSITE_ID } from './website';
import type { JsonLdNode } from './types';

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Giá cho JSON-LD.
 *
 * Lỗi cũ: `price: property.price || 0`. Mà `Property.price` cho phép null và form đăng
 * tin chỉ bắt buộc `priceRangeKey` (ô giá chính xác còn bị disable khi chọn "Giá thương
 * lượng"), nên MỌI tin thương lượng đều phát `price: 0, priceCurrency: VND` — Search
 * Console báo Offer không hợp lệ.
 *
 * Ba nhánh:
 *   1. Có giá chính xác  -> Offer.price
 *   2. Chỉ có khoảng giá -> priceSpecification { minPrice, maxPrice }, KHÔNG có price
 *   3. Thương lượng      -> bỏ hẳn thuộc tính giá
 */
export function buildOffer(property: any, url?: string): JsonLdNode {
  const sold = property?.status === 'SOLD' || property?.status === 'RENTED';
  const base: JsonLdNode = {
    '@type': 'Offer',
    priceCurrency: 'VND',
    availability: sold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
    ...(url ? { url } : {}),
  };

  const exact = num(property?.price);
  if (exact !== null && exact > 0) {
    return { ...base, price: exact };
  }

  const fallback = getPriceRange(property?.priceRangeKey, property?.transactionType);
  const min = num(property?.priceMin) ?? fallback?.min ?? null;
  const max = num(property?.priceMax) ?? fallback?.max ?? null;

  if (min !== null || max !== null) {
    return {
      ...base,
      priceSpecification: {
        '@type': 'PriceSpecification',
        priceCurrency: 'VND',
        ...(min !== null ? { minPrice: min } : {}),
        ...(max !== null ? { maxPrice: max } : {}),
      },
    };
  }

  return base;
}

function collectImages(property: any): string[] {
  const raw: unknown[] =
    Array.isArray(property?.imageObjects) && property.imageObjects.length > 0
      ? property.imageObjects.map((o: any) => o?.url)
      : Array.isArray(property?.images)
        ? property.images
        : [];

  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const resolved = toMediaUrl(text(item));
    if (!resolved) continue;
    const abs = siteConfig.absolute(resolved);
    if (!seen.has(abs)) {
      seen.add(abs);
      out.push(abs);
    }
  }
  return out;
}

function buildAddress(property: any): JsonLdNode | null {
  const street = text(property?.street);
  const ward = text(property?.ward);
  const district = text(property?.district);
  const region = text(property?.city) || siteConfig.province.name;

  if (!street && !ward && !district && !region) return null;

  // schema.org không có cấp "phường/xã" riêng — gộp vào streetAddress.
  const streetAddress = [street, ward].filter(Boolean).join(', ');

  return {
    '@type': 'PostalAddress',
    ...(streetAddress ? { streetAddress } : {}),
    ...(district ? { addressLocality: district } : {}),
    addressRegion: region,
    addressCountry: 'VN',
  };
}

function buildFloorSize(property: any): JsonLdNode | null {
  // unitCode MTK = mét vuông (UN/CEFACT).
  const exact = num(property?.area);
  if (exact !== null && exact > 0) {
    return { '@type': 'QuantitativeValue', value: exact, unitCode: 'MTK' };
  }

  const fallback = getAreaRange(property?.areaRangeKey);
  const min = num(property?.areaMin) ?? fallback?.min ?? null;
  const max = num(property?.areaMax) ?? fallback?.max ?? null;
  if (min === null && max === null) return null;

  return {
    '@type': 'QuantitativeValue',
    unitCode: 'MTK',
    ...(min !== null ? { minValue: min } : {}),
    ...(max !== null ? { maxValue: max } : {}),
  };
}

/** Loại schema.org sát nhất với loại BĐS, để mô tả vật thể chứ không phải trang. */
function accommodationType(propertyType?: string | null): string {
  switch (propertyType) {
    case 'CHUNG_CU':
      return 'Apartment';
    case 'NHA_RIENG':
    case 'BIET_THU':
      return 'House';
    case 'DAT_NEN':
    case 'MAT_BANG':
      return 'Place';
    default:
      return 'Accommodation';
  }
}

export interface ListingSchemaOptions {
  /** URL canonical tuyệt đối của trang tin. */
  url: string;
  description: string;
}

export function buildRealEstateListing(property: any, opts: ListingSchemaOptions): JsonLdNode {
  const images = collectImages(property);
  const address = buildAddress(property);
  const floorSize = buildFloorSize(property);
  const bedrooms = num(property?.bedrooms);
  const bathrooms = num(property?.bathrooms);
  const lat = num(property?.lat);
  const lng = num(property?.lng);

  // Thuộc tính vật lý mô tả BẤT ĐỘNG SẢN, không phải trang web -> đặt trong mainEntity.
  const mainEntity: JsonLdNode = {
    '@type': accommodationType(property?.propertyType),
    name: property?.title,
    ...(address ? { address } : {}),
    ...(floorSize ? { floorSize } : {}),
    ...(bedrooms !== null ? { numberOfRooms: bedrooms } : {}),
    ...(bathrooms !== null ? { numberOfBathroomsTotal: bathrooms } : {}),
    // Chỉ khai toạ độ khi người đăng xác nhận vị trí chính xác.
    ...(property?.isExactLocation && lat !== null && lng !== null
      ? { geo: { '@type': 'GeoCoordinates', latitude: lat, longitude: lng } }
      : {}),
  };

  return {
    '@type': 'RealEstateListing',
    '@id': `${opts.url}#listing`,
    name: property?.title,
    description: opts.description,
    url: opts.url,
    inLanguage: 'vi-VN',
    isPartOf: { '@id': WEBSITE_ID },
    provider: { '@id': ORGANIZATION_ID },
    category: propertyTypeLabel(property?.propertyType),
    // datePosted phải là ngày ĐĂNG, trước đây lấy nhầm createdAt (thời điểm tạo nháp).
    ...(property?.publishedAt || property?.createdAt
      ? { datePosted: property.publishedAt || property.createdAt }
      : {}),
    ...(property?.contentUpdatedAt || property?.updatedAt
      ? { dateModified: property.contentUpdatedAt || property.updatedAt }
      : {}),
    ...(images.length > 0 ? { image: images } : {}),
    mainEntity,
    offers: buildOffer(property, opts.url),
  };
}
