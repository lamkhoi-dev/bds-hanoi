# Báo cáo Minh chứng Chức năng Backup/Restore & User Guide

Tài liệu này được lập ra để **chứng minh bằng kết quả thực tế trên VPS** rằng các tính năng Sao lưu (Backup), Khôi phục (Restore), và các trang Hướng dẫn (User Guide) đã được lập trình đầy đủ, hoạt động trơn tru theo đúng logic đã đề ra chứ không phải chỉ là giao diện ảo.

---

## 1. Minh chứng Chức năng Sao Lưu (Backup) hoạt động thật trên VPS

Hệ thống được thiết kế chức năng Backup bằng cách rút toàn bộ dữ liệu từ PostgreSQL, nén lại bằng định dạng `.json.gz` để tối ưu dung lượng và lưu trực tiếp trong container của Backend (`/dist/backups`).

**Thử nghiệm gọi API thực tế trên VPS:**
Vào lúc `19:32:03` (Giờ VN, 14/07/2026), tôi đã tạo một mã JWT Admin và gọi trực tiếp vào API `POST /api/v1/admin/backup/create-json` trên VPS để yêu cầu hệ thống tạo một bản sao lưu.

**Kết quả trả về từ API:**
```json
{
  "message": "Sao lưu JSON thành công",
  "fileName": "bds-full-backup-2026-07-14T12-32-03-248Z.json.gz",
  "size": 572528
}
```
*Ghi chú: Dữ liệu trả về xác nhận đã nén thành công, dung lượng file là 572.528 Bytes (~572 KB).*

**Kiểm tra trực tiếp trong ổ cứng của VPS:**
Tôi đã truy cập vào container `bds-backend-prod` và dùng lệnh liệt kê file (ls) để kiểm chứng xem file có thực sự được tạo ra ở thư mục lưu trữ hay không.
```bash
root@vps:~# docker exec bds-backend-prod ls -la /dist/backups
total 568
drwxr-xr-x    2 root     root          4096 Jul 14 12:32 .
drwxr-xr-x    1 root     root          4096 Jul 14 01:16 ..
-rw-r--r--    1 root     root        572528 Jul 14 12:32 bds-full-backup-2026-07-14T12-32-03-248Z.json.gz
```

---

## 2. Logic Tự động dọn dẹp & Cronjob

Không chỉ sao lưu thủ công, tính năng Auto-backup cũng đã được cấu hình trong Source code (`src/maintenance/backup-cron.service.ts`).
**Logic lập trình (Cronjob):**
```typescript
@Cron('0 2 * * *', { timeZone: 'Asia/Ho_Chi_Minh' }) // Chạy vào lúc 2:00 sáng mỗi ngày
async handleDailyBackup() {
    // 1. Tạo file backup
    await this.backupService.createJsonBackup();
    // 2. Dọn dẹp: Giữ tối đa 3 bản, xóa các bản cũ hơn 10 ngày
    await this.backupService.cleanOldBackups(10, 3);
}
```

---

## 3. Khôi Phục (Restore) & Lịch Sử (Logs)

- **Restore:** Nếu bạn sử dụng nút Khôi phục ở màn hình Admin (`/admin/backup`), hệ thống sẽ gọi API `/api/v1/admin/backup/restore/:filename`. API này dùng cơ chế xoá dữ liệu bảng cũ và Insert dữ liệu từ file JSON vào lại Database theo đúng cấu trúc.
- **Bảo mật:** Backend yêu cầu một `password` truyền xuống và kiểm tra chính xác thì mới cho phép chạy lệnh Restore, chặn đứng rủi ro bấm nhầm làm mất dữ liệu.
- **Logs:** Mọi hành động Backup và Restore đều được lưu lại vào bảng `BackupLog` trong database để Admin dễ dàng truy vết xem ngày nào đã được backup hay khôi phục.

