import { rangeKeyForValue, PRICE_RANGES_SELL, PRICE_RANGES_RENT, AREA_RANGES } from '@/constants/ranges';

/**
 * Đặt dưới `src/lib` (không phải cạnh `constants/ranges.ts`) vì jest frontend chỉ chạy test
 * trong `src/lib` (`roots: ['<rootDir>/src/lib']`) — xem chú thích trong `jest.config.js`.
 *
 * Khách chốt 12/9: giá/diện tích CỤ THỂ luôn thắng nhãn khoảng người đăng tự chọn (rà lỗi
 * "kiểm duyệt tin gõ 1,4 tỷ nhưng khoảng vẫn ghi 2-3 tỷ"). `rangeKeyForValue` là hàm suy
 * khoảng đúng từ một giá trị số — bản backend đối chiếu cùng bộ ca kiểm tra này.
 */
describe('rangeKeyForValue', () => {
  it('giá 1,4 tỷ -> khoảng 1-2 tỷ', () => {
    expect(rangeKeyForValue(PRICE_RANGES_SELL, 1_400_000_000)).toBe('1B_2B');
  });

  it('giá đúng mốc 2 tỷ -> khoảng ĐẦU TIÊN chứa nó (1-2 tỷ, không phải 2-3 tỷ)', () => {
    expect(rangeKeyForValue(PRICE_RANGES_SELL, 2_000_000_000)).toBe('1B_2B');
  });

  it('không bao giờ trả về THOA_THUAN cho một giá trị số thật — đây là chỗ giữ chỗ "không có giá", khớp mọi giá trị nếu không loại trừ', () => {
    for (const v of [0, 1, 100_000_000, 2_000_000_000, 999_000_000_000]) {
      expect(rangeKeyForValue(PRICE_RANGES_SELL, v)).not.toBe('THOA_THUAN');
      expect(rangeKeyForValue(PRICE_RANGES_RENT, v)).not.toBe('THOA_THUAN');
    }
  });

  it('giá thuê tính đúng bảng thuê', () => {
    expect(rangeKeyForValue(PRICE_RANGES_RENT, 2_000_000)).toBe('1M_3M');
  });

  it('diện tích 95m² -> khoảng 80-100', () => {
    expect(rangeKeyForValue(AREA_RANGES, 95)).toBe('80_100');
  });

  it('giá trị ngoài mọi khoảng đã khai (âm, NaN) -> undefined, không đoán bừa', () => {
    expect(rangeKeyForValue(PRICE_RANGES_SELL, NaN)).toBeUndefined();
  });
});
