/**
 * Bản sao CHÍNH XÁC của `frontend/src/lib/utils.ts#generateSlug`.
 *
 * Vì sao không dùng `property-utils.ts#slugify`: hai hàm khác thứ tự xử lý —
 * `generateSlug` đổi `[^a-z0-9\s]` thành '-' TRƯỚC rồi mới gộp khoảng trắng, còn
 * `slugify` gộp mọi cụm không phải chữ-số trong một lượt. Với hầu hết tiêu đề chúng
 * cho kết quả giống nhau, nhưng đây là chuỗi nằm trong URL canonical của trang tin,
 * nên lệch một ký tự là sitemap liệt kê URL sẽ bị 301.
 *
 * Lưu ý: URL trang tin dùng `generateSlug(title)`, KHÔNG dùng cột `Property.slug`.
 *
 * Nếu sửa hàm này thì phải sửa cả bản frontend cùng lúc.
 */
export function generateSlug(title?: string | null): string {
  if (!title) return 'tin-bds';
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^a-z0-9\s])/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
