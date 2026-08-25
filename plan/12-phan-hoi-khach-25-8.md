# Phản hồi khách 25/08 — 2 file

Nguồn: `Lỗi ngày 25-8 nhadatxunghe.docx` + `Rà soát danh sách xã cũ mới Nghệ An Hà Tĩnh.docx`.

Khách đã rà **từng huyện** danh sách bên mình gửi và trả lời đầy đủ. Tổng 17 đầu việc.

---

## A. DỮ LIỆU ĐỊA GIỚI — khách đã chốt, làm được ngay

### A1. Nghệ An thiếu đúng 7 xã MỚI (123 → 130)

Khách chỉ đích danh, khớp với nghi ngờ trước đó của mình:

| Huyện | Xã mới còn thiếu |
|---|---|
| Nam Đàn | Kim Liên |
| Quỳnh Lưu | Quỳnh Văn |
| Thanh Chương | Đại Đồng, Hạnh Lâm, Kim Bảng |
| Yên Thành | Vân Tụ, Đông Thành |

### A2. Nghệ An — 262 xã CŨ cho 14 huyện: khách DUYỆT

> "OK Ah, bổ sung các xã cũ là được. Xã cũ thì do nhiều thời điểm sáp nhập trước nữa nên
> các kiểu lấy danh sách có thể lệch nhau (điều này cũng không quan trọng lắm nên cũng
> không cần phải đối chiếu tiếp)"

⇒ Nạp nguyên 262 mục. Không cần đối chiếu thêm. Cả 3 xã khách hỏi hôm 21/8 nằm trong đây.

### A3. Hà Tĩnh — 69 xã MỚI (13 huyện)

Khách cung cấp danh sách "Xã mới" cho từng huyện. Tổng cộng **69** — khớp đúng số đơn vị
hành chính của Hà Tĩnh sau sáp nhập, nên gần như chắc chắn đủ.

Hai ghi chú xử lý trùng của khách:
- "cẩm bình nếu cẩm xuyên trùng thì bỏ bên cẩm xuyên" ⇒ **Cẩm Bình** thuộc TP Hà Tĩnh.
- "bỏ xã xuân lam bên H Nghi xuân nếu trùng" ⇒ **Xuân Lam** thuộc TX Hồng Lĩnh.

### A4. Hà Tĩnh — xã CŨ, theo bản khách sửa

Khách sửa số lượng từng huyện. Có 3 huyện khách liệt kê thẳng danh sách đầy đủ (Hương Khê
20, Hương Sơn 22, Thạch Hà 22), 4 huyện ghi "OK" (Lộc Hà, Nghi Xuân, Vũ Quang, Hồng Lĩnh),
còn lại ghi số cần rút gọn.

**TP Hà Tĩnh suy ra được**: khách ghi "trùng 4 xã đã chuyển thành phường, còn 29" — trong 33
mục có đúng 4 cặp tồn tại cả dạng Phường lẫn Xã (Thạch Hưng, Thạch Hạ, Thạch Trung, Đồng
Môn). Bỏ 4 dạng "Xã" ⇒ còn 29. Khớp.

---

## B. LỖI — ưu tiên cao, đang ảnh hưởng người dùng thật

### B1. Bộ lọc giá và diện tích sai — ĐÃ TRUY NGUYÊN XONG

Đo trên API thật: lọc `minArea=50&maxArea=100` ⇒ **37/100 tin `normals` nằm ngoài khoảng**.
Lọc `minPrice=1-2 tỷ` ⇒ **40/75 tin ngoài khoảng**. Tin VIP/UP thì đúng.

**Gốc rễ:** `priceMin/priceMax` và `areaMin/areaMax` KHÔNG phải khoảng giá của tin — chúng là
**biên của bucket** mà tin rơi vào (giá 11 tỷ ⇒ bucket 10–20 tỷ; diện tích 95 ⇒ bucket
80–100). Nhưng cả hai bộ dựng truy vấn đều coi chúng như khoảng thật và ghép bằng OR.

`property-utils.ts:652-655` (nhánh Meilisearch) tách min và max thành **hai mệnh đề AND rời**:

```
(price >= min OR priceMax >= min)  AND  (price <= max OR priceMin <= max)
```

Tin giá 2,5 tỷ (bucket 2–3 tỷ) lọt khoảng hỏi 1–2 tỷ: vế đầu đúng nhờ `price >= min`, vế sau
đúng nhờ `priceMin <= max`. Diện tích 40 (bucket 30–50) lọt khoảng 50–100 theo đường ngược lại.

`property-utils.ts:575-598` (nhánh Prisma) viết đúng dạng OR-2-nhánh nhưng **vẫn sai**: nhánh
bucket khớp mọi tin có bucket giao khoảng hỏi, kể cả tin đã có giá chính xác nằm ngoài.

**Cách sửa:** nhánh bucket chỉ được dùng cho tin **KHÔNG có giá/diện tích chính xác**:

```
(price IS NOT NULL AND price >= min AND price <= max)
OR (price IS NULL AND priceMax >= min AND priceMin <= max)
```

Không xoá hẳn nhánh bucket được: có **11 tin** giá NULL nhưng có bucket (người đăng chọn
khoảng thay vì giá cụ thể), trong đó 9 tin "thoả thuận". Meilisearch 1.7.6 hỗ trợ `IS NULL`.

### B2. Link khu vực "Không tải được danh sách tin" (có ảnh)

Khách: "nhiều lúc không tải được tin, F5 hoặc vào lại vài lần thì mới hiện". Kèm yêu cầu:
nếu thật sự không có tin thì đừng hiện quảng cáo/tin liên quan mà phải hiện thông báo.

### B3. Không bình luận được, không lưu tin được
### B4. Bộ đếm view không hoạt động
### B5. Không cập nhật "tin mới xem" trong menu 3 gạch
### B6. Đổi bộ lọc rồi bấm áp dụng — popup lọc không tự đóng
### B7. Form LỌC tin chưa tách Nghệ An/Hà Tĩnh (form ĐĂNG tin đã tách rồi)

---

## C. YÊU CẦU MỚI

### C1. Link 2 khối khu vực trên trang chủ
- Khối "BĐS Nghệ An": chữ tiêu đề ⇒ `/khu-vuc` (hiện đang trỏ BĐS TP Vinh).
- Khối "BĐS TP Vinh": cả chữ tiêu đề VÀ nút "Tất cả khu vực" ⇒ trang bán BĐS TP Vinh
  (hiện là link phường Thành Vinh và link `/khu-vuc`).

### C2. Kéo bộ lọc lên trên (ngay dưới thanh tìm kiếm) ở các trang search
Áp cho: "Xem tất cả tin VIP", "Xem tất cả tin UP", `/search`, và các link search khác —
giống các landing page khác. Hiện bộ lọc đang nằm dưới cùng.

### C3. `/khu-vuc`: xếp Nghệ An trước, Hà Tĩnh sau (hiện đang lẫn nhau)

### C4. `/search?focus=1`
Khi vào `/search` thì chuyển sang `/search?focus=1`, tự đặt con trỏ vào ô tìm khoá, tự bật
popup tìm kiếm, mobile mở bàn phím nếu trình duyệt cho phép. Vào `/search` thường thì
**không** autofocus. Trang khác dùng chung component Search cũng **không** autofocus.

### C5. Menu 3 gạch: "KHU VỰC" ⇒ đổi tên "BĐS Hà Tĩnh", thêm đủ 13 huyện/tx/tp

Khách chốt phạm vi hiển thị Hà Tĩnh chỉ ở 3 nơi: menu 3 gạch, tab "BĐS Nghệ An" trên trang
chủ (mục TP Hà Tĩnh đã ghim), và `/khu-vuc`.

---

## Thứ tự làm

1. **B1** (lọc giá/diện tích) — sai kết quả tìm kiếm là nặng nhất, đã biết cách sửa.
2. **A1–A4** (dữ liệu) — khách đang chờ, và C5 phụ thuộc dữ liệu Hà Tĩnh.
3. **B3, B4, B5** — cần điều tra, có thể cùng một gốc (đăng nhập/CORS).
4. **C1–C5** — giao diện, làm sau khi dữ liệu xong.
5. **B2, B6, B7**.
