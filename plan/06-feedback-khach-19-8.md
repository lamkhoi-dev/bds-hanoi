# Plan: Xử lý feedback khách 19-8 (site Nghệ An)

Nguồn: `D:\An\web_bds_hanoi\hieu chinh nhadatxunghe ngày 19-8.docx` (14 mục + 3 ảnh).
Repo `D:\An\web_bds_hanoi\bds-hanoi`, nhánh `main-hanoi`.
VPS Nghệ An `14.225.255.128` (`nhadatxunghe.vn`, `SITE_LAYOUT=classic`, **site thật**) ·
VPS Hà Nội `222.255.214.136` (`grouped`, staging).

---

## Context

Khách rà lại site Nghệ An và gửi 14 mục. Tôi đã verify từng mục bằng `curl` + đọc code +
truy vấn DB thật: **khách đúng ở tất cả các mục**. Ba nhóm nguyên nhân:

1. **Cờ SEO đang ở `report`** — logic 301/404 phân trang đã viết xong nhưng cố ý chưa bật.
2. **Thiếu tính năng, không phải hỏng** — admin chưa bao giờ sửa được tin đã duyệt; SĐT
   nhập lúc đăng tin không có cột để lưu.
3. **Đính chính feedback cũ** — mục 14/15 sửa lại đúng chỗ tôi làm lệch ở đợt trước.

**Anh đã chốt trong phiên này:**
- Logo mới `icon_ND-XN-2dong.svg` → **thay banner hero** (file có slogan mới "Đăng bán dễ
  dàng / tìm đất an tâm." dạng `<text>` màu trắng, đọc được trên nền tối `#0a1930`).
- Thứ tự tab khu vực → **số tin nhiều nhất, ưu tiên tỉnh chính (Nghệ An) trước Hà Tĩnh**.
- Admin sửa tin → **làm cả hai**: bổ sung 3 field vào form duyệt + thêm nút "Sửa" mở form
  đầy đủ cho tin ở mọi trạng thái.

**Nguyên tắc:** đây là feedback cho site Nghệ An (PHẦN I) ⇒ phần lớn áp **cả 2 site**.
Riêng mục đổi tiêu đề khối (2.2) là chuỗi riêng của Nghệ An ⇒ chỉ `classic`.

---

## 1. SEO — bật 301/404 phân trang mà KHÔNG dời URL landing

Hiện `NEXT_PUBLIC_SEO_MODE=report` gộp **4 thứ** vào một cờ: (a) 301/404 phân trang,
(b) bảng 301 tĩnh đổi dạng URL landing (`next.config.mjs:105-113`), (c) `listingPath()`
thêm tiền tố `/ban` (`canonical.ts:122`), (d) luật 6 "legacy-shape". Bật `enforce` là dời
~4.000 URL đang có thứ hạng — khách **không** yêu cầu.

**Cách tách (giữ `NEXT_PUBLIC_SEO_MODE=report` nguyên vẹn):** thêm **biến env mới**
`NEXT_PUBLIC_SEO_ENFORCE_PAGINATION=1` và một tham số tuỳ chọn cho `applyMode()`. Chỉ cho
`notFound`/`redirect` đi qua khi `reason` thuộc nhóm phân trang. Nhờ không đụng
`canonical.ts:122`, **11 test hiện có về dạng URL không bị ảnh hưởng**
(`canonical.spec.ts:64`, `listing-url.spec.ts:103`, 8 test `breadcrumb-items.spec.ts`).

Việc cần làm:
1. `frontend/src/lib/seo/canonical.ts` — `parseListingQuery()` thêm field mới
   `pageInvalid: boolean` (bật khi `rawPage` không khớp `/^[1-9][0-9]*$/`). **Giữ nguyên
   `page = 1`** cho ca sai định dạng — nếu đổi sẽ làm đỏ `canonical.spec.ts:12` vốn khoá
   đúng hành vi này.
2. `frontend/src/lib/seo/indexability.ts` — thêm **luật mới đứng TRƯỚC luật 5**:
   `query.pageInvalid` → `notFound / page-malformed`. Hiện `page=0/-1/abc` bị luật 5
   (`non-canonical-query`) bắt trước nên ra 301, không phải 404 như khách muốn.
3. `applyMode(decision, mode, opts?)` — thêm tham số thứ 3 tuỳ chọn (không phá chữ ký cũ,
   giữ `indexability.spec.ts:111` xanh). Ở `report`, nếu `opts.enforceReasons` chứa
   `reason` thì **không hạ cấp**. Nhóm reason cho phép: `page-out-of-range` (luật 7),
   `page-malformed` (luật mới). **Cố ý KHÔNG bật `non-canonical-query`** vì reason đó bao
   cả `?utm_*`/`?limit=` — vượt phạm vi khách yêu cầu.
4. `?page=1` → **301 thật** (không phải 308 của `permanentRedirect`) làm ở
   `frontend/src/proxy.ts`: thêm nhánh xoá `page=1` rồi `NextResponse.redirect(url, 301)`,
   và mở `matcher` bằng **query matcher hẹp**
   `{ source: '/:path*', has: [{ type: 'query', key: 'page' }] }` — chỉ chạy khi URL có
   `?page=`, không ảnh hưởng request thường. Khách viết rõ "301" nên không dùng 308.
5. `[...slug]/page.tsx:105` — **giữ `redirectLegacyShape: false`** (đã đúng sẵn), đây là
   chốt chặn không cho dạng URL landing dời. `indexability.spec.ts:99` là bảo chứng.
6. Sửa test `indexability.spec.ts:45` (đang assert page sai định dạng → `redirect`) thành
   `notFound`; thêm test cho `applyMode` với `enforceReasons`.

**Phải sửa cả `backend/src/seo/seo-urls.ts:11`?** Không — nó đọc `SEO_MODE` cho URL trong
sitemap, không liên quan phân trang. Giữ nguyên.

## 2. Giao diện trang chủ

**2.1 Mũi tên trượt tab trên PC (mục 10).** `PropertyTabs.tsx:33` là
`overflow-x-auto scrollbar-hide` — không có nút. Thêm 2 nút mũi tên trái/phải, chỉ hiện
trên `>= md` (mobile vuốt được, khách nói rõ không cần), tự ẩn khi đã ở đầu/cuối
(theo `scrollLeft`/`scrollWidth`, giống cách `MobileSwipeMenu.tsx:31-36` đang tính).

**2.2 Đổi tiêu đề 2 khối (mục 11) — chỉ Nghệ An.** `LOCATION_BLOCK_DEFS`
(`backend/src/property/property.service.ts:57-66`) đang có `title` cứng dùng chung 2 site.
Tách title theo layout: `classic` → "Bất động sản Nghệ An" (khối quận/huyện) và "Bất động
sản TP Vinh" (khối phường/xã mới); `grouped` (Hà Nội) giữ nguyên tiêu đề hiện tại. Đặt
bảng title trong `homepage-layout.ts` cạnh `HOMEPAGE_LAYOUTS` — nơi đã là nguồn duy nhất
quyết định bố cục theo site.

**2.3 Thứ tự tab khu vực (mục 11) — cả 2 site.** Hiện `buildDynamicLocationBlock`
(`property.service.ts:598-660`) xếp theo `_max(publishedAt)`. Số liệu thật cho thấy vì sao
khách không hài lòng: Nghi Xuân **1 tin** đứng thứ 2 (tin mới nhất 14/7), còn TX Hoàng Mai
**7 tin** và Nghi Lộc **4 tin** bị cắt khỏi top 9.

Đổi sang: **`_count` giảm dần**, tie-break `_max(publishedAt)` giảm dần, và **ưu tiên tỉnh
chính** — khu vực có `path` bắt đầu bằng slug tỉnh ĐẦU TIÊN trong `ACTIVE_PROVINCE_SLUG`
(`nghe-an`) xếp trước các tỉnh sau (`ha-tinh`). Kết quả kiểm bằng dữ liệu thật: Vinh(93),
Nam Đàn(9), Diễn Châu(8), Đô Lương(7), **TX Hoàng Mai(7)**, Thái Hoà(5), **Nghi Lộc(4)**,
Hưng Nguyên(3), Nghĩa Đàn(3) — Hà Tĩnh xuống sau, **Nghi Xuân(1) về cuối**: khớp đúng cả
3 yêu cầu của khách trong một quy tắc, không cần ghim tay.
`groupBy` đã trả `_max`, chỉ cần thêm `_count: { _all: true }`.

**2.4 PC hiện 4 tin/hàng, mobile giữ 3 (mục 13).** `HOMEPAGE_ITEMS_PER_BLOCK = 3`
(`property.service.ts:38`) + lưới `xl:grid-cols-4` ⇒ 3 card trong 4 cột, thừa 1 ô. Nâng
hằng số lên **4**, rồi ẩn card thứ 4 dưới ngưỡng `xl` bằng class `hidden xl:block` trong
`PropertyBlock.tsx:36` và `PropertyTabs.tsx:68` — mobile/tablet vẫn đúng 3 tin như khách
yêu cầu. (Ảnh hưởng cả Hà Nội: lưới đầy hơn, không lệch ý khách.)

**2.5 Bỏ nút "Bộ lọc" trong khung tìm kiếm (mục 14).** `SearchForm.tsx:178-186` — chính
nút tôi thêm ở đợt trước do hiểu lệch feedback cũ (khách muốn nút DƯỚI khung dài ra, không
phải thêm nút TRONG khung). Xoá hẳn nút này; nút "Tìm kiếm" trả về full width.

**2.6 Nút lọc dưới khung: dài + chữ đầy đủ, bỏ chữ "và" (mục 15).**
- `HomeFilterButton.tsx:37-44` (trang chủ): đổi `self-start` → `w-full`, chữ "Bộ lọc" →
  **"Lọc để tìm kiếm nhanh, chính xác hơn"**, dùng cùng class với nút ở trang chuyên mục.
- `MobileFilterButton.tsx:29` (trang chuyên mục): bỏ chữ "và" cho khớp.
- Trang chuyên mục hiện `lg:hidden` (chỉ mobile) — khách nói "trên trang chủ và trang
  chuyên mục", nên **bỏ `lg:hidden`** để PC cũng thấy (PC vẫn có `SidebarFilter` cột trái;
  cần xem lại bằng mắt sau khi build để chắc không trùng lặp gây rối).

**2.7 Bớt khoảng trống đầu trang chủ (mục 14).** `page.tsx:100-128` hero + `:119` section
tìm kiếm `-mt-8 mb-8`, `:130` main `py-16`. Giảm `py-16` → `py-8 md:py-10` và siết khoảng
hero/search. Đây là chỉnh thị giác, phải xem ảnh trước/sau rồi tinh chỉnh, không chốt cứng
con số ngay.

## 3. Trang đăng nhập / đăng ký — noindex (mục 7-8)

`/login` và `/register` là **client component** (`"use client"` dòng 1) nên không export
được `metadata`; thư mục chưa có `layout.tsx`. Tạo `frontend/src/app/login/layout.tsx` và
`register/layout.tsx` theo đúng khuôn `app/post/layout.tsx:1-14` (đã có sẵn trong repo, kèm
comment giải thích cùng lý do), với `robots: { index: false, follow: true }`.

⚠️ **Bắt buộc kèm theo:** gỡ `'/login'` và `'/register'` khỏi mảng `disallow` trong
`frontend/src/app/robots.ts:40-41`. Chính khách đã dẫn tài liệu Google: URL bị robots.txt
chặn thì Google **không đọc được** thẻ noindex. Giữ cả hai là vô tác dụng — đúng nguyên tắc
mà comment `robots.ts:48-51` của repo đã ghi cho `/search`, `/post`, `/so-sanh`.

## 4. Admin duyệt & sửa tin (mục 21-23)

Nguyên nhân "mất hết chức năng": nút Duyệt/Sửa/Từ chối ở `admin/posts/page.tsx:181-197`
chỉ render khi `post.status === 'PENDING'`. DB Nghệ An: **155 APPROVED / 1 PENDING** ⇒
admin gần như chỉ thấy Xem/Ẩn/Xoá. Bản chất là **chưa bao giờ sửa được tin đã duyệt**.

**4.1 Bổ sung 3 field vào form duyệt (mục 22).** `ReviewModal.tsx:29-35` hiện có
`title, description, propertyType, price, area` + 4 field vị trí. Thêm **`transactionType`
(loại giao dịch)**, **`areaRangeKey` (khoảng diện tích)**, **`priceRangeKey` (khoảng giá)`**
— cả 3 đã có sẵn trong `FIELD_LABEL`/`EDITABLE_FIELDS` của
`backend/src/property/property-review.service.ts:27-48` nên **backend không cần sửa**, chỉ
thêm input + đưa vào `changedFields()`.

**4.2 Nút "Sửa" cho tin ở MỌI trạng thái (mục 21+23).** Thêm nút mở
`/post?editId={id}` — form đăng tin đã hỗ trợ `editId` sẵn (dùng cho luồng user sửa tin
AWAITING_AUTHOR), và `PropertyService.update()` **đã cho ADMIN sửa tin của người khác**
(`property.service.ts:1310`). Gần như không phải viết mới.

⚠️ **Một sửa đổi backend bắt buộc:** `property.service.ts:1360-1374` — khi tin đang
`APPROVED` mà đổi field quan trọng (tiêu đề/giá/diện tích/vị trí) thì hạ status về
`PENDING`. Đúng cho user, **sai cho admin**: admin tự sửa xong lại phải tự duyệt lại, tin
biến mất khỏi site giữa lúc đó. Thêm điều kiện: người sửa có `role === 'ADMIN'` thì giữ
nguyên status. Cần thêm test cho nhánh này.

## 5. Hiện số điện thoại của tin (mục 20)

Form đăng tin có ô SĐT (`post/page.tsx:38, :890`) nhưng **bảng `Property` không có cột
`phone`** (chỉ `Requirement` có — `schema.prisma:526`), và `phone` không nằm trong
`allowedKeys` của `normalizePropertyPayload`. SĐT gửi lên **bị loại bỏ âm thầm** — cùng bản
chất với bug `projectId` đã sửa hôm trước.

Việc cần làm: migration thêm `Property.phone String?` → thêm `'phone'` vào `allowedKeys`
(`property-utils.ts:258-302`) và `CreatePropertyDto` → hiển thị ở khối thông tin chính của
`app/tin/[slug_id]/PropertyDetailClient.tsx` **ngay dưới dòng "Lượt xem"** (dòng ~514-522,
lặp đúng khuôn markup icon+label+value của các dòng cạnh nó), bọc `<a href="tel:...">` để
nhấn gọi được. Không backfill (tin cũ chưa từng lưu SĐT nên không có gì để điền);
`property.user.phone` vẫn là nguồn hiển thị hiện có ở nút gọi, không đụng tới.

## 6. Banner hero + slogan mới (mục 24)

`public/banner.svg` **trùng byte** với `public/logo/logo-full.svg` (cùng md5) — chứa slogan
CŨ "Đăng tin dễ dàng" vẽ dạng **vector path**, nên trước giờ không sửa được bằng code (đúng
như đã báo khách).

Copy `D:\An\web_bds_hanoi\Logo Nghe An\icon_ND-XN-2dong.svg` vào
`frontend/public/banner.svg` (giữ tên để không phải sửa `page.tsx:105`). File mới:
`viewBox="0 0 516.41 145.13"` (tỉ lệ ~3.6:1, rộng hơn banner cũ 618×348 ~1.8:1) ⇒ phải
kiểm lại `width`/`height`/`className` ở `page.tsx:104-112` cho khỏi méo, và **xem bằng mắt
trên nền `#0a1930`** vì slogan là chữ trắng. Giữ file cũ lại thành
`public/logo/logo-full.svg` (đã có) để lùi được.

Ảnh PNG kèm theo **không dùng** — export nền trắng nên slogan chữ trắng bị mất.

---

## Thứ tự thực hiện

1. Nhóm 3 (noindex login/register) + nhóm 6 (banner) — nhỏ, độc lập, rủi ro thấp.
2. Nhóm 2 giao diện (2.1 → 2.7) — thuần frontend + 2 chỗ backend (title, thứ tự, số card).
3. Nhóm 4 (admin) — có sửa logic status, cần test.
4. Nhóm 5 (SĐT) — có migration, deploy riêng một nhịp như lần `oldWardId`.
5. Nhóm 1 (SEO) — làm **cuối cùng và deploy riêng**, vì đụng middleware + hành vi 301/404
   trên site thật đang có thứ hạng. Bật `NEXT_PUBLIC_SEO_ENFORCE_PAGINATION=1` cho Nghệ An
   trước, quan sát, rồi mới bật Hà Nội.
6. Mỗi nhóm: `tsc --noEmit` + `jest` sạch cả 2 workspace → commit → deploy Nghệ An → verify
   → deploy Hà Nội.

## Kiểm chứng

**SEO (nhóm 1)** — `curl -sI` trên site thật, kỳ vọng:
`?page=1` → **301** + `Location` là URL gốc · `?page=2` → 200, index, self-canonical ·
`?page=999` / `=0` / `=-1` / `=abc` → **404** · `/dat-nen`, `/dat-nen/vinh`,
`/thanh-pho-vinh` → **vẫn 200, KHÔNG 301 sang `/ban/...`** (đây là điều kiện then chốt: dạng
URL landing không được dời) · `/login`, `/register` → có `noindex` trong HTML **và** không
còn trong `robots.txt`.

**Giao diện** — xem bằng mắt trên PC ≥1280px: mỗi khối đúng **4 tin/hàng không còn ô trống**;
tab có mũi tên trượt 2 bên, ẩn đúng lúc ở đầu/cuối; khối quận/huyện tiêu đề "Bất động sản
Nghệ An" và thứ tự bắt đầu Vinh → Nam Đàn → Diễn Châu → Đô Lương → **TX Hoàng Mai**, có
**Nghi Lộc**, **Nghi Xuân ở cuối**; khối phường/xã tiêu đề "Bất động sản TP Vinh"; khung tìm
kiếm **không còn nút "Bộ lọc"**; nút lọc dưới khung dài, chữ "Lọc để tìm kiếm nhanh, chính
xác hơn" ở cả trang chủ và chuyên mục. Trên mobile: vẫn **3 tin dọc**.

**Admin** — đăng nhập `/admin/posts`: tin **APPROVED** có nút "Sửa" mở `/post?editId=`;
sửa tiêu đề tin APPROVED rồi lưu → tin **vẫn APPROVED** (không tụt về PENDING); form duyệt
tin PENDING có đủ 9 nhóm field khách liệt kê.

**SĐT** — đăng 1 tin có SĐT → trang chi tiết hiện "Liên hệ: 09xxx" dưới Lượt xem, nhấn ra
trình gọi điện. Kiểm DB: cột `phone` có giá trị.

**Không phá Nghệ An** — sau mỗi lần deploy: 178 tin/41 user không đổi; test suite xanh
(hiện 77 backend / 85 frontend); `sections` trên `/api/v1/properties/homepage` vẫn đúng thứ
tự `classic`.

---

## Trạng thái thực hiện (cập nhật 2026-08-20)

**HOÀN TẤT toàn bộ 6 nhóm.** Hai commit:
- `c08cbbe` + `2e6181e` — nhóm 2..6 (giao diện, noindex, admin, SĐT, banner)
- `18e2306` — nhóm 1 (SEO phân trang)

### Nhóm 1 đã làm khác plan ở 3 điểm

1. Tên tham số là `opts.enforcePagination` (không phải `opts.enforceReasons`) — danh sách
   reason cố định trong `PAGINATION_REASONS`, chỗ gọi không truyền được reason lạ vào.
2. Thêm `isPaginationEnforced()` đọc `NEXT_PUBLIC_SEO_ENFORCE_PAGINATION` để `page.tsx`
   không phải tự đọc `process.env`.
3. `?page=1` ở `proxy.ts` là **vô điều kiện**, không gắn cờ: hành vi đúng ở mọi site và
   mọi trang, không có lý do để trì hoãn. Giới hạn GET/HEAD.

### Sửa kèm (phát sinh khi rà link nội bộ trỏ vào 301 mới tạo)

- `/user/{slug}` — nút phân trang thiếu tiền tố `/user/`, trước giờ trỏ ra route danh mục
  `/{slug}` nên **mọi nút phân trang trên trang hồ sơ công khai đều 404**. Bug có sẵn.
- `/search` — nút "Trang trước" từ trang 2 sinh `?page=1`, nay bỏ tham số.

### Kiểm chứng trên site thật (nhadatxunghe.vn, sau deploy)

| URL | Trước | Sau |
|---|---|---|
| `/dat-nen` | 200 | 200 |
| `/dat-nen?page=1` | 200 | **301** → `/dat-nen` |
| `/dat-nen?page=2` | 200 | 200, canonical tự trỏ |
| `/dat-nen?page=99999` | 200 | **404** |
| `/dat-nen?page=0` / `-1` / `abc` / `01` | 200 | **404** |
| `/nha-rieng?page=1&priceRangeKey=2B_3B` | 200 | **301** → `/nha-rieng?priceRangeKey=2B_3B` |
| `/dat-nen/vinh`, `/thanh-pho-vinh` | 200 | **200 (không dời)** ✅ |

Dữ liệu nguyên vẹn: 180 tin (20 đã xoá mềm) / 41 user / 155 APPROVED. Test 90 frontend +
83 backend xanh. Hà Nội cùng commit, `?page=2` trả 404 đúng vì `/dat-nen` chỉ có 2 tin.

Env đã thêm trên cả 2 VPS (`.env` cũ backup thành `.env.bak.20260820`):
`SEO_ENFORCE_PAGINATION=1`. `SEO_MODE` vẫn `report` — đây là điểm giữ URL landing đứng yên.

### Việc còn tồn (KHÔNG thuộc yêu cầu 19-8, chỉ ghi lại)

- Khối `wards-old` ("Bất động sản theo phường, xã cũ") **không hiện trên Nghệ An** vì
  `Location` type `OLD_WARD` có `isFeatured=true` là **0 dòng**. Muốn hiện thì phải tick
  featured cho các phường/xã cũ cần khoe; ngoài ra chỉ 26/40 tin có `oldWardId`.
- `?utm_*` và `?limit=` vẫn 200 + noindex như cũ (reason `non-canonical-query` cố ý không
  được mở). Khách chưa đề cập.

---

## Bổ sung 2026-08-20 (sau khi anh chốt 3 quyết định)

### 1. Sửa bug khối "Chung cư" lẫn tin cho thuê — commit `b5905aa`

6 truy vấn khối theo loại BĐS của bố cục `classic` (4 khối `cat-*` + 2 tab "Bất động sản
khác") thêm `transactionType: 'BAN'`. Kiểm chứng trên site thật sau deploy:

| Khối | Trước | Sau |
|---|---|---|
| `cat-CHUNG_CU` | 3 BAN + **1 CHO_THUE** | **4 BAN** |
| `cat-DAT_NEN` / `cat-NHA_RIENG` | 4 BAN | 4 BAN |
| `other-type-tabs` | không lọc | MAT_BANG 1 BAN, BDS_KHAC 4 BAN |
| `rent-type-tabs` | CHO_THUE | CHO_THUE (không đổi) |

Test mới `homepage-category-transaction.spec.ts` khoá **bất biến** ("không truy vấn nào
lọc `propertyType` mà bỏ `transactionType`") thay vì khoá danh sách khối — khối thêm sau
này quên lọc cũng bị bắt. Đã xác nhận test đỏ thật khi bỏ 1 filter (3/3 fail).

### 2. Bật `SEO_MODE=enforce` cho Hà Nội

Làm TRƯỚC go-live vì lúc này site còn `robots.txt: Disallow: /`, đổi dạng URL không mất gì.
`.env` Hà Nội: `SEO_MODE=report` → `enforce`, rebuild **cả frontend và backend** (frontend
vì `NEXT_PUBLIC_SEO_MODE` là build arg; backend vì `seo-urls.ts` đọc `SEO_MODE` runtime để
dựng sitemap — thiếu bước này thì sitemap khai dạng URL cũ mà site đã 301 đi).

| URL | Kết quả |
|---|---|
| `/ban/dat-nen`, `/ban/dat-nen/cau-giay`, `/cho-thue/chung-cu` | 200 |
| `/dat-nen`, `/dat-nen/cau-giay` | **301** → dạng `/ban/...` |
| `/tat-ca` | **301** → `/ban` |
| `/cau-giay` (khu vực 1 đoạn) | **308** → `/ban/cau-giay` |
| `/ban/dat-nen?page=1` | **301** → `/ban/dat-nen` |
| `/ban/dat-nen?page=0` | **404** |

- Sitemap: 83/83 URL landing đã mang tiền tố `/ban` hoặc `/cho-thue`, **0** URL dạng cũ.
- Link nội bộ trang chủ: `href="/dat-nen"` = **0**, `href="/ban/dat-nen"` = 6 ⇒ không có
  link nội bộ nào trỏ vào 301.
- 2 dropdown lọc xã trên `/ban/cau-giay` vẫn chạy, option sinh URL dạng mới.
- **Nghệ An không đổi**: `/dat-nen`, `/dat-nen/vinh`, `/thanh-pho-vinh` vẫn 200.

⚠️ Điểm lệch đã biết, cố ý không sửa: khu vực **1 đoạn** (`/cau-giay`) trả **308** chứ
không 301, vì phải tra CSDL mới biết đoạn đó là khu vực nên không đặt được vào bảng tĩnh
`next.config.mjs` lẫn middleware. Google coi 308 tương đương 301 về truyền tín hiệu, nên
không xử lý thêm.

### 3. Khối "phường, xã cũ" — đã soạn câu hỏi cho khách

`plan/cau-hoi-2026-08-20.txt`: hỏi khách có cần khối này trên trang chủ Nghệ An và nếu
cần thì liệt kê phường/xã nào; kèm thông báo việc sửa bug ở mục 1 và nhắc lại 8 câu hỏi
ngày 18-8 (nêu rõ SMTP và DNS là 2 chặn cứng của go-live Hà Nội).
