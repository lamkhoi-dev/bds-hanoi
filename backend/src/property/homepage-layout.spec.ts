import {
  HOMEPAGE_LAYOUTS,
  PINNED_LOCATION_TABS,
  dedupeTabLabels,
  resolveLayout,
  homepageCacheKey,
  tabLabel,
} from './homepage-layout';

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

describe('tabLabel — rút gọn nhãn tab khu vực (khách 21/08)', () => {
  it('bỏ tiền tố Huyện/Phường/Xã/Thị xã', () => {
    expect(tabLabel({ name: 'Huyện Nam Đàn', shortName: 'Nam Đàn' })).toBe('Nam Đàn');
    expect(tabLabel({ name: 'Phường Thành Vinh', shortName: 'Thành Vinh' })).toBe('Thành Vinh');
    expect(tabLabel({ name: 'Xã Kim Liên', shortName: 'Kim Liên' })).toBe('Kim Liên');
    expect(tabLabel({ name: 'Thị xã Hoàng Mai', shortName: 'Hoàng Mai' })).toBe('Hoàng Mai');
  });

  it('cấp thành phố GIỮ "TP" — "Vinh" trần thì mất nghĩa', () => {
    expect(tabLabel({ name: 'Thành phố Vinh', shortName: 'Vinh' })).toBe('TP Vinh');
    expect(tabLabel({ name: 'Thành phố Hà Tĩnh', shortName: 'Hà Tĩnh' })).toBe('TP Hà Tĩnh');
  });

  it('thiếu shortName thì lùi về tên đầy đủ chứ không ra rỗng', () => {
    expect(tabLabel({ name: 'Huyện Nào Đó', shortName: null })).toBe('Huyện Nào Đó');
    expect(tabLabel({ name: 'Huyện Nào Đó' })).toBe('Huyện Nào Đó');
    expect(tabLabel({ name: 'Huyện Nào Đó', shortName: '  ' })).toBe('Huyện Nào Đó');
  });
});

describe('dedupeTabLabels — hai tab không được đọc y nhau', () => {
  it('Hà Tĩnh có cả Huyện Kỳ Anh lẫn Thị xã Kỳ Anh -> cả hai lùi về tên đầy đủ', () => {
    const out = dedupeTabLabels([
      { name: 'Thành phố Vinh', shortName: 'Vinh' },
      { name: 'Huyện Kỳ Anh', shortName: 'Kỳ Anh' },
      { name: 'Thị xã Kỳ Anh', shortName: 'Kỳ Anh' },
    ]);
    // Chỉ mục bị trùng mới dài ra; mục khác vẫn gọn.
    expect(out).toEqual(['TP Vinh', 'Huyện Kỳ Anh', 'Thị xã Kỳ Anh']);
  });

  it('không trùng thì giữ nguyên nhãn gọn', () => {
    expect(
      dedupeTabLabels([
        { name: 'Huyện Nam Đàn', shortName: 'Nam Đàn' },
        { name: 'Huyện Diễn Châu', shortName: 'Diễn Châu' },
      ]),
    ).toEqual(['Nam Đàn', 'Diễn Châu']);
  });
});

describe('PINNED_LOCATION_TABS', () => {
  it('Nghệ An ghim TP Hà Tĩnh ở vị trí 3, Hà Nội không ghim gì', () => {
    expect(PINNED_LOCATION_TABS.classic.districts).toEqual([
      { urlSegment: 'thanh-pho-ha-tinh', position: 3 },
    ]);
    expect(PINNED_LOCATION_TABS.grouped).toEqual({});
  });
});
