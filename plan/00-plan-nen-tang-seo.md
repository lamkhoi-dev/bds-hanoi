# Plan: Nền tảng + toàn bộ SEO cho site BĐS Hà Nội

Repo: `D:\An\web_bds_hanoi\bds-hanoi` (clone từ `main` của Website-BDS, `origin` để trống chờ repo mới, `upstream` trỏ về repo Nghệ An).

---

## Context

Khách muốn nhân bản `nhadatxunghe.vn` (Nghệ An) thành một site BĐS Hà Nội. Tài liệu `bds_doc` chia 2 giai đoạn: PHẦN I sửa/nâng cấp codebase hiện tại, PHẦN II nhân bản. Kèm theo là 41 mục SEO cần sửa và 265 URL bị Google từ chối lập chỉ mục.

Đã chốt: **đợt này làm Nền tảng + toàn bộ SEO**, deploy lên **server mới làm production Hà Nội**, và **`/ban` là URL danh sách chính** (301 `/tat-ca` và `/toan-bo-tin` về đó).

Quyết định "production Hà Nội" kéo theo một hệ quả bắt buộc: **phải nhập dữ liệu hành chính Hà Nội và gỡ toàn bộ hard-code Nghệ An ngay trong đợt này**. Nếu không, site mới là bản sao nội dung của nhadatxunghe.vn trên một domain khác — Google sẽ phạt trùng lặp **cả hai** site. Vì vậy phần "CSDL hành chính" vốn thuộc PHẦN II được kéo lên đợt này (P3).

Kết quả mong đợi: một codebase deploy được lên VPS mới, chạy dữ liệu Hà Nội, sạch các lỗi SEO kỹ thuật, và URL rác không còn sinh trang index được.

---

## Phạm vi

**Trong phạm vi:** hạ tầng deploy · sửa encoding · slug tin tức · site config tập trung · robots/canonical · structured data + breadcrumb · model Location + import Hà Nội · quyết định index/noindex/404 · phân trang · redirect 301 · sitemap · gỡ hard-code Nghệ An.

**Ngoài phạm vi (đợt sau):** redesign card tin & bố cục trang chủ · popup tìm kiếm/lọc · thống nhất công thức giá/m² · model Dự án · quy trình duyệt tin 2 chiều.

**Chặn bởi khách (thiết kế để không phải làm lại):** URL phường/xã phẳng hay lồng (B3) — ship phẳng, schema hỗ trợ cả hai · 26 tên "khu vực hot" không phải đơn vị hành chính (A4) · phân nhóm menu Trung tâm/Ngoại thành (B1) · domain chính thức (C1).

---

## Phát hiện then chốt định hình plan

| # | Phát hiện | Hệ quả |
|---|---|---|
| 1 | `prisma db seed` (`backend/package.json` → `prisma/seed.ts:23`) mở đầu bằng `location.deleteMany()`; mọi FK là `onDelete: SetNull` | Một lệnh `prisma migrate reset` xoá sạch Location và null hoá `Property.locationId`. **Gỡ ngay ở P0.** |
| 2 | `GET /locations/seed-hatinh` — GET không xác thực nhưng **ghi DB** | Xoá ở P0 |
| 3 | Docker build context là `./frontend` và `./backend` riêng biệt, dù root khai npm workspaces | **Không thể** dùng package dùng chung. Frontend giữ toàn bộ logic quyết định SEO; backend chỉ cung cấp dữ liệu |
| 4 | `data.total` **đã có sẵn** trong response `/properties/seo` (`property.service.ts:474`), frontend chỉ chưa đọc | Phân trang đúng + luật "≥1 tin ⇒ index" không cần đổi backend |
| 5 | Slug Location toàn cục `@unique`, mà dữ liệu Hà Nội có **125 nhóm trùng, chạm 275/736 dòng (37%)**. Khoá `(parentId, slug)` còn 76 trùng; `(parentId, type, slug)` chỉ còn **1** (Thị trấn Yên Viên vs Xã Yên Viên, Gia Lâm) | Khoá bắt buộc là `(parentId, type, slug)` + cột `urlSegment` toàn cục riêng |
| 6 | Sheet `All phường xã mới` có **dòng header lặp giữa bảng** (dòng 54) và cột quận là **ô merge** | Parser lọc theo cột số thứ tự, không theo số dòng |
| 7 | Tên phường/xã **không nhất quán tiền tố**: 79/126 xã mới không có tiền tố, 181/579 xã cũ không có | Lưu cả `name` (nguyên văn) và `shortName` (đã bỏ tiền tố); slug từ `shortName` |
| 8 | `Property.updatedAt` là `@updatedAt`, mà `incrementView()` gọi `prisma.property.update()` | **Mỗi lượt xem trang đẩy `lastmod`** — đúng lỗi khách báo. Cron VIP hàng giờ cũng vậy |
| 9 | `offers.price = property.price \|\| 0` mà form đăng tin chỉ bắt buộc `priceRangeKey` | **Mọi tin "thoả thuận" phát `price: 0`** |
| 10 | `Breadcrumb.tsx` tồn tại nhưng **không nơi nào render**; có 4 bản logic breadcrumb rời rạc; component hard-code `https://website-bds.com` | Hồi sinh 1 bản, xoá 3 bản chết |
| 11 | `/tin-tuc` là **trang danh sách trùng thứ 3** (`next.config.mjs:50` rewrite + `app/tin-tuc/page.tsx` redirect, rewrite thắng) | Gộp cùng đợt với `/tat-ca`, `/toan-bo-tin` |
| 12 | `proxy.ts` matcher `['/user/:path*']` nuốt cả trang hồ sơ **công khai** `/user/[slug]` → Googlebot nhận 307 về `/login` | Tách namespace `/tai-khoan/` |
| 13 | Mojibake trong `property.service.ts` — 32 dòng, 21 là thông báo cho user. Bộ lọc từ cấm mặc định hỏng nên **"lừa đảo"/"phản động" không bị lọc**. Commit `c31691c` là bản sạch cuối | Khôi phục có đối chiếu, không đoán |
| 14 | `prisma` là devDependency, bị `npm prune --omit=dev` trong Dockerfile; `start.sh` không chạy migration | Migration đang làm tay. Phải chốt cách chạy trước khi deploy |
| 15 | Chưa có `app/not-found.tsx`; `/news/hello` 500 là do backend trả `null` → frontend `res.json()` ném → `error.tsx` bắt | Sửa ở backend + thêm not-found |

---

## P0 — Nền tảng & an toàn (không đổi URL nào)

Đã làm sẵn trong repo mới (chưa commit): khôi phục `backend/start.sh`, gỡ 2 file Firebase private key + chuyển sang env `FIREBASE_SERVICE_ACCOUNT`, xoá `extract_test/` (201 file) và 2 file env chết, siết `.gitignore`, thêm `WORKDIR /app` thiếu ở stage runtime của `backend/Dockerfile`.

Còn lại:

1. **Gỡ bẫy xoá dữ liệu** — bỏ khoá `prisma.seed` trong `backend/package.json` và cắt khối location khỏi `backend/prisma/seed.ts:23-160`.
2. **Xoá `GET /locations/seed-hatinh`** — `backend/src/location/location.controller.ts:13-16` + `location.service.ts:29-63`.
3. **Sửa mojibake** `backend/src/property/property.service.ts` — 32 dòng, đối chiếu với `git show c31691c:backend/src/property/property.service.ts`. Gồm danh sách từ cấm mặc định ở dòng 331 và 1060.
4. **Slug tin tức** — `backend/src/news/news.service.ts:8-13` import `slugify` từ `property-utils.ts:139-153` thay vì regex tự chế; thêm xử lý trùng; `update()` sinh lại slug khi đổi tiêu đề; script backfill slug cũ + bảng alias để 301 (dùng chung cơ chế ở P5).
5. **404 thật** — `NewsController.findOne` ném `NotFoundException`; thêm `frontend/src/app/not-found.tsx`.
6. **`incrementView` dùng `$executeRaw`** — `backend/src/property/property-interaction.service.ts:149-154`, để lượt xem không đẩy `updatedAt`.
7. **Chạy migration khi deploy** — chuyển `prisma` sang `dependencies`, thêm `npx prisma migrate deploy` vào `backend/start.sh` sau cờ `RUN_MIGRATIONS`.
8. **Siết `docker-compose.vps.yml`**: trả healthcheck `pg_isready` về postgres (đang nằm nhầm ở caddy, exit 127, unhealthy 96k lần) · healthcheck backend đổi `http://127.0.0.1:4000/api/v1/health` (đang sai path và `localhost`→`::1`) · thêm `restart: always` cho postgres · bỏ publish cổng 4000/9000/9001 ra ngoài, chỉ bind `127.0.0.1` · `REDIS_ENABLED=true` (Redis đang chạy nhưng vô dụng, refresh token nằm in-memory nên restart là logout toàn bộ user) · thay 5 chỗ hard-code `https://nhadatxunghe.vn` bằng `${SITE_DOMAIN}` · `Caddyfile` dùng `{$SITE_DOMAIN}`.

**Kiểm chứng:** `docker compose -f docker-compose.vps.yml config --quiet` · `docker ps` không còn `(unhealthy)` · grep `\uFFFD` trong `backend/src` trả 0 · tạo tin tức tiêu đề `"Thông qua hồ sơ điều chỉnh"` ra slug `thong-qua-ho-so-dieu-chinh`.

---

## P1 — Site config tập trung + robots/canonical (không đổi URL)

1. **`frontend/src/lib/site-config.ts`** — một nguồn duy nhất cho `url`, `name`, `province`, `contact`, `isStaging`, `absolute(path)`. Thay 5 biểu thức env khác nhau (`layout.tsx:25`, `robots.ts:4`, `sitemap.ts:10`, `tin/[slug_id]/page.tsx:31`) và 2 domain hard-code (`[...slug]/page.tsx:187` → `nhadatxunghe.vn`; `Breadcrumb.tsx:20,26` → `website-bds.com`).
2. **`backend/src/shared/site-config.ts`** đọc `FRONTEND_URL`; sửa `mail.service.ts:40,66` đang hard-code `support@nhadatxunghe.vn`.
3. **Chuẩn hoá canonical tương đối** ở mọi nơi, để `metadataBase` (`layout.tsx:34`) tự resolve. Bổ sung canonical còn thiếu: `/search`, `/news`, `/news/[slug]`, `/user/[slug]`, `/khu-vuc`, `/support/*`.
4. **`robots: {index:false, follow:true}`** cho `/search`, `/so-sanh`, `/map`, `/post`, `/user/(dashboard)/*`.
5. **`robots.txt`** (`app/robots.ts:22`) thêm `/tai-khoan/`, `/so-sanh`, `/post`, `/api/`. **Không** disallow `/search` hay landing rỗng — bị chặn crawl thì Google không đọc được thẻ `noindex`, URL sẽ kẹt trong index vĩnh viễn.
6. **`React.cache()`** quanh hàm fetch SEO — hiện `getSeoMetadataTexts` chạy 2 lần mỗi request (`[...slug]/page.tsx:180` và `:236`).
7. **Env plumbing**: `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_PROVINCE_NAME`, `NEXT_PUBLIC_PROVINCE_SLUG`, `SITE_DOMAIN` vào `.env.example`, `.env.prod.example` và compose ở **cả `args:` lẫn `environment:`** (`NEXT_PUBLIC_*` bake lúc build). Cập nhật `next.config.mjs:12,25`.

**An toàn nhân bản:** giữ nhánh `isStaging` sẵn có trong `robots.ts:6-16`. Deploy lần đầu đặt `NEXT_PUBLIC_APP_ENV=staging` → noindex toàn site, chỉ gỡ khi đã có dữ liệu Hà Nội + domain chốt. Đây là chốt chặn chống trùng nội dung với nhadatxunghe.vn.

**Kiểm chứng:** grep `nhadatxunghe\|website-bds` trong `frontend/src` = 0 · `curl -s https://<host>/robots.txt` · xem `<link rel=canonical>` trên 6 loại trang.

---

## P2 — Structured data + breadcrumb (không đổi URL)

1. **`frontend/src/lib/seo/schema/`** — `organization.ts`, `website.ts` (kèm `SearchAction` trỏ `/search?q=`, route đã nhận `q`), `breadcrumb.ts`, `listing.ts`, `itemList.ts`, `article.ts`. Thêm `components/JsonLd.tsx` gom việc escape `<`/`>` đang lặp ở `tin/[slug_id]/page.tsx:149-161`. Phát **một `@graph`** mỗi trang.
2. **Organization + WebSite đặt ở `app/layout.tsx`**, không phải trang chủ — để mọi trang dùng chung.
3. **`buildOffer(property)` — không bao giờ phát `price: 0`:**
   - có `price > 0` → `Offer.price`
   - có `priceMin/priceMax` hoặc suy được từ `priceRangeKey` → `priceSpecification` với `minPrice`/`maxPrice`, **không** có `Offer.price`
   - `THOA_THUAN` hoặc không suy được → bỏ hẳn thuộc tính giá

   Thêm `getPriceRange(key, transactionType)` vào `frontend/src/constants/ranges.ts` cạnh `getPriceLabel`. `LT_500M` chỉ có `maxPrice`, `GT_20B` chỉ có `minPrice`.
4. **Làm giàu `RealEstateListing`**: `datePosted` dùng `publishedAt` (đang dùng `createdAt`), thêm `floorSize`, `numberOfRooms`, `address: PostalAddress`, `geo` **chỉ khi `isExactLocation`**, `image` là cả mảng `imageObjects`.
5. **Hồi sinh `Breadcrumb.tsx`**: bỏ `"use client"`, dùng `siteConfig.absolute()`, tách phần JSON-LD sang `buildBreadcrumbList` để `<nav>` và graph dùng **chung một mảng items**. Yêu cầu "phần tử cuối chỉ text" đã có sẵn qua prop `url?` và nhánh `isLast` ở `:48-50`.
6. **`frontend/src/lib/seo/breadcrumb-items.ts`**: `listingBreadcrumb(property, ancestors)` dựng **từ `wardId/districtId/provinceId` của chính tin**, không từ URL giới thiệu — nhờ vậy yêu cầu "tin mở từ trang lọc không kế thừa đoạn lọc" thoả mãn tự nhiên. `landingBreadcrumb(route, location)` dừng ở cấp sâu nhất có mặt. Cấp thiếu thì **lược bỏ**, không để trống.
7. Render `<Breadcrumb>` ở 2 nơi đã import sẵn, xoá 3 bản chết (`tin/[slug_id]/page.tsx:118-143`, `PropertyDetailClient.tsx:372-376`, `[...slug]/page.tsx:242-248`).
8. **Migration `Property.contentUpdatedAt`** + backfill `= updatedAt`, chỉ set ở đường create/update/đổi trạng thái. Sitemap dùng `contentUpdatedAt ?? publishedAt ?? createdAt`. Đây mới là bản vá bền cho lỗi `lastmod` (P0 mục 6 chỉ chặn lượt xem, còn cron VIP và like/click vẫn đẩy `updatedAt`).

**Kiểm chứng:** dán URL tin "thoả thuận" vào Rich Results Test — không còn `price: 0`, không lỗi Offer · breadcrumb hiện đủ cấp trên cả trang tin lẫn trang danh mục.

---

## P3 — Model Location + dữ liệu Hà Nội

### Schema (`backend/prisma/schema.prisma:278-298`)
```prisma
enum LocationType { CITY DISTRICT WARD OLD_WARD }

model Location {
  id String @id @default(uuid())
  name         String        // nguyên văn: "Phường Hoàn Kiếm", "Ba Vì"
  shortName    String        // bỏ tiền tố: "Hoàn Kiếm", "Ba Vì"
  type         LocationType
  parentId     String?
  slug         String        // theo cha: "hoan-kiem", "yen-hoa"
  urlSegment   String @unique // đoạn URL toàn cục: "cau-giay", "cua-nam-cu"
  path         String        // "ha-noi/cau-giay/yen-hoa"
  depth        Int    @default(0)
  sortOrder    Int    @default(0)
  externalRef  String?       // số thứ tự nguồn, để import lại idempotent
  isActive     Boolean @default(true)
  isFeatured   Boolean @default(false)
  isSeoEnabled Boolean @default(false)
  @@unique([parentId, type, slug])
  @@index([path]) @@index([type, isActive]) @@index([type, isFeatured]) @@index([parentId, type, sortOrder])
}
```
`urlSegment` phục vụ URL phẳng, `path` phục vụ URL lồng — **cùng một importer sinh cả hai**, nên khi khách chốt B3 chỉ là đổi routing, không phải migrate lại.

### Migration — 3 bước, SQL viết tay
- **M1** thêm cột (nullable/có default). Deploy, app không đổi.
- **M2** script backfill cho dữ liệu Nghệ An/Hà Tĩnh hiện có. **Nạp trước tập `used` từ các `slug` đã có** để URL đang được Google index không bị đổi.
- **M3** ràng buộc, trong 1 transaction: chuẩn hoá `type` (tiền kiểm `SELECT DISTINCT type` — `sync-locations.ts:38` có dò khoá `PROVINCE`) → cast enum → `DROP INDEX Location_slug_key` → `SET NOT NULL` → tạo 2 unique index. Có guard fail nếu còn NULL hoặc trùng `urlSegment`.

Rủi ro chính: `backend/scripts/seed_nghe_an.js` dùng `findUnique` trên `slug` — xoá/archive cùng PR.

### Importer — 2 tầng
- **`backend/src/scripts/extract-locations-xlsx.ts`** (chạy ở máy dev, nhận đường dẫn file) → sinh `backend/prisma/data/hanoi/locations.hanoi.json`, `featured.hanoi.json`, `conflicts.hanoi.json` **commit vào git**. Khi khách gửi dữ liệu sửa, diff PR cho thấy đúng phường nào đổi trước khi động vào production.
- **`backend/src/scripts/import-locations.ts`** đọc JSON và upsert. **Đặt trong `src/scripts/`** vì `backend/Dockerfile` chỉ copy `dist`, `node_modules`, `package*.json`, `prisma` — script trong `backend/scripts/` sẽ không bao giờ vào image, và `ts-node` đã bị prune. Chạy: `docker compose exec backend node dist/scripts/import-locations.js`.

**Luật parse** (đã kiểm chứng trên XML thật): tra sheet theo tên đã chuẩn hoá dấu (tên tab lệch dấu: `phường xa mới hot`) · forward-fill cột quận (ô merge) · **loại dòng nào cột số thứ tự không phải số** — cách này bỏ được cả 2 dòng header mà không hard-code số dòng · khoá join quận = bỏ tiền tố + bỏ dấu → 30↔30 khớp tuyệt đối · **tên quận hiển thị lấy từ bảng 30 dòng khai trong script**, không lấy từ sheet (tránh `Tây hồ` thắng `Tây Hồ`) · lấy danh sách quận từ 2 sheet "All…", **không** từ sheet `quận huyện` (sheet này chỉ có 27, thiếu Phúc Thọ/Thạch Thất/Sơn Tây) — sheet đó chỉ dùng để gán `sortOrder`.

**Sinh `urlSegment`** theo thứ tự cố định CITY → DISTRICT → WARD → OLD_WARD, nạp trước tập `used` từ DB: WARD `base` → `phuong-{base}` → `{base}-{quận}` → `-N`; OLD_WARD `base` → `{base}-cu` → `{base}-{quận}-cu` → `-N`. Mô phỏng trên 736 node cho **736/736 duy nhất**, không sinh chuỗi xấu kiểu `hoan-kiem-hoan-kiem`.

**Hot list → `isFeatured`**: khớp new-hot chỉ với `WARD`, old-hot chỉ với `OLD_WARD` (khớp chéo nguy hiểm: `Thanh Xuân` cũng là OLD_WARD ở Sóc Sơn). **Xoá cờ cũ trước khi set**, nếu không bỏ tên khỏi sheet sẽ không bao giờ mất khỏi trang chủ. `Vạn Phúc` và `Minh Khai` mơ hồ (3 quận) → ghi `conflicts.hanoi.json`, **không đoán**.

**Idempotent**: `upsert` theo `(parentId, type, slug)`, **không bao giờ `deleteMany`**. Dòng có trong DB mà không có trong file → `isActive = false`, không xoá (có thể đang được `Property.wardId` tham chiếu).

### Thu hẹp về một tỉnh
`ACTIVE_PROVINCE_SLUG=ha-noi`. Dữ liệu toàn quốc do `sync-locations.ts` để lại → **soft-deactivate** (`isActive=false` cho `path NOT LIKE 'ha-noi/%'`), không xoá cứng. Đây chính là bản vá cho lỗi "xã tỉnh khác lọt vào bộ lọc". Backup bằng `backend/scripts/db-backup.js` trước.

### API resolve + tên hiển thị
`GET /locations/resolve?segment=` (404 khi không có, trả `{name, shortName, type, ancestors[], redirectTo?}`) · `GET /locations/segments` (từ điển phẳng ~736 mục cho frontend) · `GET /locations/tree` · `GET /locations/sitemap`. Cache 2 tầng: `Map` in-process nạp lúc boot (~200KB, O(1), miễn nhiễm Redis lạnh) + Redis TTL 24h. Invalidate ở `AdminService.create/update/deleteLocation` và cuối importer — **thêm cả `getHotLocations` và `getHomepageProperties`** đang cache mà không có hook invalidate.

Sửa luôn `GET /locations` hiện chỉ áp filter `parent.name` khi có tham số `city`, nên gọi trống là trả **mọi quận toàn quốc** — gốc của lỗi trùng quận ở `SidebarFilter`.

### Xoá được nhờ P3
`formatSlugToName` (`[...slug]/page.tsx:19-90`, thủ phạm "phường Truong Vinh") · `LOCATION_SLUGS` (`property-utils.ts:104-111`) · `fallbackWards` + slugify nội tuyến (`property.service.ts:519,538-539`) · slugify nội tuyến trong `FavoriteTags.tsx:47` · `popularLocations` (`[...slug]/page.tsx:250-259`).

**Kiểm chứng:** import vào DB scratch → đếm đúng 1 CITY + 30 DISTRICT + 126 WARD + 579 OLD_WARD, 736 `urlSegment` duy nhất, 28 + 30 `isFeatured` · chạy lại lần 2 ghi 0 dòng · `GET /locations/resolve?segment=yen-hoa` trả `"Phường Yên Hòa"` đúng dấu.

---

## P4 — Hàm quyết định index + routing

Thư mục mới `frontend/src/lib/seo/`: `taxonomy.ts` (từ vựng URL duy nhất) · `route.ts` (`parseListingPath`, thuần & đồng bộ) · `indexability.ts` (`decideIndexability`, thuần & đồng bộ) · `facts.ts` (nơi duy nhất có I/O, bọc `React.cache()`) · `canonical.ts` · `copy.ts` (thay `getSeoMetadataTexts`, nhận tên đã resolve).

Thuần & đồng bộ là tính chất chịu lực: `generateMetadata`, thân trang và bộ sinh sitemap gọi cùng một hàm, không tốn network, unit-test được.

### Bảng luật (thứ tự có hiệu lực)
| # | Điều kiện | Kết quả |
|---|---|---|
| 1 | `parseListingPath` → reject | **404** |
| 2 | → redirect (alias, dạng cũ, chữ hoa) | **301** |
| 3 | có `locationSlug` mà resolve không ra | **404** |
| 4 | location có `redirectTo` hoặc `!isActive` | **301** về kế nhiệm / tổ tiên còn active |
| 5 | query không chuẩn (`page=1`, `page=abc`, `limit=`…) | **301** về canonical |
| 6 | `page > totalPages` | **404** |
| 7 | có bộ lọc (giá/diện tích/hướng/sort) | **200 + `noindex,follow`**, canonical về URL không lọc |
| 8 | `total === 0` | **200 + `noindex,follow`**, ngoài sitemap |
| 9 | `page > 20` | **200 + `noindex,follow`** |
| 10 | còn lại | **200 + index**, canonical tự trỏ, vào sitemap |

Luật 6 chọn **404** thay vì noindex: 151 URL "đã phát hiện – chưa index" chính là dạng này; `noindex` 200 giữ chúng trong hàng đợi crawl mãi mãi, 404 thì loại hẳn. Ngoại lệ: trang 1 của facet rỗng phải giữ 200+noindex để luật 8 tự lật lại được.

**Tự động lật sang index**: `[...slug]` vốn `force-dynamic`, luật 8/10 đọc `facts.total` mỗi request nên tin vừa duyệt là lần crawl kế tiếp thấy `index` ngay. Phía sitemap trễ bằng TTL cache (15 phút) + push-invalidate từ đường duyệt/tạo/xoá tin.

### Chặn URL rác trong `parseListingPath`
Độ sâu 1–3 đoạn · mỗi đoạn khớp `^[a-z0-9]+(?:-[a-z0-9]+)*$` — **một luật này giết sạch** `$`, `&`, `%24`, `..`, chữ hoa, gạch nối kép · đoạn ≤ 64 ký tự, path ≤ 160 · danh sách đoạn đầu dành riêng (`sitemap`, `robots.txt`, `api`, `_next`, `tin`, `news`, `search`, `user`, `admin`, `post`, `map`, `so-sanh`, `khu-vuc`, `support`, `toan-bo-tin`, `tat-ca`…) — thay luôn cái hack `notFound()` ở `[...slug]/page.tsx:214-221` · ngữ pháp theo vị trí `[giao-dịch]`, `[giao-dịch, loại]`, `[giao-dịch, khu-vực]`, `[giao-dịch, loại, khu-vực]`.

### Gộp 2 whitelist danh mục
Backend đúng: không có enum `NHA_MAT_PHO`. Nên `nha-mat-pho` thành **alias của** `nha-rieng` (301) — đánh thẳng vào nhóm 51 URL "trùng lặp, chưa chọn canonical". `biet-thu` là loại riêng (enum có), backend thiếu ở `:1414` — lỗi này biến mất khi backend thôi parse slug.

**`cho-thue` thôi là danh mục, thành đoạn giao dịch.** Đây là gốc của `isRent = false` hard-code ở `:96` sinh title "Bán cho thuê Nghệ An" trên ~800 URL sitemap. Theo ngữ pháp mới, `/cho-thue/{khu-vuc}` **vẫn hợp lệ** — chỉ sửa nội dung title/H1, **không cần redirect** 800 URL đó.

### Backend thôi quyết định
`/properties/seo` nhận giá trị đã resolve (`transactionType`, `propertyType`, `locationId`, `page`, `limit`) thay vì slug. Xoá `property.service.ts:1405-1433`: đường degrade âm thầm sang full-text (`filters.q`), whitelist danh mục thứ hai, dò `toan-quoc`. Chỉ có **1 caller** (`[...slug]/page.tsx:199`) nên thay đổi gọn; nhận song song 2 dạng tham số trong 1 release rồi xoá nhánh cũ.

### Phân trang
Không cần đổi API — `data.total` đã có. `totalPages = ceil(total/limit)`. Sửa `[...slug]/page.tsx:361` từ heuristic `normals.length === limit` sang `page < totalPages` (cũng hết lỗi lệch 1 khiến trang cuối vẫn hiện "Trang sau"). Bỏ `...resolvedSearchParams` ở `:356,362` (đang nhân bản mọi tham số rác vào link phân trang), thay bằng `buildPageUrl`. `rel=prev/next` phải phát bằng thẻ `<link>` thô trong thân trang — Metadata API của Next không có trường tương ứng.

**Triển khai theo 2 nhịp:** trước hết chạy **chế độ report-only** — tính quyết định, ghi log, chỉ áp `noindex`, chưa 404/301. Quan sát 1 tuần rồi mới bật đủ. Đây là chốt de-risk, không bỏ qua.

**Kiểm chứng:** unit test bảng luật (backend có Jest, frontend có Playwright ở `frontend/e2e`) · `curl -I /nha-rieng/$` → 404 · `curl -I '/ban/dat-nen?page=1'` → 301 · facet rỗng → 200 + `noindex,follow`.

---

## P5 — Chuyển đổi URL (301)

`next.config.mjs` `redirects()` với `statusCode: 301` (không dùng `permanent: true` vì nó phát 308): `/tat-ca` và `/tat-ca/*` → `/ban`, `/ban/*` · `/toan-bo-tin` → `/ban` · `/dat-nen`, `/nha-rieng`, `/chung-cu`, … (7 mục) → `/ban/{loại}` · `nha-mat-pho` → `nha-rieng` · `/sitemap` → `/sitemap.xml` · `/tin-tuc` → `/news` (đồng thời **xoá rewrite `next.config.mjs:50` và `app/tin-tuc/page.tsx`**).

`www` → apex và `http` → `https` đặt ở **Caddyfile** (Next không thấy tin cậy được host sau proxy). Đây là mục "www trả 502" trong `fix seo.xlsx`.

Redirect cần trạng thái DB (`/{khu-vuc}` cũ → `/ban/{khu-vuc}`, slug location đã nghỉ hưu) đặt trong `[...slug]/page.tsx` bằng `permanentRedirect()` — **cùng cơ chế đang chạy tốt** ở `tin/[slug_id]/page.tsx:90-94`.

**Cập nhật toàn bộ link nội bộ sang dạng mới trong cùng deploy** — `layout.tsx:211-219`, `khu-vuc/page.tsx`, `[...slug]:425-443`, `PropertyDetailClient.tsx:374,446`, `MobileMenu.tsx:118`, `PropertyCard`, `ExploreMoreContextual`, `Footer`, `SearchForm`. Link nội bộ phải trỏ thẳng vào 200, không được trỏ vào 301.

Đây là phase rủi ro cao nhất: URL tin đăng không đổi, nhưng **mọi URL landing đều dời**. Giảm thiểu bằng: tất cả đều 301 (không 404), bảng redirect tĩnh và đầy đủ, link nội bộ sửa cùng lúc.

---

## P6 — Sitemap sinh từ backend

Module mới `backend/src/seo/`: `GET /seo/sitemap-index.xml`, `/seo/sitemaps/{static,landing-:n,listings-:n,news}.xml`, `/seo/facets`.

Một truy vấn sinh toàn bộ landing sitemap:
```ts
prisma.property.groupBy({
  by: ['transactionType','propertyType','wardId','districtId','provinceId'],
  where: { status: { in: publicStatuses }, deletedAt: null },
  _count: { id: true }, _max: { publishedAt: true },
})
```
Roll-up trong bộ nhớ lên cấp quận/tỉnh và biến thể không loại BĐS. Chỉ phát nhóm có `_count > 0`. `lastmod` = `MAX(publishedAt)` đã roll-up — **đúng sự thật và miễn nhiễm lượt xem, không cần đổi schema** cho landing. Dùng lại đúng pattern `groupBy` đã chạy ở `property.service.ts:738` và `cacheManager` ở `:733`.

Chọn backend thay vì `sitemap.ts` của Next vì cả hai yêu cầu — `lastmod` thật và "chỉ URL có tin" — đều quy về một aggregate; frontend không diễn đạt được nếu không tự dựng endpoint aggregate, mà có endpoint rồi thì việc frontend serialize lại là thừa. Thêm nữa route hiện tại là `force-dynamic`, dựng lại ~6.000 dòng qua 3 round-trip **mỗi lần Googlebot gọi**.

Phục vụ tại `/sitemap.xml` qua `Caddyfile` (thêm `handle` trước catch-all), giữ nguyên URL công khai nên không phải đăng ký lại trong GSC. Xoá `frontend/src/app/sitemap.ts`.

**Trước khi merge**, chạy `groupBy` read-only trên production để có con số trước/sau chính xác — đó là căn cứ go/no-go. Dự kiến từ ~4.000 URL (sẽ thành ~5.900 sau import) xuống còn vài trăm.

**Kiểm chứng:** `curl /sitemap.xml` ra sitemap index hợp lệ · mọi URL trong đó trả 200 + `index` · duyệt 1 tin ở khu vực đang rỗng → URL đó xuất hiện trong sitemap ở lần refresh kế tiếp.

---

## P7 — Gỡ hard-code frontend + tách `/user`

1. **`useLocations.ts`** viết lại trên `/locations/tree`, dùng axios chung (hook đang thiếu `/api/v1` trong fallback dev), cache theo session. Xoá lỗi trùng quận tận gốc.
2. **`SidebarFilter.tsx`** xoá option tỉnh hard-code (`:305-321`), `activeLocations` merge (`:231-236`), state + fetch `haTinhLocations` (`:27,127-133`), mọi nhánh `isHaTinh`. **Giữ nguyên** 2 select phường/xã — filter `type !== 'OLD_WARD'` / `=== 'OLD_WARD'` ở `:353,373` đã đúng, và ràng buộc `disabled={!filters.district}` ở `:349,370` cũng **đã có sẵn** (mục khách phàn nàn "chưa chọn huyện vẫn chọn được xã" thực ra nằm ở `SearchForm`, vốn không có select phường/xã).
3. **`SearchForm.tsx:104-117`** thay 11 option quận hard-code bằng dữ liệu **truyền từ server component qua props** (trang chủ và `[...slug]` đã fetch sẵn ở server) — tránh waterfall phía client ở hero trang chủ.
4. **`app/page.tsx`** xoá `getVinhProperties()` (`:67-108`, 6 round-trip SSR tuần tự) và `displayWards` fallback (`:126-129`), dùng `homepageData.mainWardBlocks`.
5. **`app/khu-vuc/page.tsx:10-49`** thay 2 mảng hard-code 35 mục bằng tree.
6. **`/user` → `/tai-khoan`**: dashboard đã tách sẵn trong route group `app/user/(dashboard)/*`, đổi đoạn URL thành `/tai-khoan/`, `proxy.ts` matcher thành `['/tai-khoan/:path*']`. Khi đó `/user/[slug]` công khai rõ ràng, `robots.txt` chặn `/tai-khoan/` là đúng. Thêm 301 cho các đường dashboard cũ. **Đồng thời** đổi rewrite `next.config.mjs:51` (`/{slug}-{uuid}` → `/user/{slug}`) thành **redirect** — phải xong trước P4, vì dưới ngữ pháp chặt catch-all sẽ 404 URL hồ sơ mà hôm nay chỉ sống nhờ rewrite khớp trước.

---

## Thứ tự & phụ thuộc

```
P0 ──► P1 ──► P2 ──┐
              P3 ──┴─► P4 ──► P5 ──► P6
                              P7 (song song được từ sau P3)
```
P4 cần `/locations/resolve` của P3. P2 không phụ thuộc P3. P7 làm song song được sau P3.

Mỗi phase deploy độc lập được. P0→P2 **không đổi URL nào** nên rủi ro bằng 0. Rủi ro tập trung ở P4 (bật 404) và P5 (dời URL landing).

---

## Kiểm chứng tổng thể

1. `npm run typecheck` và `npm run lint` sạch ở cả 2 workspace.
2. `npm test --workspace=backend` — thêm test cho `slugify` tin tức, `buildOffer`, và bảng luật indexability.
3. Playwright `frontend/e2e` — thêm case: URL rác → 404, `?page=1` → 301, facet rỗng → noindex, breadcrumb đủ cấp.
4. `docker compose -f docker-compose.vps.yml build` chạy qua (hiện đang **fail** vì thiếu `backend/start.sh` — P0 sửa).
5. Dựng stack đầy đủ trên VPS mới, chạy `import-locations.js`, mở trang chủ + 1 trang quận + 1 trang tin và đối chiếu HTML nguồn: có H1, có canonical đúng domain, có JSON-LD `@graph`, không còn `price: 0`.
6. Rich Results Test cho 3 mẫu trang; `curl /sitemap.xml` và spot-check 20 URL đều trả 200.
7. Sau deploy: gỡ `NEXT_PUBLIC_APP_ENV=staging`, submit sitemap trong GSC property mới, theo dõi báo cáo Lập chỉ mục 2 tuần.

---

## Điểm cần chốt khi triển khai

| # | Việc | Mặc định nếu không có phản hồi |
|---|---|---|
| 1 | Domain thật cho site Hà Nội (C1) | Deploy với `NEXT_PUBLIC_APP_ENV=staging`, noindex toàn site cho tới khi có domain |
| 2 | URL phường/xã phẳng hay lồng (B3) | Ship phẳng theo `urlSegment`; `path` đã sẵn nếu đổi ý. Nếu chọn lồng, phải chốt thêm luật cho 75 cặp WARD/OLD_WARD trùng tên trong cùng quận |
| 3 | 26 "khu vực hot" không phải đơn vị hành chính (A4) | Chưa dựng. Không nhét vào `Location` (không có cột quận cha, sẽ làm bẩn dropdown phường/xã và đụng khoá `(parentId,type,slug)`) và không dựng `Project` theo phỏng đoán |
| 4 | `Vạn Phúc`, `Minh Khai` trong sheet xã cũ hot mơ hồ 3 quận | Ghi ra `conflicts.hanoi.json`, không gán `isFeatured` |
| 5 | Bảng 1 thiếu Phúc Thọ/Thạch Thất/Sơn Tây, trùng Chương Mỹ (A2) | **Không còn chặn** — lấy đủ 30 quận từ 2 sheet "All…"; sheet `quận huyện` chỉ dùng cho `sortOrder` |
| 6 | Bảng 2 trống 4 dòng (A3) | **Không còn chặn** — import 28, thêm sau bằng cách chạy lại importer |
| 7 | `/ban/{khu-vuc}` (không có loại BĐS) có index không | Có — là trang hub quận tự nhiên, `groupBy` sinh sẵn |
| 8 | Edge trên server mới: Caddy hay nginx | Caddy (đúng cái `docker-compose.vps.yml` đang dùng) |

---

## Ghi chú

Theo quy ước cá nhân, sau khi duyệt mình sẽ chép plan này vào `bds-hanoi/plan/` để lưu cùng repo, cạnh 3 file đã có: `review-dong-bo-vps.md`, `yeu-cau-nhan-ban-ha-noi.md`, `cau-hoi-can-lam-ro.md`.
