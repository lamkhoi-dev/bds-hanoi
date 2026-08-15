#!/bin/bash
# Script hỗ trợ chuyển đổi dữ liệu từ Supabase sang Postgres VPS cục bộ
# Hướng dẫn:
# 1. Cài đặt postgresql-client (để có pg_dump và psql) trên máy của bạn hoặc VPS.
# 2. Thay đổi SUPABASE_DB_URL thành chuỗi kết nối Supabase cũ của bạn.
# 3. Thay đổi VPS_DB_URL thành chuỗi kết nối Postgres trên VPS của bạn (theo .env.prod.example).
# 4. Chạy script: bash scripts/migrate_supabase_to_vps.sh

# TODO: Thay thế bằng URL thực tế của bạn
SUPABASE_DB_URL="postgresql://postgres.vlsiatevzoznbgqqppjn:Huynguyen300604--@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

# TODO: Thay thế password và thông tin theo cấu hình .env trên VPS (Nếu chạy lệnh bên ngoài docker thì cổng là 5433, nếu chạy trong docker container postgres thì cổng 5432)
VPS_DB_URL="postgresql://bds_prod_user:your_secure_db_password@localhost:5433/bds_prod_db"

echo "Bắt đầu xuất dữ liệu từ Supabase..."
# Sử dụng pg_dump để xuất toàn bộ schema và data
# Cờ --clean: thêm lệnh DROP TABLE trước khi CREATE.
# Cờ --no-owner: không set owner cho role của supabase (tránh lỗi role not found trên VPS)
pg_dump --clean --if-exists --no-owner --quote-all-identifiers -d "$SUPABASE_DB_URL" -f supabase_backup.sql

if [ $? -eq 0 ]; then
    echo "Xuất dữ liệu thành công ra file supabase_backup.sql"
else
    echo "Lỗi: Không thể xuất dữ liệu từ Supabase. Vui lòng kiểm tra lại URL kết nối."
    exit 1
fi

echo "Bắt đầu nhập dữ liệu vào VPS Postgres..."
psql -d "$VPS_DB_URL" -f supabase_backup.sql

if [ $? -eq 0 ]; then
    echo "Quá trình chuyển đổi dữ liệu hoàn tất thành công!"
    echo "Bạn có thể kiểm tra lại database trên VPS."
    echo "Nếu dữ liệu đã chuẩn, hãy xóa file backup: rm supabase_backup.sql"
else
    echo "Lỗi: Không thể nhập dữ liệu vào VPS Postgres. Vui lòng kiểm tra lại URL kết nối VPS."
    exit 1
fi
