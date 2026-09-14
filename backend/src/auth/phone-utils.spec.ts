import { phoneLookupCandidates, normalizeVnPhoneForFirebase, stripPhoneFormatting } from './phone-utils';

/**
 * Chặn tái phát: đăng nhập OTP bằng "+84912345678" tạo tài khoản MỚI trùng số vì tài khoản
 * đã đăng ký bằng "0912345678" — hai chuỗi khác nhau, so khớp đúng-một-chuỗi không tìm thấy.
 */
describe('phoneLookupCandidates', () => {
  it('số dạng 0xxxxxxxxx -> trả cả 2 dạng, để khớp được tài khoản lưu +84', () => {
    expect(phoneLookupCandidates('0912345678').sort()).toEqual(['+84912345678', '0912345678'].sort());
  });

  it('số dạng +84xxxxxxxxx -> trả cả 2 dạng, để khớp được tài khoản lưu 0', () => {
    expect(phoneLookupCandidates('+84912345678').sort()).toEqual(['+84912345678', '0912345678'].sort());
  });

  it('số dạng 84xxxxxxxxx (thiếu dấu +) -> vẫn suy ra đúng 2 dạng', () => {
    expect(phoneLookupCandidates('84912345678').sort()).toEqual(['+84912345678', '0912345678'].sort());
  });

  it('bỏ khoảng trắng, dấu chấm, dấu gạch trước khi so', () => {
    expect(phoneLookupCandidates('091 234 5678').sort()).toEqual(['+84912345678', '0912345678'].sort());
  });

  it('chuỗi rỗng -> mảng rỗng, không ném lỗi', () => {
    expect(phoneLookupCandidates('')).toEqual([]);
  });

  it('số không rõ mã vùng (không bắt đầu 0/84/+84) -> trả nguyên dạng đã bóc định dạng, không đoán mò', () => {
    expect(phoneLookupCandidates('12345')).toEqual(['12345']);
  });
});

describe('normalizeVnPhoneForFirebase (bản backend, dùng cho updatePhoneWithFirebase)', () => {
  it('0912345678 -> +84912345678', () => {
    expect(normalizeVnPhoneForFirebase('0912345678')).toBe('+84912345678');
  });
  it('84912345678 (thiếu dấu +) -> +84912345678, không nhân đôi quốc mã', () => {
    expect(normalizeVnPhoneForFirebase('84912345678')).toBe('+84912345678');
  });
});

describe('stripPhoneFormatting', () => {
  it('giữ lại chỉ chữ số và dấu +', () => {
    expect(stripPhoneFormatting('091.234-5678')).toBe('0912345678');
    expect(stripPhoneFormatting('+84 912 345 678')).toBe('+84912345678');
  });
});
