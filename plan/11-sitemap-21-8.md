# Sitemap — 3 lỗi khách nêu trong "Sitemap 21-8-2026"

Nguồn: `D:\An\web_bds_hanoi\Sitemap 21.-8docx.docx`. Cả ba đều **đã kiểm chứng trên
nhadatxunghe.vn trước khi sửa** — không sửa theo mô tả suông.

## Hiện trạng đo được trước khi sửa

```
static.xml     16 URL
landing-0.xml  218 URL
listings-0.xml 164 URL
projects.xml   1 URL
```

## 1. `/du-an/{khu-vuc}` — URL chuyển hướng nằm trong sitemap

Đo được: cả 5 URL đều trả **308** về `/du-an`.

```
/du-an/phuong-vinh-phu   -> 308 -> /du-an
/du-an/thanh-pho-vinh    -> 308 -> /du-an
/du-an/nghe-an           -> 308 -> /du-an
/du-an/phuong-thanh-vinh -> 308 -> /du-an
/du-an/phuong-vinh-loc   -> 308 -> /du-an
```

**Nguyên nhân:** `DU_AN` vừa là một giá trị của `Property.propertyType` (3 tin đang dùng)
vừa là tên mục Dự án. `getLandingUrls` dựng URL theo `PROPERTY_TYPE_SLUG` nên sinh
`/du-an/{khu-vuc}` y hệt cách nó sinh `/dat-nen/{khu-vuc}`. Nhưng router hiểu đoạn sau
`/du-an/` là **slug dự án**, không khớp thì 308 về `/du-an`.

**Sửa:** `SECTION_ROUTE_SLUGS = new Set(['du-an'])`, chặn trong `add()`. Chặn theo *slug*
chứ không theo enum, để loại BĐS nào sau này trùng tên một mục thì chỉ cần thêm một dòng.

Xoá luôn `/du-an` trần khỏi landing (nó thuộc static.xml). 3 tin loại "Dự án" **vẫn** đóng
góp cho URL khu vực của chúng — chỉ bỏ tầng URL không tồn tại.

## 2. Hà Tĩnh bị bỏ sót khỏi landing-0.xml

Đo được: landing-0.xml có **0** URL Hà Tĩnh, trong khi listings-0.xml có tin Hà Tĩnh và các
trang khu vực Hà Tĩnh đều mở **200**:

```
/thanh-pho-ha-tinh          -> 200
/huyen-nghi-xuan            -> 200
/dat-nen/thanh-pho-ha-tinh  -> 200
```

**Nguyên nhân:** `locationSegmentMap()` dựng bản đồ từ `getTree()`, mà `getTree()` **theo
thiết kế chỉ mô tả MỘT cây** — tỉnh khai đầu trong `ACTIVE_PROVINCE_SLUG`. Site chạy
`PROVINCE_SLUG=nghe-an,ha-tinh` nên mọi id khu vực Hà Tĩnh tra không ra `urlSegment` và bị
**bỏ im lặng**. Lỗi kiểu này không bao giờ báo động, chỉ làm hụt URL.

**Sửa:** thêm `LocationService#getSegmentById()` dựng từ `snap.all` (phủ mọi tỉnh đang phục
vụ). **Không** dùng `getSeoLocations()` dù tên nó nghe đúng việc: cờ `isSeoEnabled` đang
`false` ở **cả 271/271 dòng**, lấy nó làm nguồn sẽ xoá sạch sitemap danh mục.

Dữ liệu Hà Tĩnh hiện có: 4 tin / 3 huyện / 2 loại BĐS ⇒ khoảng **10 URL mới**.

> Giới hạn còn lại: Hà Tĩnh chỉ vào sitemap tới **cấp huyện**, vì có 13 huyện nhưng **0
> phường/xã**. Đã đưa vào file hỏi khách `cau-hoi-du-lieu-dia-gioi-2026-08-25.txt` mục 1.

## 3. `/ban`, `/cho-thue`, `/du-an` lặp giữa static.xml và landing-0.xml

Đối chiếu bằng `comm -12` giữa hai file: ra **đúng 3** URL đó, không hơn không kém.

**Sửa:** chặn `!typeSlug && !locationSlug` trong `add()` — đó chính là gốc mục `/ban` và
`/cho-thue`. Giữ ở static.xml (trang cố định của site), landing-0.xml chỉ nên chứa tổ hợp
sinh ra từ dữ liệu. `/du-an` đã bị mục 1 xử lý.

## Vì sao cả hai cổng chặn đặt trong `add()`

`add()` được gọi từ nhiều nhánh (có kèm loại BĐS và không kèm). Chặn ở vòng lặp gọi thì
phải nhớ chặn ở mọi nhánh; chặn trong `add()` thì không nhánh nào lách được.

## Kiểm chứng

Test: **119 backend** (thêm 3 ca — một ca cho mỗi mục, gồm cả ca "cổng chặn không được ăn
lan": `/dat-nen/nghe-an` và `/cho-thue/nha-rieng/nghe-an` phải còn nguyên).

Sau deploy, kỳ vọng landing-0.xml: 218 − 8 (6 URL du-an + `/ban` + `/cho-thue`) + ~10 (Hà
Tĩnh) ≈ **220**, và:
- `grep '/du-an' landing-0.xml` ⇒ rỗng
- `comm -12` static vs landing ⇒ rỗng
- có URL `thanh-pho-ha-tinh`, `huyen-nghi-xuan`, `thi-xa-ky-anh`

Lưu ý: sitemap có cache 15 phút (Redis). Restart backend **không** xoá cache đó.
