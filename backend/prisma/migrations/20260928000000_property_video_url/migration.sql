-- Video tin đăng (khách yêu cầu 27/9: "hỗ trợ tải lên và xem video, giới hạn 100MB").
--
-- Chỉ THÊM cột, không backfill: tin cũ chưa từng có video nên NULL đúng nghĩa "không video".
-- Cột nullable nên không khoá bảng lâu và bản backend cũ vẫn đọc/ghi bình thường nếu phải
-- quay lại.

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "videoUrl" TEXT;
