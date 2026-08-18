-- Thêm FK riêng cho phường/xã CŨ trên Property. Trước đây chỉ có cột `oldWard` (chuỗi
-- tên, không FK) — khối "Bất động sản theo phường, xã cũ" trên trang chủ (mục 25.3
-- PHẦN II) xếp hạng theo tin mới nhất cần groupBy một FK ổn định, so khớp bằng chuỗi
-- sẽ gộp sai khi 13 nhóm tên xã trùng nhau giữa các quận (vd "Quang Trung" x3).
-- Backfill dữ liệu cũ bằng scripts/backfill-old-ward-id.ts (dry-run mặc định, --apply
-- để ghi thật) SAU khi migration này chạy — không tự backfill trong migration để giữ
-- migration thuần DDL, dễ soát lỗi.

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "oldWardId" TEXT;

-- CreateIndex
CREATE INDEX "Property_oldWardId_idx" ON "Property"("oldWardId");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_oldWardId_fkey" FOREIGN KEY ("oldWardId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
