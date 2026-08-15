# HƯỚNG DẪN SỬ DỤNG CHỨC NĂNG BACKUP VÀ RESTORE TRÊN WEBSITE

Tài liệu này hướng dẫn Quản trị viên (Admin) cách sao lưu và khôi phục dữ liệu trực tiếp trên giao diện của Website mà không cần phải can thiệp vào máy chủ (VPS) hay thao tác bằng mã lệnh.

---

## 1. Cơ chế hoạt động tự động (Auto-Backup)
Hệ thống đã được lập trình để tự động bảo vệ dữ liệu của bạn:
- **Thời gian:** Vào lúc **2:00 Sáng mỗi ngày**, hệ thống sẽ tự động đóng gói toàn bộ cơ sở dữ liệu và lưu lại thành 1 file nén.
- **Tự động dọn dẹp:** Để không làm đầy bộ nhớ máy chủ, hệ thống sẽ tự động xóa các file backup cũ hơn 10 ngày (chỉ giữ lại tối đa 3-5 bản gần nhất).
- **Kết luận:** Bạn gần như không cần thao tác gì, dữ liệu luôn được an toàn mỗi ngày.

---

## 2. Hướng dẫn Sao lưu thủ công (Manual Backup)
Nếu bạn chuẩn bị cập nhật dữ liệu lớn và muốn sao lưu ngay lập tức để phòng hờ, hãy làm theo các bước sau:

**Bước 1:** Đăng nhập vào website bằng tài khoản **Admin**.
**Bước 2:** Truy cập vào Trang Quản Trị (Admin Panel).
**Bước 3:** Ở thanh Menu dọc bên trái, cuộn xuống dưới cùng và nhấp vào mục **"Sao lưu & Khôi phục"** (Biểu tượng DataBase).
**Bước 4:** Bấm vào nút màu xanh **[ + Sao lưu JSON ngay ]** ở góc trên bên phải màn hình.
**Bước 5:** Đợi hệ thống chạy khoảng 3-5 giây. Sau khi hoàn tất, hệ thống sẽ báo thành công và file backup mới sẽ xuất hiện ngay trong danh sách bên dưới.

---

## 3. Quản lý File Sao lưu
Tại màn hình **"Danh sách file backup"**, bạn có thể:
- **Tải về (Download):** Bấm biểu tượng tải xuống (Mũi tên tải xuống) để tải file `.json.gz` về lưu trữ trên máy tính cá nhân hoặc Google Drive của bạn cho an toàn.
- **Tải lên (Upload):** Nút **[ Upload file backup ]** cho phép bạn chọn file backup từ máy tính cá nhân đưa lên lại hệ thống để chuẩn bị khôi phục.
- **Xóa (Delete):** Bấm biểu tượng Thùng rác để xóa bỏ các file backup cũ không cần thiết.

---

## 4. Hướng dẫn Khôi phục dữ liệu (Restore)
> **CẢNH BÁO:** Việc khôi phục (Restore) sẽ xóa sạch toàn bộ dữ liệu hiện tại của website và ghi đè bằng dữ liệu trong file Backup mà bạn chọn. Hãy chắc chắn bạn thao tác đúng file.

**Bước 1:** Trong màn hình danh sách file backup, chọn file có ngày giờ bạn muốn quay về.
**Bước 2:** Bấm vào biểu tượng Khôi phục màu cam bên cạnh file đó.
**Bước 3:** Một hộp thoại cảnh báo rủi ro màu đỏ sẽ hiện lên. Để chắc chắn bạn không bấm nhầm, hệ thống yêu cầu bạn **Nhập chính xác mật khẩu Admin của bạn** vào ô trống.
**Bước 4:** Sau khi nhập đúng mật khẩu, bấm nút **[ KHÔI PHỤC ]**.
**Bước 5:** Chờ hệ thống tự động giải nén và ghi đè dữ liệu. Quá trình này diễn ra từ 10 - 30 giây. Khi thành công, website sẽ tự động tải lại với dữ liệu cũ.

---

## 5. Xem Lịch sử (Logs)
Ngay bên dưới danh sách file, bạn sẽ thấy bảng **Lịch sử Backup / Restore**.
Bảng này ghi lại dấu vết toàn bộ các hành động:
- Ai đã bấm Sao lưu vào lúc nào? (Thành công hay Thất bại)
- Ai đã bấm Khôi phục dữ liệu vào lúc nào?
Điều này giúp chủ website kiểm soát được liệu có nhân viên quản trị nào tự ý thay đổi dữ liệu hệ thống hay không.
