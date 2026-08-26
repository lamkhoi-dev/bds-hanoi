import { LOCATION_BLOCK_HREFS, LOCATION_BLOCK_TITLES } from './homepage-layout';

/**
 * Link của TIÊU ĐỀ khối khu vực trên trang chủ — khách yêu cầu 25/08.
 *
 * Frontend lấy link tiêu đề từ TAB ĐANG CHỌN khi backend không gửi `href`, nên
 * "Bất động sản Nghệ An" trỏ về TP Vinh (tab đầu) và "Bất động sản TP Vinh" trỏ về phường
 * Thành Vinh.
 *
 * Có MỘT cái bẫy đã dính khi sửa: payload có hai nơi trông giống nhau — `sections[]` (thứ
 * frontend thật sự đọc) và `locationBlocks` (field cũ giữ lại cho consumer chưa chuyển).
 * Lần đầu sửa nhầm vào `locationBlocks`, deploy xong `sections[].href` vẫn là undefined.
 * Test này canh phần cấu hình; phần lắp vào `sections[]` xem `locationSection()`.
 */

describe('LOCATION_BLOCK_HREFS', () => {
  it('classic: tiêu đề khối tỉnh về trang liệt kê khu vực, không về một huyện', () => {
    expect(LOCATION_BLOCK_HREFS.classic.districts).toBe('/khu-vuc');
  });

  it('classic: tiêu đề khối TP Vinh về đúng trang TP Vinh, không về phường con', () => {
    expect(LOCATION_BLOCK_HREFS.classic['wards-new']).toBe('/thanh-pho-vinh');
  });

  it('grouped (Hà Nội) không khai href — tiêu đề ở đó là tên chung, không có phạm vi riêng', () => {
    expect(LOCATION_BLOCK_HREFS.grouped.districts).toBeUndefined();
    expect(LOCATION_BLOCK_HREFS.grouped['wards-new']).toBeUndefined();
  });

  it('mọi key khai href phải là key có thật trong bảng tiêu đề', () => {
    // Khai một key không tồn tại thì link im lặng không bao giờ áp dụng.
    for (const layout of ['classic', 'grouped'] as const) {
      for (const key of Object.keys(LOCATION_BLOCK_HREFS[layout])) {
        expect(LOCATION_BLOCK_TITLES[layout]).toHaveProperty(key);
      }
    }
  });

  it('href phải là đường dẫn tuyệt đối trong site', () => {
    for (const layout of ['classic', 'grouped'] as const) {
      for (const href of Object.values(LOCATION_BLOCK_HREFS[layout])) {
        expect(href).toMatch(/^\//);
        expect(href).not.toMatch(/^https?:/);
      }
    }
  });
});
