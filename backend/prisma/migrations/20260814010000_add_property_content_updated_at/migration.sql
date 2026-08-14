-- <lastmod> của sitemap trước đây lấy từ Property.updatedAt, mà cột đó là @updatedAt nên
-- bị đẩy bởi mọi thao tác ghi: tăng lượt xem, đếm click, cron gia hạn VIP hằng giờ.
-- Kết quả là lastmod của toàn bộ tin thay đổi liên tục và trở nên vô nghĩa với Google.
--
-- contentUpdatedAt chỉ được set khi nội dung hoặc trạng thái hiển thị thực sự đổi.
ALTER TABLE "Property" ADD COLUMN     "contentUpdatedAt" TIMESTAMP(3);

-- Backfill: dữ liệu cũ lấy mốc gần đúng nhất đang có.
UPDATE "Property"
SET "contentUpdatedAt" = COALESCE("publishedAt", "updatedAt", "createdAt")
WHERE "contentUpdatedAt" IS NULL;

-- Sitemap sắp xếp và lọc theo cột này.
CREATE INDEX "Property_contentUpdatedAt_idx" ON "Property"("contentUpdatedAt");
