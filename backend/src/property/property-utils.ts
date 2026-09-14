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
  /** Lọc tin thuộc một dự án cụ thể — dùng cho trang /du-an/{slug}-{shortCode}. */
  projectId?: string;
  /**
   * Khu vực của TRANG ĐANG XEM, khớp theo MÃ (id) — dùng thay `city/district/ward/oldWard`
   * (tên chữ) khi backend đã tra được đúng một dòng `Location`.
   *
   * Lý do có trường riêng: 35 tên xã/phường trùng nhau giữa các huyện/tỉnh (vd "Xã Nghi
   * Phong" có ở cả Huyện Nghi Lộc lẫn TP Vinh). `filters.ward`/`filters.oldWard` so theo TÊN
   * nên trang của xã này hiện luôn tin của xã trùng tên — khách báo 12/9 "khu vực thỉnh
   * thoảng lấy tin của khu vực khác". Đo trên site thật: `/ha-huy-tap-ha-tinh-2` (Hà Tĩnh)
   * hiện 6 tin, CẢ 6 đều là tin TP Vinh.
   *
   * `districtId` (chỉ áp cho WARD/OLD_WARD) là huyện CHA của khu vực đang xem, dùng làm
   * phạm vi khi phải lùi về khớp theo tên cho ~40 tin nhập tay từ trước, chưa có
   * `wardId`/`oldWardId` — lùi về tên NHƯNG vẫn khoanh đúng huyện, không mở lại lỗ hổng.
   */
  locationMatch?: {
    type: 'CITY' | 'DISTRICT' | 'WARD' | 'OLD_WARD';
    id: string;
    name: string;
    districtId?: string;
  };
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

/**
 * Giá trên mỗi m². ĐÂY LÀ NƠI DUY NHẤT tính đại lượng này.
 *
 * Khách báo "chưa thống nhất giá/m2": card ở trang chủ/chuyên mục lấy giá trị backend
 * tính, còn trang chi tiết TỰ TÍNH LẠI bằng một công thức khác. Hai bên lệch nhau ở
 * ba điểm: backend luôn lấy trung bình khoảng còn trang chi tiết ưu tiên giá/diện tích
 * chính xác; backend làm tròn về số nguyên còn trang chi tiết giữ một chữ số thập phân
 * (2,95 tỷ/100m² ra "30 triệu/m²" ở card nhưng "29,5 triệu/m²" ở trang chi tiết); và
 * backend trả "-" cho mọi mức dưới 1 triệu/m².
 *
 * Quy tắc chốt: ƯU TIÊN giá và diện tích CHÍNH XÁC. Chỉ khi thiếu mới lùi về trung
 * điểm khoảng — con số chính xác luôn đáng tin hơn trung bình của một khoảng.
 */
export function calculatePricePerM2(
  priceMin?: number | null,
  priceMax?: number | null,
  areaMin?: number | null,
  areaMax?: number | null,
  exactPrice?: number | null,
  exactArea?: number | null,
): number | null {
  const price =
    exactPrice !== undefined && exactPrice !== null && exactPrice > 0
      ? exactPrice
      : priceMin !== undefined && priceMin !== null && priceMax !== undefined && priceMax !== null
        ? (priceMin + priceMax) / 2
        : null;

  const area =
    exactArea !== undefined && exactArea !== null && exactArea > 0
      ? exactArea
      : areaMin !== undefined && areaMin !== null && areaMax !== undefined && areaMax !== null
        ? (areaMin + areaMax) / 2
        : null;

  if (price === null || area === null || area <= 0 || price <= 0) return null;
  return price / area;
}

/**
 * Định dạng giá/m². Đi kèm `calculatePricePerM2` — mọi nơi hiển thị đều phải qua đây.
 *
 * Giữ MỘT chữ số thập phân ở đơn vị triệu: làm tròn về số nguyên khiến 29,5 thành 30,
 * lệch 1,7% và lệch hẳn với con số trang chi tiết đang hiện.
 * Dưới 1 triệu/m² đổi sang "nghìn/m²" thay vì trả "-": đất nông thôn 800 nghìn/m² là
 * mức có thật, trả "-" là giấu mất thông tin đúng.
 */
export function formatPricePerM2(pricePerM2?: number | null): string {
  if (!pricePerM2 || pricePerM2 <= 0) return '-';
  // Ngoài dải này gần như chắc chắn do nhập sai đơn vị -> không hiển thị con số sai.
  if (pricePerM2 < 500_000 || pricePerM2 > 9_999_000_000) return '-';
  if (pricePerM2 < 1_000_000) {
    return `≈ ${Math.round(pricePerM2 / 1000)} nghìn/m²`;
  }
  const trieu = (pricePerM2 / 1_000_000).toFixed(1).replace(/\.0$/, '').replace('.', ',');
  return `≈ ${trieu} triệu/m²`;
}

/** Chuỗi hiển thị khi tin để giá thoả thuận. Dùng chung để hai nơi không viết khác nhau. */
export const PRICE_NEGOTIABLE_LABEL = 'Giá thỏa thuận';

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
    'projectId',
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
    'oldWardId',
    // SĐT riêng của tin. Form đăng tin gửi field này từ lâu nhưng nó chưa từng nằm trong
    // danh sách cho phép nên bị loại âm thầm (khách phản hồi 19-8 mục 20).
    'phone',
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

/**
 * Khi tin chọn một dự án có sẵn (mục 9, PHẦN I), 7 trường địa điểm phải lấy từ CHÍNH dự
 * án chứ không nhận từ client — 4 field địa điểm trên form đã bị khoá (disabled) phía
 * frontend, nên nếu tin vẫn ghi đè bằng payload client gửi thì một request giả mạo có
 * thể gắn tin vào dự án A nhưng địa điểm lại là B.
 *
 * Tách khỏi PropertyService (thay vì để private method) để unit test được độc lập —
 * PropertyService có 7 dependency (queue, cache, search, notification...) không đáng
 * phải mock chỉ để kiểm tra logic copy địa điểm này.
 */
export async function applyProjectLocation(
  prisma: { project: { findUnique: (args: { where: { id: string } }) => Promise<any> } },
  data: Record<string, any>,
): Promise<Record<string, any>> {
  if (!data.projectId) {
    // Client gửi projectId rỗng ('') nghĩa là "gỡ khỏi dự án" (VD: đổi loại BĐS khỏi
    // DU_AN lúc sửa tin) -- phải ghi NULL tường minh, không được để nguyên chuỗi rỗng
    // lọt xuống Prisma vì cột có FK tới Project.id, '' không khớp NULL cũng không khớp
    // dự án nào nên sẽ vỡ ràng buộc khoá ngoại.
    if ('projectId' in data) return { ...data, projectId: null };
    return data;
  }

  const project = await prisma.project.findUnique({ where: { id: data.projectId } });
  if (!project || project.status !== 'VISIBLE') {
    const { projectId, ...rest } = data;
    return rest;
  }
  return {
    ...data,
    projectId: project.id,
    city: project.city,
    district: project.district,
    ward: project.ward,
    oldWard: project.oldWard,
    provinceId: project.provinceId,
    districtId: project.districtId,
    wardId: project.wardId,
  };
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

import { PRICE_RANGES_SELL, PRICE_RANGES_RENT, AREA_RANGES, rangeKeyForValue } from '../constants/ranges';

export function applyRangeKeys(data: Record<string, any>) {
  // Ưu tiên GIÁ/DIỆN TÍCH CỤ THỂ khi người đăng vừa gõ giá trị vừa chọn một nhãn khoảng
  // lệch nhau — quyết định đã chốt với khách 12/9, sau khi rà lỗi "Kiểm duyệt tin gõ 'Giá
  // cụ thể' 1,4 tỷ nhưng ô 'Khoảng giá' vẫn ghi 2-3 tỷ": KHÔNG tin nhãn khoảng người đăng tự
  // chọn khi đã có con số chính xác, tự tính lại khoảng đúng theo con số đó. Diện tích cùng
  // một quy tắc. Tin thoả thuận (`isNegotiable`) không có giá thật nên bỏ qua bước này.
  if (!data.isNegotiable && data.price !== undefined && data.price !== null) {
    const priceRanges = data.transactionType === 'CHO_THUE' ? PRICE_RANGES_RENT : PRICE_RANGES_SELL;
    const computedPriceKey = rangeKeyForValue(priceRanges, Number(data.price));
    if (computedPriceKey) data.priceRangeKey = computedPriceKey;
  }
  if (data.area !== undefined && data.area !== null) {
    const computedAreaKey = rangeKeyForValue(AREA_RANGES, Number(data.area));
    if (computedAreaKey) data.areaRangeKey = computedAreaKey;
  }

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
    data.pricePerM2Display = PRICE_NEGOTIABLE_LABEL;
  } else {
    const pricePerM2 = calculatePricePerM2(
      data.priceMin, data.priceMax, data.areaMin, data.areaMax, data.price, data.area,
    );
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

  // Trước đây có bảng LOCATION_SLUGS hard-code 6 phường của TP Vinh để đổi slug thành
  // tên phường. Với dữ liệu đa tỉnh thì bảng đó vô nghĩa; slug -> khu vực giờ tra qua
  // /locations/resolve. Giá trị không nhận diện được rơi về tìm kiếm toàn văn (dòng ~525).
  if (query.location) {
    filters.location = String(query.location);
  }
  if (filters.location && !filters.ward && filters.location.startsWith('Phường')) {
    filters.ward = filters.location;
  }

  // Parse range keys if provided.
  //
  // Mã khoảng giá tự nói lên đây là khoảng BÁN hay THUÊ — tìm ở CẢ HAI bảng thay vì chỉ
  // bảng ứng với `transactionType` hiện có, rồi LẤY LUÔN transactionType đó, không phụ
  // thuộc `transactionType` gửi kèm. Thiếu bước này thì lọc một mã khoảng THUÊ (vd
  // "1M_3M") mà không kèm đúng `transactionType=CHO_THUE` sẽ không tìm thấy mã ở bảng bán,
  // priceRangeKey coi như "không nhận diện được" và bộ lọc mất tác dụng — khách báo 12/9
  // "bộ lọc giá đã hoạt động, nhưng vẫn lọc lấy dữ liệu ngoài khoảng cần lọc" một phần chính
  // là trộn lẫn giá bán/thuê kiểu này (đo trên site: lọc "Dưới 500 triệu" lẫn cả tin cho
  // thuê 7 triệu/tháng). Ngoại lệ "THOA_THUAN": tồn tại giống hệt ở cả 2 bảng nên không suy
  // được giao dịch, xử lý riêng ở `buildPrismaWhere`/`buildMeiliFilters`.
  if (filters.priceRangeKey) {
    if (filters.priceRangeKey === 'THOA_THUAN') {
      // Không set minPrice/maxPrice (đều null) — nhánh THOA_THUAN lọc bằng chính nhãn này.
    } else {
      const sellRange = PRICE_RANGES_SELL.find((r) => r.key === filters.priceRangeKey);
      const rentRange = PRICE_RANGES_RENT.find((r) => r.key === filters.priceRangeKey);
      const range = sellRange ?? rentRange;
      if (range) {
        if (range.min !== null) filters.minPrice = range.min;
        if (range.max !== null) filters.maxPrice = range.max;
        filters.transactionType = sellRange ? 'BAN' : 'CHO_THUE';
      } else {
        // Mã không tồn tại ở bảng nào (vd link cũ `priceRangeKey=LT_1B`) — bỏ qua thay vì để
        // lại một mình điều kiện "không thoả thuận" trông như đang lọc nhưng thực ra trả về
        // gần như mọi tin.
        filters.priceRangeKey = undefined;
        applyRangeAlias(filters, 'price', query.price);
      }
    }
  } else {
    applyRangeAlias(filters, 'price', query.price);
  }

  if (filters.areaRangeKey) {
    const range = AREA_RANGES.find(r => r.key === filters.areaRangeKey);
    if (range) {
      if (range.min !== null) filters.minArea = range.min;
      if (range.max !== null) filters.maxArea = range.max;
    } else {
      filters.areaRangeKey = undefined;
      applyRangeAlias(filters, 'area', query.area);
    }
  } else {
    applyRangeAlias(filters, 'area', query.area);
  }

  applySeoPriceAlias(filters, query.gia);

  return filters;
}

/**
 * Mệnh đề lọc theo khu vực khi backend đã tra được đúng một dòng `Location` — xem giải
 * thích đầy đủ ở khai báo `NormalizedFilters.locationMatch`.
 *
 * WARD/OLD_WARD: ưu tiên khớp mã (`wardId`/`oldWardId`); tin CHƯA CÓ mã mới lùi về khớp
 * tên, và bắt buộc kèm đúng `districtId` cha để không mở lại lỗ hổng tên trùng giữa các
 * huyện/tỉnh (khách báo 12/9: `/ha-huy-tap-ha-tinh-2` hiện nhầm tin TP Vinh).
 */
export function locationMatchWhere(match: NonNullable<NormalizedFilters['locationMatch']>): any {
  if (match.type === 'CITY') return { provinceId: match.id };
  if (match.type === 'DISTRICT') return { districtId: match.id };

  const idField = match.type === 'WARD' ? 'wardId' : 'oldWardId';
  const nameField = match.type === 'WARD' ? 'ward' : 'oldWard';
  const byNameFallback: any[] = [{ [idField]: null }, { [nameField]: { equals: match.name, mode: 'insensitive' } }];
  if (match.districtId) byNameFallback.push({ districtId: match.districtId });

  return {
    OR: [{ [idField]: match.id }, { AND: byNameFallback }],
  };
}

/**
 * Lọc theo khoảng giá / khoảng diện tích.
 *
 * ## Đợt vá 26/08: `priceMin/priceMax` KHÔNG phải khoảng giá của tin
 *
 * Chúng là **biên của bucket** mà tin rơi vào — tin giá 11 tỷ có `priceMin=10 tỷ,
 * priceMax=20 tỷ`; tin 95 m² có `areaMin=80, areaMax=100`. Coi chúng như một khoảng thật rồi
 * ghép OR với giá chính xác khiến MỌI tin có bucket giao với khoảng người dùng hỏi đều lọt,
 * kể cả khi giá thật nằm ngoài (lọc 1–2 tỷ ra 40/75 tin sai — khách báo 25/08).
 *
 * ## Đợt vá 12/9: GIAO NHAU vẫn còn rộng hơn khách muốn
 *
 * Sau đợt vá trên, tin CHỈ CÓ NHÃN (không giá chính xác) vẫn lọt sang khoảng KỀ BÊN vì
 * "giao nhau" quá rộng — tin dán nhãn "2-3 tỷ" (bucket priceMin=2 tỷ, priceMax=3 tỷ) vẫn
 * khớp khi lọc "1-2 tỷ" vì hai bucket CHẠM NHAU ở mốc 2 tỷ. Khách báo 12/9: "bộ lọc giá đã
 * hoạt động, nhưng vẫn lọc lấy dữ liệu ngoài khoảng cần lọc".
 *
 * Từ đây, nhánh KHÔNG CÓ giá chính xác tách hai trường hợp:
 *   - Bộ lọc ứng với một MÃ KHOẢNG CỐ ĐỊNH (`rangeKey`, vd người dùng chọn "1-2 tỷ" từ danh
 *     sách): khớp khi nhãn của tin TRÙNG HỆT mã đó — không còn so giao bucket.
 *   - Bộ lọc là một khoảng TUỲ CHỈNH (không qua mã, vd `?gia=1-2-ty` hay `?price=1-2`, không
 *     biết mã tương ứng): khớp khi bucket của tin NẰM TRỌN trong khoảng hỏi (subset), chặt
 *     hơn "giao nhau" nên không còn dính lỗi chạm biên.
 *
 * ## Vì sao không xoá hẳn vế "không có giá chính xác"
 *
 * Có tin CHỈ có bucket mà không có giá chính xác — người đăng chọn "khoảng giá" thay vì
 * nhập số. Xoá vế này là mất hẳn nhóm đó khỏi mọi bộ lọc.
 *
 * Hai nhánh (có giá / không có giá) loại trừ nhau qua điều kiện `[exact]: null`, không nhánh
 * nào cứu được tin mà nhánh kia đã loại đúng — đúng quyết định khách chốt 12/9: "tin có giá
 * cụ thể thì tính theo giá cụ thể", bất kể nhãn khoảng tin đó đang ghi gì.
 */
function rangeWhere(
  exact: 'price' | 'area',
  lowField: 'priceMin' | 'areaMin',
  highField: 'priceMax' | 'areaMax',
  rangeKeyField: 'priceRangeKey' | 'areaRangeKey',
  min?: number,
  max?: number,
  rangeKey?: string,
): any {
  const exactRange: any = {};
  if (min !== undefined) exactRange.gte = min;
  if (max !== undefined) exactRange.lte = max;

  const bucket: any[] = [{ [exact]: null }];
  if (rangeKey) {
    bucket.push({ [rangeKeyField]: rangeKey });
  } else {
    if (min !== undefined) bucket.push({ [lowField]: { gte: min } });
    if (max !== undefined) bucket.push({ [highField]: { lte: max } });
  }

  return {
    OR: [
      { [exact]: exactRange },
      { AND: bucket },
    ],
  };
}

export function buildPrismaWhere(filters: NormalizedFilters): PropertyWhereInput {
  const where: PropertyWhereInput = { status: { in: ['APPROVED', 'SOLD'] }, deletedAt: null };
  const and: PropertyWhereInput[] = [];

  const txVariants = transactionTypeVariants(filters.transactionType);
  if (txVariants.length) and.push({ transactionType: { in: txVariants } });

  const propertyVariants = propertyTypeVariants(filters.propertyType);
  if (propertyVariants.length) and.push({ propertyType: { in: propertyVariants } });

  if (filters.locationMatch) {
    and.push(locationMatchWhere(filters.locationMatch));
  } else {
    // Đường lui cho những chỗ chưa chuyển sang `locationMatch` (vd `/search` với tham số
    // city/district/ward gửi thẳng tên chữ từ `SidebarFilter`) — xem cảnh báo trên khai báo
    // `locationMatch` trong `NormalizedFilters` về vì sao khớp theo tên có thể lẫn khu vực.
    if (filters.city) and.push({ city: { equals: filters.city, mode: 'insensitive' } });
    if (filters.district) and.push({ district: { equals: filters.district, mode: 'insensitive' } });
    if (filters.ward) and.push({ ward: { startsWith: filters.ward, mode: 'insensitive' } });
    if (filters.oldWard) and.push({ oldWard: { equals: filters.oldWard, mode: 'insensitive' } });
  }
  if (filters.direction) and.push({ direction: filters.direction });
  if (filters.locationId) and.push({ locationId: filters.locationId } as any);
  if (filters.provinceId) and.push({ provinceId: filters.provinceId } as any);
  if (filters.districtId) and.push({ districtId: filters.districtId } as any);
  if (filters.wardId) and.push({ wardId: filters.wardId } as any);
  if (filters.projectId) and.push({ projectId: filters.projectId } as any);

  if (filters.priceRangeKey === 'THOA_THUAN') {
    // Khách chốt 12/9: "Thỏa thuận" chỉ trả tin thỏa thuận, không phải mọi tin có giá.
    and.push({ priceRangeKey: 'THOA_THUAN' } as any);
  } else {
    const hasPriceFilter = filters.minPrice !== undefined || filters.maxPrice !== undefined;
    if (hasPriceFilter) {
      and.push({ isNegotiable: false } as any);
      and.push(
        rangeWhere('price', 'priceMin', 'priceMax', 'priceRangeKey', filters.minPrice, filters.maxPrice, filters.priceRangeKey),
      );
    }
  }

  if (filters.minArea !== undefined || filters.maxArea !== undefined) {
    and.push(
      rangeWhere('area', 'areaMin', 'areaMax', 'areaRangeKey', filters.minArea, filters.maxArea, filters.areaRangeKey),
    );
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

/**
 * Bản Meilisearch của `rangeWhere` — xem giải thích đầy đủ ở đó (đợt vá 26/08 và 12/9).
 *
 * Bản 26/08 gộp min/max thành một mệnh đề hai nhánh loại trừ nhau (có giá / không có giá),
 * thay vì hai mệnh đề AND rời khiến tin thoả vế trái bằng `price` rồi thoả vế phải bằng
 * `priceMin`. Bản 12/9 sửa tiếp nhánh "không có giá": trước đó xét GIAO NHAU giữa bucket của
 * tin và khoảng hỏi, nên hai bucket kề nhau (1-2 tỷ / 2-3 tỷ) vẫn lẫn vào nhau ở mốc chung.
 * Nay nhánh đó tách hai trường hợp — có `rangeKey` (mã khoảng cố định) thì so NHÃN, không có
 * thì so bucket NẰM TRỌN trong khoảng hỏi (subset).
 *
 * `IS NULL` cần Meilisearch >= 1.2; bản đang chạy là 1.7.6.
 */
function meiliRangeClause(
  exact: string,
  lowField: string,
  highField: string,
  rangeKeyField: string,
  min?: number,
  max?: number,
  rangeKey?: string,
): string | undefined {
  if (min === undefined && max === undefined) return undefined;

  const exactParts: string[] = [];
  if (min !== undefined) exactParts.push(`${exact} >= ${min}`);
  if (max !== undefined) exactParts.push(`${exact} <= ${max}`);

  const bucketParts: string[] = [`${exact} IS NULL`];
  if (rangeKey) {
    bucketParts.push(`${rangeKeyField} = "${escapeMeili(rangeKey)}"`);
  } else {
    // Subset — bucket của tin nằm TRỌN trong khoảng hỏi — chứ không phải giao nhau (đã sửa
    // lỗi này 1 lần ở nhánh Prisma cùng đợt; nhánh Meili đây lúc đầu vẫn sót overlap
    // `highField >= min` / `lowField <= max`, tự bắt lại bằng test `range-filter.spec.ts`).
    if (min !== undefined) bucketParts.push(`${lowField} >= ${min}`);
    if (max !== undefined) bucketParts.push(`${highField} <= ${max}`);
  }

  return `((${exactParts.join(' AND ')}) OR (${bucketParts.join(' AND ')}))`;
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

  if (filters.priceRangeKey === 'THOA_THUAN') {
    clauses.push(`priceRangeKey = "THOA_THUAN"`);
  } else {
    const hasPriceFilter = filters.minPrice !== undefined || filters.maxPrice !== undefined;
    if (hasPriceFilter) {
      clauses.push(`isNegotiable = false`);
      const priceClause = meiliRangeClause(
        'price', 'priceMin', 'priceMax', 'priceRangeKey', filters.minPrice, filters.maxPrice, filters.priceRangeKey,
      );
      if (priceClause) clauses.push(priceClause);
    }
  }

  const areaClause = meiliRangeClause(
    'area', 'areaMin', 'areaMax', 'areaRangeKey', filters.minArea, filters.maxArea, filters.areaRangeKey,
  );
  if (areaClause) clauses.push(areaClause);
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
