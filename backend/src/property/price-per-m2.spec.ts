import { calculatePricePerM2, formatPricePerM2 } from './property-utils';

/**
 * Khách báo "chưa thống nhất giá/m2": cùng một tin cho ra con số khác nhau ở card
 * trang chủ, card trang chuyên mục và trang chi tiết.
 *
 * Nguyên nhân là hai công thức song song. Các test dưới đây khoá lại công thức DUY
 * NHẤT còn giữ, gồm cả những ca đã gây lệch trước đây.
 */

describe('calculatePricePerM2', () => {
  it('ưu tiên giá và diện tích CHÍNH XÁC hơn trung điểm khoảng', () => {
    // Khoảng nói 2–4 tỷ và 80–120 m², nhưng tin khai đúng 2,9 tỷ / 100 m².
    // Bản cũ luôn lấy trung bình khoảng -> 3 tỷ / 100 = 30 triệu/m² (sai).
    const v = calculatePricePerM2(2_000_000_000, 4_000_000_000, 80, 120, 2_900_000_000, 100);
    expect(v).toBe(29_000_000);
  });

  it('thiếu giá chính xác thì lùi về trung điểm khoảng', () => {
    expect(calculatePricePerM2(2_000_000_000, 4_000_000_000, 100, 100, null, null)).toBe(30_000_000);
  });

  it('có giá chính xác nhưng chỉ có khoảng diện tích', () => {
    expect(calculatePricePerM2(null, null, 80, 120, 3_000_000_000, null)).toBe(30_000_000);
  });

  it('thiếu dữ liệu thì trả null chứ không đoán', () => {
    expect(calculatePricePerM2(null, null, null, null, null, null)).toBeNull();
    expect(calculatePricePerM2(2_000_000_000, null, null, null, null, null)).toBeNull();
    expect(calculatePricePerM2(null, null, 100, 100, null, null)).toBeNull();
  });

  it('diện tích 0 không gây chia cho 0', () => {
    expect(calculatePricePerM2(null, null, 0, 0, 1_000_000_000, 0)).toBeNull();
  });

  it('giá 0 (tin thoả thuận nhập nhầm) trả null', () => {
    expect(calculatePricePerM2(0, 0, 100, 100, 0, 100)).toBeNull();
  });
});

describe('formatPricePerM2', () => {
  it('giữ MỘT chữ số thập phân — đây là ca từng lệch giữa card và trang chi tiết', () => {
    // 2,95 tỷ / 100 m². Bản cũ Math.round -> "30 triệu/m²" ở card, "29,5" ở trang chi tiết.
    expect(formatPricePerM2(29_500_000)).toBe('≈ 29,5 triệu/m²');
  });

  it('số tròn thì không hiện ",0"', () => {
    expect(formatPricePerM2(29_000_000)).toBe('≈ 29 triệu/m²');
  });

  it('dưới 1 triệu/m² hiện nghìn/m², không trả "-"', () => {
    // Đất nông thôn 800 nghìn/m² là mức có thật; bản cũ trả "-" là giấu thông tin đúng.
    expect(formatPricePerM2(800_000)).toBe('≈ 800 nghìn/m²');
  });

  it('ngoài dải hợp lý trả "-" (gần như chắc chắn nhập sai đơn vị)', () => {
    expect(formatPricePerM2(400_000)).toBe('-');
    expect(formatPricePerM2(10_000_000_000)).toBe('-');
  });

  it('không có giá trị thì trả "-"', () => {
    expect(formatPricePerM2(null)).toBe('-');
    expect(formatPricePerM2(0)).toBe('-');
  });

  it('dùng dấu PHẨY thập phân theo cách viết tiếng Việt', () => {
    expect(formatPricePerM2(15_700_000)).toBe('≈ 15,7 triệu/m²');
    expect(formatPricePerM2(15_700_000)).not.toContain('.');
  });
});
