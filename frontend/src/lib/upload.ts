import api from './axios';

export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.url;
};

/**
 * Bản có kèm kích thước ảnh THẬT (sau khi máy chủ resize) — trình soạn thảo tin tức cần
 * width/height để: (1) khai đúng cho SEO (NewsArticle image), (2) cảnh báo ảnh đại diện
 * dưới khuyến nghị 1200×675 ngay khi vừa chọn, không phải đợi lưu xong mới biết.
 */
export const uploadImageWithMeta = async (file: File): Promise<{ url: string; width?: number; height?: number }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return { url: response.data.url, width: response.data.width, height: response.data.height };
};
