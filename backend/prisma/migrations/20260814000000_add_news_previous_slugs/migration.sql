-- Giữ lại slug cũ của bài tin tức sau khi đổi tiêu đề, để 301 URL đã được Google
-- index thay vì trả 404. Xem NewsService.update và NewsService.findOne.
ALTER TABLE "News" ADD COLUMN     "previousSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[];
