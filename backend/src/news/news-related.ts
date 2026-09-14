/**
 * Bóc mã tin đăng (shortCode hoặc UUID) từ những gì admin dán vào ô "BĐS liên quan" — có
 * thể là một link đầy đủ (`https://.../tin/ten-tin-ab12c`), một đường dẫn (`/tin/...`),
 * hay chỉ mỗi mã tin. Cùng quy ước tách với `frontend/src/lib/seo/canonical.ts
 * parseListingRef`: dạng cũ `--{uuid}` nhận ra nhờ dấu `--`; dạng mới lấy đoạn sau dấu `-`
 * cuối cùng.
 *
 * Không cố đoán mã có THẬT hay không ở đây — việc đó thuộc về nơi gọi (tra CSDL theo mã rồi
 * báo "không tìm thấy" cho từng dòng), hàm này chỉ lo phần tách chuỗi.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parsePropertyRef(input: string): string {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';

  // Mã THẬT (uuid) truyền thẳng — vd khi resolve lại `relatedPropertyIds` đã lưu để hiển thị
  // lại tiêu đề (NewsForm khi sửa bài). Không đi qua bước tách "đoạn cuối sau dấu -" bên dưới,
  // nếu không uuid sẽ bị cắt cụt thành đoạn sau dấu gạch ngang CUỐI CÙNG của chính nó.
  if (UUID_RE.test(trimmed)) return trimmed;

  // Bỏ domain + query/hash nếu admin dán nguyên link, chỉ giữ lại đoạn cuối của path.
  let value = trimmed;
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      value = new URL(trimmed).pathname;
    }
  } catch {
    // Không phải URL hợp lệ — coi như đã là path/mã, đi tiếp.
  }
  value = value.replace(/^\/+|\/+$/g, '').replace(/^tin\//, '');
  const lastSegment = value.includes('/') ? value.slice(value.lastIndexOf('/') + 1) : value;

  const legacy = lastSegment.split('--');
  if (legacy.length > 1) return legacy[legacy.length - 1];

  const i = lastSegment.lastIndexOf('-');
  return i >= 0 ? lastSegment.slice(i + 1) : lastSegment;
}

/**
 * Bóc mã cho CẢ DANH SÁCH admin dán vào (mỗi dòng một link/mã), bỏ dòng rỗng, loại trùng
 * nhưng GIỮ THỨ TỰ xuất hiện đầu tiên — admin sắp xếp thứ tự này có ý nghĩa (tin hiện trước/
 * sau trong khối "BĐS liên quan").
 */
export function parsePropertyRefList(input: string): string[] {
  const lines = (input || '').split(/\r?\n|,/).map((l) => parsePropertyRef(l)).filter(Boolean);
  return Array.from(new Set(lines));
}
