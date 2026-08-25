import { buildPrismaWhere, buildMeiliFilters } from './property-utils';

/**
 * Lọc khoảng giá / khoảng diện tích — khách báo 25/08:
 *   "bộ lọc khoảng diện tích không chính xác, lọc khoảng này nhưng vẫn ra khoảng khác"
 *   "bộ lọc khoảng giá không hoạt động"
 *
 * Đo được trên site trước khi sửa: lọc 1–2 tỷ ra 40/75 tin sai, lọc 50–100 m² ra 37/100 sai.
 *
 * Gốc rễ: `priceMin/priceMax` và `areaMin/areaMax` là BIÊN CỦA BUCKET chứ không phải khoảng
 * giá của tin (tin 11 tỷ có bucket 10–20 tỷ). Dùng chúng làm nhánh OR ngang hàng với giá
 * chính xác khiến mọi tin có bucket giao khoảng hỏi đều lọt.
 *
 * Test bám vào MỆNH ĐỀ sinh ra, không bám kết quả trả về — mock nào cũng cho kết quả qua.
 */

const f = (extra: any) => ({ ...extra }) as any;

describe('buildPrismaWhere — khoảng giá', () => {
  it('tin có giá chính xác thì XÉT GIÁ, không được cứu bằng bucket', () => {
    const where: any = buildPrismaWhere(f({ minPrice: 1e9, maxPrice: 2e9 }));
    const clause = where.AND.find((c: any) => c.OR?.some((o: any) => o.price));

    const nhanhGia = clause.OR.find((o: any) => o.price && o.price !== null);
    expect(nhanhGia.price).toEqual({ gte: 1e9, lte: 2e9 });

    // Nhánh bucket PHẢI kèm điều kiện `price: null`. Thiếu nó chính là lỗi cũ.
    const nhanhBucket = clause.OR.find((o: any) => o.AND);
    expect(nhanhBucket.AND).toContainEqual({ price: null });
  });

  it('nhánh bucket kiểm tra ĐÚNG chiều giao nhau', () => {
    const where: any = buildPrismaWhere(f({ minPrice: 1e9, maxPrice: 2e9 }));
    const clause = where.AND.find((c: any) => c.OR?.some((o: any) => o.price !== undefined));
    const bucket = clause.OR.find((o: any) => o.AND).AND;

    // bucket.high >= min  và  bucket.low <= max
    expect(bucket).toContainEqual({ priceMax: { gte: 1e9 } });
    expect(bucket).toContainEqual({ priceMin: { lte: 2e9 } });
  });

  it('chỉ có min: không được tự bịa cận trên', () => {
    const where: any = buildPrismaWhere(f({ minPrice: 3e9 }));
    const clause = where.AND.find((c: any) => c.OR?.some((o: any) => o.price !== undefined));
    const nhanhGia = clause.OR.find((o: any) => o.price && typeof o.price === 'object');

    expect(nhanhGia.price).toEqual({ gte: 3e9 });
    expect(nhanhGia.price.lte).toBeUndefined();
  });

  it('khoảng diện tích dùng đúng cặp cột của nó', () => {
    const where: any = buildPrismaWhere(f({ minArea: 50, maxArea: 100 }));
    const clause = where.AND.find((c: any) => c.OR?.some((o: any) => o.area !== undefined));
    const bucket = clause.OR.find((o: any) => o.AND).AND;

    expect(bucket).toContainEqual({ area: null });
    expect(bucket).toContainEqual({ areaMax: { gte: 50 } });
    expect(bucket).toContainEqual({ areaMin: { lte: 100 } });
  });
});

describe('buildMeiliFilters — khoảng giá', () => {
  const filterOf = (extra: any) => (buildMeiliFilters(f(extra)) as string[])[0];

  it('KHÔNG tách min/max thành hai mệnh đề AND rời — đó là lỗi cũ', () => {
    const s = filterOf({ minPrice: 1e9, maxPrice: 2e9 });

    // Dạng cũ cho tin 2,5 tỷ lọt: thoả vế trái bằng `price`, vế phải bằng `priceMin`.
    expect(s).not.toContain('(price >= 1000000000 OR priceMax >= 1000000000)');
    expect(s).not.toContain('(price <= 2000000000 OR priceMin <= 2000000000)');

    // Dạng mới: một mệnh đề, hai nhánh loại trừ nhau bằng `IS NULL`.
    expect(s).toContain('price >= 1000000000 AND price <= 2000000000');
    expect(s).toContain('price IS NULL');
    expect(s).toContain('priceMax >= 1000000000');
    expect(s).toContain('priceMin <= 2000000000');
  });

  it('bucket luôn đi kèm IS NULL, không bao giờ đứng một mình', () => {
    for (const s of [
      filterOf({ minPrice: 1e9 }),
      filterOf({ maxPrice: 2e9 }),
      filterOf({ minArea: 50, maxArea: 100 }),
    ]) {
      for (const bucketField of ['priceMin', 'priceMax', 'areaMin', 'areaMax']) {
        if (!s.includes(bucketField)) continue;
        const nhanh = s.slice(s.indexOf(bucketField));
        const truoc = s.slice(0, s.indexOf(bucketField));
        expect(truoc + nhanh).toContain('IS NULL');
      }
    }
  });

  it('không lọc khoảng thì không sinh mệnh đề khoảng nào', () => {
    const s = filterOf({});
    expect(s).not.toContain('priceMin');
    expect(s).not.toContain('areaMin');
  });

  it('lọc giá vẫn loại tin "thoả thuận" như trước', () => {
    expect(filterOf({ minPrice: 1e9 })).toContain('isNegotiable = false');
  });
});
