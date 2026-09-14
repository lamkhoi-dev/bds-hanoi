/**
 * Bóc đoạn định danh khỏi tham số `/users/public/:slug`.
 *
 * Cùng quy ước với tin đăng (`parseListingRef`, `frontend/src/lib/seo/canonical.ts`):
 *   - URL CŨ `{tên}--{uuid}` hoặc `{tên}-{uuid}`: nhận ra nhờ UUID (36 ký tự, có gạch bên
 *     trong) — lấy đúng đoạn UUID, không phụ thuộc slug đứng trước có bao nhiêu dấu gạch.
 *   - URL MỚI `{tên}-{shortCode}`: shortCode base36 không có gạch bên trong, nên "đoạn sau
 *     dấu gạch cuối cùng" luôn đúng.
 *   - Không có dấu gạch nào (link trần chỉ có mã, không có tên): trả nguyên chuỗi.
 *
 * Tách riêng khỏi controller để test được mà không cần dựng NestJS.
 */
export function parseUserRef(slug: string): string {
  if (!slug) return '';
  const uuidMatch = slug.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (uuidMatch) return uuidMatch[0];
  return slug.includes('-') ? slug.slice(slug.lastIndexOf('-') + 1) : slug;
}
