# Việc anh cần làm tiếp — site Hà Nội (22/09/2026)

Đã xem 3 file anh gửi lại: `trả lời huong-dan-cung-cap-thong-tin-ha-noi-20-9.docx`, `logo Ha noi/`,
`thông tin chi tiết.docx`. Việc em tự làm được đã làm và deploy xong (mục A). Còn lại đúng như
anh hỏi: **nếu anh tự đăng nhập rồi lấy giá trị đưa em thì cần đưa đúng những gì** — liệt kê ở mục B.

## A. Em đã làm xong, không cần anh làm gì thêm

- **Logo chính thức:** thay vào đầu trang (header) và banner trang chủ. Không đổi chân trang —
  chữ xanh của logo bị chìm vào nền xanh của chân trang, thử trên máy không đọc được nên em giữ
  chân trang như cũ (icon + tên site dạng chữ).
- **Favicon:** sửa xong cho **cả 2 site** (Nghệ An cũng bị, không phải lỗi riêng Hà Nội). Nguyên
  nhân: khai thiếu 1 dòng cấu hình nên trình duyệt không có địa chỉ icon chuẩn để tải.
- **Email hỗ trợ** chân trang: `contact@sanbdshanoi.vn`.
- **Meta Pixel:** đã có sẵn từ trước, không cần làm gì.
- **SMTP:** đã điền `mail92231.maychuemail.com`, tài khoản `sanbdsha6a7a@sanbdshanoi.vn` —
  **nhưng mật khẩu anh gửi (`Ha12345678@`) sai, cả gửi mail lẫn đăng nhập hộp mail đều báo lỗi
  xác thực.** Em đã tắt lại để hệ thống không gửi lỗi cho khách, chờ mật khẩu đúng (xem mục B).

## B. Anh tự đăng nhập bằng tài khoản Google `nguyenduy20062025@gmail.com` — cần đưa lại em gì

Tài khoản Google anh gửi dùng chung cho cả 4 việc dưới. Làm xong việc nào gửi luôn việc đó,
không cần đợi đủ cả 4.

| # | Việc | Anh vào đâu | **Đưa lại em đúng những gì** |
|---|---|---|---|
| 1 | Firebase (đăng nhập SĐT) | console.firebase.google.com → tạo project mới (không phải project `nhadatxunghe.vn` cũ) | 7 giá trị cấu hình web (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId) **+ file `.json`** ở mục Service accounts → Generate new private key |
| 2 | Google đăng nhập | console.cloud.google.com, chọn đúng project Firebase vừa tạo ở mục 1 | **Client ID** và **Client secret** (mục Credentials → OAuth client ID) |
| 3 | Google Analytics | analytics.google.com → tạo Property mới tên "Sàn BĐS Hà Nội" | **Measurement ID** dạng `G-XXXXXXXXXX` |
| 4 | SePay | my.sepay.vn (đăng nhập bằng Google ở trên) → Tích hợp Webhooks → **Thêm webhook mới** (giữ nguyên webhook Nghệ An) | **API Key** anh vừa đặt cho webhook mới. Chi tiết từng ô điền gì có trong `huong-dan-cung-cap-thong-tin-ha-noi-20-9.docx` mục 3, anh đã đọc rồi |

**Việc KHÔNG nằm trong 4 mục trên, anh vẫn phải tự làm** (không phải chỉ đăng nhập lấy giá trị):

| # | Việc | Vì sao em không làm thay được |
|---|---|---|
| 5 | Trỏ DNS `sanbdshanoi.vn` tại PA Việt Nam (2 bản ghi A: `@` và `www` → `222.255.214.136`) | Trang quản trị tên miền là form đăng nhập — quy định của em là không tự nhập mật khẩu vào form web thay người khác |
| 6 | Sửa lại mật khẩu hộp mail `sanbdsha6a7a@sanbdshanoi.vn` | Mật khẩu anh gửi (`Ha12345678@`) sai — có thể máy chủ mail đặt khác lúc tạo. Anh vào lại trang quản trị mail `mail92231.maychuemail.com:1000` (hoặc qua PA Việt Nam) đổi/xác nhận lại mật khẩu, gửi em mật khẩu đúng |
| 7 | Cloudflare — **không đăng ký hộ được** | Đăng ký tài khoản mới (kể cả bằng nút "Đăng nhập với Google") vẫn là **tạo tài khoản**, việc này em không được phép làm thay dù có mật khẩu Google. Anh tự bấm đăng ký, sau đó có thể đưa em quyền quản lý domain trong Cloudflare để em cấu hình DNS ở đó thay vì PA |

## C. Chưa trả lời / cần anh chốt

1. **Tên thương hiệu hiển thị bằng chữ** (tiêu đề trang, thẻ SEO, tên khi chia sẻ Facebook/Zalo):
   logo mới hiện chữ **"Sàn BĐS Hà Nội"** (viết tắt, vì logo ngắn gọn). Phần chữ ở tiêu đề trang thì
   dùng bản đầy đủ **"Sàn Bất Động Sản Hà Nội"** hay giữ nguyên **"Nhà Đất Hà Nội"** như hiện tại?
2. **Hotline riêng và Zalo riêng cho Hà Nội** — anh chưa gửi, site đang tạm hiện hotline của Nghệ
   An (`0868126826`). Nếu chưa có số riêng, báo em để giữ tạm hoặc để trống.
3. **Fanpage:** anh ghi tạm `facebook.com` — em đề nghị **để trống** (ẩn không nổi bật hơn là dẫn
   khách vào trang chủ Facebook không liên quan). Đồng ý thì em để trống, có fanpage thật gửi sau.

## D. Việc riêng của anh (nhắc lại, không đổi)

- Đổi ngay mật khẩu PA Việt Nam và mật khẩu Google Cloud (`Ha12345678@`) sau khi cấu hình xong —
  mật khẩu đã nằm trong file Word, không còn an toàn để dùng lâu dài.
- Bật xác minh 2 bước cho tài khoản Google `nguyenduy20062025@gmail.com` trước khi dùng nó tạo
  các dịch vụ ở mục B.
