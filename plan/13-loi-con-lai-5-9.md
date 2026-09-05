# Khách rà lại 05/09: 6 mục còn vàng — truy nguyên và sửa

Khách gửi lại `Lỗi ngày 25-8 nhadatxunghe.docx` có định dạng: **gạch ngang = đã xong**,
**tô vàng = chưa fix**. 7 mục gạch ngang, 6 mục vàng.

Bản 26/08 tôi báo "16/17 xong" là **sai với 3 mục**: giá, bộ đếm view, bình luận/lưu tin.
Chúng đúng ở tầng tôi đo (API `/properties`, hàm backend) nhưng hỏng ở tầng khách dùng
(endpoint `/properties/search`, và ID mà trang chi tiết gửi lên). Đo sai tầng nên báo nhầm.

---

## Đã truy nguyên xong — 4 gốc lỗi, không cái nào là "chờ khách"

### 1. Lọc khoảng giá không ra tin nào (mục 12)

`/search` gọi `GET /properties/search` → **Meilisearch**, khác endpoint `/properties`
(Prisma) mà tôi đã đo hôm 26/08. Đo lại đúng endpoint khách dùng:

| | không lọc | 1B_2B | 10B_20B | LT_500M |
|---|---|---|---|---|
| `/properties` (Prisma) | 195 | 42 | 6 | 33 |
| `/properties/search` (Meili) | 195 | **0** | **0** | **0** |

Diện tích trên chính endpoint đó vẫn chạy (30_50→7, 50_80→43, 100_150→66) — khớp đúng
việc khách gạch ngang mục diện tích mà để vàng mục giá.

**Gốc:** trong chỉ mục Meilisearch, tiền là **chuỗi**, diện tích là **số**:

```
"price":"2092578154"   "priceMin":"2000000000"   "priceMax":"2999000000"
"area":120             "areaMin":100             "areaMax":150
```

Meilisearch chỉ so sánh `>=` / `<=` trên số. Chứng minh trực tiếp trên chỉ mục:

```
price >= 1000000000   -> 0
price <= 99999999999  -> 0     <- điều kiện đáng lẽ khớp TẤT CẢ
area >= 100           -> 104
isNegotiable = false  -> 190
```

Vì sao lệch: `price/priceMin/priceMax` là `Decimal` trong Prisma, serialize sang JSON
thành chuỗi; `area/areaMin/areaMax` là `Float`, ra số. Hàm chuẩn hoá lúc đẩy vào chỉ mục
(`search.service.ts`) có ép ngày sang số nhưng **không đụng tới tiền**.

**Sửa:** ép số ở hàm chuẩn hoá + nạp lại chỉ mục. Gộp hai bản sao `addDocuments` /
`addDocument` làm một, vì lệch nhau là cách lỗi này quay lại.

### 2. Bộ đếm view đứng yên (mục 14)

Hai nguyên nhân chồng nhau:

- Chỗ DUY NHẤT tăng view là `GET /properties/:id`. Trang chi tiết render phía máy chủ với
  `next: { revalidate: 60 }` ⇒ **cả site chỉ gọi được 1 lần / 60 giây / tin**, bao nhiêu
  người vào cũng vậy.
- Trình duyệt không gọi bù: `PropertyDetailClient` thấy có `initialProperty` là **return
  sớm**, không gọi `GET /properties/:id` nữa. Còn `POST /:id/view` thì chỉ chạy khi **đã
  đăng nhập**, và route đó chỉ ghi "tin đã xem", không tăng đếm.

Bản vá 26/08 của tôi chỉ chữa cache 60s ở **backend** — không chạm hai cái trên.

**Sửa:** chuyển việc đếm sang `POST /:id/view`, chạy cho **mọi khách**, trả về số mới để
trang cập nhật ngay; bỏ tăng view khỏi `GET` (nếu để cả hai thì đếm gấp đôi).

### 3. Không bình luận / không lưu tin / không cập nhật tin đã xem (mục 15, 16)

`PropertyDetailClient.tsx:40`:

```ts
const actualId = slug_id ? (slug_id.split('--').pop() || '') : '';
```

Tách theo `--` là định dạng URL **cũ** (`{slug}--{uuid}`). URL hiện tại là
`{slug}-{shortCode}` — **một** gạch. Không có `--` nên `.pop()` trả về **nguyên cả chuỗi**,
và `looksLikePropertyId` chỉ kiểm "dài ≥ 16 ký tự" nên vẫn cho qua.

Đo trên site thật với `/tin/ban-nha-kinh-doanh-trung-tam-tp-vinh-10fwa`:

```
GET /properties/<nguyên chuỗi>           -> 404
GET /properties/<nguyên chuỗi>/comments  -> 404   <- bình luận không tải được
GET /properties/10fwa                    -> 200
GET /properties/10fwa/comments           -> 404   <- route này chỉ nhận UUID
```

Nên mọi lệnh gọi tương tác (bình luận, lưu tin, ghi tin đã xem, bấm gọi/Zalo) đều bắn vào
ID không tồn tại. Riêng `res.data.find(p => p.id === actualId)` không bao giờ khớp nên nút
lưu luôn hiện sai trạng thái.

**Sửa:** lấy ID từ **chính bản ghi đã tải** (`property.id`, là UUID), chỉ dùng đoạn tách từ
URL cho lần gọi đầu. Dùng lại `parseListingRef` mà server đang dùng, thay vì tự tách.

### 4. `?focus=1` (mục 5)

Phần đã làm chạy đúng — bản deploy trả `autoOpen:true` khi có `?focus=1`, `false` khi không.
Nhưng `handleSubmit` copy nguyên `window.location.search` sang trang kết quả, **giữ luôn
`focus=1`** ⇒ tìm xong popup **bật lại đè lên kết quả**, nhìn y như hỏng.

**Sửa:** bỏ `focus` khi dựng URL kết quả.

### 5. Trang khu vực không có tin (mục 9, vế sau)

Khách thêm yêu cầu: *"Nếu không có tin thì giao diện vẫn hiện quảng cáo, hoặc tin liên
quan, không hiện thông báo này"* — vế này tôi **chưa làm**. Vế đầu (thỉnh thoảng không tải
được) đã thêm thử-lại-một-lần hôm 26/08 và không tái hiện được sau 10 lần đo.

---

## Đầu việc

| # | Việc | Tầng | Kiểm chứng |
|---|---|---|---|
| 1 | Ép số `price/priceMin/priceMax` khi đẩy vào Meili, gộp 2 bản sao | backend | `price <= 99999999999` khớp > 0 |
| 2 | Nạp lại chỉ mục 2 VPS | vận hành | `/properties/search?priceRangeKey=1B_2B` = 42 |
| 3 | Đếm view sang `POST /:id/view`, mọi khách, trả số mới | backend | gọi 3 lần, số tăng 3 |
| 4 | Bỏ tăng view khỏi `GET /properties/:id` | backend | không đếm gấp đôi |
| 5 | Lấy ID từ bản ghi đã tải, bỏ `split('--')` | frontend | `/comments` trả 200 |
| 6 | Trang chi tiết gọi `POST view` cho cả khách chưa đăng nhập | frontend | số view nhích sau mỗi lần vào |
| 7 | Bỏ `focus` khỏi URL kết quả tìm kiếm | frontend | tìm xong không bị popup che |
| 8 | Trang rỗng: hiện quảng cáo + tin liên quan | frontend | không còn dòng thông báo trơ |
| 9 | Test chặn tái phát cho 1, 3, 5, 7 | test | `npm test` xanh |

## Không đụng tới

Dữ liệu địa giới (838 khu vực) và sitemap — khách đã gạch ngang, đang đúng.
Không đổi `robots.txt` Hà Nội, không bật `DEPOSIT_PREFIX`.

---

## KẾT QUẢ — 05/09/2026, đã deploy cả 2 site

Đo trên site thật sau khi deploy, không phải trên máy dev.

### Mục 12 — lọc khoảng giá

Endpoint `/properties/search` (chính cái trang `/search` dùng), trước → sau:

| khoảng | trước | sau |
|---|---|---|
| LT_500M | 0 | 33 |
| 500M_1B | 0 | 15 |
| 1B_2B | 0 | 42 |
| 2B_3B | 0 | 54 |
| 3B_5B | 0 | 40 |
| 5B_7B | 0 | 20 |
| 7B_10B | 0 | 12 |
| 10B_20B | 0 | 6 |

Khớp từng con số với endpoint Prisma. Kiểm sâu: **223 tin, 0 tin sai khoảng**.
Trên chỉ mục: `price <= 99999999999` từ 0 → **193** tin.

### Mục 14 — bộ đếm view

```
POST /properties/:id/view  ->  views=10, 11, 12   (tăng đúng từng lượt)
POST bằng shortCode        ->  views=13           (không hỏng khi hai bên lệch ID)
GET  /properties/:id       ->  views=13, 13       (không đếm gấp đôi)
```

### Mục 15, 16 — ID sai

```
GET /properties/<UUID>/comments        -> 200
GET /properties/10fwa/comments         -> 404   (shortCode không dùng được)
GET /properties/<nguyên slug>/comments -> 404   (thứ frontend gửi TRƯỚC khi sửa)
```

Trang tin đã deploy: chuỗi `split("--")` biến mất khỏi bundle, UUID của tin xuất hiện 4 lần
trong payload nên component bình luận nhận được đúng ID.

**Chưa xác minh hết:** *lưu tin* và *tin đã xem của người đã đăng nhập* đi qua đúng dòng ID
vừa sửa, nhưng cả hai đều cần đăng nhập mới chạy được nên tôi chưa tự chạy thử từ đầu đến
cuối. Cần một tài khoản thử, hoặc nhờ khách bấm lại.

### Mục 5 — `?focus=1`

Phần khách yêu cầu vốn đã chạy: `/search?focus=1` trả `autoOpen:true`, `/search` thường trả
`false`. Đã sửa lỗi kèm: tìm xong không còn bị popup bật lại đè lên kết quả
(`/search?q=vinh` → `autoOpen:false`).

### Mục 9 — trang khu vực không có tin

`/xa-can-loc`, `/phuong-nghi-phu`: dòng "Không tải được danh sách tin" biến mất, thay bằng
khối "Tin đăng mới nhất" với **7 tin thật** + ô quảng cáo.
Vế đầu (thỉnh thoảng không tải được) vẫn không tái hiện được sau 10 lần đo.

### Không hỏng gì

Nghệ An 11 khối trang chủ, link tiêu đề đúng, TP Hà Tĩnh vẫn ghim vị trí 3.
Hà Nội 9 khối nguyên vẹn. Mọi trang 200. Test: backend 144, frontend 108, đều xanh.
