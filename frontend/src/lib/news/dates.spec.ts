import { formatNewsDateTime, formatNewsDate, shouldShowUpdated } from './dates';

/**
 * Khách chưa báo trực tiếp nhưng bắt được khi làm PHẦN B: trang chi tiết render phía máy
 * chủ, container chạy UTC — không ép múi giờ Việt Nam thì "đăng lúc 23:30" hiện sai giờ,
 * có thể lệch cả NGÀY quanh nửa đêm.
 */
describe('formatNewsDateTime — luôn theo giờ Việt Nam bất kể múi giờ máy chạy', () => {
  it('23:30 giờ VN (16:30 UTC) không bị lùi về giờ UTC', () => {
    // 2026-09-15T16:30:00Z = 2026-09-15 23:30 giờ Việt Nam (UTC+7).
    expect(formatNewsDateTime('2026-09-15T16:30:00Z')).toBe('23:30 15/09/2026');
  });

  it('lệch NGÀY quanh nửa đêm: 00:30 giờ VN của ngày 16 là 17:30 UTC ngày 15', () => {
    // 2026-09-15T17:30:00Z = 2026-09-16 00:30 giờ Việt Nam — khác ngày với UTC.
    expect(formatNewsDateTime('2026-09-15T17:30:00Z')).toBe('00:30 16/09/2026');
  });

  it('ngày giờ hỏng -> gạch ngang, không phải "Invalid Date"', () => {
    expect(formatNewsDateTime('không phải ngày')).toBe('—');
  });
});

describe('formatNewsDate', () => {
  it('chỉ lấy phần ngày, theo giờ Việt Nam', () => {
    expect(formatNewsDate('2026-09-15T17:30:00Z')).toBe('16/09/2026');
  });
});

describe('shouldShowUpdated', () => {
  it('có sửa nội dung sau khi đăng -> true', () => {
    expect(shouldShowUpdated('2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z')).toBe(true);
  });

  it('chưa từng sửa (hai mốc trùng nhau, cùng ghi lúc tạo bài) -> false', () => {
    const t = '2026-01-01T00:00:00.000Z';
    expect(shouldShowUpdated(t, t)).toBe(false);
  });

  it('thiếu một trong hai mốc -> false, không đoán', () => {
    expect(shouldShowUpdated(null, '2026-02-01T00:00:00Z')).toBe(false);
    expect(shouldShowUpdated('2026-01-01T00:00:00Z', null)).toBe(false);
  });

  it('contentUpdatedAt sớm hơn publishedAt (dữ liệu bất thường) -> false, không hiện ngày cập nhật vô lý', () => {
    expect(shouldShowUpdated('2026-02-01T00:00:00Z', '2026-01-01T00:00:00Z')).toBe(false);
  });
});
