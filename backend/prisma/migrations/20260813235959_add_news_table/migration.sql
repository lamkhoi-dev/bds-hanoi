-- Tạo bảng News.
--
-- Vì sao migration này ra đời muộn hơn bảng: bảng News được đưa lên production bằng
-- `prisma db push` chứ không qua migration, nên KHÔNG migration nào trong repo tạo nó.
-- Hệ quả đã kiểm chứng: chạy `prisma migrate deploy` trên một CSDL TRẮNG thì dừng ở
-- `20260814000000_add_news_previous_slugs` với lỗi `relation "News" does not exist`.
-- Nghĩa là server Hà Nội mới không dựng được schema từ đầu.
--
-- Dùng IF NOT EXISTS ở mọi câu lệnh nên:
--   * CSDL trắng (Hà Nội)      -> tạo bảng, đi tiếp được.
--   * CSDL Nghệ An đang chạy   -> bảng đã có, mọi câu lệnh là no-op, KHÔNG đụng dữ liệu.
--
-- Đặt mốc thời gian ngay TRƯỚC 20260814000000 để nằm đúng thứ tự phụ thuộc.

CREATE TABLE IF NOT EXISTS "News" (
  "id"        TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "content"   TEXT NOT NULL,
  "thumbnail" TEXT,
  "slug"      TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "News_slug_key" ON "News"("slug");
CREATE INDEX IF NOT EXISTS "News_createdAt_idx" ON "News"("createdAt");
