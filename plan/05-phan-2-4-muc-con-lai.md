# Plan: PHẦN II Hà Nội — 4 mục còn lại

**Cập nhật cuối:** CẢ 4 MỤC ĐÃ XONG, deploy + verify sạch trên cả 2 VPS.
- Mục 1, 2, 3: commit `9449036`.
- Mục 4 (FK `oldWardId`): commit `39bab56` + 2 fix cho script backfill
  (`226b39a` khớp thêm `shortName`, `3bc10bf` không phân biệt hoa/thường) — Nghệ An
  backfill 26/40 tin (2 dữ liệu rác + 11 "Khác" + 1 thiếu districtId, không tính là lỗi),
  Hà Nội 0/0 (chưa có tin dùng xã cũ). Verify end-to-end bằng 1 tin mẫu gắn "Mộ Lao"
  (Hà Đông) — khối `wards-old` xuất hiện đúng vị trí trên trang chủ Hà Nội sau khi cache
  60s hết hạn.

Còn lại ngoài phạm vi 4 mục này: khối "khu vực hot" (chờ khách trả lời), domain thật,
logo/favicon, GSC/GA/Meta Pixel, SePay token riêng — tất cả đã có trong
`plan/cau-hoi-2026-08-18.txt` gửi khách.

Tiếp nối `plan/04-phan-2-ha-noi.md` (đã commit trong repo). Plan này chỉ còn phần CHƯA
làm; các mục đã xong ghi ở Context để khỏi làm lại.

Repo `D:\An\web_bds_hanoi\bds-hanoi`, nhánh `main-hanoi`.
VPS Hà Nội `222.255.214.136` (`SITE_LAYOUT=grouped`, staging) · VPS Nghệ An
`14.225.255.128` (`nhadatxunghe.vn`, `classic`, **site thật — không được phá**).

---

## Context

Phiên trước đã hoàn thành và deploy lên **cả 2 VPS**:
- Cơ chế `sections[]` + biến runtime `SITE_LAYOUT` (`backend/src/property/homepage-layout.ts`)
  — Nghệ An đối chiếu với baseline: giống hệt, 178 tin không mất dòng nào.
- Bố cục `grouped` cho Hà Nội: quận → xã cũ → *(chỗ trống khu vực hot)* → xã mới →
  5 tab "Nhà đất bán" → Cho thuê → Dự án dạng tab (5 + tab "Xem toàn bộ").
- Tài khoản admin Hà Nội, dữ liệu mẫu (17 tin + 4 dự án), cấu hình thanh toán tạm.
- **2 bug thật ngoài kế hoạch**: hotline Nghệ An lộ trên site Hà Nội (đã sửa) và
  `CreatePropertyDto` thiếu `projectId` khiến tính năng gắn tin vào Dự án **chưa từng
  chạy** trên cả 2 site (đã sửa + deploy).
- Câu hỏi cho khách: `plan/cau-hoi-gui-khach-2026-08-18.txt` — anh **đã gửi**, đang chờ
  trả lời. Khối "khu vực hot" (mục 5 trang chủ) vẫn là builder stub `() => null`, đã đăng
  ký đúng vị trí trong `HOMEPAGE_LAYOUTS.grouped` nên khi có câu trả lời chỉ cần viết
  thân một hàm.

**Quy tắc anh đặt ra:** yêu cầu ở PHẦN II ⇒ **chỉ áp cho Hà Nội**; PHẦN I ⇒ cả 2 site.
Mục 1 và 2 dưới đây thuộc PHẦN II (đã đối chiếu vị trí dòng trong docx) ⇒ chỉ Hà Nội.
Mục 3 và 4 là bổ khuyết/sửa lỗi cho yêu cầu vốn đã có ⇒ áp cả 2 site.

---

## 1. Menu ngang desktop 3 dropdown (docx mục 26) — chỉ Hà Nội

Hiện `frontend/src/app/layout.tsx:243-273` là mảng link phẳng, mục khu vực chỉ có 1 link
`BĐS {tỉnh}` (dòng 260) kèm comment "P7 sẽ thay bằng 3 menu xổ… khi khách gửi bảng phân
nhóm" — bảng đó **đã có** và đã nằm trong DB (Hà Nội 30/30 quận có `Location.group`,
Nghệ An 0/738).

**Rẽ nhánh theo DỮ LIỆU, không cần cờ** — đúng cách `MobileMenu.tsx:57-77` đang làm và
đã chạy ổn trên cả 2 site: có `group` ⇒ vẽ 3 dropdown; không có ⇒ giữ nguyên link phẳng.

Việc cần làm:
1. Tách hàm thuần `groupLocations()` + `interface LocationNode` từ
   `frontend/src/hooks/useLocations.ts:4-35` sang `frontend/src/lib/locations/group.ts`;
   hook cũ **re-export** lại ⇒ `MobileMenu.tsx` và `SidebarFilter.tsx` không phải sửa dòng nào.
2. `layout.tsx` (server component) fetch `GET /locations` theo đúng khuôn
   `getPublicSettings()` (dòng 94-101) — **bắt buộc `try/catch` trả `[]`**, vì một
   `throw` ở root layout làm **mọi trang** của site trả 500.
3. Component mới `frontend/src/components/DesktopNav.tsx` (`"use client"`, nhận `groups`
   qua props): bọc nguyên nội dung `<nav>` hiện tại, thay đúng mục khu vực.
   `groups.length === 0` là **nhánh mặc định** (giữ link phẳng), dropdown là nhánh có
   điều kiện — để fetch lỗi cũng ra menu Nghệ An hiện tại chứ không ra menu trống.
4. **Bẫy CSS phải xử lý**: `<nav>` dòng 243 có `overflow-x-auto` — panel `absolute` bên
   trong sẽ bị **cắt cụt** (trông như "dropdown không mở"). Bỏ class đó ở nhánh có nhóm.
   Class `mask-edges` trên nav không được định nghĩa ở đâu (globals.css lẫn tailwind
   config đều không có) — class chết, bỏ luôn.
5. Dropdown: `useState` open, đóng khi click ngoài / `Escape` / chọn mục,
   `aria-expanded`/`aria-haspopup`, panel `grid-cols-2` cho 10 mục đỡ dài.

Không đụng `MobileMenu.tsx` (đã có nhóm) và `MobileSwipeMenu.tsx` (thanh cuộn mobile,
yêu cầu là menu **desktop**).

## 2. Hai dropdown lọc phường/xã trên trang quận/huyện (docx mục 25.5b, dòng 376-380) — chỉ Hà Nội

Trang `frontend/src/app/[...slug]/page.tsx` hiện **không có** phần chọn phường/xã.
Khách muốn: ngay dưới tiêu đề có `Xem tin theo xã/phường mới: [Tất cả ▼]` và
`Xem tin theo xã/phường cũ: [Tất cả ▼]`, chọn 1 mục thì nhảy tới trang tin của phường/xã đó.

**GATE KÉP — vừa cờ vừa dữ liệu**: chỉ hiện khi `SITE_LAYOUT === 'grouped'` **VÀ** đoạn
URL đang xem đúng là một `DISTRICT`. Không được suy thuần từ dữ liệu: TP Vinh (Nghệ An)
cũng là `DISTRICT` và cũng có `WARD` + `OLD_WARD` con (33 xã cũ đã import) ⇒ bỏ cờ thì
trang `/thanh-pho-vinh` tự mọc thêm 2 dropdown, phá luật "PHẦN II chỉ Hà Nội".

Việc cần làm:
1. `frontend/src/lib/site-layout.ts` — đọc `process.env.SITE_LAYOUT` (runtime, **không**
   `NEXT_PUBLIC_`), kèm comment cảnh báo rõ: chỉ dùng trong **server component**; gọi
   trong client component sẽ luôn ra `classic` mà **không báo lỗi gì**.
2. Component mới `frontend/src/components/WardJumpSelects.tsx` (`"use client"`, nhận
   `selects` qua props): 2 `<select>`, option đầu là "Tất cả", `onChange` gọi
   `router.push(...)`. Dùng lại `selectClass` của `LocationPicker.tsx:46`; mẫu hành vi
   gần nhất đã có sẵn là `SearchControls.tsx:74-79` (router.push trong onChange).
3. **0 request thêm** — `[...slug]/page.tsx:87` đã có `dict = await getLocationDictionary()`,
   mỗi entry có sẵn `{name, shortName, type, parent}` với `parent` = **urlSegment của
   cha** (backend `location.service.ts:174`), và dict chứa **cả WARD lẫn OLD_WARD**
   (không lọc theo type). Lọc: `Object.entries(dict).filter(([, i]) => i.parent === districtSlug && i.type === 'WARD')`
   — đúng khuôn `popularLocations` (dòng 177-180) đang dùng.
4. Xác định quận đang xem: `dict[route.locationSlug]` → `type === 'DISTRICT'` thì
   districtSlug chính là nó; nếu đang ở trang phường/xã (`WARD`/`OLD_WARD`) thì
   districtSlug = `.parent` và **giá trị đang chọn của dropdown = `route.locationSlug`**
   ⇒ giữ được ngữ cảnh khi người dùng đã nhảy vào một phường. `dict` trả `{}` khi API
   lỗi (`locations.ts:33,35-38`) nên phải chịu được rỗng → không render gì, không crash.
5. **Điều hướng: THAY THẾ đoạn khu vực, KHÔNG lồng 2 cấp.**
   `listingPath({ transaction: route.transaction, propertyTypeSlug: route.propertyTypeSlug, locationSlug: wardSlug })`.
   Lý do bắt buộc: `route.ts:161,180` **reject** URL khu vực 2 đoạn
   (`/{quận}/{phường}` → `legacy-too-deep`) ⇒ lồng vào là ra trang lỗi. Chọn "Tất cả"
   thì quay về `locationSlug: districtSlug`. Tuyệt đối không dùng `?ward=...`:
   `CANONICAL_FILTER_KEYS` (`canonical.ts:18-26`) không có `ward`, sẽ bật
   `hasNonCanonicalQuery` → 301/noindex ở `enforce` và sinh URL facet rác.
6. Chèn vào `page.tsx` giữa dòng 209 (hết khối `<h1>` + `ShareButtons`) và 211
   (`<div className="mb-8">` bọc `SearchForm`) — nằm ngoài layout 2 cột nên chiếm đủ
   chiều ngang, đúng "ngay dưới tiêu đề" khách mô tả.
7. `<option>` không phải `<a>` nên không crawlable — **cố ý**: đổ 579 xã cũ thành link
   trên mỗi trang quận sẽ phát hàng trăm link nội bộ trỏ vào trang chưa có tin.

## 3. `/khu-vuc` phải liệt kê cả phường/xã cũ (docx mục 25.2) — cả 2 site

`frontend/src/app/khu-vuc/page.tsx:28` lọc `info.type !== 'WARD'` ⇒ bỏ hết 579 OLD_WARD
của Hà Nội (và 113 của Nghệ An). Khách yêu cầu anchor *"Xem toàn danh sách tin đăng theo
phường, xã **cũ và mới**"* trỏ vào trang này. Tách thành 2 Map (`wardsByDistrict` +
`oldWardsByDistrict`), render 2 mục có nhãn riêng trong mỗi quận (sau block `wards`
kết thúc ở dòng 81), chip xã cũ đổi màu cho dễ phân biệt — tham khảo
`admin/locations/page.tsx:123` đang dùng `bg-orange-100 text-orange-700` cho OLD_WARD.

**Sửa kèm (cùng file, cùng bản chất lỗi)**: link đang viết thô `/${ward.slug}` và
`/${district.slug}` thay vì `listingPath({ locationSlug })` ⇒ khi Hà Nội bật
`SEO_MODE=enforce` (đã chốt) thì **mọi link trên trang này trỏ vào một 301**. Đổi sang
`listingPath()` — đúng nguyên tắc "link nội bộ không bao giờ trỏ vào 301" đã áp ở nơi khác.

Đây là **bổ khuyết cho đúng yêu cầu sẵn có**, không phải đổi bố cục ⇒ áp cả 2 site.

## 4. 🔴 FK `oldWardId` — sửa khối "phường/xã cũ" gần như luôn rỗng

Đã kiểm chứng bằng dữ liệu thật (không có trong tài liệu khách):
`LOCATION_BLOCK_DEFS` xếp hạng khối OLD_WARD theo `Property.wardId`, nhưng `wardId`
**chỉ được gán từ phường/xã MỚI** (`resolveLocationIds()` trong
`frontend/src/components/LocationPicker.tsx:24-34` lọc đúng `type === 'WARD'`). Xã cũ lưu
ở `Property.oldWard` dạng **chuỗi tên, không FK**.
Số liệu Nghệ An: `wardId`→WARD **151 tin**, →OLD_WARD **3 tin**, trong khi **33 tin** có
`oldWard` chuỗi. Hà Nội (DB mới) thì khối này **luôn rỗng** ⇒ mục 25.3 của khách coi như
chưa làm — đúng như quan sát trên site: `sections` hiện chỉ có `districts` + `wards-new`.

Việc cần làm:
1. Migration thêm `Property.oldWardId String?` + quan hệ `onDelete: SetNull` + `@@index`,
   đúng khuôn 3 FK địa điểm đã có (`schema.prisma` dòng 31-36, 129-131).
2. `resolveLocationIds()` (`LocationPicker.tsx:24-34`) trả thêm `oldWardId` — khớp
   `type === 'OLD_WARD'` theo `value.oldWard`. Nhờ đó `ReviewModal` **tự động** gửi kèm
   (nó đã `Object.assign(out, location, ids)`, dòng 69-70), chỉ form đăng tin
   (`app/post/page.tsx:323`) phải thêm vào payload. Rồi thêm `'oldWardId'` vào
   `allowedKeys` của `normalizePropertyPayload` (`property-utils.ts:258-302`), vào
   `CreatePropertyDto`, và vào `LOCATION_ID_FIELDS` (`property-review.service.ts:56`).
3. `LOCATION_BLOCK_DEFS` đổi `groupField` của khối OLD_WARD sang `oldWardId`.
4. Script backfill `backend/src/scripts/backfill-old-ward-id.ts` (dry-run + `--apply`,
   đúng khuôn các script sẵn có): khớp `oldWard` (chuỗi) **kèm `districtId`** → Location
   type OLD_WARD. Bắt buộc khớp kèm quận vì có 13 nhóm tên xã trùng nhau giữa các quận.
5. Lợi ích kép: bộ lọc xã cũ hết lệ thuộc so khớp chuỗi (`property-utils.ts:558` đang
   dùng `equals … mode:'insensitive'` — gộp sai khi trùng tên).

Deploy **một nhịp riêng** vì có migration: sao lưu trước, `RUN_MIGRATIONS=true` đúng một
lần rồi trả `false`, đối chiếu số dòng sau khi chạy.

---

## Thứ tự thực hiện

1. Mục 3 (`/khu-vuc`) — nhỏ, thuần frontend, làm trước cho gọn.
2. Mục 1 (menu desktop) — độc lập hoàn toàn.
3. Mục 2 (2 dropdown lọc xã) — phụ thuộc `lib/site-layout.ts` tạo ở bước này.
4. `tsc --noEmit` + `jest` sạch cả 2 workspace → commit → deploy **Nghệ An trước**
   (kỳ vọng: menu vẫn phẳng, trang quận **không** có dropdown, chỉ `/khu-vuc` có thêm mục
   xã cũ) → rồi Hà Nội.
5. Mục 4 (`oldWardId`) — nhịp deploy riêng vì có migration.

## Kiểm chứng

- **Nghệ An không đổi**: `curl` trang chủ đối chiếu `sections` với bản hiện tại; header
  vẫn là link phẳng `BĐS Nghệ An`, **không** có "Trung tâm"; `/thanh-pho-vinh` **không**
  có `<select>` nào; 178 tin/41 user không đổi; test suite xanh.
- **Hà Nội**: header có đúng 3 dropdown, tổng 30 quận không trùng/thiếu, panel **không bị
  cắt** (kiểm bằng mắt vì đây là bẫy CSS đã biết); `/cau-giay` có 2 dropdown ngay dưới
  H1, chọn 1 mục nhảy đúng URL phường/xã và **không có dấu `?`** trong URL đích;
  `/khu-vuc` hiện cả xã mới lẫn xã cũ.
- **Sau mục 4**: khối "Bất động sản theo phường, xã cũ" xuất hiện trên trang chủ Hà Nội
  (`sections` có `wards-old`); Nghệ An backfill đúng 33 tin, không tin nào mất `oldWard`.
- Thêm test: `lib/locations/group.spec.ts` (30 quận → 3 nhóm đúng thứ tự; toàn NULL → `[]`)
  và `lib/site-layout.spec.ts`. **Phải mở rộng `frontend/jest.config.js` `roots` từ
  `src/lib/seo` sang `src/lib`** (hiện test ngoài `src/lib/seo` sẽ không chạy).
