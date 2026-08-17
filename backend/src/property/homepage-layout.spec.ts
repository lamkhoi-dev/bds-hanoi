import { HOMEPAGE_LAYOUTS, resolveLayout, homepageCacheKey } from './homepage-layout';

describe('resolveLayout', () => {
  it('mặc định (không truyền gì / rỗng / sai chính tả) luôn là classic — chiều an toàn', () => {
    expect(resolveLayout(undefined)).toBe('classic');
    expect(resolveLayout('')).toBe('classic');
    expect(resolveLayout('GROUPED')).toBe('classic'); // phân biệt hoa/thường, không tự đoán
    expect(resolveLayout('ha-noi')).toBe('classic');
  });

  it("chỉ đúng chuỗi 'grouped' mới bật bố cục Hà Nội", () => {
    expect(resolveLayout('grouped')).toBe('grouped');
  });
});

describe('HOMEPAGE_LAYOUTS.classic — bảo vệ bố cục Nghệ An đang chạy thật', () => {
  it('đúng thứ tự đã đo bằng curl trên site thật trước khi refactor (không được tự ý đổi)', () => {
    expect(HOMEPAGE_LAYOUTS.classic).toEqual([
      'vip', 'up', 'ad',
      'districts', 'wards-new', 'wards-old',
      'cat-DAT_NEN', 'cat-NHA_RIENG', 'cat-CHUNG_CU', 'cat-DU_AN',
      'project-grid',
      'rent-type-tabs', 'other-type-tabs',
    ]);
  });
});

describe('HOMEPAGE_LAYOUTS.grouped — bố cục PHẦN II Hà Nội', () => {
  it('xã cũ đứng trước xã mới, "khu vực hot" nằm giữa (đúng đính chính của khách)', () => {
    const idx = (id: string) => HOMEPAGE_LAYOUTS.grouped.indexOf(id as any);
    expect(idx('wards-old')).toBeLessThan(idx('hot-areas'));
    expect(idx('hot-areas')).toBeLessThan(idx('wards-new'));
  });

  it('mọi id trong 2 preset đều là chuỗi hợp lệ, không trùng lặp trong cùng 1 preset', () => {
    for (const layout of Object.values(HOMEPAGE_LAYOUTS)) {
      expect(new Set(layout).size).toBe(layout.length);
    }
  });
});

describe('homepageCacheKey', () => {
  it('2 layout khác nhau phải ra 2 cache key khác nhau', () => {
    expect(homepageCacheKey('classic')).not.toBe(homepageCacheKey('grouped'));
  });
});
