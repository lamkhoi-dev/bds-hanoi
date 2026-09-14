/**
 * Rút câu lỗi tiếng Việt dễ hiểu từ một lỗi axios, ưu tiên thông điệp thật của máy chủ.
 *
 * Vì sao cần riêng: lỗi 413 (Payload Too Large) không đi qua bộ lọc lỗi của NestJS — nó bị
 * chặn ở tầng body-parser TRƯỚC KHI vào tới ứng dụng, nên `error.response.data` không có
 * hình dạng JSON `{message}` như lỗi thường mà là trang lỗi HTML/text của Express. Toast
 * chung chung "Lỗi khi đăng bài viết" (trước 12/9, khi khách báo không đăng được tin tức
 * trên PC) không cho người dùng biết PHẢI LÀM GÌ — thêm nhánh riêng cho 413 để chỉ đúng
 * hướng khắc phục (dùng nút Chèn ảnh thay vì dán trực tiếp).
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { status?: number; data?: any }; message?: string };

  if (e?.response?.status === 413) {
    return 'Nội dung quá lớn (thường do dán ảnh trực tiếp vào bài). Hãy dùng nút "Chèn ảnh" thay vì dán, rồi thử lại.';
  }

  const data = e?.response?.data;
  const msg = data?.message;
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (Array.isArray(msg) && msg.length > 0) return msg.join(', ');

  if (!e?.response && e?.message === 'Network Error') {
    return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.';
  }

  return fallback;
}
