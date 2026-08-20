-- SĐT liên hệ riêng của tin đăng. Form đăng tin đã có ô nhập từ trước nhưng bảng
-- Property không có cột nào để lưu (chỉ Requirement có), nên `normalizePropertyPayload`
-- loại giá trị này khỏi payload một cách âm thầm — khách phản hồi 19-8 (mục 20) là số
-- điện thoại nhập thêm không hiện ở trang chi tiết tin.
--
-- Không backfill: tin cũ chưa từng lưu SĐT nên không có dữ liệu để điền. Cột NULL nghĩa
-- là trang chi tiết chỉ hiện SĐT của tài khoản người đăng như trước.

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "phone" TEXT;
