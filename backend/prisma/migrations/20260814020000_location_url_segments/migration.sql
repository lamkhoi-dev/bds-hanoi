-- Chuẩn bị cho dữ liệu hành chính Hà Nội.
--
-- Vấn đề: `Location.slug` đang UNIQUE TOÀN CỤC. Dữ liệu Hà Nội (1 thành phố +
-- 30 quận/huyện + 126 phường xã mới + 579 phường xã cũ = 736 bản ghi) có 125 nhóm tên
-- trùng nhau, chạm 275/736 hàng — không thể nhét vừa ràng buộc đó.
--   * khoá (parentId, slug)        -> còn 76 xung đột (WARD trùng tên OLD_WARD cùng quận)
--   * khoá (parentId, type, slug)  -> chỉ còn 1 (Thị trấn Yên Viên vs Xã Yên Viên, Gia Lâm)
-- nên `type` bắt buộc phải nằm trong khoá.
--
-- Tách hai khái niệm:
--   slug       — định danh theo cấp cha, suy ra được, không cần hậu tố
--   urlSegment — đoạn URL duy nhất toàn cục, có hậu tố khi trùng

-- 1. Enum thay cho cột type dạng chuỗi tự do
CREATE TYPE "LocationType" AS ENUM ('CITY', 'DISTRICT', 'WARD', 'OLD_WARD');

-- 2. Thêm cột, tạm cho phép NULL để backfill
ALTER TABLE "Location" ADD COLUMN     "shortName" TEXT;
ALTER TABLE "Location" ADD COLUMN     "urlSegment" TEXT;
ALTER TABLE "Location" ADD COLUMN     "path" TEXT;
ALTER TABLE "Location" ADD COLUMN     "depth" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Location" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Location" ADD COLUMN     "externalRef" TEXT;
ALTER TABLE "Location" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- 3. Chuẩn hoá giá trị type cũ trước khi ép kiểu enum.
--    scripts/sync-locations.ts từng dò khoá 'PROVINCE' nên có thể tồn tại giá trị đó.
UPDATE "Location" SET "type" = upper(trim("type"));
UPDATE "Location" SET "type" = 'CITY' WHERE "type" IN ('PROVINCE', 'TINH', 'THANH_PHO');

-- 3b. Tiền kiểm giá trị `type` TRƯỚC khi ép enum ở bước 6.
--     Ép kiểu mà gặp giá trị lạ sẽ ném lỗi cụt lủn "invalid input value for enum",
--     không cho biết giá trị nào. Dừng ở đây và NÊU ĐÍCH DANH thì sửa được ngay.
DO $$
DECLARE bad TEXT;
BEGIN
  SELECT string_agg(DISTINCT "type", ', ') INTO bad
    FROM "Location"
   WHERE "type" IS NULL OR "type" NOT IN ('CITY', 'DISTRICT', 'WARD', 'OLD_WARD');
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'Cột Location.type còn giá trị không thuộc enum: [%]. Chuẩn hoá rồi migrate lại.', bad;
  END IF;
END $$;

-- 4. Backfill cho dữ liệu sẵn có (DB mới thì không có hàng nào, các lệnh này là no-op)

-- shortName: bỏ tiền tố đơn vị. Nếu để nguyên `name` thì trang hiển thị
-- "Thành phố Vinh" ở chỗ chỉ nên là "Vinh", và menu/breadcrumb bị lặp tiền tố.
UPDATE "Location"
SET "shortName" = NULLIF(
  trim(regexp_replace("name", '^(Thành phố|Thị xã|Thị trấn|Quận|Huyện|Phường|Xã|Tỉnh)\s+', '', 'i')),
  ''
)
WHERE "shortName" IS NULL;
-- Tên chỉ gồm mỗi tiền tố (không nên có, nhưng phòng) thì giữ nguyên tên gốc.
UPDATE "Location" SET "shortName" = "name" WHERE "shortName" IS NULL;

UPDATE "Location" SET "urlSegment" = "slug" WHERE "urlSegment" IS NULL AND "slug" IS NOT NULL;
UPDATE "Location" SET "slug" = "urlSegment" WHERE "slug" IS NULL AND "urlSegment" IS NOT NULL;

-- path + depth: dựng THEO CÂY, không phải gán phẳng.
--
-- Bản trước gán `path = urlSegment`, nên một huyện của Nghệ An có path 'dien-chau'.
-- LocationService lọc `path = 'nghe-an' OR path LIKE 'nghe-an/%'` -> toàn bộ huyện và
-- xã bị loại, site mất sạch khu vực dù dữ liệu vẫn còn nguyên trong bảng.
-- CTE đệ quy dựng đúng 'nghe-an/dien-chau/dien-hoa'.
--
-- Bản ghi mồ côi (parentId trỏ vào id không tồn tại) KHÔNG nằm trong CTE nên path vẫn
-- NULL và bị chốt chặn ở bước 5 tóm — đúng ý đồ, thà dừng còn hơn đặt path sai.
WITH RECURSIVE tree AS (
  SELECT "id", "urlSegment"::text AS "path", 0 AS "depth"
    FROM "Location"
   WHERE "parentId" IS NULL
  UNION ALL
  SELECT c."id", t."path" || '/' || c."urlSegment", t."depth" + 1
    FROM "Location" c
    JOIN tree t ON c."parentId" = t."id"
)
UPDATE "Location" l
   SET "path" = tree."path", "depth" = tree."depth"
  FROM tree
 WHERE l."id" = tree."id";

-- 5. Dừng lớn tiếng thay vì âm thầm bịa dữ liệu.
--    Slug tiếng Việt cần bỏ dấu — không làm được bằng SQL thuần, nên nếu DB đã có
--    Location mà thiếu slug thì phải chạy backfill bằng script trước.
DO $$
DECLARE bad INT;
DECLARE sample TEXT;
BEGIN
  SELECT count(*), string_agg(DISTINCT "name", ', ') INTO bad, sample
    FROM "Location"
   WHERE "slug" IS NULL OR "urlSegment" IS NULL OR "path" IS NULL OR "shortName" IS NULL;
  IF bad > 0 THEN
    RAISE EXCEPTION
      'Có % bản ghi Location thiếu slug/urlSegment/path (ví dụ: %). Nguyên nhân thường gặp: thiếu slug, hoặc parentId mồ côi nên không dựng được path.', bad, left(coalesce(sample, ''), 200);
  END IF;
END $$;

-- 6. Ràng buộc mới
DROP INDEX IF EXISTS "Location_slug_key";
DROP INDEX IF EXISTS "Location_slug_type_parentId_idx";

ALTER TABLE "Location" ALTER COLUMN "shortName" SET NOT NULL;
ALTER TABLE "Location" ALTER COLUMN "urlSegment" SET NOT NULL;
ALTER TABLE "Location" ALTER COLUMN "path" SET NOT NULL;
ALTER TABLE "Location" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Location" ALTER COLUMN "type" TYPE "LocationType" USING "type"::"LocationType";

CREATE UNIQUE INDEX "Location_urlSegment_key" ON "Location"("urlSegment");
CREATE UNIQUE INDEX "Location_parentId_type_slug_key" ON "Location"("parentId", "type", "slug");
CREATE INDEX "Location_path_idx" ON "Location"("path");
CREATE INDEX "Location_type_isActive_idx" ON "Location"("type", "isActive");
CREATE INDEX "Location_parentId_type_sortOrder_idx" ON "Location"("parentId", "type", "sortOrder");
