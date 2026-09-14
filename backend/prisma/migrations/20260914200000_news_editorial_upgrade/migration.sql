-- Nâng cấp quản trị tin tức: trạng thái + hẹn giờ, chuyên mục, tác giả, ảnh có chú thích,
-- SEO tuỳ chọn, BĐS liên quan. Xem plan/14-loi-12-9.md PHẦN B.
--
-- CHỈ THÊM — không xoá, không đổi kiểu cột nào. Bài cũ backfill PUBLISHED,
-- publishedAt = createdAt, để URL đang được Google index không rớt khỏi sitemap.

DO $$ BEGIN
  CREATE TYPE "NewsStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "NewsCategory" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NewsCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "NewsCategory_name_key" ON "NewsCategory"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "NewsCategory_slug_key" ON "NewsCategory"("slug");
CREATE INDEX IF NOT EXISTS "NewsCategory_isActive_sortOrder_idx" ON "NewsCategory"("isActive", "sortOrder");

ALTER TABLE "News"
  ADD COLUMN IF NOT EXISTS "sapo" TEXT,
  ADD COLUMN IF NOT EXISTS "thumbnailAlt" TEXT,
  ADD COLUMN IF NOT EXISTS "thumbnailCaption" TEXT,
  ADD COLUMN IF NOT EXISTS "thumbnailCredit" TEXT,
  ADD COLUMN IF NOT EXISTS "thumbnailWidth" INTEGER,
  ADD COLUMN IF NOT EXISTS "thumbnailHeight" INTEGER,
  ADD COLUMN IF NOT EXISTS "status" "NewsStatus" NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "contentUpdatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "authorName" TEXT,
  ADD COLUMN IF NOT EXISTS "categoryId" TEXT,
  ADD COLUMN IF NOT EXISTS "sources" JSONB,
  ADD COLUMN IF NOT EXISTS "seoTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "metaDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "canonicalUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "relatedPropertyIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill TRƯỚC khi đặt default cho publishedAt: nếu không, bài cũ nhận đúng giờ chạy
-- migration thay vì giờ đăng thật, sitemap <lastmod> sẽ nhảy vọt cho mọi bài cũ cùng lúc.
UPDATE "News" SET "publishedAt" = "createdAt" WHERE "publishedAt" IS NULL;
ALTER TABLE "News" ALTER COLUMN "publishedAt" SET DEFAULT CURRENT_TIMESTAMP;
-- contentUpdatedAt để NULL: `updatedAt` cũ có thể đã bị các script sửa slug/dữ liệu khác
-- đẩy lên, không phản ánh đúng lần sửa NỘI DUNG gần nhất.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'News_categoryId_fkey') THEN
    ALTER TABLE "News" ADD CONSTRAINT "News_categoryId_fkey" FOREIGN KEY ("categoryId")
      REFERENCES "NewsCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "News_status_publishedAt_idx" ON "News"("status", "publishedAt");
CREATE INDEX IF NOT EXISTS "News_categoryId_status_publishedAt_idx" ON "News"("categoryId", "status", "publishedAt");
