/**
 * Từ vựng URL duy nhất của site: loại giao dịch và loại bất động sản.
 *
 * Trước đây có HAI danh sách danh mục lệch nhau — `CATEGORIES` ở
 * `app/[...slug]/page.tsx` và `categoryCandidates` ở `property.service.ts` — nên
 * `biet-thu` chạy được ở frontend nhưng backend không nhận, còn `nha-mat-pho` được
 * frontend coi là danh mục riêng dù enum không hề có `NHA_MAT_PHO`.
 *
 * P4 sẽ dùng file này làm nguồn cho `parseListingPath`.
 */

export type TransactionEnum = 'BAN' | 'CHO_THUE';
export type PropertyTypeEnum =
  | 'DAT_NEN'
  | 'NHA_RIENG'
  | 'CHUNG_CU'
  | 'DU_AN'
  | 'MAT_BANG'
  | 'BIET_THU'
  | 'BDS_KHAC';

export interface TransactionDef {
  slug: string;
  enum: TransactionEnum;
  label: string;
}

export interface PropertyTypeDef {
  slug: string;
  enum: PropertyTypeEnum;
  label: string;
  /** Slug cũ trỏ về loại này; P5 sẽ 301 chúng về `slug`. */
  aliases: readonly string[];
}

export const TRANSACTIONS: readonly TransactionDef[] = [
  { slug: 'ban', enum: 'BAN', label: 'Bán' },
  { slug: 'cho-thue', enum: 'CHO_THUE', label: 'Cho thuê' },
];

export const PROPERTY_TYPES: readonly PropertyTypeDef[] = [
  { slug: 'dat-nen', enum: 'DAT_NEN', label: 'Đất nền', aliases: [] },
  // `nha-mat-pho` không có enum riêng — backend vẫn ánh xạ về NHA_RIENG. Để nó là
  // alias thì hai URL không còn cạnh tranh canonical với nhau nữa.
  { slug: 'nha-rieng', enum: 'NHA_RIENG', label: 'Nhà riêng, nhà mặt phố', aliases: ['nha-mat-pho'] },
  { slug: 'chung-cu', enum: 'CHUNG_CU', label: 'Chung cư', aliases: ['can-ho', 'can-ho-chung-cu'] },
  { slug: 'du-an', enum: 'DU_AN', label: 'Dự án', aliases: [] },
  // Khách yêu cầu đổi nhãn: "Mặt bằng, kho xưởng" -> "Mặt bằng kinh doanh, kho xưởng".
  // Slug URL giữ nguyên để không phải 301 các URL đang được index.
  { slug: 'mat-bang-kho-xuong', enum: 'MAT_BANG', label: 'Mặt bằng kinh doanh, kho xưởng', aliases: ['mat-bang'] },
  { slug: 'biet-thu', enum: 'BIET_THU', label: 'Biệt thự', aliases: [] },
  { slug: 'bds-khac', enum: 'BDS_KHAC', label: 'Bất động sản khác', aliases: ['khac'] },
];

const TYPE_BY_SLUG = new Map<string, PropertyTypeDef>();
for (const t of PROPERTY_TYPES) {
  TYPE_BY_SLUG.set(t.slug, t);
  for (const a of t.aliases) TYPE_BY_SLUG.set(a, t);
}
const TYPE_BY_ENUM = new Map<string, PropertyTypeDef>(PROPERTY_TYPES.map(t => [t.enum, t]));
const TX_BY_SLUG = new Map<string, TransactionDef>(TRANSACTIONS.map(t => [t.slug, t]));
const TX_BY_ENUM = new Map<string, TransactionDef>(TRANSACTIONS.map(t => [t.enum, t]));

export function propertyTypeBySlug(slug?: string | null): PropertyTypeDef | undefined {
  return slug ? TYPE_BY_SLUG.get(slug) : undefined;
}

export function propertyTypeByEnum(value?: string | null): PropertyTypeDef | undefined {
  return value ? TYPE_BY_ENUM.get(value) : undefined;
}

export function transactionBySlug(slug?: string | null): TransactionDef | undefined {
  return slug ? TX_BY_SLUG.get(slug) : undefined;
}

export function transactionByEnum(value?: string | null): TransactionDef | undefined {
  return value ? TX_BY_ENUM.get(value) : undefined;
}

/**
 * Chọn một tập loại BĐS theo đúng thứ tự truyền vào, cho các menu/footer chỉ hiện vài
 * loại. Trước đây mỗi nơi tự khai lại mảng `{key, label, path}` của mình — sinh ra 5
 * nhãn khác nhau cho `MAT_BANG` và cả slug không tồn tại (`biet-thu-lien-ke`).
 */
export function propertyTypesByEnum(values: readonly string[]): PropertyTypeDef[] {
  return values
    .map((v) => TYPE_BY_ENUM.get(v))
    .filter((t): t is PropertyTypeDef => Boolean(t));
}

/** Nhãn hiển thị, có fallback để không bao giờ render chuỗi rỗng. */
export function propertyTypeLabel(value?: string | null): string {
  return propertyTypeByEnum(value)?.label ?? 'Bất động sản';
}

export function transactionLabel(value?: string | null): string {
  return transactionByEnum(value)?.label ?? 'Bán';
}
