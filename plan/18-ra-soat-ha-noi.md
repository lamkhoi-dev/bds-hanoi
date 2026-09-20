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

## Cập nhật 20/09 (chiều): sửa menu + hướng dẫn lấy key còn lại

### Menu ngang (header) — sửa 2 lần
1. Lần 1: bỏ `overflow` cố định → nav không còn tràn đè nút "Cần mua"/"Đăng bán" khi ĐÓNG.
2. Lần 2 (phát hiện khi đo lại): khi MỞ dropdown, nav bật `overflow-visible` nên vẫn tràn đè nút,
   và cụm "Ngoại thành" sát mép phải bị tràn ra ngoài màn ở 1280px. Sửa: nav luôn
   `overflow-x-auto`; dropdown vẽ qua portal `position: fixed`, kẹp trong màn hình, đóng khi
   cuộn/đổi cỡ cửa sổ/Escape/bấm ra ngoài. (`frontend/src/components/DesktopNav.tsx`)
   Kiểm chứng: lần 1 đã đo (Playwright 1920/1440/1280, cả 2 site) — 0 phần tử đè lên thanh
   menu khi đóng; đo lần 2 (mở từng dropdown, 4 góc phải nhìn thấy, không tràn màn) làm sau
   khi deploy bản portal.
   Lưu ý còn lại: ở 1280–1440px thanh menu Hà Nội phải cuộn ngang (11 mục) — đúng cách Nghệ
   An đang chạy ở 1440px; không đè chữ. Muốn hiện đủ cần đổi thiết kế (gộp 3 cụm thành 1).

### Meta Pixel
Hà Nội đã có Pixel riêng trong Cài đặt hệ thống (khác Nghệ An), trang chủ có nạp `fbq('init')`.

### Thứ tự lấy key (khách làm → gửi lại → dev cấu hình)
| # | Hạng mục | Khách làm | Gửi lại | Cần build lại? | Kiểm chứng |
|---|---|---|---|---|---|
| 1 | DNS | Bản ghi A `@` và `www` → `222.255.214.136` (làm trước: chờ lan truyền, các mục sau cần tên miền thật) | báo đã trỏ | Có (đổi `SITE_DOMAIN`, `APP_ENV`) | `https://sanbdshanoi.vn` 200, robots hết chặn |
| 2 | SMTP | Gmail riêng → bật xác minh 2 bước → Mật khẩu ứng dụng | email + mật khẩu ứng dụng 16 ký tự | Không (restart backend) | Đăng ký tài khoản mới nhận được OTP |
| 3 | SePay | Thêm webhook thứ 2 → URL Hà Nội, API Key ngẫu nhiên ≥32 ký tự | API Key | Không (nhập ở Cài đặt hệ thống) | Nạp thử → số dư cộng; log không có UNAUTHORIZED |
| 4 | Firebase | Tạo project mới, bật Phone auth, thêm domain | 7 giá trị web + file service account | **Có** (frontend) | Tab OTP hiện, gửi SMS thật 1 lần |
| 5 | Google OAuth | Tạo OAuth Client, callback đúng domain | Client ID + Secret | Không | Nút Google tự hiện, đăng nhập được |
| 6 | Google Analytics | Tạo property GA4 | Measurement ID `G-...` | **Có** | Realtime thấy lượt truy cập |
| 7 | Thương hiệu | Chốt email hỗ trợ, fanpage, tên ngắn | 3–5 giá trị | **Có** | Footer/logo hiển thị đúng |
| 8 | Facebook OAuth | Tuỳ chọn — trang đăng nhập không có nút Facebook | — | — | — |
