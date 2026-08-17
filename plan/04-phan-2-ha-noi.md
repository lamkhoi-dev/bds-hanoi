# Plan: Hoàn thiện FULL hệ thống site Hà Nội (PHẦN II)

Repo `D:\An\web_bds_hanoi\bds-hanoi`, nhánh `main-hanoi`.
VPS Hà Nội `222.255.214.136` (Ubuntu 24.04, 5.8GB RAM, 4 CPU, swap 2GB) — đang chạy tại
`https://222-255-214-136.nip.io` (staging, chặn index). Domain thật sẽ dùng:
**`sanbdshanoi.vn`** (anh cung cấp 18/08, chưa trỏ DNS).
VPS Nghệ An `14.225.255.128` (`nhadatxunghe.vn`) — site thật đang chạy, **không được phá**.

---

## Context

Plan này thay plan cũ (đã hoàn thành Phần A + B + dựng hạ tầng). Lý do viết lại: đọc lại
tài liệu khách phát hiện **PHẦN II còn 5 yêu cầu UI chưa làm**, và khảo sát VPS phát hiện
**site Hà Nội chưa vận hành được** (không có admin, lộ hotline Nghệ An).

**Đã xong (kiểm chứng trên VPS thật):**
- Hạ tầng: Docker + swap 2GB + 7 container healthy, HTTPS hợp lệ, `.env` secrets riêng
  hoàn toàn, DB `bds_hanoi_db` tách biệt.
- Dữ liệu hành chính: **736 Location** (1 CITY + 30 DISTRICT + 126 WARD + 579 OLD_WARD),
  `isFeatured` = 28 WARD + 32 OLD_WARD, phân nhóm 3 cụm **khớp chính xác bảng khách gửi
  14/08** (`plan/tra-loi-khach-2026-08-14.txt`).
- Tab động khu vực (mục 25 cơ chế 9 tab), fix cache trang chủ, migration drift.
- Brand: 0 chỗ nào lộ chữ "Nghệ An"/"Xứ Nghệ"/"Vinh" trong HTML trang chủ.

**Quy tắc anh đặt ra (tuân thủ tuyệt đối):** yêu cầu nằm ở **PHẦN II ⇒ chỉ áp cho Hà
Nội**; PHẦN I ⇒ áp cả 2 site. Đã đối chiếu từng dòng docx: 5 yêu cầu ở mục 3 dưới đây
đều nằm sau dòng 194 (mốc PHẦN II) ⇒ **Nghệ An giữ nguyên**, vì khách đã duyệt.

**Anh đã chốt trong phiên này:** tôi tạo admin rồi anh đổi mật khẩu · tạo dữ liệu mẫu để
xem giao diện · bank/SePay/hotline tạm copy từ Nghệ An · khối "khu vực hot" thì hỏi lại
khách cho chắc · tôi soạn danh sách câu hỏi gửi khách · **SMTP anh sẽ cấp riêng** (nên tài
khoản mẫu tạo bằng script, bỏ qua OTP email) · **bật `SEO_MODE=enforce` cho Hà Nội**
(đúng yêu cầu tài liệu mục 6, Nghệ An giữ `report`).

---

## 1. Việc đầu tiên: soạn 2 file tài liệu (theo quy ước `plan/` của anh)

1. `plan/04-phan-2-ha-noi.md` — copy plan này vào repo để lưu vết (quy tắc CLAUDE.md:
   plan phải nằm trong `plan/` ở gốc project).
2. `plan/cau-hoi-gui-khach-2026-08-18.md` — **danh sách câu hỏi cho khách**, gồm:
   - **Chặn cứng:** khối "khu vực hot" (Bảng 4, 31 tên như Vinhomes Smart City, Royal
     City, Hồ Tây, Láng Hạ) — tài liệu mục 25 liệt kê nó là khối RIÊNG với khối Dự án,
     nhưng 26/31 tên là dự án/khu đô thị. Nó là **Dự án** (đã có) hay thực thể riêng có
     landing page riêng? Nếu riêng thì URL nào (`/khu-vuc-hot/...`?) và mỗi tên thuộc
     quận nào (file khách không có cột quận cha ⇒ không dựng được breadcrumb)?
     Ecopark nằm ở Hưng Yên — vẫn đưa vào?
   - Xác nhận 2 giả định tôi đã tạm chọn: "Vạn Phúc" → Hà Đông, "Minh Khai" → Hai Bà
     Trưng (sheet xã cũ hot có tên trùng 3 quận).
   - Bảng 2 (xã mới hot) có 4 dòng trống (STT 5, 26, 27, 32) — bổ sung tên?
   - Logo + favicon bản Hà Nội (hiện dùng icon ngôi nhà trung tính, không có wordmark).
   - Hotline, email, Fanpage, Zalo riêng cho Hà Nội (hiện **đang hiện số của Nghệ An**).
   - Tài khoản Google Search Console + GA4 + Meta Pixel ID mới (mục 19, 20).
   - Có dùng Cloudflare không (mục 22) — nếu có cần tài khoản.
   - Thông tin ngân hàng + SePay token riêng cho Hà Nội (nếu không thì dùng chung Nghệ An).
   - Bảng ánh xạ xã cũ → xã mới (câu B4 chưa từng được trả lời) — hiện người đăng chọn
     độc lập 2 trường, hệ thống không kiểm tra khớp.

---

## 2. Vận hành site Hà Nội — làm được ngay, không chờ khách

### 2.1 Sửa lỗi lộ thông tin Nghệ An (ưu tiên cao nhất)

`frontend/src/app/layout.tsx:197` và `support/privacy/page.tsx:65` có fallback cứng
`'0868126826'` — đã kiểm chứng: **site Hà Nội đang hiện đúng số này ở header**. Sửa bằng
cách điền `NEXT_PUBLIC_SUPPORT_PHONE` + `NEXT_PUBLIC_SUPPORT_EMAIL` vào `.env` VPS Hà Nội
(tạm dùng của Nghệ An theo anh chốt) rồi **rebuild frontend** (biến `NEXT_PUBLIC_*` bake
lúc build). Đồng thời đổi fallback cứng thành chuỗi rỗng để lần sau quên set thì ẩn hẳn
chứ không hiện số của site khác.

### 2.2 Tạo tài khoản admin — BLOCKER

Hiện `User` = 0 dòng ⇒ **không vào được `/admin`**. Các script `backend/scripts/*admin*`
đều **không dùng được trong container** (không được `COPY` vào image; `create-admin.js`
còn `require('bcryptjs')` mà package chỉ có `bcrypt`).

Viết mới `backend/src/scripts/create-admin.ts` (thư mục `src/scripts` MỚI được biên dịch
vào `dist/scripts/`): đọc `ADMIN_EMAIL`/`ADMIN_PASSWORD` từ env, hash bằng `bcrypt`,
`upsert` idempotent, set `role='ADMIN'`, `status='ACTIVE'`, `emailVerified=true`. Mặc
định dry-run, cần `--apply` (đúng khuôn mẫu các script sẵn có).

### 2.3 Cấu hình `SystemSettings` qua `/admin/settings`

Dòng `default_settings` đã tự sinh nhưng các trường sau đang rỗng:
- `bankBin`, `bankAccount`, `accountName`, `sepayWebhookToken` → thiếu thì `/payment/qr-code`
  trả **503**, webhook trả **500** ⇒ không nạp được tiền. Copy từ Nghệ An (anh đã chốt).
- `googleSearchConsoleId`, `googleAnalyticsId`, `facebookPixelId` → chờ khách (mục 1).
- Đối chiếu giá VIP/UP với Nghệ An (Nghệ An: VIP 5000, UP 4000; Hà Nội đang mặc định
  10000/3000) — hỏi anh chốt.
- Khai webhook ở SePay: `https://{domain}/api/v1/payment/webhook/sepay`.

### 2.4 Dữ liệu mẫu để xem giao diện (anh đã chốt)

Trang chủ hiện trống hoàn toàn: `locationBlocks: 0` khối (khối rỗng tự ẩn — đúng thiết
kế), sitemap landing 0 URL (landing chỉ sinh từ khu vực CÓ tin — đúng thiết kế, không
phải bug). Tạo qua **API/luồng thật** (không insert SQL thô, để Meilisearch + cache +
sitemap tự cập nhật đúng): vài user, ~15-20 tin rải trên nhiều quận/phường, 3-5 dự án.
Ghi rõ đây là dữ liệu thử, xoá sạch trước khi chạy thật.

Sửa luôn `backend/src/property/property.service.ts:764` — `stats: { projects: 15,
satisfaction: 99 }` **hardcode**, site trống vẫn khoe "15+ dự án". Đổi `projects` sang
đếm thật; `satisfaction` bỏ hoặc đưa vào `SystemSettings`.

### 2.5 Gắn domain thật `sanbdshanoi.vn`

1. Trỏ DNS A: `sanbdshanoi.vn` **và** `www.sanbdshanoi.vn` → `222.255.214.136`
   (`Caddyfile:35` cần bản ghi www, nếu không Caddy không cấp được cert cho block redirect).
2. Đổi `SITE_DOMAIN` trong `/app/.env`, rebuild frontend, `docker compose up -d` →
   Caddy tự xin Let's Encrypt.
3. Giữ `APP_ENV=staging` cho tới khi khách xác nhận nội dung; khi go-live đổi
   `production` **và rebuild frontend** (nếu không `robots.txt` vẫn `Disallow: /`).
4. `SEO_MODE=enforce` (anh đã chốt) ⇒ URL chính tắc dạng `/ban/dat-nen/cau-giay`, các
   dạng khác 301 về đó. Hiện `report` nên cả 3 dạng đều trả 200. Nghệ An giữ `report`
   (đổi = dời ~4.000 URL đang có thứ hạng, khách không yêu cầu).

### 2.6 Vá 3 gap hạ tầng phát hiện khi khảo sát

- **7 biến `NEXT_PUBLIC_FIREBASE_*`** (`frontend/src/lib/firebase.ts:6-12`) không có
  trong `Dockerfile`/`compose`/`.env.prod.example` ⇒ **đăng nhập OTP bằng SĐT không thể
  bật** dù có Firebase project. Thêm `ARG`/`ENV` + build args (đúng khuôn mẫu đã làm cho
  `BRAND_LINE1/2`). Ảnh hưởng cả 2 site.
- `NEXT_PUBLIC_META_PIXEL_ID` cũng thiếu tương tự.
- **SMTP**: anh sẽ cấp riêng ⇒ tạm thời user không tự đăng ký được (code bắt
  `emailVerified` mới cho đăng tin). Tài khoản mẫu ở mục 2.4 vì vậy tạo bằng script
  (set `emailVerified=true`), không qua luồng OTP. Ghi vào danh sách chờ.

---

## 3. Các yêu cầu UI của PHẦN II chưa làm — chủ yếu CHỈ áp cho Hà Nội

Đã đối chiếu vị trí trong docx để phân định phạm vi:

| # | Yêu cầu | Vị trí docx | Phạm vi |
|---|---|---|---|
| 3.1 | Thứ tự khối trang chủ + thêm khối "khu vực hot" | mục 25, dòng 386-395 | chỉ HN |
| 3.2 | 6 loại BĐS → 5 tab ngang | mục 25, dòng 382-383 | chỉ HN |
| 3.3 | Khối Dự án → 5 dự án + 1 tab "xem toàn bộ" | mục 25, dòng 385 | chỉ HN |
| 3.4 | Menu ngang desktop 3 dropdown theo cụm | mục 26 | chỉ HN |
| 3.5 | Trang quận/huyện: 2 dropdown lọc xã cũ/mới | mục 25.5b, dòng 376-380 | chỉ HN |
| 3.6 | `/khu-vuc` phải liệt kê cả phường/xã **cũ** | mục 25.2 | cả 2 (bổ khuyết) |

*Mục 3.6*: `frontend/src/app/khu-vuc/page.tsx:28` lọc `info.type !== 'WARD'` ⇒ bỏ hết 579
OLD_WARD của Hà Nội (và 113 của Nghệ An). Khách yêu cầu anchor "Xem toàn danh sách tin
đăng theo phường, xã **cũ và mới**" trỏ vào trang này ⇒ phải có cả 2 loại.

*(PHẦN I dòng 5 chỉ yêu cầu "Cho thuê thành tab ngang 5 loại" — đã làm xong cả 2 site.
Menu mobile 3 nhóm đã có từ commit `c22c7fc`; **chỉ thiếu bản desktop**.)*

**Thứ tự khối trang chủ khách chốt** (`tra-loi-khach-2026-08-14.txt` dòng 6 — xã **cũ**
nằm TRÊN xã mới): 1.VIP · 2.UP · 3.Tab quận/huyện · 4.Tab phường-xã **cũ** hot ·
5.Tab **khu vực hot** · 6.Tab phường-xã **mới** hot · 7.Tab loại BĐS (5 tab) ·
8.Tab cho thuê (5 tab) · 9.Tab dự án (5 + 1 tab).
Hiện code xếp: quận → xã **mới** → xã **cũ** ⇒ sai thứ tự, và thiếu khối mục 5.

> ⏸ **Mục 5 (khối "khu vực hot") bị CHẶN** vì chờ khách trả lời (xem mục 1). Thiết kế
> phải chèn thêm được 1 khối vào giữa mà không viết lại — 4 mục còn lại làm ngay được.

### Cơ chế rẽ nhánh 2 site (quyết định nền tảng)

Hiện **không có một chỗ nào trong repo rẽ nhánh theo tỉnh** (đã grep `=== 'ha-noi'`,
`province.slug ===` → 0 kết quả). Nguyên tắc đang theo: một build, hành vi khác nhau nhờ
**dữ liệu** (vd `Location.group` NULL ⇒ MobileMenu tự lùi về menu phẳng) hoặc **env**.
Giữ nguyên nguyên tắc đó, cụ thể:

1. **Bố cục trang chủ (3.1-3.3): quyết ở BACKEND, trả về mảng `sections[]` CÓ THỨ TỰ.**
   Một biến **runtime** `SITE_LAYOUT` = `classic` (mặc định, bố cục Nghệ An) | `grouped`
   (bố cục PHẦN II). **Không** đặt tiền tố `NEXT_PUBLIC_` — biến đó bị bake vào bundle
   lúc build nên sẽ thành **2 image khác nhau**, phá mục tiêu "một image cho cả 2 site";
   đặt ở `environment:` chứ không phải `build.args:`. Tên đặt theo *hành vi* chứ không
   theo tỉnh, để mai khách Nghệ An đổi ý thì sửa 1 dòng `.env`, không sửa code.
   Backend khai 2 preset là **mảng id khối** (`HOMEPAGE_LAYOUTS.classic` /
   `.grouped`) + registry builder theo từng id, rồi trả
   `sections: {id, kind: 'block'|'tabs'|'ad'|'project-grid', ...}[]`.
   `frontend/src/app/page.tsx` co lại thành `sections.map(renderSection)` với **một
   `switch`** — thêm/bớt/đổi thứ tự khối về sau chỉ sửa 1 mảng string ở backend,
   frontend không đổi dòng nào. Mặc định `classic` là chiều fail-safe đúng: thiếu biến /
   sai chính tả / mất env đều ra bố cục Nghệ An.
2. **Menu ngang desktop (3.4): rẽ nhánh theo DỮ LIỆU, không cần biến.** Dùng lại đúng
   `groupDistricts()` trong `frontend/src/hooks/useLocations.ts` mà `MobileMenu.tsx:57-77`
   đang dùng: `group` có giá trị ⇒ vẽ 3 dropdown; NULL ⇒ giữ link phẳng `BĐS {tỉnh}`.
   Đã kiểm chứng dữ liệu thật: Hà Nội 30/30 DISTRICT có `group`, Nghệ An 0/738 ⇒ tín hiệu
   sạch, tự đúng cho cả 2 site.
3. **Hai dropdown lọc xã (3.5): GATE KÉP — vừa cờ vừa dữ liệu.** Chỉ hiện khi
   `SITE_LAYOUT === 'grouped'` **VÀ** đoạn URL đang xem đúng là một `DISTRICT`; từng ô
   còn tự ẩn nếu quận đó không có `WARD`/`OLD_WARD` con. Không được suy thuần từ dữ liệu:
   TP Vinh (Nghệ An) cũng là `DISTRICT` và cũng có `WARD`+`OLD_WARD` con (33 xã cũ đã
   import) ⇒ nếu bỏ cờ thì trang `/thanh-pho-vinh` tự mọc 2 dropdown, phá luật "PHẦN II
   chỉ Hà Nội". `SITE_LAYOUT` đọc runtime phía **server component** của
   `[...slug]/page.tsx` (không phải qua `NEXT_PUBLIC_*`), nên module đọc nó phải gắn
   cảnh báo rõ "chỉ dùng trong server component" — đọc trong client component sẽ luôn ra
   `undefined`/`classic` mà không báo lỗi gì.

### Việc cụ thể từng mục

**3.1 Thứ tự khối + chỗ chèn "khu vực hot"** — **QUAN TRỌNG: `LOCATION_BLOCK_DEFS` phải
đổi từ mảng có thứ tự sang `Record` keyed by id, KHÔNG mang thứ tự riêng.** Nếu chỉ đảo
thứ tự mảng hiện có (dòng 55-59) để phục vụ Hà Nội thì Nghệ An **tự đảo theo** — đúng thứ
phải tránh nhất. Thứ tự **chỉ tồn tại** trong `HOMEPAGE_LAYOUTS.classic` (giữ nguyên
đúng thứ tự Nghệ An đang chạy: districts → wards-new → wards-old) và `.grouped` (districts
→ wards-old → hot-areas → wards-new → ... theo khách chốt). Tổng quát hoá luôn
`buildDynamicLocationBlock` → `buildDynamicTabBlock` nhận "nhà cung cấp ứng viên"
(`locationCandidates`/`projectCandidates`/`hotAreaCandidates` stub) thay vì riêng
Location — dùng lại được cho cả khối Dự án (3.3) thay vì có 2 bản sao thuật toán
`groupBy+_max(publishedAt)+sort+slice` (bản thứ hai hiện nằm ở
`ProjectService.findLatestForHomepage()`). Đăng ký `'hot-areas'` với builder stub
`async () => null` ngay từ bây giờ, đúng vị trí thứ 5 ⇒ khi khách trả lời chỉ viết
**thân 1 hàm**, không đụng thứ tự/type/frontend/Nghệ An.
**Test bắt buộc**: snapshot `HOMEPAGE_LAYOUTS.classic` đúng byte thứ tự đang chạy thật
(lấy từ `curl` baseline trước khi sửa) — ai lỡ đảo sẽ đỏ CI ngay.

**3.2 Năm tab ngang** — builder mới `sale-type-tabs`: `SALE_TAB_TYPES = ['DAT_NEN',
'NHA_RIENG','CHUNG_CU','MAT_BANG','BDS_KHAC']`, lọc `transactionType: 'BAN'` (khối
`categoryBlocks` hiện KHÔNG lọc transactionType — đang lẫn cả tin cho thuê, một bug có
sẵn — **không sửa cho Nghệ An trong đợt này**, chỉ khối mới của Hà Nội lọc đúng). Nhãn/
href lấy từ `blockMeta()` sẵn có (dòng 69-73), không viết chuỗi cứng.
*Lưu ý phân biệt:* `propertyType = 'DU_AN'` (một loại BĐS, sinh đúng 1 tab) **khác** model
`Project` (nhiều dự án, mỗi dự án 1 tab riêng — đúng thứ khách cần cho mục 9). Tin
`DU_AN` không gắn `projectId` sẽ không lên khối nào ở bố cục mới (vẫn vào được qua tìm
kiếm) — cần báo khách, không chặn code.

**3.3 Khối Dự án thành 5 tab + 1** — builder `project-tabs` dùng lại đúng
`buildDynamicTabBlock` (không gọi `ProjectService`, tránh vòng phụ thuộc module vì
`ProjectModule` đã `imports: [PropertyModule]`; gọi thẳng `this.prisma.project` — đúng
cách `buildDynamicLocationBlock` hiện gọi thẳng `this.prisma.location`). `limit: 5`
(không dùng chung `HOMEPAGE_TABS_PER_BLOCK=9`), tab cuối `{key:'xem-toan-bo',
title:'Xem toàn bộ', href:'/du-an', asLink:true}`. **`PropertyTabs.tsx` cần thêm prop
`asLink?: boolean`**: hiện nó hard-code `if (tab.id === 'khu-vuc-khac')` để render tab
cuối bằng `<Link>` thay vì nút — sửa **cộng thêm** `if (tab.asLink || tab.id ===
'khu-vuc-khac')`, giữ nguyên nhánh cũ (dây bảo hiểm), không xoá. Frontend thay khối grid
ảnh hiện tại (`page.tsx:206-245`) — **mất thumbnail dự án** khi ở bố cục tab, đúng yêu
cầu khách nhưng nên xác nhận lại khi demo.

**3.4 Menu ngang desktop** — tách hàm gom nhóm THUẦN từ
`frontend/src/hooks/useLocations.ts` sang `frontend/src/lib/locations/group.ts` (hook cũ
`import/export` lại, để `MobileMenu.tsx`/`SidebarFilter.tsx` không phải sửa dòng nào).
`layout.tsx` (server component) tự `fetch` `GET /locations` (cùng khuôn
`getPublicSettings()` dòng 94-101, **bắt buộc try/catch → `[]`** — một `throw` ở root
layout sập toàn site), gọi hàm gom nhóm, truyền kết quả xuống component mới
`DesktopNav.tsx` (`"use client"`) qua props. `groups.length === 0` **là nhánh mặc định**
⇒ giữ nguyên link phẳng `BĐS {tỉnh}` hiện tại (dòng 260); có nhóm ⇒ vẽ 3 dropdown, mỗi
mục `listingPath({ locationSlug })`. **Bẫy CSS**: `<nav>` (dòng 243) có
`overflow-x-auto` — dropdown `absolute` bên trong sẽ bị cắt cụt, phải bỏ class đó ở
nhánh có nhóm.

**3.5 Hai dropdown lọc xã trên trang quận/huyện** — **không** gọi thêm API: từ điển
`getLocationDictionary()` mà `[...slug]/page.tsx` đã fetch sẵn (mỗi entry có `name`,
`type`, và `parent` = urlSegment của cấp cha) đã đủ để lọc `WARD`/`OLD_WARD` theo đúng
quận đang xem — 0 round-trip thêm. Component mới `WardJumpSelects.tsx` (`"use client"`,
nhận `selects` qua props), `onChange` gọi `router.push(listingPath({locationSlug}))`
(URL landing thật, **không phải** `?ward=...` — query lạ sẽ bị 301 ở `SEO_MODE=enforce`
và sinh URL facet rác). `<option>` không phải `<a>` nên không crawlable — **cố ý**, để
không phát hàng trăm link nội bộ tới trang chưa có tin trên mỗi trang quận.

**3.6 `/khu-vuc` thêm phường/xã cũ** — `frontend/src/app/khu-vuc/page.tsx:28` nới điều
kiện để nhận cả `OLD_WARD`, tách 2 mục riêng trong từng quận ("Phường/xã mới" và
"Phường/xã cũ") cho khỏi lẫn.

---

### 3.7 🔴 Lỗi thiết kế trong chính code Phần A: khối "phường/xã cũ" gần như luôn rỗng

Phát hiện khi kiểm chứng dữ liệu thật (không có trong tài liệu khách):

`buildDynamicLocationBlock` cho khối `OLD_WARD` xếp hạng theo `Property.wardId`
(`property.service.ts:600`), nhưng `wardId` **chỉ được gán từ phường/xã MỚI** —
`resolveLocationIds()` (`frontend/src/components/LocationPicker.tsx:24-34`) lọc đúng
`type === 'WARD'`. Xã cũ được lưu ở `Property.oldWard` dạng **chuỗi tên, KHÔNG có FK**.

Đối chiếu DB Nghệ An: `wardId` trỏ WARD = **151 tin**, trỏ OLD_WARD = **3 tin** (sót lại
từ import xã cũ TP Vinh), trong khi **33 tin** có `oldWard` dạng chuỗi. ⇒ Khối này đếm
được 3/158 tin ⇒ với Hà Nội (DB trắng, form chỉ gán `wardId` = xã mới) nó sẽ **luôn rỗng
và tự ẩn**, tức mục 25.3 của khách coi như chưa làm.

**Cách sửa đề xuất — thêm FK `oldWardId` vào `Property`** (nullable, `onDelete: SetNull`,
đúng khuôn 3 FK địa điểm đã có):
- Migration thêm cột + index; `resolveLocationIds()` trả thêm `oldWardId`; form đăng tin
  và `ReviewModal` gửi kèm; `LOCATION_ID_FIELDS` trong `property-review.service.ts` thêm
  vào; `LOCATION_BLOCK_DEFS` đổi `groupField` của OLD_WARD sang `oldWardId`.
- Backfill 33 tin Nghệ An: khớp `oldWard` (chuỗi) + `districtId` → `Location` type
  OLD_WARD. **Phải khớp kèm quận** vì có 13 nhóm tên xã trùng nhau giữa các quận.
- Lợi ích kép: bộ lọc xã cũ ở mục 3.5 cũng hết lệ thuộc so khớp chuỗi
  (`property-utils.ts:558` đang dùng `equals ... mode: 'insensitive'` — gộp sai khi trùng tên).

*Không thêm cột thì phương án B là group theo chuỗi `oldWard`, nhưng sẽ gộp sai các xã
trùng tên khác quận ⇒ không nên.*

## 3b. Ghi nhận rủi ro — KHÔNG làm trong đợt này

DB Nghệ An còn **705 quận/huyện của 63 tỉnh khác** đang `isActive=true` (chỉ 33 dòng
thuộc Nghệ An + Hà Tĩnh). Site không hiện chúng vì `LocationService` lọc theo `path`,
nhưng `/admin/locations` liệt kê hết (kèm 2 dòng "Thành phố Vinh" trùng nhau đã phát hiện
hôm qua). **Không dùng `import-locations.ts` để dọn**: script hardcode chỉ đọc thư mục
`hanoi`, chạy trên DB Nghệ An sẽ tắt SAI toàn bộ dữ liệu Nghệ An. Cần một đợt riêng, có
sao lưu, nếu anh muốn dọn.

## 4. Thứ tự thực hiện

1. Soạn 2 file tài liệu (mục 1) → anh gửi câu hỏi cho khách.
2. Sửa lỗi lộ hotline Nghệ An (2.1) + script tạo admin (2.2) → deploy → anh đăng nhập được.
3. Cấu hình `SystemSettings` (2.3) + dữ liệu mẫu (2.4) → anh/khách xem được giao diện thật.
4. Bốn yêu cầu UI làm được ngay (3.2, 3.3, 3.4, 3.5) + đổi thứ tự khối (3.1 phần không
   chặn) — `tsc --noEmit` + `jest` sạch cả 2 workspace trước khi deploy.
5. Vá 3 gap hạ tầng (2.6) — ảnh hưởng cả 2 site nên deploy cả 2 nơi.
6. Gắn domain thật (2.5) khi anh trỏ xong DNS.
7. Thêm FK `oldWardId` (3.7) — có migration nên deploy riêng một nhịp, sao lưu trước,
   backfill 33 tin Nghệ An và kiểm lại số dòng.
8. Khi khách trả lời → chèn khối "khu vực hot" + các mục còn chặn.
9. Cập nhật memory dự án: domain `sanbdshanoi.vn`, VPS Hà Nội `222.255.214.136` (thay ghi
   chú cũ về IP `103.179.173.228` chưa xác nhận), và sửa lại bảng phân nhóm 3 cụm trong
   memory theo đúng bảng khách gửi (bảng tôi từng tự đề xuất bị lệch 6 quận).

## 5. Kiểm chứng

- **Nghệ An không đổi gì**: sau mỗi lần deploy, đối chiếu trang chủ vẫn đúng bố cục cũ
  (4 khối rời + 2 tab, menu ngang phẳng), số liệu DB không đổi (178 tin/41 user), test
  suite hiện có xanh (66 backend / 79 frontend).
- **Hà Nội**: đăng nhập `/admin` được · trang chủ hiện đủ 9 khối đúng thứ tự khách chốt ·
  menu ngang 3 dropdown đúng 10 quận/nhóm · trang 1 quận có 2 dropdown lọc xã và chọn thì
  nhảy đúng trang phường/xã · sitemap có URL landing sau khi có tin · `grep -i "nghệ
  an\|xứ nghệ\|0868126826"` trong HTML = 0.
- Đối chiếu lại từng mục PHẦN II với tài liệu, đánh dấu mục nào xong/chặn để báo khách.
