import { normalizeVnPhoneForFirebase, translateFirebaseAuthError } from './phone';

/**
 * Chặn tái phát: `FirebaseSmsProvider` cũ tự nối `'+84' + phone.replace(/^0/, '')`. Ô nhập ở
 * `login/page.tsx` lọc mọi ký tự không phải số (`replace(/\D/g, '')`), nên nếu người dùng
 * gõ sẵn `+84912345678` hay `84912345678`, giá trị đưa vào hàm nối chuỗi chỉ còn
 * `84912345678` — nối `'+84' + '84912345678'` ra `+8484912345678`, Firebase từ chối với
 * `auth/invalid-phone-number`. Đây chính là gốc "lỗi fiber" khách báo.
 */
describe('normalizeVnPhoneForFirebase', () => {
  it('số bắt đầu 0 -> +84, bỏ số 0 đầu', () => {
    expect(normalizeVnPhoneForFirebase('0912345678')).toBe('+84912345678');
  });

  it('số đã là +84 (ô nhập không lọc dấu + do nhập tay trực tiếp) -> giữ nguyên', () => {
    expect(normalizeVnPhoneForFirebase('+84912345678')).toBe('+84912345678');
  });

  it('số dạng 84xxxxxxxxx (dấu + đã bị ô nhập lọc mất) -> +84xxxxxxxxx, KHÔNG nhân đôi', () => {
    expect(normalizeVnPhoneForFirebase('84912345678')).toBe('+84912345678');
  });

  it('bỏ khoảng trắng và dấu chấm', () => {
    expect(normalizeVnPhoneForFirebase('091 234 5678')).toBe('+84912345678');
    expect(normalizeVnPhoneForFirebase('091.234.5678')).toBe('+84912345678');
  });
});

describe('translateFirebaseAuthError', () => {
  it('dịch mã lỗi phổ biến sang tiếng Việt, không lộ chữ Firebase', () => {
    const msg = translateFirebaseAuthError({ code: 'auth/invalid-phone-number' });
    expect(msg).not.toMatch(/firebase/i);
    expect(msg).toBe('Số điện thoại không đúng định dạng.');
  });

  it('mã không nằm trong danh sách -> null để nơi gọi tự quyết định câu dự phòng', () => {
    expect(translateFirebaseAuthError({ code: 'auth/some-unmapped-code' })).toBeNull();
    expect(translateFirebaseAuthError(new Error('lỗi bất kỳ'))).toBeNull();
  });
});
