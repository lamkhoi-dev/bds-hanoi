-- Model Dự án (PHẦN I, mục 8-23).
--
-- Toàn bộ cột mới đều nullable hoặc có default, bảng Project là bảng MỚI — không đụng
-- một dòng dữ liệu nào đang có trong Property/Location. An toàn tuyệt đối để chạy trên
-- CSDL đang phục vụ production.

CREATE TYPE "ProjectStatus" AS ENUM ('VISIBLE', 'HIDDEN');

CREATE TABLE "Project" (
  "id"               TEXT NOT NULL,
  "shortCode"        TEXT NOT NULL,
  "name"             TEXT NOT NULL,
  "slug"             TEXT NOT NULL,
  "thumbnail"        TEXT,
  "description"      TEXT NOT NULL,
  "status"           "ProjectStatus" NOT NULL DEFAULT 'VISIBLE',
  "city"             TEXT,
  "district"         TEXT,
  "ward"             TEXT,
  "oldWard"          TEXT,
  "provinceId"       TEXT,
  "districtId"       TEXT,
  "wardId"           TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  "contentUpdatedAt" TIMESTAMP(3),

  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Project_shortCode_key" ON "Project"("shortCode");
CREATE INDEX "Project_status_idx" ON "Project"("status");

ALTER TABLE "Project" ADD CONSTRAINT "Project_provinceId_fkey"
  FOREIGN KEY ("provinceId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_districtId_fkey"
  FOREIGN KEY ("districtId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_wardId_fkey"
  FOREIGN KEY ("wardId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Property.projectId — nullable, không có dòng nào ghi ngay nên không cần backfill.
ALTER TABLE "Property" ADD COLUMN "projectId" TEXT;
ALTER TABLE "Property" ADD CONSTRAINT "Property_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
