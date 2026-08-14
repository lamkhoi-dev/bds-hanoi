# Đối chiếu code với yêu cầu — còn thiếu / còn sai

Kiểm tra ngày 2026-08-14 trên `bds-hanoi` (working tree, chưa commit), đối chiếu từng dòng
`bds_doc/fix seo.xlsx` (32 mục) và `bds_doc/update 30-7 F.docx`.

Mọi kết luận dưới đây đều từ grep/đọc code thật, không dựa trí nhớ.

---

## A. Còn THIẾU — ảnh hưởng SEO trực tiếp

### A1. `fix seo` II.5 — Meta description trang hỗ trợ (CHƯA LÀM)

Yêu cầu: *"Tin tức và trang hỗ trợ còn thiếu hoặc dùng mô tả mặc định."*

**9/10 trang `/support/*` không có `metadata` nào cả** — không title, không description.
Không có `app/support/layout.tsx` dùng chung để bù.

| Trang | metadata | description |
|---|---|---|
| `/support/complaints` | ✗ | ✗ |
| `/support/how-to-post` | ✗ | ✗ |
| `/support/payment-policy` | ✗ | ✗ |
| `/support/posting-policy` | ✗ | ✗ |
| `/support/pricing` | ✗ | ✗ |
| `/support/privacy` | ✗ | ✗ |
| `/support/refund-policy` | ✗ | ✗ |
| `/support/rules` | ✗ | ✗ |
| `/support/terms` | ✗ | ✗ |
| `/support/data-deletion` | ✓ | ✓ |

**Việc cần làm:** thêm `export const metadata` (title + description + canonical) cho 9 trang.

### A2. `fix seo` I.15 — Tin đã bán vẫn nằm trong sitemap (CHƯA LÀM)

Yêu cầu: *"Tin đã bán, hết hạn hoặc bị xóa … đồng thời loại khỏi sitemap."*

`backend/src/seo/seo.service.ts:16`
```ts
const PUBLIC_STATUSES = ['APPROVED', 'SOLD'] as const;
```
dùng ở cả `:70` (landing roll-up) và `:152` (sitemap tin đăng) ⇒ tin `SOLD` vẫn được đẩy
vào sitemap và vẫn đếm vào `_count` khiến một facet chỉ toàn tin đã bán vẫn được index.

**Việc cần làm:** tách 2 hằng — `INDEXABLE_STATUSES = ['APPROVED']` cho sitemap/roll-up,
giữ `SOLD` ở đường xem trang (trang vẫn mở được, chỉ noindex). Đồng thời quyết định:
đã bán còn tin tương đương ⇒ 301, không còn ⇒ 410.

### A3. `fix seo` II.3 — Lặp thương hiệu trong title (CÒN SAI, 2 chỗ)

`app/layout.tsx:47` đặt `template: '%s | ' + siteConfig.name`. Hai trang lại tự nối thêm:

- `app/support/data-deletion/page.tsx:3` → `Yêu cầu xóa dữ liệu | {Site} | {Site}`
- `app/user/(dashboard)/my-listings/page.tsx:6` → tương tự

**Việc cần làm:** bỏ hậu tố thủ công, để template lo.

### A4. `fix seo` II.8 — Mỗi trang chỉ một H1 (CHƯA LÀM, 3 file)

| File | Số thẻ `<h1>` |
|---|---|
| `app/post/page.tsx` | 2 |
| `app/so-sanh/page.tsx` | 2 |
| `app/user/[slug]/page.tsx` | 2 |

`/post` và `/so-sanh` đã `noindex` nên tác động thấp, nhưng `/user/[slug]` là trang
**công khai được index** — đây là lỗi thật.

### A5. Canonical còn thiếu (lệch so với plan P1 mục 3)

Plan cam kết bổ sung canonical cho `/search`, `/news`, `/news/[slug]`, `/user/[slug]`,
`/khu-vuc`, `/support/*`. Thực tế còn thiếu:

| Trang | Có index? | Thiếu canonical |
|---|---|---|
| `app/news/page.tsx` | ✓ index | ✗ |
| `app/user/[slug]/page.tsx` | ✓ index | ✗ |
| `app/support/data-deletion/page.tsx` | ✓ index | ✗ |
| `app/search/page.tsx` | noindex | ✗ (ít quan trọng) |

(`/map`, `/post`, `/so-sanh`, `/my-listings`, `not-found` đều noindex — không cần.)

### A6. `/user/[slug]` không trả 404 khi hồ sơ không tồn tại

`app/user/[slug]/page.tsx:25` — khi API trả lỗi, `generateMetadata` trả
`{ title: 'User not found' }` rồi trang vẫn render **200**. Đúng định nghĩa soft 404
mà `fix seo` I.9 yêu cầu loại bỏ. Đợt này đã sửa soft 404 cho tin đăng và tin tức,
**bỏ sót trang hồ sơ**.

---

## B. Còn thiếu — hiệu năng / giao diện

### B1. `fix seo` IV.1 — Kích thước ảnh (CHƯA LÀM)

Yêu cầu: *"nhiều thẻ ảnh chưa thể hiện rõ width và height … tránh xô lệch giao diện."*

- **23 thẻ `<img>` thô** không có `width`/`height`. 9 file thuộc trang công khai:
  `app/layout.tsx`, `components/Footer.tsx`, `components/HeaderAuth.tsx`,
  `components/GoogleAdPlaceholder.tsx`, `app/map/page.tsx`, `app/post/page.tsx`,
  `app/so-sanh/page.tsx`, `app/user/[slug]/page.tsx`, `app/user/nap-tien/page.tsx`.
- **29 file dùng `next/image` với `fill` mà không khai `sizes`** ⇒ Next tải ảnh ở
  breakpoint lớn nhất, phí băng thông và hại LCP mobile.

### B2. `fix seo` IV.3 — Giảm tải trang (CHƯA LÀM)

Không nằm trong phạm vi đợt này (đợt này là hạ tầng + SEO). Cần đo bằng PageSpeed
sau khi deploy rồi mới quyết định cắt gì.

---

## C. Còn sai — `update 30-7 F.docx`

### C1. Nhãn loại BĐS chưa thống nhất (5 biến thể)

Khách yêu cầu nhãn **"Mặt bằng kinh doanh, kho xưởng"**. Hiện có 5 chuỗi khác nhau
cho cùng một enum `MAT_BANG`:

| Nơi | Nhãn hiện tại |
|---|---|
| `components/SearchForm.tsx:101` | `Mặt bằng KD` |
| `components/SidebarFilter.tsx:263` | `Mặt bằng kinh doanh` |
| `components/MobileMenu.tsx:32` | `Mặt bằng / kho xưởng` |
| `components/ExploreMoreBehavioral.tsx:12` | `Mặt bằng` |
| `components/ExploreMoreContextual.tsx:18` | `Mặt bằng` |
| `app/admin/posts/page.tsx:113` | `Mặt bằng kinh doanh` |
| `app/post/page.tsx:572` | `Mặt bằng, kho xưởng` |

`lib/seo/taxonomy.ts` đã có nhãn chuẩn nhưng **UI không dùng** — mỗi chỗ tự viết chuỗi.

**Việc cần làm:** cho 7 nơi trên đọc nhãn từ `taxonomy.ts`. Đây cũng là gốc để lần sau
đổi nhãn chỉ sửa 1 dòng.

---

## D. Đã kiểm tra và XÁC NHẬN ĐÚNG

Những mục dưới đây đã grep/đọc code và xác nhận đạt — liệt kê để khỏi kiểm lại:

**SEO kỹ thuật (I):** HTTPS + www→apex 301 (Caddyfile) · chuẩn hoá dấu `/` cuối
(Next mặc định `trailingSlash:false`) · `robots.txt` viết lại, **không** chặn `/search`
và landing rỗng (chặn thì Google không đọc được `noindex`) · sitemap `lastmod` =
`MAX(publishedAt)` thật, miễn nhiễm lượt xem · sitemap chỉ phát facet `_count > 0` ·
khu vực rỗng → 200 + `noindex,follow` + ngoài sitemap · khu vực không hợp lệ → 404 ·
soft 404 tin đăng và tin tức → 404 thật + `app/not-found.tsx` · `/search` noindex ·
`/post` `/so-sanh` `/map` noindex · `/news/hello` → 404 · gộp `/tat-ca` `/toan-bo-tin`
`/tin-tuc` về `/ban` bằng 301 · `?page=1` → 301, `page` vượt số trang → 404.

**Nội dung & thẻ (II):** slug tin tức sinh lại bằng `slugify` chung + 301 URL cũ ·
tên khu vực đúng dấu (đã xoá `formatSlugToName` — thủ phạm "phường Truong Vinh") ·
**H1 và nội dung tin đăng CÓ render phía máy chủ** — `page.tsx:121` truyền
`initialProperty`, `PropertyDetailClient.tsx:42` đặt `loading = !initialProperty`
nên HTML đầu tiên đã có H1/giá/diện tích, không phải "Đang tải…"
*(mục II.6 và II.7 khách đánh dấu CẦN LÀM GẤP — thực tế repo đã có sẵn từ commit
`29107d4`, có thể khách test trên bản deploy cũ)* · breadcrumb đủ cấp, dựng từ
`wardId/districtId` của chính tin nên không kế thừa đoạn lọc · trang lọc `noindex,follow`
+ canonical về URL gốc · **không có link lọc crawlable** — `SidebarFilter`/`SearchForm`
dùng `router.push`, không phát `<a>` (II.10 đạt về mặt cấu trúc, không cần `nofollow`).

**Schema (III):** `buildOffer` không bao giờ phát `price: 0` — kiểm 7 trường hợp,
tin thoả thuận bỏ hẳn thuộc tính giá · BreadcrumbList đầy đủ, trỏ `/ban` không phải
`/tat-ca` · Organization + WebSite + SearchAction đặt ở `layout.tsx` nên mọi trang có ·
một `@graph` mỗi trang, `@id` tham chiếu chéo.

**Khác:** `/tin-tuc` không còn link nội bộ · không còn link tới `/news/hello`.

---

## E. Không code được — phải làm sau khi deploy

| Mục | Việc |
|---|---|
| `fix seo` I.5 | Gửi sitemap trong GSC property mới |
| `fix seo` III.4 | Chạy Rich Results Test 3 mẫu trang, theo dõi báo cáo Schema |
| `fix seo` IV.2 | Đo Core Web Vitals mobile (LCP ≤2,5s · INP ≤200ms · CLS ≤0,1) |

---

## F. Ngoài phạm vi đợt này (đã chốt với anh từ đầu)

Redesign card tin & bố cục trang chủ · popup tìm kiếm/lọc · thống nhất công thức giá/m² ·
model Dự án · quy trình duyệt tin 2 chiều.

**Chặn bởi khách:** menu 3 nhóm Trung tâm/Ngoại thành (B1) · 26 "khu vực hot" không phải
đơn vị hành chính (A4) · URL phường/xã phẳng hay lồng (B3) · domain chính thức (C1).

---

## Tóm tắt

| Nhóm | Số mục | Ước lượng |
|---|---|---|
| A — SEO, cần sửa trước khi deploy | 6 | ~2–3 giờ |
| B — ảnh & hiệu năng | 2 | ~2 giờ (B1) |
| C — nhãn loại BĐS | 1 | ~30 phút |
| D — đã đạt | 25 | — |
| E — sau deploy | 3 | — |

Nhóm A và C nên xong trước khi deploy. B1 làm được song song, không chặn.
