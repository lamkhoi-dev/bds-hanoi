# Plan: Vá các mục còn thiếu/còn sai sau đợt Nền tảng + SEO

Repo: `D:\An\web_bds_hanoi\bds-hanoi`. Nối tiếp đợt P0–P7 (đã xong, chưa commit).

---

## Context

Đợt trước đã làm xong nền tảng + 25/32 mục `fix seo.xlsx`. Lần rà soát này đối chiếu
từng dòng yêu cầu với code thật và tìm ra **7 mục chưa đạt**, trong đó **3 lỗi nghiêm
trọng hơn cả danh sách ban đầu** — đều là hệ quả của việc P5 đổi dạng URL mà một số nơi
không được cập nhật theo.

Mục tiêu: đóng hết khoảng cách so với `fix seo.xlsx` + `update 30-7 F.docx` trước khi
deploy lên server Hà Nội.

---

## Đính chính báo cáo audit trước

Hai mục mình báo sai, đã kiểm lại:

| Mục | Báo trước | Thực tế |
|---|---|---|
| `/so-sanh` có 2 `<h1>` | Lỗi | **Không phải lỗi** — hai `<h1>` nằm ở hai nhánh `return` loại trừ nhau (`:58` early-return khi `items.length < 2`). |
| 29 file `<Image fill>` thiếu `sizes` | Lỗi | **Không phải lỗi** — grep của mình khớp nhầm `fill-current`/`flex-shrink`. Chỉ có 2 chỗ `fill` thật (`PropertyGallery.tsx:39,66`) và file đó **đã có** `sizes`. |

Và một mục mình báo ĐẠT nhưng thực ra chưa: **`fix seo` III.2 / II.9 (Breadcrumb)** — xem F1.

---

## 3 phát hiện mới (nặng hơn danh sách cũ)

### N1 — Breadcrumb vẫn phát URL cũ, vẫn trỏ `/tat-ca`

`lib/seo/breadcrumb-items.ts:84-96` `listingSegmentPath` được viết ở P2 theo dạng URL
cũ và **không được cập nhật khi P5 đổi sang `/{giao-dịch}/{loại}/{khu-vực}`**. Dòng 94:

```ts
if (!propertyTypeSlug) return '/tat-ca';
```

Hàm này là nguồn cho **cả** `<nav>` breadcrumb **và** JSON-LD `BreadcrumbList`, trên
**mọi** trang tin + trang danh mục. Nghĩa là:
- `fix seo` III.2 *"Breadcrumb Schema … đang trỏ qua /tat-ca"* — **chưa sửa**, y nguyên.
- Mọi mắt xích breadcrumb trỏ vào URL 301, cả với Google lẫn người dùng.

Chính comment trong file đã dự báo: *"P5 sẽ chuyển sang … khi đó chỉ sửa hàm này"* — bước đó bị bỏ sót.

### N2 — Breadcrumb và link SEO dùng SAI cột slug khu vực

`backend/src/property/property.service.ts:778`
```ts
const locationFields = { select: { id: true, name: true, slug: true, type: true } };
```

`Location.slug` là **slug theo phạm vi cha, không unique toàn cục** (schema ghi rõ:
*"125 nhóm tên trùng nhau, chạm 275/736 bản ghi"*). Cột dùng cho URL là `urlSegment`
(`@unique`) — `location.service.ts:215,223` đã alias đúng cho `getTree`, riêng `findOne`
thì không.

Hệ quả trên dữ liệu Hà Nội: **~37% tin đăng** có breadcrumb và 4 link SEO ở cuối trang
chi tiết trỏ sang phường khác hoặc vào URL không tồn tại (→ 404 dưới routing chặt của P4).

### N3 — `SidebarFilter` và `SearchControls` còn đọc URL theo ngữ pháp CŨ

`SidebarFilter.tsx:42` và `SearchControls.tsx:27` tự giữ mảng `CATEGORIES` và giả định
đoạn đầu là loại BĐS. Với URL mới `/ban/dat-nen/cau-giay`:

- `slug[0] = 'ban'` không có trong `CATEGORIES` → không nhận loại BĐS
- `parsedLoc = 'ban/dat-nen/cau-giay'` → không khớp khu vực nào

⇒ **Bộ lọc hiện trống trên mọi trang danh mục.** Đây là lỗi chức năng, không chỉ SEO.
`lib/seo/route.ts` đã có `parseListingPath` thuần/đồng bộ, đã có 54 test — hai widget này
chỉ cần dùng nó.

---

## Luật đã chốt

- **Tin SOLD** → `200 + noindex,follow`, **loại khỏi sitemap tin đăng**. Trang vẫn mở
  được. Tin `EXPIRED`/`DELETED` đã trả 404 sẵn (không nằm trong `publicStatuses`) — không đổi.
- **Nhãn loại BĐS**: `taxonomy.ts` là nguồn duy nhất, **một** trường `label`, không thêm
  biến thể ngắn. Nhãn `MAT_BANG` = `"Mặt bằng kinh doanh, kho xưởng"` đúng yêu cầu khách.
- **Commit theo từng phase.**

---

## F1 — Breadcrumb + mọi link nội bộ trỏ đúng URL mới `(N1, N2, III.2, II.9)`

1. `lib/seo/breadcrumb-items.ts` — xoá `listingSegmentPath`, gọi thẳng `listingPath()`
   từ `lib/seo/canonical.ts`. Đây là điểm sửa duy nhất cho toàn bộ breadcrumb.
2. `lib/seo/breadcrumb-items.ts` `locationRef()` — đọc `node.urlSegment ?? node.slug`.
3. `backend/src/property/property.service.ts:778` — `locationFields` thêm
   `urlSegment: true` và `shortName: true` (giữ `slug` để không vỡ chỗ gọi khác).
4. `app/tin/[slug_id]/PropertyDetailClient.tsx:441-449` — 5 nhánh ternary hard-code URL
   cũ (`/tat-ca`, `/dat-nen`, `/search?transactionType=CHO_THUE&…`) thay bằng một lệnh
   `listingPath({ transaction, propertyTypeSlug })`. Các link khu vực ở `:849` đổi sang
   `urlSegment`.
5. `components/Footer.tsx:45-48`, `components/MobileMenu.tsx:28-46` — 11 link còn ở dạng
   `/dat-nen`, `/chung-cu`… và `/search?transactionType=CHO_THUE&…` chuyển sang
   `listingPath`. Nhóm "Cho thuê" của MobileMenu hiện trỏ vào `/search` (noindex) thay vì
   `/cho-thue/{loại}` (indexable).
6. `components/ExploreMoreBehavioral.tsx:13` + `ExploreMoreContextual.tsx:19` —
   `path: 'biet-thu-lien-ke'` là **slug không tồn tại**, sẽ 404 dưới P4. Bỏ mảng
   `CATEGORIES` tự chế, dùng `PROPERTY_TYPES` + `listingPath`.
7. `app/page.tsx:279` — `/search?transactionType=CHO_THUE` → `/cho-thue`.
   (4 link `?priceRangeKey=` ở `:301-304` giữ nguyên — dạng nào cũng noindex.)

**Kiểm chứng:** `grep -rE "['\"\`]/(dat-nen|nha-rieng|chung-cu|du-an|mat-bang|biet-thu|bds-khac|tat-ca|toan-bo-tin)"` trong `frontend/src` chỉ còn khớp `taxonomy.ts` và file test.

---

## F2 — Hai widget lọc đọc URL bằng `parseListingPath` `(N3)`

`components/SidebarFilter.tsx:40-65` và `components/SearchControls.tsx:26-40`: bỏ mảng
`CATEGORIES` + `mapCategoryToEnum` tự chế, gọi `parseListingPath(slug)` rồi lấy
`transaction`/`propertyTypeSlug`/`locationSlug`. Ánh xạ slug→enum lấy từ
`propertyTypeBySlug()`.

**Kiểm chứng:** mở `/ban/dat-nen/cau-giay` — sidebar hiện sẵn "Đất nền" + "Cầu Giấy";
mở `/cho-thue/cau-giay` — hiện "Cho thuê" + "Cầu Giấy", loại BĐS để trống.

---

## F3 — Nhãn loại BĐS: một nguồn duy nhất `(update 30-7)`

`taxonomy.ts` đã có nhãn đúng nhưng **8 nơi tự viết chuỗi riêng**, ra 5 biến thể cho cùng
enum `MAT_BANG`. Cho tất cả đọc `PROPERTY_TYPES` / `propertyTypeLabel()`:

`SearchForm.tsx:98-105` · `SidebarFilter.tsx:258-265` và bản đồ nhãn ở `:205` ·
`MobileMenu.tsx:28-32` (đã gộp vào F1) · `ExploreMore*.tsx` (đã gộp vào F1) ·
`app/post/page.tsx:566-574` và bản đồ preview `:1120-1128` · `app/admin/posts/page.tsx:113`.

Cả 3 danh sách `<option>` dựng bằng `PROPERTY_TYPES.map(...)` để lần sau đổi nhãn chỉ sửa
1 dòng.

**Kiểm chứng:** `grep -rn "Mặt bằng" frontend/src --include='*.tsx'` chỉ còn khớp
`taxonomy.ts`.

---

## F4 — Metadata 10 trang hỗ trợ `(fix seo II.5, II.3)`

1. Thêm `export const metadata` cho **9 trang** `/support/*` thiếu hoàn toàn
   (`complaints`, `how-to-post`, `payment-policy`, `posting-policy`, `pricing`,
   `privacy`, `refund-policy`, `rules`, `terms`). Mỗi trang có sẵn đúng 1 `<h1>` mô tả
   chính xác nội dung — dùng làm `title`; `description` viết tay 120–155 ký tự, **không
   cắt giữa từ** (yêu cầu ghi rõ). Thêm `alternates.canonical`.
2. Bỏ hậu tố thương hiệu viết tay ở `support/data-deletion/page.tsx:3` và
   `user/(dashboard)/my-listings/page.tsx:6` — `layout.tsx:47` đã có
   `template: '%s | {tên site}'` nên hiện đang nhân đôi.

---

## F5 — Soft 404 trang hồ sơ + H1 trùng `(fix seo I.9, II.8)`

1. `app/user/[slug]/page.tsx` — nhánh `catch` ở `:195-201` đang render trang "404" nhưng
   trả **HTTP 200**. Thay bằng `notFound()`. Việc này xoá luôn thẻ `<h1>` thứ hai
   (`:198`) ⇒ đóng cả II.8 cho trang này. `generateMetadata` (`:25`) trả
   `robots: { index: false }` cho nhánh không tìm thấy.
2. `app/user/[slug]/page.tsx` — thêm `alternates.canonical: /user/${slug}`.
3. `app/post/page.tsx:1131` — `<h1>` trong khối preview (`{previewMode && …}`) đổi thành
   `<h2>`: khi bật preview thì cả nó và `<h1>` tiêu đề trang `:492` cùng nằm trong DOM.

---

## F6 — Tin đã bán ra khỏi sitemap + noindex `(fix seo I.15)`

1. `backend/src/seo/seo.service.ts:16` — tách hằng:
   - `INDEXABLE_STATUSES = ['APPROVED']` cho sitemap tin đăng (`:152`).
   - Roll-up landing (`:70`) **giữ cả `SOLD`**: trang phường có tin đã bán vẫn là trang
     có nội dung thật, và `total` mà frontend đọc từ `/properties/seo` cũng đếm `SOLD`
     nên hai bên mới nhất quán.
2. `app/tin/[slug_id]/page.tsx` `generateMetadata` — `status ∈ {SOLD, RENTED}` ⇒
   `robots: { index: false, follow: true }`. `schema/listing.ts:33` đã nhận biết trạng
   thái này sẵn.
3. Sửa `title: 'Khong tim thay tin dang'` (`:49`) thành có dấu.

---

## F7 — Canonical còn thiếu + kích thước ảnh `(fix seo IV.1)`

1. Thêm `alternates.canonical`: `app/news/page.tsx` (`/news`), `app/search/page.tsx`
   (`/search`). `/user/[slug]` và `/support/*` đã nằm ở F4/F5. `/news/[slug]` và
   `/khu-vuc` đã có.
2. Thêm `width`/`height` cho **13 thẻ `<img>` thô trên trang công khai** — logo
   (`Footer.tsx:16`, `layout.tsx:221`, `post/page.tsx:1114`), avatar
   (`HeaderAuth.tsx:36`, `so-sanh:183`, `user/[slug]:88`), ảnh tin (`map:110`,
   `so-sanh:98`, `user/[slug]:147`), còn lại (`GoogleAdPlaceholder:94`,
   `nap-tien:203`, `post:979`, `post:1109`).
   Giữ nguyên `<img>`, **không** đổi sang `next/image` — đổi sẽ kéo theo cấu hình
   `remotePatterns` cho ảnh người dùng, rủi ro không tương xứng với lợi ích CLS.
3. 10 thẻ `<img>` trong `/admin/*` bổ sung cùng lúc (rẻ, và `/admin` vốn noindex).

---

## F8 — Kiểm chứng & commit

1. `npm run typecheck` sạch ở cả 2 workspace.
2. `npm test --workspace=frontend` (54 test) và `--workspace=backend` (20 test) — thêm:
   - `breadcrumb-items.spec.ts`: breadcrumb tin `BAN + DAT_NEN + phường` ra
     `/ban`, `/ban/dat-nen`, `/ban/dat-nen/{urlSegment}` — **không có `/tat-ca`**.
   - `seo-urls.spec.ts`: tin `SOLD` không xuất hiện trong sitemap tin đăng.
3. Chạy `npm run build --workspace=frontend` để bắt lỗi import còn sót.
4. Commit theo phase: gom P0–P7 đã xong thành các commit chủ đề trước, rồi F1…F7 mỗi
   phase một commit.

---

## Ngoài phạm vi (giữ nguyên như đã chốt)

`fix seo` IV.2 Core Web Vitals và IV.3 giảm tải trang — phải đo PageSpeed sau khi deploy
mới quyết được cắt gì. I.5 gửi sitemap GSC và III.4 Rich Results Test — làm sau deploy.

Redesign card tin & trang chủ · popup lọc · công thức giá/m² · model Dự án · duyệt tin
2 chiều. Chặn bởi khách: menu 3 nhóm (B1) · 26 khu vực hot (A4) · URL phường phẳng/lồng
(B3) · domain thật (C1).
