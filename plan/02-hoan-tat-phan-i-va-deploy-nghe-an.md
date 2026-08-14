# Plan: Hoàn tất PHẦN I, deploy Nghệ An trước rồi nhân bản Hà Nội

Nối tiếp `00-plan-nen-tang-seo.md` và `01-va-cac-muc-con-thieu.md` (đã xong, 10 commit trên
nhánh `hanoi/nen-tang-seo`).

---

## Context

`update 30-7 F.docx` mở đầu bằng **"PHẦN I: UPDATE TRƯỚC KHI NHÂN BẢN"** — tức sửa
nhadatxunghe.vn trước, *rồi mới* clone sang Hà Nội. Hai đợt vừa rồi làm ngược: toàn bộ
bản vá nằm trong repo Hà Nội, còn site Nghệ An đang chạy vẫn nguyên 32 lỗi SEO.

Anh đã chốt hướng đúng theo tài liệu: **sửa Nghệ An trước, Hà Nội copy ra là có sẵn.**

Điều này khả thi mà không phải viết lại gì, vì đợt trước đã gỡ hết hard-code: `site-config.ts`,
`ACTIVE_PROVINCE_SLUG`, khu vực lấy từ DB. **Một codebase chạy cả hai site**, chỉ khác biến
môi trường và dữ liệu khu vực trong DB.

---

## Phát hiện then chốt: Nghệ An KHÔNG phải đổi URL

Đây là điều quyết định toàn bộ mức rủi ro của đợt này.

`fix seo.xlsx` mục I.13 chỉ yêu cầu gộp **ba** URL trùng nhau: `/ban`, `/tat-ca`,
`/toan-bo-tin`. Nó **không** yêu cầu dời `/dat-nen/{khu-vực}` sang `/ban/dat-nen/{khu-vực}` —
đó là thiết kế mình thêm vào để URL sạch cho site mới.

Trên site mới không sao (chưa có gì được index). Trên Nghệ An thì đó là dời **~4.000 URL
đang có thứ hạng** — rủi ro lớn mà khách không hề yêu cầu.

May là `listingPath` và bảng redirect đều đã gán cờ:

| Site | `NEXT_PUBLIC_SEO_MODE` | Dạng URL danh mục | Gộp `/tat-ca`, `/toan-bo-tin` |
|---|---|---|---|
| **nhadatxunghe.vn** | `report` | **giữ nguyên** `/dat-nen/cau-giay` | ✅ vẫn 301 (nằm ngoài cờ) |
| **Hà Nội** | `enforce` | `/ban/dat-nen/cau-giay` | ✅ |

Nghĩa là Nghệ An nhận **toàn bộ** bản vá SEO mà **không dời một URL landing nào**. Nếu sau
này khách muốn dạng URL mới, chỉ đổi một biến môi trường.

---

## Trả lời của khách (`cau_hoi.txt`) — mục nào được mở khoá

| Mã | Nội dung | Kết quả |
|---|---|---|
| **B1** | Phân nhóm menu ngang | ✅ Đủ 30 quận: 10 Trung tâm / 10 Cận trung tâm / 10 Ngoại thành. Đối chiếu với dữ liệu đã import: **30/30 khớp tuyệt đối**, không trùng, không thừa. |
| **B3** | Địa giới 2 hay 3 tầng | ✅ **3 tầng, giống nhadatxunghe** — giữ cấp quận/huyện làm cấp điều hướng để gom xã. Đúng với schema đã dựng, và xác nhận URL dạng phẳng là đúng. |
| **B2** | Mục 25.5 gán ngược dropdown | ✅ Gõ nhầm — dropdown xã cũ lấy bảng xã cũ. |
| **B7** | Tab động | ✅ 9 tab, 3–4 tab thấy ngay, còn lại trượt ngang. |
| **B8** | Thứ tự khối trang chủ | ✅ Xã **cũ** là tab 4, xã **mới** là tab 6 (cũ nằm trên mới). |
| **B9, B10** | Mục nhảy số, "Dữ liệu người dùng" | ✅ Đã bỏ bớt so với dự định ban đầu — không còn chặn. |
| — | Bổ sung mới | Trang chủ **mỗi khối/chuyên mục để 3 card tin**. |

**Còn treo:** A4 (26 "khu vực hot" không phải đơn vị hành chính) · B5 (chi tiết Dự án) ·
B6 (chi tiết duyệt tin) · B13 (công thức giá/m²) · C1 (domain Hà Nội) · mã GA4 + Meta Pixel mới.

---

## G1 — Hoàn tất các mục PHẦN I còn thiếu

Anh đã chọn làm cả 4 nhóm.

1. **Bố cục trang chủ** (`app/page.tsx`)
   - Kéo *BĐS tại {thành phố tỉnh lỵ}* và *Bất động sản theo khu vực* lên trên *Đất nền*
     (ngay dưới quảng cáo). Hiện thứ tự là: Tin UP → Dành cho bạn → … → BĐS khác → BĐS theo khu vực.
   - **Bỏ hẳn** khối "Dành cho bạn" (`page.tsx:141`).
   - **Mỗi khối/chuyên mục để 3 card tin** (yêu cầu mới trong `cau_hoi.txt`).
2. **Nhãn "Khu vực khác" → "Tất cả các khu vực"** — `PropertyTabs.tsx:35`, id `khu-vuc-khac`.
3. **Cho thuê thành tab ngang**: nhà riêng · chung cư · mặt bằng–kho · đất nền · BĐS khác.
   Dùng lại `PropertyTabs` sẵn có, nguồn từ `PROPERTY_TYPES` nên nhãn không lệch.
4. **Slogan** "Đăng tin dễ dàng / tìm đất an tâm" → "Đăng bán dễ dàng / tìm đất an tâm".
   Chuỗi này **không có trong code** — nhiều khả năng nằm trong ảnh banner hoặc cấu hình
   admin. Truy trước khi sửa; nếu là ảnh thì báo lại chứ không tự chế ảnh mới.

## G2 — Menu 3 nhóm Trung tâm / Cận trung tâm / Ngoại thành (B1)

Phân nhóm này là **của riêng Hà Nội** — Nghệ An không có. Nên **không viết cứng vào frontend**:
thêm cột `Location.group` (nullable) và set qua importer.

- Có `group` (Hà Nội) → menu ngang tách 3 nhóm.
- Không có `group` (Nghệ An) → giữ menu phẳng như hiện tại.

Cùng một build phục vụ cả hai site — đúng nguyên tắc "một codebase, hai site" của đợt này.

## G3 — Xã cũ TP Vinh + đường nhập dữ liệu Nghệ An

Sheet **"Các phường xã cũ Ở Vinh"** đã có sẵn trong `bds_doc/danh sách khu vực.xlsx` —
**không phải chờ khách gửi**.

- Mở rộng `extract-locations-xlsx.ts` sinh `backend/prisma/data/nghe-an/*.json` từ sheet này.
- Đợt trước mình xoá `backend/scripts/sync-locations.ts` (nguồn dữ liệu khu vực Nghệ An).
  Điều đó **an toàn cho việc deploy**: DB production Nghệ An đã có sẵn Location, migration
  `20260814020000` chỉ backfill thêm `urlSegment`/`path` từ `slug` hiện có, **giữ nguyên
  mọi URL đang được Google index**. Nhưng phải kiểm thật trên bản sao DB trước khi chạy live.
- `ACTIVE_PROVINCE_SLUG` đổi thành **danh sách** để Nghệ An giữ được cả Hà Tĩnh nếu muốn —
  yêu cầu "bỏ các xã tỉnh khác ra" không nói rõ Hà Tĩnh có thuộc diện bỏ hay không, mà tên
  site là "Nhà đất xứ Nghệ". Mặc định giữ cả hai, ghi rõ để khách xác nhận.

## G4 — Rút gọn đuôi link tin (PHẦN I, mục "Đuôi link tin")

Hiện tại: `/tin/{slug}--{uuid-36-ký-tự}`. Khách yêu cầu ngắn hơn, và ghi rõ điều kiện:
*"nếu đổi phải giữ ID cố định và chuyển hướng 301"*.

- Thêm `Property.shortCode` — chuỗi base36 **8 ký tự**, `@unique`, sinh ngẫu nhiên có thử
  lại khi đụng. Không cắt UUID: 8 ký tự hex đầu chỉ có 4,3 tỉ tổ hợp, đụng nhau là chuyện
  gần chắc chắn ở quy mô 100k tin (nghịch lý ngày sinh).
- URL mới `/tin/{slug}-{shortCode}`, giữ **cùng bản ghi** nên "ID cố định" thoả mãn.
- URL cũ `--{uuid}` **301 vĩnh viễn** sang URL mới — dùng lại đúng cơ chế đang chạy tốt ở
  `tin/[slug_id]/page.tsx`, chỉ thêm nhánh nhận dạng uuid.
- Sitemap và canonical chuyển sang dạng mới cùng deploy.

**Rủi ro cao nhất của đợt này** vì nó dời *mọi* URL tin đăng đang được index. Bắt buộc:
301 (không 404), sitemap phát dạng mới ngay, và theo dõi GSC 2 tuần.

## G5 — Deploy nhadatxunghe.vn

Cần anh cung cấp: **IP + tài khoản SSH server Nghệ An** (nếu khác `14.225.255.128`) và xác nhận
được phép dừng dịch vụ vài phút.

Thứ tự chạy — không đảo:
1. `backend/scripts/db-backup.js` — sao lưu trước khi động vào bất cứ thứ gì.
2. Dựng lại DB từ bản sao ở môi trường scratch, chạy 3 migration mới, **đếm số Location có
   `urlSegment` NULL** (phải bằng 0) và **đối chiếu danh sách URL landing trước/sau** qua
   `GET /seo/facets`. Đây là căn cứ go/no-go.
3. Deploy với `NEXT_PUBLIC_SEO_MODE=report` — nhận hết bản vá, **không dời URL landing**.
4. Chạy `import-locations.js` cho phần xã cũ TP Vinh.
5. Theo dõi GSC 1 tuần. Chỉ bật `enforce` nếu khách muốn đổi dạng URL.

## G6 — Nhân bản Hà Nội

Sau khi Nghệ An chạy ổn: cùng codebase, đổi env (`SITE_DOMAIN`, `ACTIVE_PROVINCE_SLUG=ha-noi`,
`NEXT_PUBLIC_SEO_MODE=enforce`), chạy `import-locations.js` với dữ liệu Hà Nội đã commit.

Deploy lần đầu đặt `NEXT_PUBLIC_APP_ENV=staging` → noindex toàn site, chỉ gỡ khi đã có
domain chốt (C1) và dữ liệu đầy đủ. Đây là chốt chặn chống Google phạt trùng nội dung với
nhadatxunghe.vn.

---

## Kiểm chứng

1. `npm run typecheck` + 87 test hiện có, cộng test mới cho `shortCode` và `Location.group`.
2. Test then chốt cho G4: URL `--{uuid}` cũ trả **301** chứ không 404; URL mới trả 200;
   sitemap chỉ phát dạng mới.
3. Test then chốt cho chế độ report: với `SEO_MODE=report`, `listingPath` phải trả
   `/dat-nen/cau-giay` (dạng Nghệ An đang chạy) — đã có sẵn trong `seo-urls.spec.ts`, bổ sung
   ở phía frontend.
4. Trên bản sao DB Nghệ An: 0 Location có `urlSegment` NULL, và **mọi URL landing đang được
   index vẫn trả 200** sau migration.

---

## Ngoài phạm vi đợt này

Model Dự án (B5) · quy trình duyệt tin 2 chiều (B6) · popup tìm kiếm/lọc · thống nhất công
thức giá/m² (B13) · redesign card tin trang chủ · 26 "khu vực hot" (A4).

Bốn mục đầu đều chờ khách làm rõ thêm; riêng redesign card tin thì tài liệu đã đủ chi tiết
nhưng khối lượng lớn, để thành một đợt riêng.
