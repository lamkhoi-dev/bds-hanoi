# Plan: Tìm ra & sửa gốc "khu vực/loại BĐS thỉnh thoảng lấy tin sai" (18/9)

## Bối cảnh

Khách báo lại đúng lỗi cũ (25/8 → 15/9 → 18/9), lần này kèm bằng chứng mới: **lỗi lan sang
cả trang loại BĐS** (`/nha-rieng`), không chỉ trang khu vực. Trước đó em từng đoán đây là do
cửa sổ khởi động lại sau deploy — sai, vì lần này backend đã chạy ổn định 22 tiếng không
restart mà khách vẫn gặp.

## Điều tra — đã CHỨNG MINH được, không còn đoán

1. Test lại y hệt URL khách gửi (`/nghi-phong`, `/nha-rieng`) bằng curl trực tiếp: cả 2 đều
   ra kết quả ĐÚNG ngay lúc kiểm tra → xác nhận đây là lỗi CHỚP NHOÁNG thật, không phải lỗi
   dữ liệu/logic thường trực (logic khớp khu vực đã đúng, verify lại nhiều lần rồi).
2. Phát hiện phụ (không phải nguyên nhân chính, nhưng là dữ liệu rác nên vẫn đáng ghi lại):
   CSDL có **4 dòng "Xã Nghi Phong"** trùng lặp, một dòng bị gán sai cha là "Thành phố Vinh"
   thay vì "Huyện Nghi Lộc" (urlSegment `nghi-phong` so với `nghi-phong-nghi-loc` đúng).
   Không dọn ở đợt này — không phải gốc lỗi, dọn sai lúc này có thể ảnh hưởng tin đã gắn
   sẵn vào đó.
3. **TÌM RA GỐC LỖI THẬT**: mọi trang khu vực/loại BĐS được Next.js tải dữ liệu PHÍA SERVER,
   gọi thẳng `http://backend:4000` qua mạng nội bộ Docker (`server-api.ts`) — KHÔNG đi qua
   Caddy. Nghĩa là request server-side của **MỌI khách truy cập site cùng lúc** đều mang
   chung MỘT địa chỉ IP nguồn (IP của container frontend), không phải IP thật của từng
   người. `ThrottlerModule` mặc định giới hạn 100 request/phút TÍNH THEO IP đó — bị dồn
   chung cho cả site. Tái hiện được ngay: gọi 130 lần liên tiếp từ trong container frontend
   là dính `429 Too Many Requests` lập tức. Đúng khớp mọi triệu chứng đã ghi nhận: "không
   phải lúc nào cũng bị", "F5 lại thì đúng" (đợi qua cửa sổ 60 giây), và nay "lan sang cả
   trang loại BĐS" (bất kỳ route công khai nào không có `@Throttle` riêng đều dùng chung
   giới hạn 100/phút này, không riêng gì trang khu vực).

## Đã sửa

Bỏ giới hạn tần suất (`@SkipThrottle()`) ở TOÀN BỘ route ĐỌC công khai được gọi lúc dựng
trang phía server hoặc do máy chủ ngoài gọi vào — không có gì để chống lạm dụng ở các route
này (không sửa dữ liệu), và giới hạn sai chỗ chỉ gây hại:
- `property.controller.ts`: `stats`, `homepage`, `hot-locations`, `map`, danh sách, `sitemap`,
  **`seo`** (route gây lỗi khách báo), `compare`, `:id/related`, `:id` (chi tiết tin).
- `location.controller.ts`: cả controller (100% route đọc).
- `news.controller.ts`: danh sách công khai, chi tiết, bài liên quan (route quản trị giữ
  nguyên — gọi từ trình duyệt admin qua HTTPS công khai, IP thật riêng từng người, không
  dính lỗi này).
- `news-category.controller.ts`: danh sách công khai, theo slug.
- `seo.controller.ts`: cả controller (sitemap cho Googlebot).
- **`payment.controller.ts` `webhook/sepay`**: nhân tiện rà thấy route này CŨNG không có
  `@Throttle` riêng, dùng chung giới hạn mặc định — nếu đúng là nguyên nhân của lỗi "nạp
  tiền không cộng" (đã xác thực bằng token riêng, rate-limit ở đây chỉ có hại — mất giao
  dịch thật) thì sửa luôn, không cần đợi khách test lại mới biết đây có phải nguyên nhân
  hay không, vì rủi ro sửa = 0, còn rủi ro KHÔNG sửa = mất tiền thật của khách hàng.

`facts.ts` (frontend): thêm log lỗi khi hết 3 lần thử lại vẫn hỏng (trước đây im lặng hoàn
toàn, không có cách nào biết vì sao khi khách báo lại) + coi `429` là đáng thử lại thay vì
trả lỗi ngay — lưới an toàn thứ hai dù gốc lỗi đã sửa ở nguồn.

## Vẫn giữ giới hạn (không đụng)
Đăng nhập, đăng ký, bình luận, đăng/sửa tin, nạp tiền qua form, các route có `@UseGuards`
gắn với hành động của MỘT người dùng cụ thể — đây là nơi rate-limit thực sự có tác dụng
chống lạm dụng. `/properties/search` giữ nguyên giới hạn riêng (60/phút, gọi Meilisearch tốn
hơn) — chưa có bằng chứng khách gặp lỗi này ở `/search`.

## Test
268 test backend + 192 test frontend xanh (không có test riêng cho throttle — đây là cấu
hình decorator, không phải logic nghiệp vụ; kiểm chứng bằng tái hiện lỗi thật trên VPS
trước/sau khi sửa mới là bằng chứng đáng tin ở đây).

## Kiểm chứng trước/sau khi deploy — 18/09/2026, đã deploy cả 2 site

- **Trước** (Nghệ An, trước khi sửa): gọi 130 lần liên tiếp `/properties/seo` qua mạng nội bộ
  container → dính `429` bắt đầu từ lần thứ ~101 (đo được bằng 1 request đơn lẻ ngay sau đợt
  test 60 request trước đó cũng đã đủ trigger).
- **Sau** (Nghệ An, sau khi deploy commit `044ad01`): lặp lại ĐÚNG bài test 130 lần liên tiếp
  → **130/130 trả 200, 0 lần 429**. Xác nhận sửa dứt điểm.
- Hà Nội: build + deploy thành công, container healthy, trang chủ 200 (site chưa có traffic
  thật để tái hiện 429 nhưng cùng 1 codebase nên đã được vá y hệt).
- Nạp tiền (webhook SePay): chưa có cách tự kiểm bằng giao dịch ngân hàng thật — nhờ khách
  test lại 1 lần, có khả năng đã tự khỏi vì cùng nguyên nhân giới hạn tần suất.

---

## Nạp tiền quét QR không cộng tiền — điều tra tiếp 18/9 (khách xác nhận web khu vực đã ổn)

Khách báo web Nghệ An đã ổn (xác nhận sửa 429 đúng), còn lại lỗi nạp tiền, kèm email SePay
thông báo bổ sung IP webhook `45.57.137.67` từ 22/9/2026.

### Đã kiểm chứng & loại trừ
- Webhook công khai thông từ internet: `GET` → 200; `POST` token giả → 200 `{success:false}`
  đúng thiết kế; cả đường `/api/payment/...` (không `v1`) cũng chạy.
- **Không có whitelist IP ở đâu cả** (Caddy không lọc IP, backend không lọc IP, VPS: `iptables
  INPUT ACCEPT`, không ufw, không fail2ban) → email đổi IP của SePay **không liên quan**, không
  cần làm gì ở phía server.
- Token cấu hình: giải mã được, dạng chuỗi ngẫu nhiên 38 ký tự (hoa/thường/số) — không phải mặt
  nạ `****`, không có tiền tố `Apikey`. Lưu lại cài đặt không làm hỏng token (mã đã chặn mặt nạ).
- `PaymentWebhookLog` dừng ở 10/7; chỉ có đúng 3 giao dịch nạp thành công (1/7, 4/7, 6/7). Backend
  không nhận webhook nào từ SePay kể từ lần deploy gần nhất.
- Gọi qua `http://` hoặc `www.` bị Caddy **chuyển hướng 308/301** — nếu URL trong SePay đang ghi
  một trong hai dạng này thì webhook (POST) thường không đi theo redirect → thất bại im lặng.

### Lỗ hổng quan sát đã vá (commit `14e8693`)
Webhook bị từ chối xác thực trước đây chỉ `logger.warn` ra stdout — mất sạch mỗi lần deploy, và
KHÔNG có dòng nào trong DB. Nên không thể phân biệt "SePay không gọi tới" với "SePay gọi nhưng
token lệch". Nay ghi bền vững 1 dòng `UNAUTHORIZED` / 5 phút (upsert, cắt payload 4KB) gồm: có/không
header, kiểu chứng thực, độ dài token nhận, khớp độ dài hay không, IP nguồn, user-agent — **không
bao giờ ghi giá trị token**. Kiểm chứng trên site thật: gọi thử token giả → có dòng, ghi đúng IP thật
`58.187.190.0`, 0 dòng chứa chuỗi token giả. Đã xoá dòng test. POST webhook đổi từ bỏ hẳn giới hạn
sang `@Throttle 600/phút/IP` (vẫn rộng gấp trăm lần lưu lượng thật).

### Cần khách làm (quyết định được nguyên nhân)
Chụp **nhật ký gọi webhook trên my.sepay.vn** (Tích hợp Webhooks → webhook đang dùng → nhật ký) cho lần
nạp thử gần nhất + kiểm tra 3 điểm: URL đúng `https://nhadatxunghe.vn/api/v1/payment/webhook/sepay`
(https, không `www`, không `http`); kiểu chứng thực = API Key; API Key trùng ô "SePay Webhook Token"
trong Cài đặt hệ thống. Sau đó nạp thử 1 lần nữa: nếu SePay có gọi mà lệch cấu hình thì sẽ có dòng
`UNAUTHORIZED` trong `PaymentWebhookLog` cho biết chính xác lệch chỗ nào; nếu vẫn không có dòng nào
thì SePay không gọi tới (xem nhật ký phía SePay: chưa gửi / gửi tới URL khác / bị đánh dấu bỏ qua vì
"không có mã thanh toán").
