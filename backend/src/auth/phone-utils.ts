/**
 * Chuẩn hoá số điện thoại Việt Nam để tra cứu — KHÔNG dùng để lưu (lưu giữ nguyên dạng
 * người dùng nhập, xem `phoneLookupCandidates` bên dưới để biết vì sao).
 *
 * Lỗi khách báo 25/12 "đăng nhập bằng số điện thoại: lỗi fiber" (đọc là Firebase): backend
 * lưu số ở NHIỀU dạng khác nhau tuỳ đường tạo tài khoản — đăng ký thường giữ nguyên
 * `0912345678`, đổi số trong Cài đặt lưu `+84912345678` (Firebase luôn trả E.164). Tra cứu
 * cũ so khớp CHUỖI Y HỆT, nên đăng nhập OTP bằng `+84912345678` không tìm thấy tài khoản đã
 * đăng ký bằng `0912345678` và ÂM THẦM TẠO TÀI KHOẢN MỚI trùng số.
 */

/** Bóc số thuần (bỏ khoảng trắng, dấu chấm/gạch) khỏi một chuỗi số điện thoại người dùng gõ. */
export function stripPhoneFormatting(raw: string): string {
  return String(raw || '').replace(/[^\d+]/g, '');
}

/**
 * Trả về MỌI dạng biểu diễn hợp lệ của một số điện thoại VN, để tra `WHERE phone IN (...)`.
 *
 * Không đoán mò với số không phải VN (không bắt đầu 0/84/+84): trả nguyên dạng đã bóc định
 * dạng, để không vô tình khớp nhầm một chuỗi khác.
 */
export function phoneLookupCandidates(raw: string): string[] {
  const digits = stripPhoneFormatting(raw);
  if (!digits) return [];

  let national: string | null = null; // dạng 0xxxxxxxxx
  let e164: string | null = null; // dạng +84xxxxxxxxx

  if (digits.startsWith('+84')) {
    e164 = digits;
    national = '0' + digits.slice(3);
  } else if (digits.startsWith('84') && digits.length >= 10) {
    e164 = '+' + digits;
    national = '0' + digits.slice(2);
  } else if (digits.startsWith('0')) {
    national = digits;
    e164 = '+84' + digits.slice(1);
  } else {
    return [digits];
  }

  return Array.from(new Set([national, e164].filter((v): v is string => Boolean(v))));
}

/**
 * Chuẩn hoá số điện thoại người dùng GÕ TAY (đăng nhập bằng SMS ở frontend) sang dạng E.164
 * mà Firebase yêu cầu.
 *
 * Trước đây `FirebaseSmsProvider` tự nối `'+84' + phone.replace(/^0/, '')` trong khi ô nhập
 * đã tự lọc hết ký tự không phải số — nếu người dùng gõ sẵn `+84...` hay `84...`, phần lọc
 * chỉ giữ lại `84...`, khiến kết quả thành `+8484912345678`.
 */
export function normalizeVnPhoneForFirebase(raw: string): string {
  const digits = stripPhoneFormatting(raw);
  if (digits.startsWith('+84')) return digits;
  if (digits.startsWith('84') && digits.length >= 10) return '+' + digits;
  if (digits.startsWith('0')) return '+84' + digits.slice(1);
  // Số lạ (không rõ mã vùng) — giữ nguyên, để Firebase tự báo lỗi định dạng thay vì đoán sai.
  return digits.startsWith('+') ? digits : '+' + digits;
}
