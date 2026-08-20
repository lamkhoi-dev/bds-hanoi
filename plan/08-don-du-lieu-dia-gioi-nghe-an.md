# Dọn dữ liệu địa giới rác trên DB Nghệ An — 2026-08-21

**Đã thực hiện xong.** File này giữ lại số liệu đối chiếu và **câu lệnh lùi**.

VPS `14.225.255.128`, container `bds-postgres-prod`, DB `bds_db`, user `bds_user`.

---

## Vấn đề

DB Nghệ An chứa **cả bộ địa giới 63 tỉnh** do một lần import cũ để lại, tất cả đang
`isActive=true`:

| Nhóm | CITY | DISTRICT | WARD | OLD_WARD | Tổng |
|---|---|---|---|---|---|
| `nghe-an/*` + `ha-tinh/*` (dữ liệu thật) | 2 | 33 | 123 | 113 | **271** |
| 63 tỉnh khác (`tinh-*`, `thanh-pho-*`) | 63 | 705 | 10.656 | 13 | **11.437** |

Site không hiện chúng (`LocationService` lọc theo `path` khớp `ACTIVE_PROVINCE_SLUG`, đã
kiểm: `/api/v1/locations` trả đúng 33 dòng), nhưng `/admin/locations` liệt kê hết ⇒ trang
đó gần như không dùng được. Trong đó có bản sao **"Thành phố Vinh"**
(`tinh-nghe-an/thanh-pho-vinh-1`) mà khách từng thấy — bản thật
(`nghe-an/thanh-pho-vinh`) giữ đủ **96 tin**, bản sao **0 tin**.

## Kiểm tra trước khi sửa — phải soi ĐỦ 10 khoá ngoại, không chỉ `districtId`

`Location` được 10 cột ở 4 bảng trỏ tới. Số tin/dự án trỏ vào **11.437 dòng rác**:

| Cột | Số dòng |
|---|---|
| `Property.provinceId` / `districtId` / `wardId` / `oldWardId` | 0 / 0 / 0 / 0 |
| **`Property.locationId`** | **4** |
| `Project.provinceId` / `districtId` / `wardId` | 0 / 0 / 0 |
| `Requirement.locationId` | 0 |

⚠️ Nếu chỉ kiểm `districtId` như lần khảo sát đầu thì đã kết luận sai là "0 dòng".

**4 tin đó vẫn an toàn** vì: (a) `provinceId` + `districtId` của cả 4 đều trỏ đúng dòng
Nghệ An/Hà Tĩnh — đây mới là các FK mà khối trang chủ và bộ lọc dùng; (b) `locationId` là
FK cũ, không truy vấn nào join `Location` rồi lọc `isActive` (đã rà: nó chỉ dùng làm bộ
lọc theo id, thuộc tính filter của Meilisearch, "tin tương tự", và cột xuất CSV admin).

**Ghi nhận lỗi dữ liệu có sẵn, KHÔNG sửa trong đợt này:** tin `10fu6`
("Thị xã Hoàng Mai, Nghệ An") có `locationId` trỏ tới **Phường Tân Mai, Quận Hoàng Mai,
Hà Nội** — trùng tên "Hoàng Mai". Không ảnh hưởng hiển thị vì `districtId` đúng.

## Đã làm

```sql
-- Sao lưu trước: /root/backup-truoc-don-location-2026-08-21.sql.gz (749K, 11708 dòng Location)
begin;
update "Location" set "isActive"=false
 where path not like 'nghe-an%' and path not like 'ha-tinh%' and "isActive"=true;
-- UPDATE 11437
commit;
```

Chọn `isActive=false` chứ không `DELETE`: lùi được bằng một câu lệnh, và giữ nguyên FK cho
4 tin ở trên. Trước khi chạy đã xác nhận **cả 11.437 dòng rác đều đang `isActive=true`**
(0 dòng đã tắt sẵn) ⇒ câu lệnh lùi bên dưới khôi phục đúng trạng thái cũ, không bật thừa.

## Kết quả — đối chiếu site trước/sau

| Chỉ số | Trước | Sau |
|---|---|---|
| `sections` trang chủ | 12 khối | **12 khối** |
| khối `districts` | 10 tab | **10 tab** |
| khối `wards-new` | 7 tab | **7 tab** |
| `stats` | 159 tin / 41 user / 2 dự án | **giống hệt** |
| `/khu-vuc` mục "Phường/xã cũ" | 12 | **12** |
| `/api/v1/locations` | 33 | **33** |
| 4 tin có `locationId` rác | — | cả 4 vẫn **200** |
| `Location` còn `isActive` | 11.708 | **271** (đúng 2 tỉnh) |

DB Hà Nội **không cần dọn**: 736/736 dòng đều thuộc `ha-noi/*`.

## Lùi lại nếu cần

```sql
update "Location" set "isActive"=true
 where path not like 'nghe-an%' and path not like 'ha-tinh%' and "isActive"=false;
```

Hoặc khôi phục toàn bộ DB:
```
gunzip -c /root/backup-truoc-don-location-2026-08-21.sql.gz | docker exec -i bds-postgres-prod psql -U bds_user -d bds_db
```

## ⚠️ Cảnh báo giữ nguyên từ plan 04

**Tuyệt đối không dùng `backend/src/scripts/import-locations.ts` để dọn việc này.** Script
hardcode chỉ đọc thư mục dữ liệu `hanoi`; chạy trên DB Nghệ An sẽ tắt **sai toàn bộ** 271
dòng dữ liệu thật.
