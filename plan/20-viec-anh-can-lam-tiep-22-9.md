# Việc anh cần làm tiếp — site Hà Nội (22/09/2026)

## Cập nhật 22/9 (tối): site đã chạy ở tên miền thật

Anh đã trỏ DNS (mục 5) và làm xong mục 1, 2, 3 (Firebase + Google đăng nhập dùng chung dự án
`nha-dat-xu-nghe-8504d`, GA4 mã `G-6MXSWN04N0`). Em đã copy toàn bộ cấu hình đó sang máy chủ Hà
Nội, đổi `SITE_DOMAIN` sang `sanbdshanoi.vn`, xây lại và khởi động lại. Đã kiểm chứng:

- `https://sanbdshanoi.vn` chạy HTTPS thật (chứng chỉ Let's Encrypt tự cấp), `www` chuyển hướng
  đúng về địa chỉ chính, logo/banner hiển thị đúng, nút "Đăng nhập bằng Google" đã hiện.
- **Địa chỉ tạm `https://222-255-214-136.nip.io` không dùng được nữa** — từ giờ chỉ dùng tên
  miền thật. Ảnh tin/dự án cũ vẫn hiển thị bình thường trên tên miền mới (không phải lo vụ ảnh vỡ
  em từng cảnh báo ở `plan/19` — hoá ra không đúng, đã sửa lại ghi chú ở đó).
- **`APP_ENV` em CỐ Ý giữ nguyên `staging`** (chưa đổi `production`) — robots.txt vẫn đang chặn
  Google index. Lý do: dữ liệu trên site vẫn là dữ liệu mẫu (người đăng `*@demo.invalid`, tin/dự
  án/bài viết giả lập). Mở cho Google thấy lúc này thì Google sẽ lưu lại nội dung mẫu, khó gỡ ảnh
  hưởng SEO sau này. Khi nào có dữ liệu thật (hoặc anh đồng ý mở luôn, chấp nhận dọn sau), báo em.
- **Mục 4 (SePay) và mục 6 (mật khẩu mail) vẫn còn treo** — xem lại bảng dưới.

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

**Cập nhật 22/9 (anh yêu cầu): 2 web cùng 1 chủ nên dùng CHUNG project Google đang chạy cho Nghệ
An (`nha-dat-xu-nghe-8504d`) thay vì tạo project mới** — em đã kiểm tra trên máy chủ Nghệ An,
project này đủ dùng cho cả Firebase lẫn Google đăng nhập. Nhẹ việc hơn hẳn bản cũ: anh chỉ cần
**thêm tên miền Hà Nội vào danh sách được phép**, KHÔNG cần tạo gì mới, KHÔNG cần gửi lại 7 giá
trị hay file `.json` hay Client ID/Secret — **em tự copy nguyên từ máy chủ Nghệ An sang**, anh
không cần đưa lại em gì cho 2 mục này.

| # | Việc | Trạng thái | Đưa lại em |
|---|---|---|---|
| 1 | Firebase (đăng nhập SĐT) | ✅ **Xong 22/9** — anh đã thêm domain, em đã copy cấu hình sang Hà Nội | Không cần gửi gì nữa |
| 2 | Google đăng nhập | ✅ **Xong 22/9** — nút "Đăng nhập bằng Google" đã hiện trên `sanbdshanoi.vn/login`, đã kiểm tra bằng ảnh chụp | Không cần gửi gì nữa |
| 3 | Google Analytics | ✅ **Xong 22/9** — mã `G-6MXSWN04N0` đã gắn, đã kiểm tra thấy trong mã nguồn trang | — |
| 4 | SePay | ⏳ **Chưa làm** — anh nói sẽ làm sau, em chỉ thêm khi anh sẵn sàng | **API Key** webhook mới (bắt buộc phải gửi — mỗi webhook một khoá riêng, không dùng chung được với Nghệ An) |

Lưu ý mục 2: khi khách Hà Nội bấm "Đăng nhập bằng Google", màn hình xin quyền của Google có thể
hiện tên ứng dụng đã đặt cho bên Nghệ An (dùng chung project) — hơi lệch thương hiệu một chút
nhưng đăng nhập vẫn chạy đúng, không cần đợi Google duyệt lại gì thêm. Muốn tên hiện đúng 100%
thì để sau, đổi "App name" trong OAuth consent screen thành tên chung chung hơn.

**Việc KHÔNG nằm trong 4 mục trên, anh vẫn phải tự làm** (không phải chỉ đăng nhập lấy giá trị):

| # | Việc | Trạng thái | Vì sao em không làm thay được |
|---|---|---|---|
| 5 | Trỏ DNS `sanbdshanoi.vn` tại PA Việt Nam | ✅ **Xong** — em đã đo, DNS đúng, site chạy HTTPS thật rồi | — |
| 6 | Sửa lại mật khẩu hộp mail `sanbdsha6a7a@sanbdshanoi.vn` | ⏳ Chưa — anh hỏi "không quan trọng nhỉ" — **em nghĩ vẫn quan trọng**: không có mục này thì **khách thật vào đăng ký sẽ bấm nút xong đứng im/báo lỗi**, vì OTP không gửi được. Không gấp bằng SePay hay DNS, nhưng cần trước khi mời khách thật vào dùng thử. Anh vào lại `mail92231.maychuemail.com:1000` đổi/xác nhận mật khẩu, gửi em mật khẩu đúng |
| 7 | Cloudflare | Không gấp — anh nói đúng, mục này thật sự không quan trọng lúc này (site đã chạy tốt qua PA Việt Nam, Cloudflare chỉ thêm CDN/chống DDoS) | Đăng ký tài khoản mới (kể cả bằng nút "Đăng nhập với Google") vẫn là **tạo tài khoản** — việc này em không được phép làm thay dù có mật khẩu Google |

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
