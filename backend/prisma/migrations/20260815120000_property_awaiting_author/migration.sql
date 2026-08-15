-- Trạng thái "chờ người đăng duyệt lại" cho quy trình duyệt tin 2 chiều.
--
-- Khách yêu cầu: admin kiểm tin có 3 lựa chọn — duyệt luôn, sửa rồi duyệt luôn, hoặc
-- SỬA RỒI TRẢ VỀ cho người đăng kiểm tra. Lựa chọn thứ ba cần một trạng thái riêng,
-- không dùng lại DRAFT được vì DRAFT là tin người dùng tự lưu nháp, không phân biệt
-- được với tin đang chờ người đăng xem lại phần admin đã sửa.
--
-- ADD VALUE là thao tác chỉ THÊM, không đụng dòng dữ liệu nào đang có.
ALTER TYPE "PropertyStatus" ADD VALUE IF NOT EXISTS 'AWAITING_AUTHOR';
