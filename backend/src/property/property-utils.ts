type PropertyWhereInput = any;
type PropertyOrderByWithRelationInput = any;

const TRANSACTION_TYPE_ALIASES: Record<string, string> = {
  ban: 'BAN',
  'ban bds': 'BAN',
  'ban bat dong san': 'BAN',
  'bán': 'BAN',
  'bán bđs': 'BAN',
  'bán bất động sản': 'BAN',
  cho_thue: 'CHO_THUE',
  'cho-thue': 'CHO_THUE',
  'cho thue': 'CHO_THUE',
  'cho thuê': 'CHO_THUE',
  thue: 'CHO_THUE',
  'thuê': 'CHO_THUE',
  can_mua: 'CAN_MUA',
  'can-mua': 'CAN_MUA',
  'can mua': 'CAN_MUA',
  'cần mua': 'CAN_MUA',
};

const PROPERTY_TYPE_ALIASES: Record<string, string> = {
  dat_nen: 'DAT_NEN',
  'dat-nen': 'DAT_NEN',
  'dat nen': 'DAT_NEN',
  'đất nền': 'DAT_NEN',
  nha_rieng: 'NHA_RIENG',
  'nha-rieng': 'NHA_RIENG',
  'nha rieng': 'NHA_RIENG',
  'nhà riêng': 'NHA_RIENG',
  'nha mat pho': 'NHA_RIENG',
  'nhà mặt phố': 'NHA_RIENG',
  'nha rieng nha mat pho': 'NHA_RIENG',
  'nhà riêng nhà mặt phố': 'NHA_RIENG',
  chung_cu: 'CHUNG_CU',
  'chung-cu': 'CHUNG_CU',
  'chung cu': 'CHUNG_CU',
  'chung cư': 'CHUNG_CU',
  'can ho': 'CHUNG_CU',
  'căn hộ': 'CHUNG_CU',
  'can ho chung cu': 'CHUNG_CU',
  'căn hộ chung cư': 'CHUNG_CU',
  du_an: 'DU_AN',
  'du-an': 'DU_AN',
  'du an': 'DU_AN',
  'dự án': 'DU_AN',
  mat_bang: 'MAT_BANG',
  'mat-bang': 'MAT_BANG',
  'mat bang': 'MAT_BANG',
  'mặt bằng': 'MAT_BANG',
  'mat bang kho xuong': 'MAT_BANG',
  'mặt bằng kho xưởng': 'MAT_BANG',
  biet_thu: 'BIET_THU',
  'biet-thu': 'BIET_THU',
  'biet thu': 'BIET_THU',
  'biệt thự': 'BIET_THU',
  'bds_khac': 'BDS_KHAC',
  'bds khac': 'BDS_KHAC',
  'khac': 'BDS_KHAC',
  'bất động sản khác': 'BDS_KHAC',
  'khác': 'BDS_KHAC',
};

const DIRECTION_ALIASES: Record<string, string> = {
  'dong': 'Đông',
  'tay': 'Tây',
  'nam': 'Nam',
  'bac': 'Bắc',
  'dong_nam': 'Đông Nam',
  'dong-nam': 'Đông Nam',
  'dong nam': 'Đông Nam',
  'đông nam': 'Đông Nam',
  'tay_nam': 'Tây Nam',
  'tay-nam': 'Tây Nam',
  'tay nam': 'Tây Nam',
  'tây nam': 'Tây Nam',
  'dong_bac': 'Đông Bắc',
  'dong-bac': 'Đông Bắc',
  'dong bac': 'Đông Bắc',
  'đông bắc': 'Đông Bắc',
  'tay_bac': 'Tây Bắc',
  'tay-bac': 'Tây Bắc',
  'tay bac': 'Tây Bắc',
  'tây bắc': 'Tây Bắc',
};

const TRANSACTION_TYPE_LABELS: Record<string, string[]> = {
  BAN: ['BAN', 'Bán', 'ban', 'bán'],
  CHO_THUE: ['CHO_THUE', 'Cho thuê', 'cho-thue', 'cho thuê'],
  CAN_MUA: ['CAN_MUA', 'Cần mua', 'can-mua', 'cần mua'],
};

const PROPERTY_TYPE_LABELS: Record<string, string[]> = {
  DAT_NEN: ['DAT_NEN', 'Đất nền', 'dat-nen', 'đất nền'],
  NHA_RIENG: ['NHA_RIENG', 'Nhà riêng', 'Nhà riêng, nhà mặt phố', 'Nhà mặt phố'],
  CHUNG_CU: ['CHUNG_CU', 'Chung cư', 'Căn hộ / Chung cư', 'Căn hộ chung cư'],
  DU_AN: ['DU_AN', 'Dự án'],
  MAT_BANG: ['MAT_BANG', 'Mặt bằng', 'Mặt bằng, kho xưởng'],
  BIET_THU: ['BIET_THU', 'Biệt thự'],
  BDS_KHAC: ['BDS_KHAC', 'Bất động sản khác', 'Khác'],
};

const LOCATION_SLUGS: Record<string, string> = {
  'thanh-vinh': 'Phường Thành Vinh',
  'truong-vinh': 'Phường Trường Vinh',
  'vinh-loc': 'Phường Vinh Lộc',
  'vinh-phu': 'Phường Vinh Phú',
  'vinh-hung': 'Phường Vinh Hưng',
  'cua-lo': 'Phường Cửa Lò',
};

export type NormalizedFilters = {
  q?: string;
  transactionType?: string;
  propertyType?: string;
  city?: string;
  district?: string;
  ward?: string;
  oldWard?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  direction?: string;
  sort?: string;
  page: number;
  limit: number;
  priceRangeKey?: string;
  areaRangeKey?: string;
  locationId?: string;
  provinceId?: string;
  districtId?: string;
  wardId?: string;
  tier?: string;
};

export function stripAccents(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function slugify(value?: string | null) {
  if (!value) return '';
  return stripAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function calculatePricePerM2(
  priceMin?: number | null,
  priceMax?: number | null,
  areaMin?: number | null,
  areaMax?: number | null
): number | null {
  // Chỉ tính khi có đủ min/max hợp lệ (có thể min = max). Không tính cho các trường hợp chỉ có 1 đầu.
  if (
    priceMin !== undefined && priceMin !== null &&
    priceMax !== undefined && priceMax !== null &&
    areaMin !== undefined && areaMin !== null &&
    areaMax !== undefined && areaMax !== null
  ) {
    const avgPrice = (priceMin + priceMax) / 2;
    const avgArea = (areaMin + areaMax) / 2;
    if (avgArea > 0) {
      return avgPrice / avgArea;
    }
  }
  return null;
}

export function formatPricePerM2(pricePerM2?: number | null): string {
  if (!pricePerM2) return '-';
  const millionPerM2 = pricePerM2 / 1000000;
  const rounded = Math.round(millionPerM2);
  if (rounded === 0 || rounded > 9999) return '-';
  return `≈ ${rounded} triệu/m²`;
}

function normalizeKey(value?: string | null) {
  if (!value) return undefined;
  return stripAccents(String(value).trim())
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function unique(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

export function normalizeTransactionType(value?: string | null) {
  if (!value || value === 'all') return undefined;
  const raw = String(value).trim();
  const upper = raw.toUpperCase();
  if (TRANSACTION_TYPE_LABELS[upper]) return upper;
  const key = normalizeKey(raw);
  return key ? TRANSACTION_TYPE_ALIASES[key] || raw : undefined;
}

export function normalizePropertyType(value?: string | null) {
  if (!value || value === 'all' || value === 'Tất cả danh mục') return undefined;
  const raw = String(value).trim();
  const upper = raw.toUpperCase();
  if (PROPERTY_TYPE_LABELS[upper]) return upper;
  const key = normalizeKey(raw);
  return key ? PROPERTY_TYPE_ALIASES[key] || raw : undefined;
}

export function normalizeDirection(value?: string | null) {
  if (!value) return undefined;
  const raw = String(value).trim();
  const key = normalizeKey(raw);
  return key ? DIRECTION_ALIASES[key] || raw : undefined;
}

export function transactionTypeVariants(value?: string | null) {
  const normalized = normalizeTransactionType(value);
  if (!normalized) return [];
  return unique([...(TRANSACTION_TYPE_LABELS[normalized] || []), String(value || '').trim()]);
}

export function propertyTypeVariants(value?: string | null) {
  const normalized = normalizePropertyType(value);
  if (!normalized) return [];
  return unique([...(PROPERTY_TYPE_LABELS[normalized] || []), String(value || '').trim()]);
}

export function normalizePropertyPayload(data: Record<string, any>): Record<string, any> {
  const allowedKeys = [
    'title',
    'description',
    'transactionType',
    'propertyType',
    'categoryId',
    'city',
    'district',
    'ward',
    'oldWard',
    'street',
    'price',
    'area',
    'priceRangeKey',
    'priceMin',
    'priceMax',
    'areaRangeKey',
    'areaMin',
    'areaMax',
    'pricePerM2',
    'pricePerM2Display',
    'locationId',
    'lat',
    'lng',
    'direction',
    'amenities',
    'thumbnail',
    'images',
    'provinceId',
    'districtId',
    'wardId',
    'isNegotiable',
    'bedrooms',
    'bathrooms',
    'floors',
    'frontage',
    'accessRoad',
    'roadWidth',
    'legal',
    'furniture',
    'surroundings',
    'source'
  ];
  const normalized: Record<string, any> = {};
  for (const key of allowedKeys) {
    if (data[key] !== undefined) normalized[key] = data[key];
  }
  
  if (data['ownership'] !== undefined && normalized['source'] === undefined) {
    normalized['source'] = data['ownership'];
  }

  const transactionType = normalizeTransactionType(data['transactionType']);
  const propertyType = normalizePropertyType(data['propertyType'] || data['category']);
  const direction = normalizeDirection(data['direction']);
  
  if (transactionType) normalized.transactionType = transactionType;
  if (propertyType) normalized.propertyType = propertyType;
  if (direction) normalized.direction = direction;
  
  if (normalized['price'] !== undefined && normalized['price'] !== null) normalized['price'] = Number(normalized['price']);
  if (normalized['area'] !== undefined && normalized['area'] !== null) normalized['area'] = Number(normalized['area']);
  if (normalized['priceMin'] !== undefined && normalized['priceMin'] !== null) normalized['priceMin'] = Number(normalized['priceMin']);
  if (normalized['priceMax'] !== undefined && normalized['priceMax'] !== null) normalized['priceMax'] = Number(normalized['priceMax']);
  if (normalized['areaMin'] !== undefined && normalized['areaMin'] !== null) normalized['areaMin'] = Number(normalized['areaMin']);
  if (normalized['areaMax'] !== undefined && normalized['areaMax'] !== null) normalized['areaMax'] = Number(normalized['areaMax']);
  if (normalized['pricePerM2'] !== undefined && normalized['pricePerM2'] !== null) normalized['pricePerM2'] = Number(normalized['pricePerM2']);
  if (normalized['lat'] !== undefined && normalized['lat'] !== null) normalized['lat'] = Number(normalized['lat']);
  if (normalized['lng'] !== undefined && normalized['lng'] !== null) normalized['lng'] = Number(normalized['lng']);
  
  const parseNumeric = (val: any) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const match = val.match(/\d+(\.\d+)?/);
      if (match) return Number(match[0]);
    }
    return null;
  };

  if (normalized['bedrooms'] !== undefined && normalized['bedrooms'] !== null) normalized['bedrooms'] = parseNumeric(normalized['bedrooms']);
  if (normalized['bathrooms'] !== undefined && normalized['bathrooms'] !== null) normalized['bathrooms'] = parseNumeric(normalized['bathrooms']);
  if (normalized['floors'] !== undefined && normalized['floors'] !== null) normalized['floors'] = parseNumeric(normalized['floors']);
  if (normalized['frontage'] !== undefined && normalized['frontage'] !== null) normalized['frontage'] = parseNumeric(normalized['frontage']);
  if (normalized['accessRoad'] !== undefined && normalized['accessRoad'] !== null) normalized['accessRoad'] = parseNumeric(normalized['accessRoad']);
  if (normalized['roadWidth'] !== undefined && normalized['roadWidth'] !== null) normalized['roadWidth'] = parseNumeric(normalized['roadWidth']);
  if (Array.isArray(normalized['images'])) {
    normalized['images'] = normalized['images'].filter((image: unknown) => typeof image === 'string' && image.trim());
  }
  return normalized;
}

function toNumber(value: any) {
  if (value === undefined || value === null || value === '') return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function applyRangeAlias(filters: NormalizedFilters, key: 'price' | 'area', value?: string) {
  if (!value) return;
  const normalized = value.trim();
  const targetMin = key === 'price' ? 'minPrice' : 'minArea';
  const targetMax = key === 'price' ? 'maxPrice' : 'maxArea';
  const multiplier = key === 'price' ? 1_000_000 : 1;

  if (normalized.startsWith('<')) {
    filters[targetMax] = Number(normalized.slice(1)) * multiplier;
    return;
  }
  if (normalized.startsWith('>')) {
    filters[targetMin] = Number(normalized.slice(1)) * multiplier;
    return;
  }
  const [min, max] = normalized.split('-').map(Number);
  if (Number.isFinite(min)) filters[targetMin] = min * multiplier;
  if (Number.isFinite(max)) filters[targetMax] = max * multiplier;
}

import { PRICE_RANGES_SELL, PRICE_RANGES_RENT, AREA_RANGES } from '../constants/ranges';

export function applyRangeKeys(data: Record<string, any>) {
  if (data.priceRangeKey) {
    const ranges = data.transactionType === 'CHO_THUE' ? PRICE_RANGES_RENT : PRICE_RANGES_SELL;
    const range = ranges.find(r => r.key === data.priceRangeKey);
    if (range) {
      data.priceMin = range.min;
      data.priceMax = range.max;
    }
  }

  if (data.areaRangeKey) {
    const range = AREA_RANGES.find(r => r.key === data.areaRangeKey);
    if (range) {
      data.areaMin = range.min;
      data.areaMax = range.max;
    }
  }

  if (!data.priceRangeKey && data.price !== undefined && data.price !== null) {
    if (data.priceMin === undefined || data.priceMin === null) data.priceMin = data.price;
    if (data.priceMax === undefined || data.priceMax === null) data.priceMax = data.price;
  }
  if (!data.areaRangeKey && data.area !== undefined && data.area !== null) {
    if (data.areaMin === undefined || data.areaMin === null) data.areaMin = data.area;
    if (data.areaMax === undefined || data.areaMax === null) data.areaMax = data.area;
  }

  // Calculate pricePerM2 if possible, skip if negotiable
  if (data.isNegotiable) {
    data.price = null;
    data.priceMin = null;
    data.priceMax = null;
    data.pricePerM2 = null;
    data.pricePerM2Display = 'Giá thỏa thuận';
  } else {
    const pricePerM2 = calculatePricePerM2(data.priceMin, data.priceMax, data.areaMin, data.areaMax);
    if (pricePerM2) {
      data.pricePerM2 = pricePerM2;
      data.pricePerM2Display = formatPricePerM2(pricePerM2);
    } else {
      data.pricePerM2 = null;
      data.pricePerM2Display = '-';
    }
  }
}

function applySeoPriceAlias(filters: NormalizedFilters, value?: string) {
  if (!value) return;
  if (value === 'duoi-1-ty') filters.maxPrice = 1_000_000_000;
  if (value === '1-2-ty') {
    filters.minPrice = 1_000_000_000;
    filters.maxPrice = 2_000_000_000;
  }
  if (value === '2-3-ty') {
    filters.minPrice = 2_000_000_000;
    filters.maxPrice = 3_000_000_000;
  }
  if (value === 'tren-3-ty') filters.minPrice = 3_000_000_000;
}

export function normalizeSearchFilters(query: Record<string, any>): NormalizedFilters {
  const filters: NormalizedFilters = {
    q: query.q || undefined,
    transactionType: normalizeTransactionType(query.transactionType || query.type),
    propertyType: normalizePropertyType(query.propertyType || query.category),
    city: query.city || undefined,
    district: query.district || undefined,
    ward: query.ward || undefined,
    oldWard: query.oldWard || undefined,
    direction: normalizeDirection(query.direction),
    sort: query.sort || undefined,
    page: Math.max(1, toNumber(query.page) || 1),
    limit: Math.min(100, Math.max(1, toNumber(query.limit) || 20)),
    minPrice: toNumber(query.minPrice),
    maxPrice: toNumber(query.maxPrice),
    minArea: toNumber(query.minArea),
    maxArea: toNumber(query.maxArea),
    priceRangeKey: query.priceRangeKey || undefined,
    areaRangeKey: query.areaRangeKey || undefined,
    locationId: query.locationId || undefined,
    provinceId: query.provinceId || undefined,
    districtId: query.districtId || undefined,
    wardId: query.wardId || undefined,
    tier: query.tier === 'VIP' || query.tier === 'UP' ? query.tier : undefined,
  };

  if (query.location) {
    filters.location = LOCATION_SLUGS[String(query.location)] || String(query.location);
  }
  if (filters.location && !filters.ward && filters.location.startsWith('Phường')) {
    filters.ward = filters.location;
  }

  // Parse range keys if provided
  if (filters.priceRangeKey) {
    const ranges = filters.transactionType === 'CHO_THUE' ? PRICE_RANGES_RENT : PRICE_RANGES_SELL;
    const range = ranges.find(r => r.key === filters.priceRangeKey);
    if (range) {
      if (range.min !== null) filters.minPrice = range.min;
      if (range.max !== null) filters.maxPrice = range.max;
    }
  } else {
    applyRangeAlias(filters, 'price', query.price);
  }

  if (filters.areaRangeKey) {
    const range = AREA_RANGES.find(r => r.key === filters.areaRangeKey);
    if (range) {
      if (range.min !== null) filters.minArea = range.min;
      if (range.max !== null) filters.maxArea = range.max;
    }
  } else {
    applyRangeAlias(filters, 'area', query.area);
  }

  applySeoPriceAlias(filters, query.gia);

  return filters;
}

export function buildPrismaWhere(filters: NormalizedFilters): PropertyWhereInput {
  const where: PropertyWhereInput = { status: { in: ['APPROVED', 'SOLD'] }, deletedAt: null };
  const and: PropertyWhereInput[] = [];

  const txVariants = transactionTypeVariants(filters.transactionType);
  if (txVariants.length) and.push({ transactionType: { in: txVariants } });

  const propertyVariants = propertyTypeVariants(filters.propertyType);
  if (propertyVariants.length) and.push({ propertyType: { in: propertyVariants } });

  if (filters.city) and.push({ city: { equals: filters.city, mode: 'insensitive' } });
  if (filters.district) and.push({ district: { equals: filters.district, mode: 'insensitive' } });
  if (filters.ward) and.push({ ward: { startsWith: filters.ward, mode: 'insensitive' } });
  if (filters.oldWard) and.push({ oldWard: { equals: filters.oldWard, mode: 'insensitive' } });
  if (filters.direction) and.push({ direction: filters.direction });
  if (filters.locationId) and.push({ locationId: filters.locationId } as any);
  if (filters.provinceId) and.push({ provinceId: filters.provinceId } as any);
  if (filters.districtId) and.push({ districtId: filters.districtId } as any);
  if (filters.wardId) and.push({ wardId: filters.wardId } as any);
  
  const hasPriceFilter = filters.minPrice !== undefined || filters.maxPrice !== undefined || filters.priceRangeKey;
  if (hasPriceFilter) {
    and.push({ isNegotiable: false } as any);
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const priceConditions: any[] = [];
    if (filters.minPrice !== undefined) priceConditions.push({ priceMax: { gte: filters.minPrice } });
    if (filters.maxPrice !== undefined) priceConditions.push({ priceMin: { lte: filters.maxPrice } });
    
    and.push({
      OR: [
        { price: { gte: filters.minPrice ?? 0, lte: filters.maxPrice ?? Number.MAX_SAFE_INTEGER } },
        { AND: priceConditions }
      ]
    });
  }

  if (filters.minArea !== undefined || filters.maxArea !== undefined) {
    const areaConditions: any[] = [];
    if (filters.minArea !== undefined) areaConditions.push({ areaMax: { gte: filters.minArea } });
    if (filters.maxArea !== undefined) areaConditions.push({ areaMin: { lte: filters.maxArea } });
    
    and.push({
      OR: [
        { area: { gte: filters.minArea ?? 0, lte: filters.maxArea ?? Number.MAX_SAFE_INTEGER } },
        { AND: areaConditions }
      ]
    });
  }

  const text = filters.q || filters.location;
  if (text) {
    const words = text.split(/\s+/).filter(Boolean);
    const slugConditions = words.map(word => ({ slug: { contains: slugify(word), mode: 'insensitive' } }));

    and.push({
      OR: [
        { title: { contains: text, mode: 'insensitive' } },
        { description: { contains: text, mode: 'insensitive' } },
        { city: { contains: text, mode: 'insensitive' } },
        { district: { contains: text, mode: 'insensitive' } },
        { ward: { equals: text, mode: 'insensitive' } },
        { street: { contains: text, mode: 'insensitive' } },
        ...(slugConditions.length > 0 ? [{ AND: slugConditions }] : []),
      ],
    });
  }

  return and.length ? { ...where, AND: and } : where;
}

function escapeMeili(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function meiliStringFilter(attribute: string, values: string[]) {
  if (!values.length) return undefined;
  return values.map((value) => `${attribute} = "${escapeMeili(value)}"`).join(' OR ');
}

export function buildMeiliFilters(filters: NormalizedFilters) {
  const clauses: string[] = ['(status = "APPROVED" OR status = "SOLD")', 'deletedAt IS NULL'];
  const txFilter = meiliStringFilter('transactionType', transactionTypeVariants(filters.transactionType));
  const propertyFilter = meiliStringFilter('propertyType', propertyTypeVariants(filters.propertyType));
  if (txFilter) clauses.push(`(${txFilter})`);
  if (propertyFilter) clauses.push(`(${propertyFilter})`);
  if (filters.city) clauses.push(`city = "${escapeMeili(filters.city)}"`);
  if (filters.district) clauses.push(`district = "${escapeMeili(filters.district)}"`);
  if (filters.ward) clauses.push(`ward = "${escapeMeili(filters.ward)}"`);
  if (filters.oldWard) clauses.push(`oldWard = "${escapeMeili(filters.oldWard)}"`);
  if (filters.direction) clauses.push(`direction = "${escapeMeili(filters.direction)}"`);
  if (filters.locationId) clauses.push(`locationId = "${escapeMeili(filters.locationId)}"`);
  if (filters.provinceId) clauses.push(`provinceId = "${escapeMeili(filters.provinceId)}"`);
  if (filters.districtId) clauses.push(`districtId = "${escapeMeili(filters.districtId)}"`);
  if (filters.wardId) clauses.push(`wardId = "${escapeMeili(filters.wardId)}"`);

  const hasPriceFilter = filters.minPrice !== undefined || filters.maxPrice !== undefined || filters.priceRangeKey;
  if (hasPriceFilter) {
    clauses.push(`isNegotiable = false`);
  }

  if (filters.minPrice !== undefined) clauses.push(`(price >= ${filters.minPrice} OR priceMax >= ${filters.minPrice})`);
  if (filters.maxPrice !== undefined) clauses.push(`(price <= ${filters.maxPrice} OR priceMin <= ${filters.maxPrice})`);
  if (filters.minArea !== undefined) clauses.push(`(area >= ${filters.minArea} OR areaMax >= ${filters.minArea})`);
  if (filters.maxArea !== undefined) clauses.push(`(area <= ${filters.maxArea} OR areaMin <= ${filters.maxArea})`);
  return clauses.length ? [clauses.join(' AND ')] : undefined;
}

export function buildMeiliSort(sort?: string) {
  if (sort === 'price_asc') return ['priceMin:asc', 'price:asc'];
  if (sort === 'price_desc') return ['priceMax:desc', 'price:desc'];
  if (sort === 'area_asc') return ['areaMin:asc', 'area:asc'];
  if (sort === 'area_desc') return ['areaMax:desc', 'area:desc'];
  if (sort === 'price_per_m2_asc') return ['pricePerM2:asc'];
  if (sort === 'price_per_m2_desc') return ['pricePerM2:desc'];
  return ['pushedAt:desc', 'publishedAt:desc'];
}

export function buildPrismaOrder(sort?: string): any {
  if (sort === 'price_asc') return [{ status: 'asc' }, { priceMin: { sort: 'asc', nulls: 'last' } }, { price: { sort: 'asc', nulls: 'last' } }];
  if (sort === 'price_desc') return [{ status: 'asc' }, { priceMax: { sort: 'desc', nulls: 'last' } }, { price: { sort: 'desc', nulls: 'last' } }];
  if (sort === 'area_asc') return [{ status: 'asc' }, { areaMin: { sort: 'asc', nulls: 'last' } }, { area: { sort: 'asc', nulls: 'last' } }];
  if (sort === 'area_desc') return [{ status: 'asc' }, { areaMax: { sort: 'desc', nulls: 'last' } }, { area: { sort: 'desc', nulls: 'last' } }];
  if (sort === 'price_per_m2_asc') return [{ status: 'asc' }, { pricePerM2: { sort: 'asc', nulls: 'last' } }];
  if (sort === 'price_per_m2_desc') return [{ status: 'asc' }, { pricePerM2: { sort: 'desc', nulls: 'last' } }];
  return [{ status: 'asc' }, { pushedAt: { sort: 'desc', nulls: 'last' } }, { publishedAt: { sort: 'desc', nulls: 'last' } }];
}
