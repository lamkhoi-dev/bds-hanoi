# Báo cáo: Yêu cầu nhân bản nhadatxunghe.vn → Nhà Đất Hà Nội

Nguồn: `D:\An\web_bds_hanoi\bds_doc` (4 file) · Ngày đọc: 2026-08-13

## 0. Bốn file gồm gì

| File | Nội dung |
|---|---|
| `update 30-7 F.docx` (544 KB) | **Tài liệu yêu cầu chính** — 388 đoạn, 5 ảnh minh hoạ. Chia 2 phần: PHẦN I (update trước khi nhân bản), PHẦN II (nhân bản) |
| `danh sách khu vực.xlsx` | **Dữ liệu hành chính Hà Nội** — 7 sheet: 30 quận/huyện, 126 phường/xã mới, 579 phường/xã cũ, 3 bảng "hot" + 1 sheet phường xã cũ TP Vinh |
| `fix seo.xlsx` | **Checklist SEO 41 mục**, chia 4 nhóm, mỗi mục có trạng thái ĐÃ CÓ / MỘT PHẦN / CẦN LÀM / CẦN LÀM GẤP |
| `Danh sách chưa lập chỉ mục.xlsx` | **265 URL** Google từ chối index, chia 7 nhóm nguyên nhân (export từ Search Console) |

**Bối cảnh:** giữ nguyên codebase, làm 2 bước — (1) sửa/nâng cấp site Nghệ An hiện tại, (2) nhân bản thành site Hà Nội với domain + dữ liệu + thương hiệu mới. VPS dùng chung với nhadatxunghe (theo mục 22).

---

## 1. PHẦN I — Update trước khi nhân bản

### 1.1 Trang chủ & bố cục
- Kéo 2 chuyên mục **BĐS tại Vinh** và **BĐS theo khu vực** lên trên chuyên mục Đất nền (dưới quảng cáo)
- **Bỏ hẳn** chuyên mục "Dành cho bạn"
- Đổi link "Khu vực khác" → **"Tất cả các khu vực"**
- **Cho thuê** làm thành tab ngang: nhà riêng · chung cư · mặt bằng-kho · đất nền · BĐS khác
- Sửa slogan: *Đăng tin dễ dàng* → **Đăng bán dễ dàng** / tìm đất an tâm
- Sửa nhãn: "Nhà đất Bán" → **"Bán Nhà đất"** (loại giao dịch đứng trước loại BĐS)
- Bỏ mã số thuế, bỏ địa chỉ (bỏ "số 123") ở footer
- Gắn lại **GA4 + Meta Pixel** (die Facebook)
- Bổ sung đầy đủ phường/xã cũ TP Vinh (sheet *Các phường xã cũ Ở Vinh*, 33 mục)

### 1.2 Card tin — thiết kế lại (mobile + PC)
**Có ảnh:**
- Mobile: **1 tin/dòng**, thumbnail chiếm trọn chiều ngang
- Trên thumbnail 2 dòng: dòng 1 = `Giá · Diện tích · Giá/m²` (vd `2,9 tỷ · 100 m² · 29 triệu/m²`); dòng 2 = địa chỉ (xã mới)
- Dưới thumbnail: 2 dòng tiêu đề (đậm, quá 2 dòng thì `…`) + 1 dòng phụ (hướng nhà, phòng ngủ, WC, ngày đăng — chữ nhỏ, không đậm)
- PC: giảm từ **5 tin/dòng → 3–4 tin/dòng** để tỷ lệ thumbnail giống mobile; giữ 2 hàng/chuyên mục
- ⚠️ Mục đích: **hết lặp giá và giá/m²** (hiện đang hiện cả trên thumbnail lẫn dưới tiêu đề — xem ảnh 2)

**Không ảnh** (placeholder mới):
- 40% trái: logo + dòng "nhadatxunghe.vn"
- 60% phải, thứ tự nổi bật: nhãn **BÁN/CHO THUÊ** (nền đỏ cam / xanh dương, chữ trắng) → **LOẠI BĐS** lớn & đậm nhất, màu `#176B45` → "Tại {khu vực}" nhỏ → "Chưa cập nhật hình ảnh" nhỏ & nhạt nhất
- Nền xám xanh rất nhạt, đường phân chia xám nhạt

### 1.3 Tìm kiếm & bộ lọc
- Bấm ô tìm kiếm → **popup mở ngay + bật bàn phím**
- **Bỏ chữ "Lọc tìm kiếm"** ở cả 2 vị trí (ảnh 1)
- Bộ lọc trong chuyên mục: kéo lên ngay dưới ô tìm kiếm
- Bộ lọc trang chủ: từ cuối trang → lên đầu trang, dạng **popup nổi**, thống nhất với trang chuyên mục
- **Bỏ toàn bộ xã/huyện tỉnh khác** khỏi bộ lọc và menu gợi ý (ảnh 3 cho thấy đang lòi ra *Xã Phăng Sô Lin*, *Xã Hạ Long*, *Xã Mường Lói* — không thuộc Nghệ An)
- Ràng buộc: **chọn huyện xong mới cho chọn xã**
- Thống nhất công thức **giá/m²** (hiện trang chủ / chuyên mục / chi tiết tính khác nhau do lấy giá & diện tích trung bình vs cụ thể)

### 1.4 Dự án — TÍNH NĂNG HOÀN TOÀN MỚI
- Form đăng tin: chọn loại BĐS = **Dự án** → hiện dropdown danh sách dự án; chọn xong **khoá 4 field địa điểm** (lấy mặc định theo dự án)
- Admin tạo dự án: tên, ảnh đại diện, địa điểm (tỉnh / khu vực / xã cũ / xã mới), mô tả
- Trạng thái: **Hiển thị / Ẩn**
- Trang chủ: 4 dự án có bài mới nhất, thumbnail ngang toàn màn hình
- URL: `/du-an` (toàn bộ) · `/du-an/ten-du-an-ID` (chi tiết)
- Tin trong dự án hiển thị như chuyên mục thường, **tự chèn địa điểm dự án vào mô tả** (phục vụ SEO + tìm kiếm nội bộ)
- Cần đủ: sitemap tự sinh, URL chuẩn SEO, meta title, meta description, H1, mô tả, cho index Google

### 1.5 Quy trình duyệt tin — làm mới
```
User đăng  → Chờ duyệt
Admin có 3 lựa chọn:
   a) Duyệt luôn (không sửa)
   b) Sửa và duyệt luôn
   c) Sửa rồi trả về user → trạng thái "Chờ người đăng duyệt lại"
         ↓ Hệ thống thông báo, hiển thị RÕ nội dung admin đã sửa
         ↓ User kiểm tra → nhấn Đăng tin lần nữa → quay lại "Chờ duyệt"
         ↓ Admin duyệt lần cuối
Lưu lịch sử chỉnh sửa. Vẫn giữ chức năng từ chối tin.
```
Mục đích: chặn lỗi chính tả, sai chuyên mục, **sai đơn vị giá**.

### 1.6 Landing page rỗng — chặn index
Hiện tại gõ URL bất kỳ đều sinh landing page (ảnh 4: `/test-thu-ten-xa` vẫn ra trang có H1 + mô tả SEO). Quy tắc mới:

| Điều kiện | robots | sitemap | nội dung SEO |
|---|---|---|---|
| URL có ≥1 tin | `index,follow` | Có | Đầy đủ (title, desc, breadcrumb, schema) |
| URL không tin | `noindex,follow` | Không | Không hiển thị dạng landing page |

- Khi URL chuyển 0 tin → có tin: **tự động** đổi `noindex`→`index` và thêm vào sitemap lần sinh kế tiếp
- Trang rỗng: đổi "Chưa có bài đăng nào" → **"Không có kết quả tìm kiếm phù hợp"**, bỏ tiêu đề + mô tả, thêm gợi ý về trang chủ + bộ lọc, bỏ link liên quan

### 1.7 Breadcrumb & Schema
**Cấu trúc Breadcrumb:** `Trang chủ / Loại giao dịch / Loại BĐS / Huyện / Xã mới / Tiêu đề`
- Phần tử cuối = trang hiện tại, **chỉ text, không link**; tiêu đề dài thì `…` (chỉ ngắt hiển thị)
- Trang lọc/search sinh breadcrumb tương ứng tới mức đang lọc
- ⚠️ Quy tắc quan trọng: từ trang lọc `?gia=2-3-ty` bấm vào 1 tin thì breadcrumb của tin **không kế thừa bộ lọc**, phải là `… / Huyện / Xã mới / Tiêu đề`
- Dự án khác: `Trang chủ / Dự án / {Tên dự án} / {Tiêu đề tin}` (không có khu vực)

**Schema cần có:** Organization · WebSite · Breadcrumb · Article/WebPage · ImageObject · SearchAction. Địa điểm khai đầy đủ `Việt Nam / Tỉnh / Huyện / Xã`.

### 1.8 SEO kỹ thuật (chi tiết ở mục 3)
Rút gọn đuôi link tin · đổi canonical theo URL mới · sinh lại sitemap · tối ưu Core Web Vitals · kiểm tra broken link, redirect, robots, structured data, meta, H1-H3, internal link, alt ảnh, Open Graph, PageSpeed.

---

## 2. PHẦN II — Nhân bản sang Hà Nội

| # | Hạng mục | Nội dung |
|---|---|---|
| 1 | Thương hiệu | Nhà Đất Xứ Nghệ → **Nhà Đất Hà Nội**: logo, favicon, tên site, footer, copyright, email, fanpage, Zalo |
| 2 | Domain | `nhadatxunghe.vn` → **`nhadathanoi.vn`** — kéo theo canonical, sitemap, robots, OG, Twitter Card, RSS |
| 3 | Organization Schema | Tên / địa chỉ / phạm vi → Hà Nội |
| 5 | **CSDL hành chính** | Thay toàn bộ Nghệ An → Hà Nội: **30 quận/huyện (Bảng 1)** · **579 phường/xã cũ (Bảng 6)** · **126 phường/xã mới (Bảng 5)** |
| 6 | Landing page SEO | `/ban/dat-nen/dien-chau` → `/ban/dat-nen/cau-giay`… sinh lại toàn bộ |
| 7 | Menu khu vực | Vinh/Diễn Châu/Nghi Lộc → Ba Đình/Hoàn Kiếm/Cầu Giấy/Đống Đa/Long Biên/Hà Đông/Thanh Xuân… |
| 10 | Nội dung mặc định | "Mua bán nhà đất Nghệ An" → "…Hà Nội" (title, description, heading, footer, FAQ, About) |
| 11 | Sitemap | Sinh lại toàn bộ |
| — | Prompt sinh nội dung | Các prompt tạo tiêu đề / mô tả / FAQ / SEO đều đổi "Nghệ An" → "Hà Nội" |
| 19–20 | GSC + GA | Tạo Property mới, gửi sitemap, theo dõi index |
| 22 | Hạ tầng | Cloudflare DNS + SSL + cache + redirect. **Trước mắt dùng chung VPS với nhadatxunghe** |
| 24 | Cấu hình SEO | Toàn bộ meta/OG/JSON-LD/canonical/robots/sitemap/RSS chuyển domain mới |
| — | Loại BĐS | Giữ 6 loại, đổi tên: "Mặt bằng, kho xưởng" → **"Mặt bằng kinh doanh, kho xưởng"** |

### 2.1 Bố trí trang chủ Hà Nội (mục 25)
9 phần theo thứ tự:
1. **VIP** → 2. **UP** → 3. Tab **quận/huyện** (Bảng 1) → 4. Tab **phường/xã mới hot** (Bảng 2) → 5. Tab **khu vực hot** (Bảng 4) → 6. Tab **phường/xã cũ hot** (Bảng 3) → 7. Tab **Loại BĐS** (5 tab) → 8. Tab **Cho thuê** (5 tab) → 9. Tab **Dự án** (5 dự án + tab xem toàn bộ)

**Cơ chế tab động** (áp cho phần 3–6): mỗi bảng có ~30 khu vực = 30 tab tiềm năng, nhưng chỉ hiện **9 tab + 1 tab "xem toàn bộ"** trên trang chủ. Không tab nào mặc định. **Tab có tin mới nhất đứng đầu**, tab mới có tin đẩy tab cũ xuống — 9 tab có tin mới nhất được hiển thị.

**Trang danh sách theo quận/huyện** (mục 25.5): tiêu đề "Danh sách tin đăng tại…" + **2 dropdown lọc riêng biệt**:
- `Xem tin theo phường/xã cũ: [Tất cả ▼]` — nguồn Bảng 6
- `Xem tin theo phường/xã mới: [Tất cả ▼]` — nguồn Bảng 5

*(Lưu ý: trong tài liệu gốc, nhãn của 2 dropdown này bị gán nhầm nguồn bảng — cần xác nhận lại với khách.)*

### 2.2 Menu ngang cố định (mục 26)
Thay các menu khu vực bằng **3 menu xổ xuống**, mỗi menu 10 quận/huyện:
`Trung tâm ▼` | `Cận trung tâm ▼` | `Ngoại thành ▼`

### 2.3 Bố trí 6 loại BĐS trên trang chủ
3 nhóm tab ngang: **Bán** (đất nền, nhà riêng, chung cư, mặt bằng KD-kho, BĐS khác — 5 tab) · **Cho thuê** (5 tab tương ứng) · **Dự án** (5 tab + 1 link toàn bộ)

---

## 3. Checklist SEO (`fix seo.xlsx` — 41 mục)

### Nhóm 1 — SEO kỹ thuật (15 mục)
| Trạng thái | Mục |
|---|---|
| ✅ ĐÃ CÓ | HTTPS (308) · chuẩn hoá dấu `/` cuối · robots.txt (chặn /admin, /login, /register) · mã xác minh GSC |
| ⚠️ CẦN LÀM | **`www.nhadatxunghe.vn` đang trả 502** → phải 301 về non-www |
| ⚠️ CẦN LÀM | `/search?...` **chưa có noindex** — mọi trang tìm kiếm/tổ hợp lọc phải `noindex,follow`, không vào sitemap |
| ⚠️ CẦN LÀM | Trang chức năng `/post`, `/so-sanh`, login, tài khoản, nạp điểm phải `noindex` (`/post` đã lọt vào kết quả tìm kiếm) |
| ⚠️ CẦN LÀM | `/news/hello` (trang thử) **đang trả 500** → phải 404/410 và xoá mọi internal link |
| ⚠️ CẦN LÀM | `/ban`, `/tat-ca`, `/toan-bo-tin` nội dung gần giống nhau → chọn 1 URL chính, còn lại 301/canonical |
| ⚠️ MỘT PHẦN | Phân trang: `?page=1` tạo URL trùng trang gốc (cần bỏ), `?page=999` vẫn trả 200 (cần 404/noindex) |
| ⚠️ | Sitemap 1.632 URL nhưng **1.477 URL cùng một `lastmod`** = thời điểm sinh lại sitemap → sai chuẩn Google, nên bỏ nếu không có ngày thật |
| ⚠️ | Sitemap chứa nhiều tổ hợp loại BĐS × khu vực **không có tin** |
| ⚠️ | Trang khu vực không tin (vd `/dat-nen/xa-ha-trung`) vẫn index → cần `noindex,follow` + loại khỏi sitemap; khu vực không hợp lệ trả 404 |
| ⚠️ | Soft 404: tin không tồn tại trả **200 + noindex**, bài tin tức không tồn tại trả **500** → phải 404/410 |
| ⚠️ CẦN QUY ĐỊNH | Tin đã bán / hết hạn / bị xoá: còn trang tương đương → 301, không còn → 404/410, đồng thời loại khỏi sitemap |

### Nhóm 2 — URL, tiêu đề, cấu trúc (10 mục)
- 🔴 **CẦN LÀM GẤP — SSR nội dung tin đăng**: title/description/schema đã xuất sẵn nhưng **nội dung chính vẫn phụ thuộc JavaScript**; HTML đầu tiên chỉ có "Đang tải…" và **không có H1**. Phải render server-side ít nhất: H1, giá, diện tích, vị trí, mô tả, ảnh chính, ngày đăng
- 🔴 **Slug tin tức bị mất chữ**: `th-ng-qua-h-s-i-u-ch-nh...` → phải sinh lại slug không dấu đúng + 301 URL cũ
- 🔴 **Tên khu vực lấy thẳng từ slug**: "phường Truong Vinh", "xa ha trung", "huyen anh son" → phải hiển thị "phường Trường Vinh", "xã Hà Trung", "huyện Anh Sơn"
- ⚠️ Title chuyên mục bị **lặp thương hiệu**
- ⚠️ Meta description: tin tức + trang hỗ trợ còn thiếu/mặc định; không được cắt giữa từ
- ⚠️ Quy định mỗi trang **1 H1 duy nhất**; H2 cho mô tả/thông tin BĐS/khu vực liên quan; H3 cho nhóm phụ
- ⚠️ Breadcrumb tin đăng chưa đủ cấp (mới có `Trang chủ → Bán → Tên tin`, lại trỏ qua `/tat-ca`)
- ⚠️ Hạn chế link crawlable sinh quá nhiều tổ hợp bộ lọc
- ℹ️ UUID trong URL tin còn dài — không gấp, nếu đổi phải giữ ID cố định + 301

### Nhóm 3 — Schema (4 mục)
- 🔴 **`price: 0` trong schema** dù tin hiển thị 5–7 tỷ → phải dùng giá đúng hoặc bỏ hẳn thuộc tính
- ⚠️ Breadcrumb Schema chưa đủ cấp
- ⚠️ Thiếu **Organization / WebSite Schema** ở trang chủ
- ⚠️ Chưa kiểm tra bằng Rich Results Test + báo cáo Schema trong GSC

### Nhóm 4 — Ảnh, tốc độ, mobile (3 mục)
- ⚠️ Nhiều thẻ ảnh **thiếu width/height** → gây CLS
- 🎯 Mục tiêu Core Web Vitals (p75): **LCP ≤ 2,5s · INP ≤ 200ms · CLS ≤ 0,1**, ưu tiên mobile
- ⚠️ Giảm JavaScript, giảm HTML đầu trang, tránh tải dữ liệu lặp, SSR nội dung tin

---

## 4. 265 URL Google từ chối index

| Nguyên nhân | Số trang |
|---|---|
| Đã phát hiện thấy – chưa được lập chỉ mục | 151 |
| Trang trùng lặp, người dùng chưa chọn trang chính tắc | 51 |
| Đã thu thập dữ liệu – chưa được lập chỉ mục | 21 |
| Trang thay thế có thẻ chính tắc thích hợp | 15 |
| Bị chặn bằng robots.txt | 13 |
| Bị loại trừ bởi thẻ 'noindex' | 9 |
| Trang trùng lặp, Google chọn trang chính tắc khác | 5 |

**Phân bố theo đường dẫn:** `/search` 50 · `/nha-rieng` 30 · `/dat-nen` 27 · `/bds-khac` 26 · `/cho-thue` 25 · `/_next` 18 · `/du-an` 15 · `/tin` 13 · `/user` 12 · `/mat-bang-kho-xuong` 11 · `/chung-cu` 7

**Đáng chú ý:** có URL rác kiểu `/nha-rieng/$`, `/chung-cu/&`, `/dat-nen/&`, `/du-an/&` — chứng minh route catch-all `[...slug]` nhận mọi chuỗi và sinh trang. 60/265 URL có tham số `?`.

---

## 5. Đối chiếu với code hiện tại

### Có sẵn, tận dụng được ✅
| Yêu cầu | Đã có gì |
|---|---|
| CSDL hành chính 3 cấp | `model Location` với `type: CITY/DISTRICT/WARD`, `parentId`, `slug`, `isFeatured`, `isSeoEnabled` — cấu trúc tốt, chỉ cần thay dữ liệu |
| Tab "hot" trên trang chủ | `Location.isFeatured` + index `[type, isFeatured]` |
| Landing SEO có kiểm soát | `Location.isSeoEnabled` |
| Lịch sử chỉnh sửa tin | `model PropertyHistory` |
| Trạng thái tin | `enum PropertyStatus`: DRAFT, PENDING, APPROVED, REJECTED, HIDDEN, SOLD, RENTED, EXPIRED, DELETED |
| **SSR trang chi tiết tin** | **Đã fix trong `main`** (`initialProperty`) nhưng **chưa deploy lên VPS** — deploy main là xử lý ngay được mục "CẦN LÀM GẤP" |

### Phải làm mới hoàn toàn 🔴
| Hạng mục | Khối lượng |
|---|---|
| **Model Dự án** | Không có `model Project` trong schema, không có route `/du-an` ở frontend. Cần: model + migration + quan hệ `Property→Project` + admin CRUD + 2 route + tab trang chủ + sitemap + schema. **Đây là hạng mục lớn nhất** |
| **Phường/xã cũ thành entity** | Hiện `Property.oldWard` chỉ là `String?` tự do, không có quan hệ. Yêu cầu Hà Nội cần **lọc theo cả xã cũ và xã mới** như 2 dropdown → phải nâng thành Location type mới (vd `OLD_WARD`) + quan hệ + index, nếu không sẽ không lọc/SEO được |
| **Trạng thái "Chờ người đăng duyệt lại"** | Thiếu trong enum. Cần thêm status + luồng thông báo + **hiển thị diff nội dung admin đã sửa** |
| **Tab động theo tin mới nhất** | Logic xếp hạng 9 tab theo `publishedAt` mới nhất của từng khu vực |
| **Menu 3 nhóm Trung tâm/Cận trung tâm/Ngoại thành** | Cần trường phân nhóm cho 30 quận/huyện (tài liệu chưa nêu quận nào thuộc nhóm nào — **cần hỏi khách**) |
| **Chặn landing page rỗng + auto index** | Sửa `[...slug]/page.tsx`: đếm tin → quyết định robots + có/không vào sitemap, tự chuyển noindex→index khi có tin |

---

## 6. Rủi ro & điểm cần làm rõ với khách

1. **Chưa có danh sách phân nhóm** 30 quận/huyện thành Trung tâm / Cận trung tâm / Ngoại thành (mục 26)
2. **Mục 25.5 gán nhầm nguồn dữ liệu**: dropdown "xã/phường cũ" ghi lấy Bảng 5 (xã mới) và ngược lại — cần xác nhận
3. Tài liệu **nhảy số mục** (thiếu 4, 8, 9, 12–18, 21) — có thể còn phần chưa gửi
4. **Dùng chung VPS** với nhadatxunghe: VPS hiện chỉ 3.8 GB RAM, 0 swap, đang dùng 2.4 GB. Chạy thêm 1 bộ frontend+backend nữa **gần như chắc chắn OOM** — cần nâng RAM hoặc tách VPS
5. **Domain `nhadathanoi.vn`** trong tài liệu chỉ là ví dụ ("Ví dụ") — cần chốt domain thật
6. Site Hà Nội **cạnh tranh cao hơn Nghệ An rất nhiều** — kỳ vọng SEO nên đặt lại
7. Thứ tự bắt buộc: **PHẦN I xong mới nhân bản**, nếu không sẽ phải sửa lỗi 2 lần trên 2 site

## 7. Đề xuất thứ tự triển khai

**Giai đoạn 0 — dọn nền (làm ngay, độc lập)**
Vá bảo mật VPS + deploy `main` (xem `plan/review-dong-bo-vps.md`). Riêng deploy main đã xử lý được "SSR tin đăng — CẦN LÀM GẤP".

**Giai đoạn 1 — SEO nền tảng**
www→non-www · noindex cho /search + trang chức năng · soft 404 · gộp /ban–/tat-ca–/toan-bo-tin · sửa slug tin tức · tên khu vực hiển thị đúng dấu · `price:0` trong schema · Organization/WebSite Schema · lastmod sitemap.

**Giai đoạn 2 — Landing page & Breadcrumb**
Quy tắc noindex theo số tin + auto-index · breadcrumb đầy đủ 6 cấp · chặn URL rác `[...slug]`.

**Giai đoạn 3 — UI/UX**
Card tin (có ảnh + không ảnh) · bố cục trang chủ · popup tìm kiếm/lọc · bỏ dữ liệu tỉnh khác · thống nhất giá/m².

**Giai đoạn 4 — Tính năng mới**
Model + trang Dự án · quy trình duyệt tin 2 chiều.

**Giai đoạn 5 — Nhân bản Hà Nội**
Import 30 quận/huyện + 579 xã cũ + 126 xã mới · đổi thương hiệu/domain/schema · tab động · menu 3 nhóm · sinh lại sitemap/landing · GSC + GA mới.
