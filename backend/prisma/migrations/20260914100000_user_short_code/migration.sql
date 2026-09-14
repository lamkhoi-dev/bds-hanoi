-- Mã ngắn cho link người đăng — khách báo 12/9: "link user (người đăng bài) bị dài thành
-- link slug ngắn (đoạn id cuối cùng của link)".
--
-- Hiện `/user/{tên-slug}-{uuid 36 ký tự}`. Cùng công thức đã dùng cho tin đăng (migration
-- `20260814040000_property_short_code`): sequence + base36, DUY NHẤT TUYỆT ĐỐI, không cần
-- vòng lặp thử lại. Bản ghi KHÔNG đổi `id` nên URL cũ vẫn 301 được về dạng mới.
--
-- KHÁC với tin đăng ở một điểm: đặt DEFAULT ngay trên cột thay vì để tầng ứng dụng tự gọi
-- `nextval()` lúc tạo. Tài khoản được tạo ở NHIỀU đường (đăng ký thường, đăng nhập OTP tự
-- tạo tài khoản, đăng nhập Google, admin tạo tay) — bắt tầng ứng dụng nhớ gán ở đúng từng ấy
-- chỗ là cách chắc chắn bỏ sót một chỗ. Đặt DEFAULT ở CSDL thì mọi đường tạo, kể cả những
-- đường sau này mới viết, đều tự có mã mà không cần sửa thêm dòng code nào.

CREATE SEQUENCE IF NOT EXISTS user_short_code_seq START WITH 100000;

-- Dùng lại hàm `bds_to_base36` đã tạo ở migration tin đăng — cùng một hàm, không tạo bản
-- thứ hai. Nếu vì lý do gì đó hàm chưa tồn tại (vd chạy migration này trên một CSDL mới
-- theo thứ tự khác), tạo lại y hệt để migration này không phụ thuộc thứ tự.
CREATE OR REPLACE FUNCTION bds_to_base36(n bigint) RETURNS text AS $$
DECLARE
  digits constant text := '0123456789abcdefghijklmnopqrstuvwxyz';
  result text := '';
  v bigint := n;
BEGIN
  IF v IS NULL OR v <= 0 THEN RETURN '0'; END IF;
  WHILE v > 0 LOOP
    result := substr(digits, (v % 36)::int + 1, 1) || result;
    v := v / 36;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "shortCode" TEXT;

-- Backfill người dùng đã có — nextval() volatile nên gọi MỘT LẦN CHO MỖI DÒNG.
UPDATE "User"
SET "shortCode" = bds_to_base36(nextval('user_short_code_seq'))
WHERE "shortCode" IS NULL;

DO $$
DECLARE missing int;
BEGIN
  SELECT count(*) INTO missing FROM "User" WHERE "shortCode" IS NULL;
  IF missing > 0 THEN
    RAISE EXCEPTION 'Còn % người dùng chưa có shortCode — dừng migration.', missing;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "User_shortCode_key" ON "User"("shortCode");

-- Đặt DEFAULT cho mọi INSERT về sau — kể cả khi ứng dụng không gán tường minh.
ALTER TABLE "User" ALTER COLUMN "shortCode" SET DEFAULT bds_to_base36(nextval('user_short_code_seq'));
