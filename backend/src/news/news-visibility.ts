import type { Prisma } from '@prisma/client';

/**
 * Điều kiện Prisma cho "bài công khai" — MỘT định nghĩa dùng ở mọi nơi khách vãng lai đọc
 * tin: chi tiết bài, danh sách `/news`, bài liên quan, sitemap. Không cron nào cần chạy để
 * "xuất bản đúng giờ hẹn" — chỉ cần MỌI truy vấn công khai đều lọc qua đây, bài tự hiện ra
 * đúng lúc `publishedAt` đến vì mỗi lần đọc đều so lại với "bây giờ".
 *
 * `now` nhận tham số thay vì tự gọi `new Date()` bên trong — để test được với một mốc giờ
 * cố định, không phải mock đồng hồ hệ thống.
 */
export function publicNewsWhere(now: Date = new Date()): Prisma.NewsWhereInput {
  return {
    status: 'PUBLISHED',
    publishedAt: { lte: now },
  };
}
