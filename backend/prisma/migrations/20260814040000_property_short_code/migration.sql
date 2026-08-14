-- Mã ngắn cho URL tin đăng.
--
-- PHẦN I, mục "Đuôi link tin": hiện tại `/tin/{slug}--{uuid}` với 36 ký tự UUID, khách
-- yêu cầu rút ngắn, kèm điều kiện "phải giữ ID cố định và chuyển hướng 301".
--
-- Vì sao dùng SEQUENCE chứ không cắt UUID: 8 ký tự hex đầu chỉ có 4,3 tỉ tổ hợp — theo
-- nghịch lý ngày sinh thì ở quy mô 100k tin xác suất đụng đã khoảng 68%. Sequence cho
-- mã DUY NHẤT TUYỆT ĐỐI, không cần vòng lặp thử lại, và còn NGẮN HƠN: base36 của
-- 1.700.000 là 5 ký tự, đủ chỗ cho ~58 triệu tin trước khi cần ký tự thứ 6.
--
-- Bản ghi KHÔNG đổi id, nên yêu cầu "giữ ID cố định" thoả mãn; URL cũ do frontend 301.

CREATE SEQUENCE IF NOT EXISTS property_short_code_seq START WITH 1700000;

-- Tên có tiền tố `bds_` để CREATE OR REPLACE không âm thầm đè lên một hàm cùng tên
-- có sẵn trong CSDL. Hàm này CHỈ phục vụ backfill một lần; ứng dụng tự đổi cơ số ở
-- tầng TypeScript nên không phụ thuộc vào việc hàm này còn tồn tại hay không.
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

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "shortCode" TEXT;

-- nextval() là hàm volatile nên được gọi MỘT LẦN CHO MỖI DÒNG — mỗi tin một mã riêng.
UPDATE "Property"
SET "shortCode" = bds_to_base36(nextval('property_short_code_seq'))
WHERE "shortCode" IS NULL;

-- Chốt chặn: nếu còn dòng nào chưa có mã thì dừng migration thay vì để index unique
-- tạo được nhưng URL của những tin đó thì hỏng.
DO $$
DECLARE missing int;
BEGIN
  SELECT count(*) INTO missing FROM "Property" WHERE "shortCode" IS NULL;
  IF missing > 0 THEN
    RAISE EXCEPTION 'Còn % tin chưa có shortCode — dừng migration.', missing;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Property_shortCode_key" ON "Property"("shortCode");
