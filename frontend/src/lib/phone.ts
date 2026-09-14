/**
 * Chuẩn hoá số điện thoại người dùng gõ tay sang dạng E.164 mà Firebase Phone Auth yêu cầu.
 *
 * Bug đã sửa (khách báo "lỗi fiber" = Firebase, 12/9): `FirebaseSmsProvider` cũ tự nối
 * `'+84' + phone.replace(/^0/, '')`. Ô nhập số điện thoại ở `login/page.tsx` lọc sẵn mọi ký
 * tự không phải chữ số (`replace(/\D/g, '')`), nên nếu người dùng gõ `+84912345678` hay
 * `84912345678`, giá trị lưu trong state chỉ còn `84912345678` — nối chuỗi cũ cho ra
 * `+8484912345678`, Firebase từ chối với `auth/invalid-phone-number`.
 */
export function normalizeVnPhoneForFirebase(raw: string): string {
  const digits = String(raw || '').replace(/[^\d+]/g, '');
  if (digits.startsWith('+84')) return digits;
  if (digits.startsWith('84') && digits.length >= 10) return '+' + digits;
  if (digits.startsWith('0')) return '+84' + digits.slice(1);
  // Số lạ không rõ mã vùng — giữ nguyên (thêm dấu + nếu thiếu) để Firebase tự báo lỗi định
  // dạng thay vì đoán sai mã vùng.
  return digits.startsWith('+') ? digits : '+' + digits;
}

/**
 * Dịch mã lỗi Firebase Auth sang câu tiếng Việt. Không dịch được thì trả `null` để nơi gọi
 * tự quyết định câu dự phòng — KHÔNG hiện nguyên văn "Firebase: Error (auth/...)." lên màn
 * hình, đó chính là thứ khách đọc thành "lỗi fiber".
 */
export function translateFirebaseAuthError(err: unknown): string | null {
  const code = (err as { code?: string })?.code || '';
  const map: Record<string, string> = {
    'auth/invalid-phone-number': 'Số điện thoại không đúng định dạng.',
    'auth/missing-phone-number': 'Vui lòng nhập số điện thoại.',
    'auth/quota-exceeded': 'Hệ thống gửi mã OTP đang quá tải, vui lòng thử lại sau.',
    'auth/too-many-requests': 'Bạn đã thử quá nhiều lần, vui lòng thử lại sau ít phút.',
    'auth/captcha-check-failed': 'Xác minh bảo mật thất bại, vui lòng tải lại trang và thử lại.',
    'auth/invalid-verification-code': 'Mã OTP không đúng.',
    'auth/code-expired': 'Mã OTP đã hết hạn, vui lòng gửi lại.',
    'auth/network-request-failed': 'Lỗi kết nối mạng, vui lòng thử lại.',
    'auth/invalid-api-key': 'Đăng nhập bằng SMS đang được cấu hình lại, vui lòng đăng nhập bằng email/mật khẩu.',
    'auth/app-not-authorized': 'Đăng nhập bằng SMS đang được cấu hình lại, vui lòng đăng nhập bằng email/mật khẩu.',
  };
  return map[code] || null;
}
