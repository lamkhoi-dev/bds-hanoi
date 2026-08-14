-- Nhóm điều hướng cho cấp quận/huyện.
--
-- Khách chốt Hà Nội chia 3 nhóm: Trung tâm / Cận trung tâm / Ngoại thành (10 quận mỗi
-- nhóm, khớp đúng 30/30 với dữ liệu đã nhập). Nghệ An không phân nhóm.
--
-- Lưu NHÃN (String) thay vì enum để tỉnh khác dùng cách chia riêng mà không phải
-- migrate schema. NULL = không phân nhóm -> menu giữ dạng phẳng như hiện tại, nên
-- migration này an toàn tuyệt đối với dữ liệu Nghệ An đang chạy.

ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "group" TEXT;
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "groupOrder" INTEGER NOT NULL DEFAULT 0;

-- Chỉ dùng để liệt kê quận theo nhóm ở menu; luôn kèm điều kiện type/isActive.
CREATE INDEX IF NOT EXISTS "Location_group_groupOrder_sortOrder_idx"
  ON "Location" ("group", "groupOrder", "sortOrder");
