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

---

# TIẾN ĐỘ — 26/08/2026

Tất cả đã commit, **chưa deploy** (push GitHub đang kẹt credential — 6 commit chờ).
Test: **132 backend** (+13), **108 frontend** (+6).

## ĐÃ XONG (7/17)

| Mục | Việc | Kiểm chứng |
|---|---|---|
| B1 | Lọc giá + diện tích | 8 test; soi thẳng mệnh đề gửi xuống Prisma/Meili |
| B4 | Bộ đếm view | 5 test; `RETURNING` + vá cache |
| B6 | Popup lọc không tự đóng | hook `useCloseOnNavigate`, áp cho cả 2 lớp bọc |
| B7 | Form lọc chưa tách tỉnh | dùng lại helper đã vá cho form đăng tin |
| C1 | Link tiêu đề 2 khối khu vực | `LOCATION_BLOCK_HREFS` |
| C3 | `/khu-vuc` xếp theo tỉnh | 6 test |
| C4 | `/search?focus=1` | + chặn `focus` rò sang phân trang và API |
| A1–A4 | Dữ liệu 2 tỉnh + importer | file JSON + script chỉ-thêm; **chờ deploy để chạy** |

### Vài chỗ đáng ghi lại

**B4 — giả thuyết đầu SAI.** Tưởng bộ đếm không chạy; đo ra CSDL vẫn tăng đều (toàn site
39.641 lượt). Cái hỏng là `findOne` cache 60 giây còn `incrementView` ghi thẳng SQL, nên
màn hình đứng yên. Sửa bằng vá đúng con số vào cache, KHÔNG xoá cache — xoá là bỏ luôn thứ
giữ trang chi tiết nhẹ.

**B1 — cả hai nhánh truy vấn đều sai**, không riêng Meili. Sửa một chỗ là vẫn lọt.

**A3 — 69 xã mới Hà Tĩnh khớp đúng** số đơn vị hành chính sau sáp nhập, nên tin được.
Xã cũ: 10/13 huyện khớp chính xác số khách ghi; còn dư 3 mục ở Can Lộc, Cẩm Xuyên, Đức Thọ.

## CÒN LẠI (4/17)

- **B2** Link khu vực "Không tải được danh sách tin" — cần xem log lúc lỗi xảy ra.
- **B3** Không bình luận / lưu tin được — cần tài khoản thật để tái hiện (GET bình luận
  trả 200 bình thường, nên lỗi nằm ở nhánh cần đăng nhập).
- **B5** "Tin mới xem" không cập nhật — cùng nhóm cần đăng nhập với B3.
- **C2** Kéo bộ lọc lên trên ở các trang search.
- **C5** Menu 3 gạch "BĐS Hà Tĩnh" đủ 13 huyện — **phụ thuộc A3/A4 đã nạp dữ liệu**.

## CÂU HỎI CHO KHÁCH

1. **TX Kỳ Anh và Huyện Kỳ Anh trùng 3 xã** (Kỳ Châu, Kỳ Hải, Kỳ Tân) — chuyển hẳn sang
   thị xã hay để cả hai nơi? Trùng tên giữa 2 huyện đụng đúng chuyện slug khách từng nêu.
2. **Phường hay xã?** Khách ghi "Xã mới" cho TX Kỳ Anh (Vũng Áng, Sông Trí, Hoành Sơn…)
   nhưng đây là thị xã. Bên em suy phường/xã bằng cách đối chiếu danh sách cũ, ra 4 phường
   (Trần Phú, Hà Huy Tập, Bắc Hồng Lĩnh, Nam Hồng Lĩnh) + Thành Sen. Nhờ xác nhận.
3. Yêu cầu `?focus=1` có chỗ tự mâu thuẫn: "vào /search chuyển sang /search?focus=1" nhưng
   "vào search bình thường thì không autofocus". Bên em làm theo cách tự nhất quán: hỗ trợ
   tham số, không tự chuyển hướng. Nếu khách muốn link nào đó mang sẵn `?focus=1` thì cho
   biết link nào.

---

# BỐN LỖI BẮT ĐƯỢC KHI DEPLOY — 26/08

Đều là lỗi của chính bản sửa, bắt được nhờ chạy thử trên CSDL thật trước khi ghi.

## 1. Ghi dở giữa chừng vì trùng slug (đã ghi 68/269 dòng rồi mới nổ)

`slug` ràng buộc DUY NHẤT theo `(parentId, type)`. Ba cặp xã **có thật** trong cùng một
huyện cho ra cùng slug vì `slugify` bỏ dấu:

```
Kỳ Sơn:   Nậm Càn / Nậm Cắn      -> nam-can
Nghi Lộc: Nghi Văn / Nghi Vạn    -> nghi-van
Quỳ Châu: Châu Bình / Châu Bính  -> chau-binh
```

Bản đầu chỉ đối chiếu với bản ghi ĐÃ CÓ trong CSDL, không theo dõi slug sinh ra trong chính
lượt chạy, nên lần ghi thứ hai mới nổ — và nổ giữa chừng. Sửa: cái sau nhận hậu tố số ở cột
`slug`, còn `urlSegment` vẫn dựng từ dạng đọc được.

## 2. Suýt biến xã này thành xã kia

Nghiêm trọng nhất. Importer tra bản ghi theo `slug`, nên khi gặp "Xã Nậm Cắn" nó **tìm thấy
bản ghi "Xã Nậm Càn"** rồi định ĐỔI TÊN bản ghi đó — mất hẳn một xã. Chạy thử in ra đúng
dòng này mới lộ:

```
CẬP NHẬT  Huyện Kỳ Sơn / Xã Nậm Cắn  (giữ URL nam-can)
```

Sửa: khớp theo **TÊN**, không theo slug. Tên là thứ duy nhất phân biệt được hai xã đó.
Sau khi sửa, chạy thử ra "cập nhật 0" — đúng, vì dữ liệu toàn xã mới.

## 3. Sửa nhầm nhánh — deploy xong không có tác dụng gì

Payload có hai chỗ trông giống nhau: `sections[]` (thứ frontend thật sự đọc) và
`locationBlocks` (field cũ giữ lại cho consumer chưa chuyển). Lần đầu gắn `href` vào
`locationBlocks`, deploy xong đo lại `sections[].href` vẫn `None`. Đã chuyển sang
`locationSection()` và thêm test canh.

## 4. Khớp huyện quá rộng

`matchNames` chứa cả tên trần, mà Hà Tĩnh có **cả "Huyện Kỳ Anh" lẫn "Thị xã Kỳ Anh"** —
`shortName` của cả hai đều là "Kỳ Anh". Mỗi huyện sẽ khớp 2 bản ghi và script dừng vì luật
"không đoán". Sửa: thử tên đầy đủ trước, không có mới nới ra.

> Cả 4 lỗi đều lộ ra nhờ bước **chạy thử trước khi ghi**. Nếu importer không có chế độ đó
> thì lỗi 2 đã âm thầm làm hỏng dữ liệu địa giới của site đang chạy.
