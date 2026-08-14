/**
 * Bảng tên chuẩn của 30 quận/huyện/thị xã Hà Nội (đơn vị CŨ, dùng làm cấp điều hướng).
 *
 * Vì sao cần bảng này thay vì lấy tên từ file nguồn: hai sheet "All phường xã mới" và
 * "All phường xã cũ" viết tên quận không nhất quán — lúc có tiền tố lúc không
 * ("Hoàng Mai" vs "Quận Hoàng Mai"), và có cả lỗi hoa/thường ("Tây hồ" vs "Tây Hồ").
 * Nếu lấy theo sheet nào đọc trước thì tên hiển thị sẽ phụ thuộc thứ tự đọc.
 *
 * Sheet "quận huyện" KHÔNG dùng làm nguồn danh sách: nó chỉ có 27 đơn vị (thiếu
 * Phúc Thọ, Thạch Thất, Sơn Tây) và lặp "Huyện Chương Mỹ" hai lần. Nó chỉ dùng để
 * gán thứ tự hiển thị trên trang chủ.
 */
export interface DistrictDef {
  /** Tên hiển thị chuẩn, có tiền tố đầy đủ. */
  name: string;
  /** Tên đã bỏ tiền tố, dùng để sinh slug và để khớp với dữ liệu nguồn. */
  shortName: string;
}

export const HANOI_DISTRICTS: readonly DistrictDef[] = [
  { name: 'Quận Hoàn Kiếm', shortName: 'Hoàn Kiếm' },
  { name: 'Quận Ba Đình', shortName: 'Ba Đình' },
  { name: 'Quận Đống Đa', shortName: 'Đống Đa' },
  { name: 'Quận Hai Bà Trưng', shortName: 'Hai Bà Trưng' },
  { name: 'Quận Cầu Giấy', shortName: 'Cầu Giấy' },
  { name: 'Quận Thanh Xuân', shortName: 'Thanh Xuân' },
  { name: 'Quận Nam Từ Liêm', shortName: 'Nam Từ Liêm' },
  { name: 'Quận Bắc Từ Liêm', shortName: 'Bắc Từ Liêm' },
  { name: 'Quận Hà Đông', shortName: 'Hà Đông' },
  { name: 'Quận Long Biên', shortName: 'Long Biên' },
  { name: 'Quận Tây Hồ', shortName: 'Tây Hồ' },
  { name: 'Quận Hoàng Mai', shortName: 'Hoàng Mai' },
  { name: 'Huyện Ba Vì', shortName: 'Ba Vì' },
  { name: 'Huyện Sóc Sơn', shortName: 'Sóc Sơn' },
  { name: 'Huyện Đông Anh', shortName: 'Đông Anh' },
  { name: 'Huyện Gia Lâm', shortName: 'Gia Lâm' },
  { name: 'Huyện Thanh Trì', shortName: 'Thanh Trì' },
  { name: 'Huyện Thường Tín', shortName: 'Thường Tín' },
  { name: 'Huyện Chương Mỹ', shortName: 'Chương Mỹ' },
  { name: 'Huyện Hoài Đức', shortName: 'Hoài Đức' },
  { name: 'Huyện Đan Phượng', shortName: 'Đan Phượng' },
  { name: 'Huyện Mê Linh', shortName: 'Mê Linh' },
  { name: 'Huyện Phú Xuyên', shortName: 'Phú Xuyên' },
  { name: 'Huyện Ứng Hòa', shortName: 'Ứng Hòa' },
  { name: 'Huyện Mỹ Đức', shortName: 'Mỹ Đức' },
  { name: 'Huyện Thanh Oai', shortName: 'Thanh Oai' },
  { name: 'Huyện Quốc Oai', shortName: 'Quốc Oai' },
  { name: 'Huyện Phúc Thọ', shortName: 'Phúc Thọ' },
  { name: 'Huyện Thạch Thất', shortName: 'Thạch Thất' },
  { name: 'Thị xã Sơn Tây', shortName: 'Sơn Tây' },
];

/**
 * Phân nhóm menu ngang do khách gửi ngày 2026-08-14 (câu B1).
 *
 * Đối chiếu với `HANOI_DISTRICTS`: 30/30 khớp tuyệt đối, không trùng, không thừa —
 * `extract-locations-xlsx.ts` kiểm lại điều này mỗi lần chạy và dừng nếu lệch, để
 * khi khách sửa danh sách mà quên một quận thì phát hiện ngay chứ không âm thầm bỏ sót.
 *
 * Thứ tự trong mảng cũng là thứ tự hiển thị trong mỗi nhóm.
 */
export const HANOI_DISTRICT_GROUPS: readonly { label: string; shortNames: readonly string[] }[] = [
  {
    label: 'Trung tâm',
    shortNames: [
      'Cầu Giấy', 'Nam Từ Liêm', 'Hà Đông', 'Thanh Xuân', 'Hoàng Mai',
      'Tây Hồ', 'Đống Đa', 'Hai Bà Trưng', 'Ba Đình', 'Hoàn Kiếm',
    ],
  },
  {
    label: 'Cận trung tâm',
    shortNames: [
      'Long Biên', 'Bắc Từ Liêm', 'Gia Lâm', 'Đông Anh', 'Hoài Đức',
      'Thanh Trì', 'Đan Phượng', 'Mê Linh', 'Thanh Oai', 'Thường Tín',
    ],
  },
  {
    label: 'Ngoại thành',
    shortNames: [
      'Sóc Sơn', 'Thạch Thất', 'Quốc Oai', 'Chương Mỹ', 'Sơn Tây',
      'Phúc Thọ', 'Ba Vì', 'Phú Xuyên', 'Ứng Hòa', 'Mỹ Đức',
    ],
  },
];

/** `shortName` -> {nhãn nhóm, thứ tự nhóm, thứ tự trong nhóm}. */
export function buildDistrictGroupIndex(): Map<
  string,
  { group: string; groupOrder: number; orderInGroup: number }
> {
  const index = new Map<string, { group: string; groupOrder: number; orderInGroup: number }>();
  HANOI_DISTRICT_GROUPS.forEach((g, groupOrder) => {
    g.shortNames.forEach((shortName, orderInGroup) => {
      if (index.has(shortName)) {
        throw new Error(`Quận "${shortName}" bị xếp vào hai nhóm.`);
      }
      index.set(shortName, { group: g.label, groupOrder, orderInGroup });
    });
  });

  const known = new Set(HANOI_DISTRICTS.map((d) => d.shortName));
  const unknown = [...index.keys()].filter((n) => !known.has(n));
  const ungrouped = [...known].filter((n) => !index.has(n));
  if (unknown.length || ungrouped.length) {
    throw new Error(
      'Phân nhóm quận/huyện không khớp bảng chuẩn.' +
        (unknown.length ? ` Không có trong bảng: ${unknown.join(', ')}.` : '') +
        (ungrouped.length ? ` Chưa được xếp nhóm: ${ungrouped.join(', ')}.` : ''),
    );
  }
  return index;
}

// Dùng chung với đường tạo khu vực trong trang admin, để URL của khu vực nhập từ file
// và khu vực admin tạo tay sinh ra theo cùng một quy tắc.
export { stripUnitPrefix, UNIT_PREFIXES } from '../location/location-utils';
