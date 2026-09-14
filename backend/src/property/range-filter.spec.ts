import { buildPrismaWhere, buildMeiliFilters, normalizeSearchFilters, locationMatchWhere } from './property-utils';

/**
 * Lọc khoảng giá / khoảng diện tích — hai đợt vá liên tiếp trên cùng một lỗi khách báo.
 *
 * ĐỢT 26/08: "bộ lọc khoảng diện tích không chính xác" / "bộ lọc khoảng giá không hoạt
 * động". Đo được: lọc 1–2 tỷ ra 40/75 tin sai, lọc 50–100 m² ra 37/100 sai. Gốc rễ:
 * `priceMin/priceMax` là BIÊN CỦA BUCKET chứ không phải khoảng giá của tin (tin 11 tỷ có
 * bucket 10–20 tỷ). Vá bằng cách tách "có giá chính xác" / "không có giá" thành hai nhánh
 * loại trừ nhau.
 *
 * ĐỢT 12/9: "bộ lọc giá đã hoạt động, nhưng vẫn lọc lấy dữ liệu ngoài khoảng cần lọc". Sau
 * đợt vá trên, nhánh "không có giá" vẫn xét GIAO NHAU giữa bucket của tin và khoảng hỏi —
 * hai bucket kề nhau (1-2 tỷ / 2-3 tỷ) vẫn khớp nhau ở mốc chung 2 tỷ. Vá tiếp: có mã khoảng
 * cố định (`rangeKey`) thì so NHÃN; không có mã (khoảng tuỳ chỉnh) thì so bucket NẰM TRỌN
 * trong khoảng hỏi (subset), không còn "giao nhau".
 *
 * Test bám vào MỆNH ĐỀ sinh ra, không bám kết quả trả về — mock nào cũng cho kết quả qua.
 */

const f = (extra: any) => ({ ...extra }) as any;

describe('buildPrismaWhere — khoảng giá (tin có giá chính xác)', () => {
  it('tin có giá chính xác thì XÉT GIÁ, không được cứu bằng bucket', () => {
    const where: any = buildPrismaWhere(f({ minPrice: 1e9, maxPrice: 2e9 }));
    const clause = where.AND.find((c: any) => c.OR?.some((o: any) => o.price));

    const nhanhGia = clause.OR.find((o: any) => o.price && o.price !== null);
    expect(nhanhGia.price).toEqual({ gte: 1e9, lte: 2e9 });

    // Nhánh bucket PHẢI kèm điều kiện `price: null`. Thiếu nó chính là lỗi cũ (26/08).
    const nhanhBucket = clause.OR.find((o: any) => o.AND);
    expect(nhanhBucket.AND).toContainEqual({ price: null });
  });

  it('chỉ có min: không được tự bịa cận trên', () => {
    const where: any = buildPrismaWhere(f({ minPrice: 3e9 }));
    const clause = where.AND.find((c: any) => c.OR?.some((o: any) => o.price !== undefined));
    const nhanhGia = clause.OR.find((o: any) => o.price && typeof o.price === 'object');

    expect(nhanhGia.price).toEqual({ gte: 3e9 });
    expect(nhanhGia.price.lte).toBeUndefined();
  });
});

describe('buildPrismaWhere — khoảng giá (tin KHÔNG có giá, mã khoảng cố định — đợt 12/9)', () => {
  it('khớp ĐÚNG NHÃN, không còn so giao bucket — 2 khoảng kề nhau không lẫn vào nhau nữa', () => {
    // Lọc "1-2 tỷ": filters mang priceRangeKey='1B_2B' (như SidebarFilter/landing page gửi).
    const where: any = buildPrismaWhere(f({ minPrice: 1e9, maxPrice: 2e9, priceRangeKey: '1B_2B' }));
    const clause = where.AND.find((c: any) => c.OR?.some((o: any) => o.price !== undefined));
    const bucket = clause.OR.find((o: any) => o.AND).AND;

    expect(bucket).toContainEqual({ price: null });
    expect(bucket).toContainEqual({ priceRangeKey: '1B_2B' });
    // KHÔNG còn mệnh đề so bucket theo số — đó là cách lỗi 12/9 lọt tin nhãn "2-3 tỷ".
    expect(bucket.some((c: any) => 'priceMax' in c || 'priceMin' in c)).toBe(false);
  });

  it('diện tích cùng quy tắc: mã khoảng cố định thì so nhãn', () => {
    const where: any = buildPrismaWhere(f({ minArea: 50, maxArea: 80, areaRangeKey: '50_80' }));
    const clause = where.AND.find((c: any) => c.OR?.some((o: any) => o.area !== undefined));
    const bucket = clause.OR.find((o: any) => o.AND).AND;

    expect(bucket).toContainEqual({ area: null });
    expect(bucket).toContainEqual({ areaRangeKey: '50_80' });
  });
});

describe('buildPrismaWhere — khoảng giá (tin KHÔNG có giá, khoảng tuỳ chỉnh không qua mã)', () => {
  it('không có rangeKey -> so bucket NẰM TRỌN trong khoảng hỏi (subset), không phải giao nhau', () => {
    const where: any = buildPrismaWhere(f({ minPrice: 1e9, maxPrice: 2e9 }));
    const clause = where.AND.find((c: any) => c.OR?.some((o: any) => o.price !== undefined));
    const bucket = clause.OR.find((o: any) => o.AND).AND;

    // subset: bucket.low >= min VÀ bucket.high <= max — KHÔNG phải overlap (bucket.high>=min).
    expect(bucket).toContainEqual({ priceMin: { gte: 1e9 } });
    expect(bucket).toContainEqual({ priceMax: { lte: 2e9 } });
  });

  it('diện tích tuỳ chỉnh cũng dùng subset, đúng cặp cột của nó', () => {
    const where: any = buildPrismaWhere(f({ minArea: 50, maxArea: 100 }));
    const clause = where.AND.find((c: any) => c.OR?.some((o: any) => o.area !== undefined));
    const bucket = clause.OR.find((o: any) => o.AND).AND;

    expect(bucket).toContainEqual({ area: null });
    expect(bucket).toContainEqual({ areaMin: { gte: 50 } });
    expect(bucket).toContainEqual({ areaMax: { lte: 100 } });
  });
});

describe('buildPrismaWhere — "Thỏa thuận" (khách chốt 12/9: chỉ trả tin thỏa thuận)', () => {
  it('lọc THOA_THUAN ra đúng điều kiện priceRangeKey, KHÔNG phải "mọi tin có giá"', () => {
    const where: any = buildPrismaWhere(f({ priceRangeKey: 'THOA_THUAN' }));
    expect(where.AND).toContainEqual({ priceRangeKey: 'THOA_THUAN' });
    // Trước đây chỉ có mỗi `isNegotiable:false` bị bật nhầm — giờ không được có isNegotiable.
    expect(where.AND.some((c: any) => 'isNegotiable' in c)).toBe(false);
  });
});

describe('buildPrismaWhere — khu vực khớp theo MÃ, không theo tên (đợt 12/9)', () => {
  it('WARD: ưu tiên wardId, lùi về tên CHỈ trong đúng huyện cha', () => {
    const where = locationMatchWhere({ type: 'WARD', id: 'ward-1', name: 'Phường Hà Huy Tập', districtId: 'huyen-ha-tinh' });
    expect(where.OR).toContainEqual({ wardId: 'ward-1' });
    const fallback = where.OR.find((o: any) => o.AND);
    expect(fallback.AND).toContainEqual({ wardId: null });
    expect(fallback.AND).toContainEqual({ districtId: 'huyen-ha-tinh' });
    expect(fallback.AND).toContainEqual({ ward: { equals: 'Phường Hà Huy Tập', mode: 'insensitive' } });
  });

  it('OLD_WARD: cùng quy tắc với oldWardId/oldWard', () => {
    const where = locationMatchWhere({ type: 'OLD_WARD', id: 'old-1', name: 'Xã Nghi Phong', districtId: 'huyen-nghi-loc' });
    expect(where.OR).toContainEqual({ oldWardId: 'old-1' });
    const fallback = where.OR.find((o: any) => o.AND);
    expect(fallback.AND).toContainEqual({ oldWardId: null });
    expect(fallback.AND).toContainEqual({ districtId: 'huyen-nghi-loc' });
  });

  it('DISTRICT/CITY: lọc thẳng bằng mã, không có nhánh theo tên', () => {
    expect(locationMatchWhere({ type: 'DISTRICT', id: 'd1', name: 'Huyện Nam Đàn' })).toEqual({ districtId: 'd1' });
    expect(locationMatchWhere({ type: 'CITY', id: 'p1', name: 'Hà Tĩnh' })).toEqual({ provinceId: 'p1' });
  });
});

describe('normalizeSearchFilters — mã khoảng giá tự suy ra giao dịch bán/thuê (đợt 12/9)', () => {
  it('mã ở bảng BÁN -> ép transactionType = BAN dù query không gửi hoặc gửi sai', () => {
    const filters = normalizeSearchFilters({ priceRangeKey: '1B_2B' });
    expect(filters.transactionType).toBe('BAN');
    expect(filters.minPrice).toBe(1_000_000_000);
    expect(filters.maxPrice).toBe(2_000_000_000);
  });

  it('mã ở bảng THUÊ -> ép transactionType = CHO_THUE — tránh lẫn tin bán vào lọc giá thuê', () => {
    const filters = normalizeSearchFilters({ priceRangeKey: '1M_3M' });
    expect(filters.transactionType).toBe('CHO_THUE');
    expect(filters.minPrice).toBe(1_000_000);
    expect(filters.maxPrice).toBe(3_000_000);
  });

  it('mã không tồn tại ở bảng nào (vd link cũ LT_1B) -> bỏ qua, không lọc bừa', () => {
    const filters = normalizeSearchFilters({ priceRangeKey: 'LT_1B' });
    expect(filters.priceRangeKey).toBeUndefined();
    expect(filters.minPrice).toBeUndefined();
    expect(filters.maxPrice).toBeUndefined();
  });

  it('THOA_THUAN không ép transactionType (tồn tại giống hệt ở cả 2 bảng, không suy được)', () => {
    const filters = normalizeSearchFilters({ priceRangeKey: 'THOA_THUAN', transactionType: 'CHO_THUE' });
    expect(filters.transactionType).toBe('CHO_THUE');
    expect(filters.minPrice).toBeUndefined();
    expect(filters.maxPrice).toBeUndefined();
  });
});

describe('buildMeiliFilters — khoảng giá', () => {
  const filterOf = (extra: any) => (buildMeiliFilters(f(extra)) as string[])[0];

  it('mã khoảng cố định -> so NHÃN, không so bucket theo số', () => {
    const s = filterOf({ minPrice: 1e9, maxPrice: 2e9, priceRangeKey: '1B_2B' });
    expect(s).toContain('priceRangeKey = "1B_2B"');
    expect(s).not.toContain('priceMax >=');
    expect(s).not.toContain('priceMin <=');
  });

  it('khoảng tuỳ chỉnh (không mã) -> vẫn dùng subset như trước, KHÔNG tách 2 mệnh đề AND rời', () => {
    const s = filterOf({ minPrice: 1e9, maxPrice: 2e9 });
    expect(s).not.toContain('(price >= 1000000000 OR priceMax >= 1000000000)');
    expect(s).toContain('price >= 1000000000 AND price <= 2000000000');
    expect(s).toContain('price IS NULL');
    expect(s).toContain('priceMin >= 1000000000');
    expect(s).toContain('priceMax <= 2000000000');
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

  it('lọc giá vẫn loại tin "thoả thuận" như trước — trừ khi chính đang lọc thoả thuận', () => {
    expect(filterOf({ minPrice: 1e9 })).toContain('isNegotiable = false');
    const thoaThuan = filterOf({ priceRangeKey: 'THOA_THUAN' });
    expect(thoaThuan).toContain('priceRangeKey = "THOA_THUAN"');
    expect(thoaThuan).not.toContain('isNegotiable');
  });
});
