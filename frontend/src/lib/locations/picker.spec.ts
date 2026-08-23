import { provincesOf, provinceOfDistrict, districtHasWards } from './picker';
import type { DistrictNode } from './picker';

/**
 * Dựng đúng hình dạng `GET /locations` trả về trên site thật ngày 23/08: mảng phẳng gồm
 * quận/huyện của CẢ HAI tỉnh, Nghệ An có phường/xã con còn Hà Tĩnh **không có dòng nào**.
 */
const NGHE_AN = { id: 'p-na', name: 'Nghệ An' };
const HA_TINH = { id: 'p-ht', name: 'Hà Tĩnh' };

const LOCATIONS: DistrictNode[] = [
  {
    id: 'd-vinh',
    name: 'Thành phố Vinh',
    parent: NGHE_AN,
    children: [
      { id: 'w-1', name: 'Phường Thành Vinh', type: 'WARD' },
      { id: 'ow-1', name: 'Phường Vinh Tân', type: 'OLD_WARD' },
    ],
  },
  {
    id: 'd-nam-dan',
    name: 'Huyện Nam Đàn',
    parent: NGHE_AN,
    children: [{ id: 'w-2', name: 'Xã Kim Liên', type: 'WARD' }],
  },
  // Hà Tĩnh: có huyện nhưng KHÔNG có phường/xã — đúng trạng thái DB thật (13 huyện / 0 xã).
  { id: 'd-nghi-xuan', name: 'Huyện Nghi Xuân', parent: HA_TINH, children: [] },
  { id: 'd-ky-anh', name: 'Huyện Kỳ Anh', parent: HA_TINH, children: [] },
  // Chỉ có xã CŨ, không có xã mới -> vẫn phải coi là "không có phường/xã mới".
  {
    id: 'd-chi-xa-cu',
    name: 'Huyện Chỉ Xã Cũ',
    parent: HA_TINH,
    children: [{ id: 'ow-2', name: 'Xã Nào Đó', type: 'OLD_WARD' }],
  },
];

describe('provincesOf', () => {
  it('suy đủ 2 tỉnh từ dữ liệu, giữ thứ tự backend trả về, không lặp', () => {
    expect(provincesOf(LOCATIONS)).toEqual(['Nghệ An', 'Hà Tĩnh']);
  });

  it('site một tỉnh vẫn ra đúng một mục — không đổi hành vi Hà Nội', () => {
    const oneProvince = LOCATIONS.filter((d) => d.parent?.name === 'Nghệ An');
    expect(provincesOf(oneProvince)).toEqual(['Nghệ An']);
  });

  it('chịu được mảng rỗng và dòng thiếu parent, không ném lỗi', () => {
    expect(provincesOf([])).toEqual([]);
    expect(provincesOf([{ id: 'x', name: 'Lạc' } as DistrictNode])).toEqual([]);
    expect(provincesOf(undefined as any)).toEqual([]);
  });
});

describe('provinceOfDistrict', () => {
  it('tra đúng tỉnh cha — đây là thứ giữ được khu vực khi MỞ SỬA tin Hà Tĩnh', () => {
    // Form khởi tạo city = "Nghệ An"; nếu lọc theo city thì Nghi Xuân biến mất khỏi danh sách.
    expect(provinceOfDistrict(LOCATIONS, 'Huyện Nghi Xuân')).toBe('Hà Tĩnh');
    expect(provinceOfDistrict(LOCATIONS, 'Thành phố Vinh')).toBe('Nghệ An');
  });

  it('trả null khi chưa chọn hoặc tên không có thật', () => {
    expect(provinceOfDistrict(LOCATIONS, '')).toBeNull();
    expect(provinceOfDistrict(LOCATIONS, 'Huyện Không Có')).toBeNull();
  });
});

describe('districtHasWards', () => {
  it('true khi khu vực có phường/xã MỚI', () => {
    expect(districtHasWards(LOCATIONS, 'Thành phố Vinh')).toBe(true);
    expect(districtHasWards(LOCATIONS, 'Huyện Nam Đàn')).toBe(true);
  });

  it('false cho huyện Hà Tĩnh — đây là ca chặn đăng tin khách báo 21/08', () => {
    expect(districtHasWards(LOCATIONS, 'Huyện Nghi Xuân')).toBe(false);
    expect(districtHasWards(LOCATIONS, 'Huyện Kỳ Anh')).toBe(false);
  });

  it('chỉ có xã CŨ thì vẫn là false — ô bắt buộc là ô xã MỚI', () => {
    expect(districtHasWards(LOCATIONS, 'Huyện Chỉ Xã Cũ')).toBe(false);
  });

  it('chưa chọn khu vực thì false, không ném lỗi', () => {
    expect(districtHasWards(LOCATIONS, '')).toBe(false);
    expect(districtHasWards([], 'Thành phố Vinh')).toBe(false);
  });
});
