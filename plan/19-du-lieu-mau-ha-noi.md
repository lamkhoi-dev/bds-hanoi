# Bổ sung dữ liệu mẫu cho site Hà Nội (20/09/2026)

Yêu cầu của anh: "data thông tin các thứ hoặc hình ảnh e lấy hoặc kiếm giúp a bổ sung cho đủ cho đẹp để
dễ test, giờ a vào còn hơi trống".

## Hiện trạng (đã đo trên DB Hà Nội)
18 tin (mô tả 1 câu, KHÔNG ảnh, không toạ độ/pháp lý/hướng), 4 dự án mẫu không ảnh, 0 tin tức,
0 chuyên mục, 0 yêu cầu "Cần mua", 0 bình luận, 2 tài khoản (admin + test).

## Nguyên tắc
- CHỈ ghi vào DB/MinIO Hà Nội. Script từ chối chạy nếu `APP_ENV` không phải `staging`.
- Ảnh: chỉ dùng nguồn cho phép dùng tự do (Unsplash / Pexels / Wikimedia Commons); ảnh Commons ghi
  nguồn + giấy phép vào `thumbnailCredit`. Không lấy ảnh tin thật của Nghệ An.
- Mọi dữ liệu là DỮ LIỆU MẪU, gắn dấu để dọn được: người đăng là tài khoản `*@demo.invalid`, SĐT giả
  dạng `0900 000 0xx`, tên dự án/bài viết là nội dung tự viết (không nêu số liệu thị trường thật).
- Ảnh lưu qua chính API `/upload/image` (cùng đường xử lý WebP 1200px như người dùng thật).
- Khi đổi tên miền thật: URL ảnh đang trỏ `222-255-214-136.nip.io` → phải viết lại, hoặc dọn dữ liệu mẫu.

## Việc cần làm
| # | Việc | Kiểm chứng |
|---|---|---|
| 1 | Chọn ~60 ảnh (nhà, căn hộ, nội thất, đất, mặt bằng, dự án, Hà Nội) và xem bằng mắt | Bảng ảnh phân loại, không ảnh lỗi/không liên quan |
| 2 | Tải lên MinIO Hà Nội qua API bằng tài khoản admin thử nghiệm | Mỗi URL trả 200 `image/webp` |
| 3 | Script `seed-demo-hanoi.ts`: người đăng mẫu, làm giàu 18 tin cũ, thêm ~32 tin mới | Tổng ~50 tin, mỗi tin 3–6 ảnh, có VIP/UP |
| 4 | Dự án: gắn ảnh + mô tả đủ; thêm dự án nếu cần | Trang `/du-an` có ảnh |
| 5 | Tin tức: 4 chuyên mục, ~8 bài có sapo/ảnh/nguồn/BĐS liên quan | `/news` + trang chuyên mục hiển thị đủ |
| 6 | "Cần mua" vài yêu cầu + vài bình luận | Trang `/requirements` có dữ liệu |
| 7 | Nạp lại Meilisearch | `/search` trả đủ số tin |
| 8 | Playwright chụp trang chủ, danh sách, chi tiết, dự án, tin tức | Không ảnh vỡ, không khối trống |

## Kết quả (20/09/2026 đêm)
Tất cả việc 1–7 đã làm và đo lại bằng Playwright (0 ảnh vỡ ở trang chủ, danh sách, chi tiết, tin tức, bài viết).

| Hạng mục | Trước | Sau |
|---|---|---|
| Tin đăng | 18 (không ảnh) | **81** — 18 tin cũ được làm giàu + 63 tin mới, 10 VIP, 9 UP, ~390 ảnh |
| Người đăng | 1 admin | + 4 người đăng mẫu (`*@demo.invalid`, SĐT `0900 000 00x`) |
| Dự án | 4 (không ảnh) | **6**, có ảnh + mô tả; mỗi dự án ≥1 tin thường |
| Tin tức | 0 | 5 chuyên mục, 8 bài (6 đã đăng, 1 nháp, 1 hẹn giờ +3 ngày) |
| Bình luận / "Cần mua" | 0 / 0 | 10 (có trả lời) / 5 |
| Ảnh | 0 | 91 ảnh tải qua `/upload/image` (Unsplash, Pexels; 13 ảnh Wikimedia Commons có ghi nguồn) |

Cách làm (để dựng lại được): `backend/src/scripts/seed-demo-hanoi.ts` + `demo-data-hanoi.ts`
(chỉ chạy khi `APP_ENV=staging` VÀ tên CSDL chứa "hanoi"; mặc định chạy thử; `--apply` ghi; chạy lại là
làm mới nội dung/ảnh chứ không tạo trùng; `--cleanup --apply` gỡ toàn bộ). Sau khi ghi: `reindex-search.js`.
Bài tin tức đăng riêng qua API bằng tài khoản admin (đi qua đường làm sạch HTML của service).
Đã sao lưu CSDL trước khi nạp: `/root/backups/hanoi-before-demo-seed-2026-09-20.sql.gz` (VPS Hà Nội).

### Phát hiện thêm khi rà giao diện
1. **Hero trang chủ Hà Nội hiện chữ "Nhà đất xứ Nghệ"** (`banner.svg` là logo Nghệ An, chữ vẽ cứng thành path).
   Đã sửa: Nghệ An giữ `banner.svg`; site khác dựng bằng chữ từ `siteConfig.brand` + ngôi nhà của header.
2. Khối "Dự án" và "Khu vực hot" trên trang chủ chỉ liệt kê tin **NORMAL** (`getItems` đặt `tier: 'NORMAL'`;
   VIP/UP có khối riêng) — dự án/khu vực chỉ có tin VIP/UP sẽ hiện "Chưa có bất động sản nào". Đã thêm tin thường.
3. Ảnh chụp công trình cụ thể (Royal City, Times City, Keangnam, Ocean Park) chỉ gán cho tin/dự án đúng công
   trình đó (trước đó tin Royal City từng hiện ảnh biển hiệu Times City).
4. Trang `/du-an` cache 5 phút (`revalidate = 300`) — mới nạp dữ liệu thì phải đợi hoặc khởi động lại frontend.

### Dọn dữ liệu mẫu khi mở chính thức
- Tin/dự án/người đăng/bình luận/"Cần mua": `docker exec -e APP_ENV=staging bds-backend-prod node dist/scripts/seed-demo-hanoi.js --cleanup --apply`
  (cũng gỡ khỏi Meilisearch). LƯU Ý: 18 tin cũ đã chuyển sang người đăng mẫu nên cũng bị xoá theo.
- Tin tức: xoá 8 bài + 5 chuyên mục mẫu trong Quản trị (đều có dòng "Bài viết mẫu" cuối bài).
- ~~Đổi sang tên miền thật: URL ảnh lưu tuyệt đối `nip.io`, phải viết lại~~ — **SAI, đã kiểm chứng
  thực tế 22/9 lúc chuyển `SITE_DOMAIN` sang `sanbdshanoi.vn`**: `frontend/src/lib/media.ts`
  `toMediaUrl()` tự cắt mọi URL ảnh (dù lưu tuyệt đối domain nào) về đường dẫn tương đối
  `/bds-uploads/...` trước khi render, nên đổi tên miền KHÔNG làm vỡ ảnh cũ — không cần viết lại
  `PropertyImage.url` hay dọn dữ liệu trước khi đổi domain. Đã đo: ảnh tin/dự án tải đủ trên
  `sanbdshanoi.vn` ngay sau khi đổi, không phải sửa gì thêm.
