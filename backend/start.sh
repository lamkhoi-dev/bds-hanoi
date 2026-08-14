#!/bin/sh
set -e

# Áp migration trước khi khởi động.
#
# MẶC ĐỊNH LÀ "false" — CỐ Ý.
# Đây là thao tác GHI lên cơ sở dữ liệu thật. Nếu mặc định bật thì mỗi lệnh
# `docker compose up` vô tình trên VPS đang chạy production là một lần đổi schema
# ngoài ý muốn. Trên nhadatxunghe.vn còn thêm rủi ro riêng: lịch sử migration trong
# repo KHÔNG dựng lại được schema hiện tại từ đầu (bảng News từng được đưa lên bằng
# `db push`), nên phải đối chiếu bằng tay trước.
#
# Quy trình đúng: sao lưu -> diễn tập trên bản sao -> đặt RUN_MIGRATIONS=true đúng
# một lần cho lần deploy đó -> trả về false.
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "Applying database migrations..."
  ./node_modules/.bin/prisma migrate deploy
else
  echo "Bỏ qua migration (RUN_MIGRATIONS=${RUN_MIGRATIONS:-false}). Đặt RUN_MIGRATIONS=true để chạy."
fi

echo "Starting application..."
if [ -f "dist/src/main.js" ]; then
  node dist/src/main.js
else
  node dist/main
fi
