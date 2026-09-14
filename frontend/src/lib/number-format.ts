/**
 * Định dạng/đọc lại số có dấu chấm phân cách hàng nghìn — khách báo 12/9: "Trong mục kiểm
 * duyệt tin, cho dấu phẩy hoặc chấm (phân cách hàng nghìn): 1.400.000.000 thay cho
 * 1400000000".
 *
 * Tách riêng khỏi `lib/utils.ts formatNumberString` (vốn chỉ ĐỊNH DẠNG, không ĐỌC NGƯỢC)
 * vì ô nhập cần cả hai chiều: hiện có dấu chấm trong lúc gõ, và đọc lại đúng số khi gửi lên
 * máy chủ. Hai hàm phải khớp nhau tuyệt đối — test đối chiếu `parseThousands(formatThousands(x)) === x`.
 */

/** Hiện `1400000000` thành `1.400.000.000`. Giá trị rỗng/không hợp lệ trả chuỗi rỗng. */
export function formatThousands(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return '';
  const negative = num < 0;
  const digits = Math.trunc(Math.abs(num)).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (negative ? '-' : '') + grouped;
}

/**
 * Đọc ngược `1.400.000.000` (hoặc bất kỳ chuỗi nào người dùng gõ dở) về số nguyên.
 * Chỉ giữ chữ số và dấu trừ ở đầu — dấu chấm/phẩy/khoảng trắng người dùng gõ xen vào đều bỏ.
 * Chuỗi không còn chữ số nào -> `null` (khác 0 — ô trống không phải giá trị 0).
 */
export function parseThousands(display: string): number | null {
  if (!display) return null;
  const negative = display.trim().startsWith('-');
  const digits = display.replace(/[^\d]/g, '');
  if (!digits) return null;
  const num = Number(digits);
  return negative ? -num : num;
}
