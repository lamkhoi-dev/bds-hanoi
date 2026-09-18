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

## Kiểm chứng trước/sau khi deploy
- Trước: gọi 130 lần liên tiếp `/properties/seo` qua mạng nội bộ → dính 429 ở lần thứ ~101.
- Sau: gọi lại đúng số lần đó → không còn 429 nào.
- Nạp tiền: chưa có cách tự kiểm (cần giao dịch ngân hàng thật) — nhờ khách test lại 1 lần
  sau khi deploy.
