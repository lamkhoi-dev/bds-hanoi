# HƯỚNG DẪN QUẢN TRỊ DOCKER & BACKUP/RESTORE TRÊN VPS

Tài liệu này dành cho kỹ thuật viên quản trị hệ thống, hướng dẫn cách sử dụng mã lệnh (Command Line) trên VPS để quản lý các container Docker của hệ thống website Bất Động Sản, cũng như cách Backup/Restore toàn diện ở cấp độ Máy chủ.

---

## 1. Các lệnh quản lý Docker Compose (Vận hành Website)

Hệ thống được đóng gói bằng Docker Compose nằm tại thư mục `/var/www/bds-system`.

*   **Truy cập thư mục chứa mã nguồn:**
    ```bash
    cd /var/www/bds-system
    ```
*   **Xem trạng thái các container đang chạy:**
    ```bash
    docker ps
    ```
*   **Khởi động lại toàn bộ website:**
    ```bash
    docker compose -f docker-compose.vps.yml restart
    ```
*   **Tắt hoàn toàn website:**
    ```bash
    docker compose -f docker-compose.vps.yml down
    ```
*   **Bật lại website (chạy ngầm):**
    ```bash
    docker compose -f docker-compose.vps.yml up -d
    ```
*   **Xem logs lỗi (rất quan trọng khi gỡ lỗi):**
    ```bash
    docker logs bds-backend-prod --tail 100 -f   # Xem log backend
    docker logs bds-frontend-prod --tail 100 -f  # Xem log frontend
    ```

---

## 2. Hướng dẫn Sao lưu (Backup) cấp độ Máy chủ
Bên cạnh chức năng Backup JSON trên giao diện Web, để an toàn tuyệt đối 100%, kỹ thuật viên nên sao lưu Database dạng `.dump` và sao lưu toàn bộ hình ảnh trong MinIO.

### A. Backup Database (PostgreSQL)
Tạo một bản snapshot toàn bộ dữ liệu (bảo toàn cấu trúc bảng & index):
```bash
docker exec -t bds-postgres-prod pg_dump -U bds_user bds_db -F c -f /var/lib/postgresql/data/bds_backup_$(date +%F).dump
```
*(File sinh ra sẽ nằm trong thư mục cấu hình volume của Database trên VPS).*

### B. Backup Hình ảnh (MinIO Object Storage)
Hình ảnh tải lên được lưu tại thư mục `/var/www/bds-system/minio_data`. Để sao lưu, ta sẽ nén toàn bộ thư mục này lại:
```bash
tar -czvf /root/backup_images_$(date +%F).tar.gz /var/www/bds-system/minio_data
```

---

## 3. Hướng dẫn Khôi phục (Restore) cấp độ Máy chủ
Sử dụng trong trường hợp server bị hỏng nặng, web không thể truy cập, cần dựng lại dữ liệu từ đầu.

### A. Khôi phục CSDL (PostgreSQL)
Giả sử bạn đang có file `/var/lib/postgresql/data/bds_backup_2026-xx-xx.dump`.
**Bước 1:** Xóa sạch database cũ bị lỗi và tạo lại database trắng.
```bash
docker exec -i bds-postgres-prod psql -U bds_user -d postgres -c "DROP DATABASE bds_db; CREATE DATABASE bds_db;"
```

**Bước 2:** Bơm dữ liệu từ file backup vào database trắng vừa tạo.
```bash
docker exec -i bds-postgres-prod pg_restore -U bds_user -d bds_db -1 /var/lib/postgresql/data/bds_backup_2026-xx-xx.dump
```

### B. Khôi phục Hình ảnh (MinIO)
Giả sử bạn đã tải file `backup_images_2026-xx-xx.tar.gz` vào thư mục `/root` của VPS mới.
Chạy lệnh giải nén đè lên thư mục cũ:
```bash
tar -xzvf /root/backup_images_2026-xx-xx.tar.gz -C /
```

**Bước C:** Khởi động lại hệ thống để nhận dữ liệu mới:
```bash
cd /var/www/bds-system
docker compose -f docker-compose.vps.yml restart
```
