# Rà soát site Hà Nội so với Nghệ An (20/09/2026)

Khách yêu cầu: "xem đã ổn hay còn lỗi gì so với Nghệ An, thiếu gì chưa code, thiếu key gì".

## Kết luận ngắn
**Mã nguồn đủ, không thiếu chức năng nào.** Hai site dùng chung codebase, cùng chạy đủ 25
migration, 0 migration lỗi. Khác biệt còn lại đều thuộc 2 nhóm: (a) khoá/cấu hình bên ngoài
chưa có, (b) chưa có dữ liệu thật. Chỉ tìm thấy **1 lỗi code thật** (nút Google) — đã sửa.

## Lỗi code tìm thấy & đã sửa
`GOOGLE_CLIENT_ID` trống → `google.strategy.ts` rơi về chuỗi giữ chỗ `google_oauth_disabled`,
bấm "Đăng nhập bằng Google" là ra thẳng màn hình `invalid_client` của Google. Sửa: `/settings/public`
trả thêm cờ `googleLoginEnabled`/`facebookLoginEnabled`/`emailEnabled` đọc từ biến môi trường
backend; trang đăng nhập ẩn nút + dấu phân cách khi chưa cấu hình (cùng kiểu tab OTP tự ẩn khi
thiếu Firebase). Mặc định hiện, chỉ ẩn khi backend trả lời rõ là chưa cấu hình → Nghệ An không
bị nháy mất nút.

Kèm theo: `create-test-user.ts` — tạo thẳng tài khoản `ACTIVE + emailVerified`, bỏ qua bước OTP
email. Cần vì chưa có SMTP thì luồng đăng ký tự phục vụ không dùng được, không ai tạo nổi tài
khoản để thử các luồng phía người dùng.

## Khoá/cấu hình còn thiếu (khách cung cấp)
| Hạng mục | Trạng thái | Hậu quả |
|---|---|---|
| Firebase (7 biến) | trống | Đăng nhập OTP SĐT — tab đã tự ẩn, không lỗi |
| SMTP | trống | **Không đăng ký được tài khoản mới**, không quên mật khẩu được |
| Google OAuth | trống | Nút đã tự ẩn sau bản sửa |
| Facebook OAuth | trống | Chưa dùng tới |
| `sepayWebhookToken` (trong CSDL) | **TRỐNG** | Nạp tiền không cộng — giống lỗi vừa xử lý ở Nghệ An |
| `NEXT_PUBLIC_GA_ID` | trống | Không đo lượt truy cập |
| Thương hiệu: `BRAND_LINE1/2`, `SITE_SHORT_NAME`, `SUPPORT_EMAIL`, `FACEBOOK_URL` | trống | Logo/footer dùng giá trị suy luận mặc định |
| **DNS `sanbdshanoi.vn`** | đã đăng ký (ns1/ns2.dotvndns.vn) nhưng **chưa có bản ghi A** | Site chạy bằng IP tạm `222-255-214-136.nip.io` |

## Thiếu dữ liệu (không phải lỗi)
- **0 ảnh** — `PropertyImage` rỗng, kho MinIO trống (bucket `bds-uploads` đã tạo, đường dẫn
  công khai trả 200 → chức năng tải ảnh sẵn sàng, chỉ chưa có ai tải lên).
- 18 tin mẫu (Nghệ An 273), tất cả tier NORMAL → khối "Tin nổi bật" (VIP) hiện thông báo trống.
- 4 dự án mẫu (tên có chữ "Mẫu"), không ảnh. 0 tin tức, 0 chuyên mục tin. 1 tài khoản.
- Bảng `Location`: 736 dòng (1 tỉnh/30 quận huyện/126 phường xã mới/579 cũ) — đủ cho Hà Nội;
  Nghệ An có 12.275 vì chứa cả bộ dữ liệu toàn quốc.

## Đúng thiết kế, không cần sửa
- `APP_ENV=staging` → `robots.txt` chặn toàn bộ (tránh Google coi là nội dung trùng với Nghệ An).
  Đổi sang `production` khi có tên miền thật + dữ liệu thật.
- `SEO_MODE=enforce` (Nghệ An là `report`) → `/nha-rieng` chuyển 301 sang `/ban/nha-rieng`. Hà Nội
  là site mới nên dùng dạng URL mới ngay; Nghệ An giữ URL cũ để không mất thứ hạng. Link nội bộ
  trên Hà Nội đã trỏ thẳng `/ban/...`, không đi qua chuyển hướng.
- `SITE_LAYOUT=grouped` → trang chủ có 2 dropdown "Xem tin theo xã/phường mới/cũ" (mục 25.5b
  PHẦN II), đã kiểm tra hiển thị đúng.

## Đã kiểm chứng chạy tốt trên Hà Nội
Trang chủ, tìm kiếm (Meilisearch 18/18 tài liệu), trang khu vực (`/ban/ha-noi` 13 tin,
`/ban/phuong-cau-giay` 1 tin, `/ban/gia-lam` 2 tin), chi tiết tin, đăng tin, tin tức, dự án,
so sánh, các trang hỗ trợ, trang quản trị, sitemap (75 landing + 18 tin + 4 dự án + 16 tĩnh).

## Tài khoản thử nghiệm đã tạo
`test@sanbdshanoi.vn` (USER, số dư 500 điểm để thử trừ tiền) và đặt lại mật khẩu cho
`admin@sanbdshanoi.vn` (ADMIN). Cả hai đã kiểm chứng đăng nhập được qua API. Mật khẩu gửi riêng
cho khách, nhắc đổi sau lần đăng nhập đầu.
