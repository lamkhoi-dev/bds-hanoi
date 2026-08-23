/**
 * Tiền tố nội dung chuyển khoản, để hai site dùng CHUNG một tài khoản ngân hàng vẫn phân
 * biệt được giao dịch của bên nào.
 *
 * Khách chốt 21/08: "mình cũng muốn dùng tài khoản chung nhưng có phân biệt, ví dụ bạn có
 * thể để nội dung nạp tiền có chữ HN ở đầu chẳng hạn".
 *
 * ## MẶC ĐỊNH TẮT, và phải để nguyên như vậy cho tới khi trả lời được câu dưới đây
 *
 * Một tài khoản ngân hàng ⇒ SePay gửi webhook về MỘT URL. Hai site là HAI database tách
 * rời. Nên giao dịch của người dùng Hà Nội hoàn toàn có thể được webhook về backend Nghệ
 * An, backend đó tra `userId` trong DB của mình, không thấy, và **bỏ tiền qua**.
 *
 * Tiền tố là điều kiện CẦN để phân biệt, chưa ĐỦ để chạy. Trước khi đặt `DEPOSIT_PREFIX=HN`
 * cho Hà Nội phải xác nhận với SePay: có gửi được webhook tới 2 URL không?
 *   - Có   → mỗi backend đặt tiền tố của mình; giao dịch mang tiền tố lạ bị bỏ qua IM LẶNG
 *            (xem `matchesPrefix`) chứ không ghi log lỗi, vì với nó đó là giao dịch của
 *            site kia, không phải sự cố.
 *   - Không → phải một backend nhận rồi chuyển tiếp, hoặc tách sub-account. Không có cách
 *            nào chỉ bằng tiền tố.
 *
 * Để trống (mặc định) thì mọi thứ giữ nguyên hành vi cũ: nội dung `NAP {id}`, và nhận mọi
 * giao dịch đúng cú pháp — đúng như Nghệ An đang chạy.
 */

/** Chỉ chữ và số, tránh ký tự làm hỏng nội dung chuyển khoản của ngân hàng. */
const VALID = /^[A-Za-z0-9]{1,8}$/;

export function depositPrefix(raw: string | undefined = process.env.DEPOSIT_PREFIX): string {
  const value = (raw ?? '').trim().toUpperCase();
  return VALID.test(value) ? value : '';
}

/** Nội dung chuyển khoản site này phát ra: `NAP {tiền tố}{id}`. */
export function buildDepositContent(userId: string, prefix = depositPrefix()): string {
  return `NAP ${prefix}${userId}`.replace(/-/g, '').substring(0, 50);
}

/**
 * Tách `userId` khỏi nội dung chuyển khoản.
 *
 * Trả `null` khi sai cú pháp HOẶC khi tiền tố không phải của site này. Chỗ gọi phải phân
 * biệt hai ca đó bằng `matchesPrefix` nếu muốn ghi log khác nhau.
 *
 * Khi site KHÔNG đặt tiền tố (Nghệ An), vẫn phải nhận đúng nội dung không tiền tố như cũ —
 * nếu không thì bật biến này lên ở một site sẽ làm rơi toàn bộ giao dịch của site kia.
 */
export function parseDepositToken(
  content: string,
  prefix = depositPrefix(),
): { token: string } | null {
  const match = String(content ?? '').match(/NAP\s*([a-zA-Z0-9]+)/i);
  if (!match) return null;
  const raw = match[1];

  if (!prefix) return { token: raw };

  const upper = raw.toUpperCase();
  if (!upper.startsWith(prefix)) return null;
  const token = raw.slice(prefix.length);
  return token.length > 0 ? { token } : null;
}

/** Nội dung này có thuộc site đang chạy không — dùng để quyết định "bỏ qua im lặng". */
export function matchesPrefix(content: string, prefix = depositPrefix()): boolean {
  if (!prefix) return true;
  const match = String(content ?? '').match(/NAP\s*([a-zA-Z0-9]+)/i);
  if (!match) return false;
  return match[1].toUpperCase().startsWith(prefix);
}
