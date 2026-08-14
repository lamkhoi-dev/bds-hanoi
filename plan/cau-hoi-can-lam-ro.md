# Điểm chưa rõ / còn thiếu — cần làm rõ với khách

Nguồn: `D:\An\web_bds_hanoi\bds_doc` · Lập ngày 2026-08-13

---

## 0. Mức độ đã đọc — tự đánh giá trung thực

| File | Đã đọc | Ghi chú |
|---|---|---|
| `update 30-7 F.docx` | ✅ **100%** | 388/388 đoạn. Đã kiểm tra: không có bảng, không có text box, không có nội dung ẩn. 5 ảnh đã xem hết. 3 hyperlink trỏ tới `/khu-vuc`, `/thanh-pho-vinh`, `/phuong-truong-vinh` |
| `fix seo.xlsx` | ✅ **100%** | 41/41 mục, đã đọc bản đầy đủ không cắt. **Có 1 ô bị cắt ngay trong file gốc** → mục A1 bên dưới |
| `danh sách khu vực.xlsx` | ✅ **100%** | 7/7 sheet, đã đối chiếu chéo toàn bộ. Phát hiện 6 vấn đề dữ liệu → mục A |
| `Danh sách chưa lập chỉ mục.xlsx` | ✅ **100%** | 265/265 URL, đã phân loại theo nhóm nguyên nhân và theo đường dẫn |

**Kết luận:** đã đọc hết nội dung có trong 4 file. Những gì còn thiếu bên dưới là **thiếu trong chính tài liệu**, không phải do chưa đọc.

---

## A. LỖI / THIẾU TRONG DỮ LIỆU — có bằng chứng cụ thể

> Nhóm này cần khách gửi bổ sung thì mới import được, không tự suy đoán thay khách được.

### A1. Ô mô tả bị cắt giữa chừng trong `fix seo.xlsx`
Mục **II.3 – "Title chuyên mục/khu vực"** ghi:
> *"MỘT PHẦN: có title động nhưng đang bị lặp thương hiệu: `..."*

Nội dung dừng ở đó — **không có ví dụ title bị lặp**. Cần khách gửi lại đầy đủ mục này.

### A2. Bảng 1 (quận/huyện) thiếu 3 đơn vị và có 1 dòng trùng
- Tài liệu nói **30 quận/huyện/tx**, Bảng 5 và Bảng 6 đều có đủ **30**
- Nhưng sheet `quận huyện` chỉ có **28 dòng = 27 đơn vị duy nhất**
- **Trùng lặp:** `Huyện Chương Mỹ` xuất hiện **2 lần**
- **Thiếu 3 đơn vị** (có trong Bảng 5 & 6 nhưng không có trong Bảng 1): **Phúc Thọ · Thạch Thất · Sơn Tây**

→ Xác nhận: Bảng 1 đúng phải là 30 đơn vị gồm cả 3 cái trên?

### A3. Bảng 2 (phường/xã mới hot) bỏ trống 4 dòng
Sheet `phường xa mới hot` đánh số tới **32** nhưng **STT 5, 26, 27, 32 để trống tên**, chỉ điền được 28 mục.

→ Khách định 32 khu vực hot? Cần điền nốt 4 dòng, hoặc xác nhận 28 là đủ.

### A4. Bảng 4 "khu vực hot" — 26/31 mục KHÔNG phải đơn vị hành chính
Đây là điểm cần quyết định **thiết kế**, không chỉ là dữ liệu.

- **Chỉ 5 mục** trùng tên đơn vị hành chính: Văn Phú, Mỹ Đình 1, Mỹ Đình 2, Láng Hạ, Phương Liệt
- **26 mục còn lại là tên dự án / khu đô thị**: Vinhomes Smart City, Vinhomes Ocean Park, Vinhomes Riverside, Royal City, Times City, Ciputra, Splendora, Ecopark, Goldmark City, Mỹ Đình Pearl, The Manor, Keangnam, Mandarin Garden, Park Hill, Gamuda Gardens, Thanh Hà, Nam An Khánh, Bắc An Khánh, The Matrix One, Imperia Sky Garden, Sunshine City, An Hưng, Linh Đàm, Hồ Tây, Ngoại Giao Đoàn, Trung Kính

**Câu hỏi:**
1. Nhóm này **trùng khái niệm với "Dự án"** ở PHẦN I mục 1.4. Vinhomes Smart City vừa nằm ở Bảng 4 (khu vực hot) vừa hoàn toàn có thể là một "Dự án" do admin tạo. → **Là một hay hai thực thể khác nhau?**
2. Nếu là hai: URL của "khu vực hot" là gì? (`/khu-vuc/vinhomes-smart-city` hay `/du-an/vinhomes-smart-city`?) Sẽ trùng nội dung → hại SEO.
3. **Ecopark nằm ở Hưng Yên**, không thuộc Hà Nội. Vẫn đưa vào? (Splendora, Nam/Bắc An Khánh thuộc Hoài Đức — vẫn Hà Nội, không sao.)
4. Mỗi khu vực hot cần gán về quận/huyện nào? Hiện file **không có cột cha** → không dựng được breadcrumb `Trang chủ / Bán / Đất nền / {Quận} / {Khu vực hot}`.

### A5. 13 tên phường/xã trùng nhau giữa các quận/huyện → **đụng slug**
| Tên | Số lần | Thuộc |
|---|---|---|
| Quang Trung | 3 | Đống Đa · Hà Đông · Sơn Tây |
| Minh Khai | 2 | Hai Bà Trưng · Bắc Từ Liêm |
| Xã Phú Cường | 2 | Ba Vì · Sóc Sơn |
| Xã Phú Sơn | 2 | Ba Vì · Gia Lâm |
| Xã Kim Chung | 2 | Đông Anh · Hoài Đức |
| Xã Liên Hà | 2 | Đông Anh · Đan Phượng |
| Xã Vân Hà | 2 | Đông Anh · Phúc Thọ |
| Xã Tam Hiệp | 2 | Thanh Trì · Phúc Thọ |
| Xã Tân Minh | 2 | Thường Tín · Sóc Sơn |
| Xã Tiền Phong | 2 | Thường Tín · Mê Linh |
| Xã Tân Dân | 2 | Phú Xuyên · Sóc Sơn |
| Xã Phùng Xá | 2 | Mỹ Đức · Thạch Thất |
| Xã Đông Xuân | 2 | Quốc Oai · Sóc Sơn |

**Vấn đề kỹ thuật:** trong code hiện tại `Location.slug` là `@unique` **toàn cục** → import sẽ lỗi. Bắt buộc phải đặt slug kèm cấp cha.

**Cần khách chốt định dạng URL**, ví dụ với Quang Trung:
- Phương án 1: `/ban/dat-nen/dong-da/quang-trung` (slug lồng theo quận — khuyến nghị, tốt SEO)
- Phương án 2: `/ban/dat-nen/quang-trung-dong-da` (slug phẳng có hậu tố)

*(Nghệ An hiện tại không gặp vấn đề này nên chưa có tiền lệ trong code.)*

### A6. Tên quận/huyện viết không nhất quán giữa các bảng
| Đơn vị | Bảng 1 | Bảng 5 | Bảng 6 |
|---|---|---|---|
| Hoàng Mai | `Hoàng Mai` | `Hoàng Mai` | `Quận Hoàng Mai` |
| Tây Hồ | `Tây Hồ` | `Tây Hồ` | **`Tây hồ`** (sai hoa/thường) |

Ngoài ra Bảng 1 lúc có tiền tố (`Quận Hoàn Kiếm`, `Quận Ba Đình`, `Quận Đống Đa`) lúc không (`Hai Bà Trưng`, `Cầu Giấy`, `Thanh Xuân`, `Hà Đông`…).

→ Không chặn được việc import (mình chuẩn hoá được), nhưng **cần chốt tên hiển thị chính thức** vì nó lên title/H1/breadcrumb. Đề xuất: lưu tên chuẩn có tiền tố đầy đủ, hiển thị tuỳ ngữ cảnh.

---

## B. NGHIỆP VỤ CHƯA RÕ — cần khách trả lời

### B1. 🔴 Phân nhóm menu ngang (mục 26) — **thiếu hoàn toàn**
Yêu cầu: 3 menu xổ xuống `Trung tâm ▼ | Cận trung tâm ▼ | Ngoại thành ▼`, **mỗi menu 10 quận/huyện**.

Tài liệu **không nói quận/huyện nào thuộc nhóm nào**. 30 ÷ 3 = 10 — vừa khít, nhưng cách chia là quyết định của khách.

→ Cần bảng phân nhóm 30 quận/huyện thành 3 nhóm × 10.

### B2. 🔴 Mục 25.5 — hai dropdown bị gán nhầm nguồn dữ liệu
Tài liệu ghi nguyên văn:
```
Xem tin theo xã/phường CŨ:  [Tất cả ▼]  → danh sách lấy theo bảng 5 sheet All phường xã MỚI
Xem tin theo xã/phường MỚI: [Tất cả ▼]  → danh sách lấy theo bảng 6 sheet All phường xã CŨ
```
**Nhãn và nguồn ngược nhau.** Suy đoán hợp lý: dropdown "cũ" lấy Bảng 6, dropdown "mới" lấy Bảng 5 — nhưng cần khách xác nhận, không tự sửa.

### B3. Mô hình phân cấp địa giới — 2 tầng hay 3 tầng?
Sau sáp nhập 2025, Hà Nội **không còn cấp quận/huyện**, chỉ còn 126 phường/xã trực thuộc thành phố. Nhưng tài liệu vẫn dùng quận/huyện cũ làm cấp điều hướng chính (mục 25.1, Bảng 5 gán mỗi phường mới về một "Quận/huyện cũ").

**Cần chốt:**
1. Cấu trúc URL có cấp quận/huyện không? `/ban/dat-nen/cau-giay/yen-hoa` hay `/ban/dat-nen/yen-hoa`?
2. Breadcrumb `Trang chủ / Bán / Đất nền / {Quận/huyện cũ} / {Phường mới} / {Tiêu đề}` — cấp quận/huyện là **quận cũ**, đúng không?
3. Khi user đăng tin: bắt chọn quận/huyện cũ → phường mới → phường cũ (3 cấp), hay chỉ 2 cấp?

### B4. Quan hệ phường/xã CŨ ↔ MỚI
Bảng 5 (126 xã mới) và Bảng 6 (579 xã cũ) đều gán về quận/huyện cũ, **nhưng không có ánh xạ xã cũ → xã mới**.

Ví dụ: xã cũ *Mộ Lao* (Hà Đông) nay thuộc phường mới nào?

→ Cần bảng ánh xạ, **hoặc** xác nhận: mỗi tin đăng người dùng tự chọn độc lập cả 2 trường (xã cũ + xã mới) và hệ thống không kiểm tra tính khớp.

*Lưu ý kỹ thuật: code hiện tại `Property.oldWard` chỉ là text tự do, không có quan hệ — nên hiện đang là "tự chọn độc lập". Nếu khách muốn ràng buộc thì phải làm thêm.*

### B5. Dự án — nhiều chi tiết chưa chốt
1. URL: tài liệu đưa **2 phương án** — `/du-an/ten-du-an-ID` **hoặc** `/ten-du-an-ID`. Chọn cái nào? (khuyến nghị `/du-an/...`)
2. Dự án có phải một trong 6 loại BĐS không? Mục 1.4 nói "chọn loại BĐS là dự án", nhưng PHẦN II nói "giữ nguyên 6 loại" mà 6 loại đó là: đất nền, nhà riêng, chung cư, mặt bằng KD-kho xưởng, BĐS khác... → **Dự án là loại thứ 6 hay là chiều phân loại riêng?**
3. Một tin trong dự án thì loại BĐS thật là gì? (vd "Bán shophouse tại Vinhomes" — shophouse thuộc loại nào?)
4. Ảnh dự án: chỉ 1 ảnh đại diện, hay có album?
5. Dự án có cần trạng thái khác ngoài Hiển thị/Ẩn không? (đang mở bán / đã bàn giao…)

### B6. Quy trình duyệt tin — chi tiết vận hành
1. "Hiển thị rõ nội dung admin đã sửa" — hiển thị dạng **so sánh trước/sau từng trường**, hay chỉ ghi chú text của admin?
2. User **không phản hồi** trong X ngày thì tin ra sao? (tự huỷ / giữ nguyên chờ / tự duyệt?)
3. Ở trạng thái "Chờ người đăng duyệt lại", user có được **sửa tiếp** không hay chỉ được bấm đồng ý?
4. Tin đang hiển thị mà user sửa → có phải duyệt lại từ đầu không? Trong lúc chờ duyệt thì bản cũ còn hiển thị không?

### B7. Tab động — quy tắc xếp hạng
Mục 25 nói *"Tab nào có tin mới nhất sẽ đứng đầu… 9 tab có tin mới nhất sẽ hiển thị"*, rồi có câu **"Thực ra thì chỉ 3"** — câu này bỏ lửng, không rõ nghĩa.

**Cần làm rõ:**
1. "Chỉ 3" nghĩa là gì? Chỉ 3 tab hiển thị? Chỉ áp dụng cho 3 trong 4 khối?
2. Mốc "tin mới nhất" tính theo `publishedAt` (ngày duyệt) hay ngày tạo?
3. Khu vực **không có tin nào** thì có xuất hiện tab không?
4. Thứ tự tab có cache không, hay tính lại mỗi lần tải trang? (ảnh hưởng hiệu năng)

### B8. Thứ tự các khối trên trang chủ — tài liệu tự mâu thuẫn
Đoạn mô tả liệt kê: quận/huyện → **phường xã mới** → khu vực hot → **phường xã mới** (lặp lại lần 2)

Nhưng phần trước đó mô tả 4 khối là: quận/huyện · phường xã **mới** hot · phường xã **cũ** hot · khu vực hot.

→ Đoán rằng khối số 6 phải là **"phường xã cũ"** chứ không phải "mới" lần nữa. Cần xác nhận và chốt thứ tự cuối cùng.

### B9. Tài liệu nhảy số mục — có thể còn phần chưa gửi
PHẦN II đánh số: 1, 2, 3, **5**, 6, 7, **10**, 11, **19**, 20, **22**, 23, 24, 25, 26.

**Thiếu: 4, 8, 9, 12, 13, 14, 15, 16, 17, 18, 21.**

Có 2 mục xuất hiện nhưng **không có số và không có nội dung**: "Bộ lọc" (sau mục 7) và "Banner" (sau phần prompt), "Breadcrumb" (sau mục 11), "23. Dữ liệu người dùng" (chỉ có tiêu đề, không có nội dung).

→ Hỏi khách: 11 mục bị thiếu là cố ý bỏ hay còn bản đầy đủ hơn? Riêng **"23. Dữ liệu người dùng"** rất quan trọng → xem B10.

### B10. 🔴 Dữ liệu người dùng — mục 23 chỉ có tiêu đề, không có nội dung
Đây là quyết định lớn nhưng tài liệu bỏ trống:
1. Site Hà Nội dùng **database riêng hay chung** với Nghệ An?
2. Tài khoản user có **dùng chung** không? (đăng ký ở Nghệ An thì đăng nhập được ở Hà Nội?)
3. Ví tiền / số dư / gói VIP có dùng chung không?
4. Có copy dữ liệu user từ Nghệ An sang không, hay Hà Nội bắt đầu từ con số 0?
5. Tin đăng: có copy tin mẫu sang không, hay để trống hoàn toàn?

*Kỹ thuật: hiện `docker-compose.vps.yml` chỉ định nghĩa **một** database `bds_db`. Chạy 2 site thì phải hoặc tách DB, hoặc thêm cột phân vùng cho mọi bảng — hai hướng khác nhau hoàn toàn về khối lượng.*

### B11. Loại BĐS "Mặt bằng kinh doanh, kho xưởng"
Đổi tên hiển thị thì **slug URL có đổi theo không**?
- Hiện tại: `/mat-bang-kho-xuong` (thấy trong danh sách URL lỗi index)
- Nếu đổi thành `/mat-bang-kinh-doanh-kho-xuong` thì cần 301 cho site Nghệ An

→ Với site Hà Nội mới thì tự do chọn; với site Nghệ An cần chốt có đổi URL hay chỉ đổi chữ hiển thị.

### B12. Rút gọn đuôi link tin (PHẦN I)
Yêu cầu "thiết kế lại đuôi ngắn hơn, hiện tại đang dài quá". Hiện đang là UUID 36 ký tự.

**Cần chốt:** rút thành mã ngắn bao nhiêu ký tự? Dạng gì (số tăng dần / base62 / nanoid)?

⚠️ Lưu ý: đổi cái này thì **toàn bộ URL tin cũ phải 301**, và `fix seo.xlsx` mục II.1 nói rõ *"không phải ưu tiên SEO cấp bách"*. → **Đề xuất: chỉ áp dụng cho site Hà Nội mới, không đổi trên site Nghệ An** để tránh rủi ro mất index. Cần khách đồng ý.

### B13. Thống nhất giá/m² — công thức nào là đúng?
Tài liệu nêu hiện trang chủ / chuyên mục / chi tiết tính khác nhau do chỗ lấy giá & diện tích **trung bình**, chỗ lấy **cụ thể**.

**Cần chốt:** khi tin chỉ có **khoảng giá** và **khoảng diện tích** (không có số cụ thể) thì giá/m² hiển thị thế nào?
- Không hiển thị?
- Hiển thị khoảng (vd `25–32 triệu/m²`)?
- Lấy trung điểm của cả hai khoảng?

*Card mới yêu cầu 1 dòng `2,9 tỷ · 100 m² · 29 triệu/m²`, tài liệu có ghi thêm "nếu bố trí đủ thì để khoảng giá, khoảng diện tích thì hơn" — tức là ưu tiên hiện khoảng nếu vừa chỗ.*

---

## C. HẠ TẦNG & TÀI KHOẢN — cần khách cung cấp

| # | Cần gì | Ghi chú |
|---|---|---|
| C1 | **Domain chính thức** | `nhadathanoi.vn` trong tài liệu chỉ ghi "Ví dụ" — chưa chốt. Cần biết đã mua chưa, DNS ở đâu |
| C2 | **Logo + favicon** bản Hà Nội | Chưa có file. Logo hiện là "NHÀ ĐẤT XỨ NGHỆ" |
| C3 | Email, Fanpage, Zalo, hotline mới | Phục vụ footer + Organization Schema |
| C4 | Tài khoản **Google Search Console** + **GA4** | Tài liệu nói "tạo Property mới" — ai tạo, quyền gì |
| C5 | **Meta Pixel ID** mới | Mục PHẦN I nói pixel cũ "die facebook" — cần ID mới |
| C6 | Tài khoản **Cloudflare** | Mục 22 yêu cầu DNS/SSL/cache/redirect |
| C7 | 🔴 **Nâng cấp VPS** | Máy hiện **3.8 GB RAM, 0 swap, đang dùng 2.4 GB**. Chạy thêm 1 bộ frontend+backend nữa gần như chắc chắn **OOM**. Cần nâng RAM hoặc tách VPS riêng — đây là chi phí khách phải duyệt |

---

## D. MÂU THUẪN GIỮA TÀI LIỆU VÀ HIỆN TRẠNG CODE

| # | Điểm cần lưu ý |
|---|---|
| D1 | `fix seo.xlsx` II.7 ghi **"CẦN LÀM GẤP: SSR nội dung tin đăng"** — nhưng việc này **đã được fix trong nhánh `main`** (commit `29107d4`, truyền `initialProperty`). Chỉ là **chưa deploy lên VPS**. → Cần báo khách: mục này chỉ cần deploy, không phải làm mới |
| D2 | `fix seo.xlsx` II.6 ghi H1 trang tin chỉ có "Đang tải…" — **cùng nguyên nhân với D1**, cũng đã fix trong `main` |
| D3 | Tài liệu viết ngày **30-7**, nhưng bản `main` đã có commit ngày **15-7** chưa deploy. → Cần xác nhận khách đánh giá SEO trên **bản đang chạy (cũ)**, nên vài mục có thể đã hết hiệu lực sau khi deploy |
| D4 | 265 URL lỗi index có nhiều URL rác dạng `/nha-rieng/$`, `/chung-cu/&`, `/du-an/&` — do route catch-all `[...slug]` nhận mọi chuỗi. Đây chính là gốc của yêu cầu "xử lý landing page trống" |
| D5 | Tài liệu nhắc `/du-an` trong danh sách URL lỗi index (15 URL) → **site Nghệ An hiện đã có gì đó ở `/du-an`?** Nhưng code `main` **không có route `/du-an`** và **không có model Project**. Cần kiểm tra lại trên bản đang chạy |

---

## E. Đề xuất thứ tự xử lý

1. **Gửi khách mục A + B** → chờ trả lời (đặc biệt A2, A3, A4, B1, B2, B10 — chặn việc lập plan)
2. Song song: **làm ngay Giai đoạn 0** (vá bảo mật VPS + deploy `main`) — không phụ thuộc câu trả lời nào, và giải quyết luôn D1/D2
3. Có câu trả lời → lập plan chi tiết + ước lượng khối lượng
4. Chốt plan → triển khai theo 5 giai đoạn trong `plan/yeu-cau-nhan-ban-ha-noi.md`

**Các câu hỏi CHẶN (phải có trước khi lập plan):**
- A2 (thiếu 3 quận/huyện) · A3 (4 dòng trống) · A4 (khu vực hot là gì) · A5 (định dạng URL khi trùng tên)
- B1 (phân nhóm menu) · B2 (dropdown ngược) · B3 (2 hay 3 tầng địa giới) · B10 (DB chung hay riêng)
- C1 (domain) · C7 (VPS)
