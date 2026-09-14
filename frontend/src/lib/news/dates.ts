/**
 * Định dạng ngày giờ tin tức — LUÔN ép múi giờ Việt Nam (`Asia/Ho_Chi_Minh`).
 *
 * `toLocaleDateString('vi-VN')` KHÔNG tự lấy múi giờ Việt Nam — nó lấy múi giờ của MÁY
 * đang chạy code. Trang chi tiết tin đăng (`tin/[slug_id]`) render phía máy chủ, và máy chủ
 * chạy UTC (Docker container, không set TZ) — "Đăng lúc 23:30 15/09" hiển thị thành
 * "06:30 16/09" (lệch 7 tiếng, có thể lệch cả NGÀY quanh nửa đêm) nếu không ép múi giờ.
 */
const VN_TIME_ZONE = 'Asia/Ho_Chi_Minh';

/**
 * Tự ghép chuỗi thay vì tin vào định dạng mặc định của `toLocaleDateString('vi-VN')` — bản
 * ICU đi kèm Node đổi giữa các môi trường (máy dev ra "15/9/2026", container production có
 * thể ra "15/09/2026"), nên số liệu hiển thị được KHÔNG được phép phụ thuộc môi trường chạy.
 * Ép `2-digit` tường minh cho từng phần rồi tự ghép là cách duy nhất chắc chắn.
 */
function vnParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') };
}

export function formatNewsDateTime(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return '—';
  const p = vnParts(date);
  return `${p.hour}:${p.minute} ${p.day}/${p.month}/${p.year}`;
}

export function formatNewsDate(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return '—';
  const p = vnParts(date);
  return `${p.day}/${p.month}/${p.year}`;
}

/**
 * "Cập nhật lúc..." chỉ hiện khi THẬT SỰ có một lần sửa nội dung sau khi đăng — không hiện
 * khi hai mốc trùng nhau (bài chưa từng sửa) hay khi thiếu `contentUpdatedAt`.
 */
export function shouldShowUpdated(
  publishedAt?: string | Date | null,
  contentUpdatedAt?: string | Date | null,
): boolean {
  if (!publishedAt || !contentUpdatedAt) return false;
  const p = new Date(publishedAt).getTime();
  const c = new Date(contentUpdatedAt).getTime();
  if (Number.isNaN(p) || Number.isNaN(c)) return false;
  // Sai số nhỏ (dưới 1 giây) là do publishedAt/contentUpdatedAt cùng được set trong một lần
  // ghi (bài mới tạo) — không tính là "đã cập nhật".
  return c - p > 1000;
}
