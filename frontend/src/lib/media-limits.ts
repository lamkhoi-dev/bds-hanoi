/**
 * Giới hạn dung lượng khi đăng tin có video.
 *
 * Khách yêu cầu 27/9: "giới hạn 100MB cho 8 ảnh + video" — tổng dung lượng file gốc khách
 * chọn (ảnh + video) không quá 100MB. Máy chủ chỉ chặn cứng từng video ≤ 100MB (ảnh đã có
 * giới hạn 5MB/ảnh riêng); phép cộng tổng nằm ở đây vì chỉ trình duyệt biết mọi file khách
 * vừa chọn, còn máy chủ chỉ nhìn thấy từng lượt tải lên rời nhau.
 */
export const MAX_MEDIA_BYTES = 100 * 1024 * 1024;

/** Định dạng video nhận vào — máy chủ nén tất cả về MP4 nên khách không phải tự đổi. */
export const VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/webm';

export function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)}MB`;
}

/**
 * Trả về câu báo lỗi (tiếng Việt) nếu thêm `addingBytes` vào lượt tải hiện có làm tổng vượt
 * 100MB, ngược lại `null`. `currentBytes` là tổng dung lượng gốc ảnh + video đã tải lên
 * trong phiên đăng tin này (ảnh/video có sẵn của tin đang sửa không biết dung lượng nên
 * không được tính — máy chủ vẫn chặn từng video quá 100MB).
 */
export function mediaBudgetError(currentBytes: number, addingBytes: number): string | null {
  if (currentBytes + addingBytes <= MAX_MEDIA_BYTES) return null;
  const left = Math.max(0, MAX_MEDIA_BYTES - currentBytes);
  return `Tổng dung lượng ảnh + video tối đa ${formatMegabytes(MAX_MEDIA_BYTES)}. Bạn còn ${formatMegabytes(left)}, file này ${formatMegabytes(addingBytes)}.`;
}

/** Lấy câu lỗi hiển thị từ phản hồi lỗi của máy chủ khi tải video. */
export function videoUploadErrorMessage(err: any): string {
  const status = err?.response?.status;
  if (status === 413) return `Video vượt quá ${formatMegabytes(MAX_MEDIA_BYTES)}.`;
  const message = err?.response?.data?.message;
  if (typeof message === 'string' && message) return message;
  if (Array.isArray(message) && message.length > 0) return String(message[0]);
  if (err?.code === 'ECONNABORTED') return 'Tải video quá lâu. Vui lòng thử video nhỏ hơn hoặc kiểm tra mạng.';
  return 'Không tải được video. Vui lòng thử lại.';
}
