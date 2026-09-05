/**
 * Chuẩn hoá một tin đăng trước khi đẩy vào chỉ mục Meilisearch.
 *
 * Tách khỏi `search.service.ts` để test được mà không cần dựng cả service (service chỉ
 * khởi tạo được khi có Meilisearch chạy thật), và để CHỈ CÒN MỘT bản: trước đây
 * `addDocuments` và `addDocument` mỗi hàm giữ một bản sao y hệt nhau, sửa một bên quên bên
 * kia là chuyện sớm muộn.
 *
 * ## Vì sao phải ép kiểu số — lỗi khách báo 25/08, truy ra 05/09
 *
 * Meilisearch chỉ so sánh `>=` / `<=` được với giá trị lưu dạng SỐ. Giá trị lưu dạng chuỗi
 * thì mọi phép so sánh đều không khớp — và nó không báo lỗi, chỉ trả 0 kết quả.
 *
 * Trong Prisma, `price`/`priceMin`/`priceMax` là `Decimal`, mà `Decimal` serialize sang JSON
 * thành CHUỖI; còn `area`/`areaMin`/`areaMax` là `Float`, ra số. Nên trên site thật, lọc
 * diện tích chạy đúng còn lọc giá trả về 0 tin ở mọi khoảng — đúng như khách mô tả "bộ lọc
 * khoảng giá không hoạt động, không lọc được", trong khi bộ lọc diện tích thì họ xác nhận
 * đã xong. Đo được ngay trên chỉ mục production:
 *
 *     price <= 99999999999  -> 0 tin   (điều kiện đáng lẽ khớp tất cả)
 *     area  >= 100          -> 104 tin
 *
 * Ép cả các trường diện tích nữa dù hiện đang đúng: chúng đúng chỉ vì tình cờ đang là
 * `Float`. Đổi cột sang `Decimal` một ngày nào đó là lỗi này quay lại y hệt, mà lần đó
 * không ai nối được nguyên nhân với hậu quả nữa.
 */

/** `Decimal` của Prisma ra chuỗi, cột rỗng ra `null` — cả hai đều phải về số hoặc `null`. */
function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toEpochOrNull(value: unknown): number | null {
  if (!value) return null;
  const t = new Date(value as any).getTime();
  return Number.isFinite(t) ? t : null;
}

export function normalizeSearchDocument(document: any): any {
  return {
    ...document,
    tier: document.tier || 'NORMAL',
    tierRank:
      document.status === 'SOLD' || document.status === 'RENTED'
        ? 0
        : document.tier === 'VIP'
          ? 3
          : document.tier === 'UP'
            ? 2
            : 1,

    // Các trường lọc theo khoảng — xem phần đầu file.
    price: toNumberOrNull(document.price),
    priceMin: toNumberOrNull(document.priceMin),
    priceMax: toNumberOrNull(document.priceMax),
    area: toNumberOrNull(document.area),
    areaMin: toNumberOrNull(document.areaMin),
    areaMax: toNumberOrNull(document.areaMax),
    pricePerM2: toNumberOrNull(document.pricePerM2),

    deletedAt: toEpochOrNull(document.deletedAt),
    publishedAt: toEpochOrNull(document.publishedAt),
    createdAt: toEpochOrNull(document.createdAt),
    pushedAt: toEpochOrNull(document.pushedAt),

    provinceId: document.provinceId || null,
    districtId: document.districtId || null,
    wardId: document.wardId || null,
    isNegotiable: !!document.isNegotiable,
    propertyCode: document.propertyCode || null,
    slug: document.slug || null,
    callClicks: document.callClicks || 0,
    zaloClicks: document.zaloClicks || 0,
  };
}
