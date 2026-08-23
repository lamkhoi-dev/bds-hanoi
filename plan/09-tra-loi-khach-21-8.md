# Plan: Xử lý phản hồi khách ngày 21-8

Nguồn: `D:\An\web_bds_hanoi\tra loi câu hỏi.docx` (trả lời 8 câu 18-8) và
`D:\An\web_bds_hanoi\trả lời 21-8.docx` (trả lời câu 21-8 + copy lại bản 18-8 có bổ sung).
File 21-8 là bản MỚI HƠN — nó thêm mã Meta Pixel thật và nói logo đã gửi.

---

## Đã kiểm dữ liệu thật, và có 3 chỗ khách nói LỆCH với DB

Phải nêu trước vì nó đổi cách làm:

**1. Khối "phường/xã cũ" Nghệ An — khách chọn 10 xã, chỉ 7 tồn tại và chỉ 1 có tin.**

Khách liệt kê: Vinh Tân, Hưng Dũng, Hưng Hòa, Nghi Phú, Nghi Phong, Diễn Thành, Diễn Ngọc,
Quán Hành, Hòa Hiếu, Quỳnh Thiện.

| Xã | Trong DB? | Số tin |
|---|---|---|
| Vinh Tân | ✅ OLD_WARD | **8** |
| Hưng Dũng, Hưng Hòa, Nghi Phú, Nghi Phong, Diễn Thành, Diễn Ngọc | ✅ OLD_WARD | **0** |
| Quán Hành, Quỳnh Thiện | ❌ chỉ có trong bộ dữ liệu rác `tinh-*` vừa tắt, và là type WARD | — |
| Hòa Hiếu | ❌ **không tồn tại** | — |

Khối chỉ hiện xã CÓ tin (`groupBy` bỏ nhóm rỗng) ⇒ tick đúng 10 xã khách nêu thì khối
hiện **1 tab Vinh Tân + "Tất cả các khu vực"**. Trong khi 7 xã cũ khác ĐANG có tin lại
không nằm trong danh sách khách: Lê Lợi(4), Đội Cung(3), Lê Mao(2), Trường Thi(2),
Quang Trung(2), Cửa Nam(1), Diễn Bình(1).

**2. Bảng 2 Hà Nội — "Hoàng Liệt, Từ Liêm cho đủ 30" khớp chính xác.** Hiện 28 WARD được
tick; `Phường Hoàng Liệt` và `Phường Từ Liêm` đều có trong DB dạng WARD chưa tick → tick 2
dòng này ra đúng **30**. (Khách viết "2 xã cũ" nhưng câu hỏi là về bảng xã MỚI, và con số 30
chỉ khớp khi hiểu là WARD — nên hiểu theo số.)

**3. `shortName` đã có sẵn 100%** ở cả 2 DB (Nghệ An và Hà Nội, cả 4 cấp) và nó **cắt hết**
tiền tố: "Thành phố Vinh" → "Vinh", "Thị xã Hoàng Mai" → "Hoàng Mai". Việc rút gọn nhãn tab
vì thế **không cần thêm cột nào**, chỉ cần đổi chỗ đọc.

---

## A. Làm được ngay, không chờ khách

### A1. Rút gọn nhãn tab khu vực — cả 2 site

Khách: bỏ "Phường/Xã/Huyện/TX" đầu nhãn, "Thành phố Vinh" viết "TP Vinh", bớt khoảng trắng
để hiện được nhiều tab hơn, nhưng **bấm không được dính 2 tab vào nhau**.

- `buildDynamicLocationBlock` (`property.service.ts`) đang đặt `title: loc.name`. Đổi sang
  `shortName`, riêng cấp thành phố thì thêm tiền tố `TP `.
- Cần một hàm thuần `tabLabel(loc)` ở `homepage-layout.ts` (nơi đã là nguồn duy nhất cho
  chuyện hiển thị theo site) — **không** rải logic vào chỗ dựng khối.
- ⚠️ **Bẫy trùng nhãn**: Hà Tĩnh có CẢ "Huyện Kỳ Anh" và "Thị xã Kỳ Anh", `shortName` của
  cả hai đều là "Kỳ Anh". Bỏ tiền tố mà hai tab cùng xuất hiện thì thành hai tab đọc y
  nhau. Luật chống: trong CÙNG một dải tab, nếu 2 nhãn rút gọn bằng nhau thì cả hai lùi về
  `name` đầy đủ. Áp ở tầng dựng dải, vì chỉ ở đó mới biết có trùng hay không.
- Padding: `PropertyTabs.tsx` đang `px-2.5 py-1.5`. Giảm ngang chứ **không** giảm dọc —
  chiều cao là vùng bấm trên điện thoại. Đề xuất `px-2` + `gap-0.5`, giữ `py-1.5`.
- **Kiểm chứng:** dải tab "BĐS Nghệ An" hiện ≥ 5 tab ở 1280px (hiện 3–4); nhãn đọc là
  "TP Vinh / Nam Đàn / Diễn Châu…"; ở 375px hai tab cạnh nhau vẫn cách nhau ≥ 4px.

### A2. Ghim tab "TP. Hà Tĩnh" vào vị trí 3–4 khối "BĐS Nghệ An" — chỉ Nghệ An

TP Hà Tĩnh chỉ **2 tin** nên luật xếp hạng hiện tại (tỉnh chính trước → nhiều tin → mới
nhất) đẩy nó ra khỏi top 9. Khách muốn nó nằm thứ 3–4.

- Thêm khái niệm **ghim** vào `buildDynamicLocationBlock`: một danh sách
  `{ urlSegment, position }` cấu hình trong `homepage-layout.ts` theo layout (`classic` có
  `thanh-pho-ha-tinh` ở vị trí 3; `grouped` rỗng).
- Ghim chèn SAU khi xếp hạng, và chỉ chèn nếu khu vực đó **có tin** — ghim một tab rỗng thì
  bấm vào ra trang trắng.
- **Không** ghim bằng cách sửa `isFeatured` hay thêm cột DB: đây là quyết định trình bày của
  một site, thuộc `homepage-layout.ts`.
- **Kiểm chứng:** khối "BĐS Nghệ An" có "TP. Hà Tĩnh" ở đúng vị trí 3, 9 tab còn lại giữ thứ
  tự tương đối như cũ; khối Hà Nội không mọc thêm tab nào.

### A3. Bật khối "phường/xã cũ" trên trang chủ Nghệ An

- Tick `isFeatured` cho **7 xã khách nêu mà có trong DB**. Tôn trọng đúng danh sách khách.
- **Báo lại khách** 3 xã không tồn tại (Quán Hành, Hòa Hiếu, Quỳnh Thiện) và việc khối sẽ
  chỉ hiện 1 tab (Vinh Tân) cho tới khi tin mới tích lũy — khách đã lường trước điều này
  ("số này sẽ tăng dần"), nhưng vẫn phải nói rõ vì 1 tab trông như lỗi.
- Kèm câu hỏi: có tick thêm 7 xã cũ ĐANG có tin (Lê Lợi, Đội Cung, Lê Mao, Trường Thi,
  Quang Trung, Cửa Nam, Diễn Bình) để khối đầy ngay không?
- Tab "Tất cả các khu vực" → `/khu-vuc` đã có sẵn, khớp yêu cầu "link dẫn đến danh sách khu vực".
- **Kiểm chứng:** `sections` của `/api/v1/properties/homepage` có `wards-old`.

### A4. Tick 2 xã mới Hà Nội cho đủ 30

`Phường Hoàng Liệt` + `Phường Từ Liêm` (type WARD) → `isFeatured=true`. 28 → **30**.
**Kiểm chứng:** `select count(*) … where type='WARD' and isFeatured` = 30.

### A5. Meta Pixel — KHÔNG cần sửa code

`layout.tsx:167` đã đọc `settings?.facebookPixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID`,
tức `SystemSettings` **thắng** env. Nên chỉ cần vào `/admin/settings` của từng site điền:

| Site | Pixel ID |
|---|---|
| nhadatxunghe.vn | `1731533327967405` |
| sanbdshanoi.vn | `1385282836865273` |

Không rebuild, không deploy. **Kiểm chứng:** `curl` trang chủ mỗi site thấy đúng `fbq('init', '<id>')`.

### A6. Bỏ hẳn việc "ánh xạ xã cũ → xã mới"

Khách chốt: *"Phường xã cũ và mới là 2 field ngang hàng, không phụ thuộc vào nhau… chỉ cần
thuộc quận huyện"*. Đúng như hệ thống đang làm ⇒ **không có việc gì phải làm**, gạch khỏi
danh sách chờ. Ghi lại quyết định này vào comment ở `LocationPicker` để lần sau không ai
"sửa" thành phụ thuộc.

---

## B. Cần thiết kế cẩn thận — làm sau khi anh xem qua

### B1. Khối "KHU VỰC HOT" = khớp từ khóa, không phải đơn vị hành chính

Khách trả lời rõ (và đây là câu chặn lâu nhất): khu vực hot **không thuộc quận/huyện/phường
nào**; tin được lấy khi **nội dung tin chứa đúng cụm từ giống hệt tên khu vực** — không mở
rộng, không khớp lẻ từng từ, **bắt buộc đúng 100%**; sai chính tả nhỏ thì "nếu khó thì
không lấy".

Nghĩa là nó KHÔNG phải `Project` (khác hẳn giả định ban đầu) và cũng không phải `Location`.
Thiết kế đề xuất:

- Bảng mới `HotArea { id, name, slug, sortOrder, isActive, siteScope }` — 31 tên Bảng 4.
  Không dùng `Location` vì nó không có cha hành chính và sẽ làm bẩn cây địa giới + `/khu-vuc`.
- Truy vấn: `title contains name` **hoặc** `description contains name`, `mode:'insensitive'`.
  Chốt phạm vi khớp là `title + description` (khách nói "trong tin"). **Không** dùng
  Meilisearch cho việc này: nó tokenize và khớp mờ, đúng thứ khách bảo KHÔNG được làm.
- Bỏ qua sai chính tả — khách đã cho phép ("nếu khó thì… không lấy vào").
- 31 tên × 1 query là quá nhiều cho trang chủ ⇒ chỉ lấy N khu vực đầu theo `sortOrder`, và
  khối này vốn nằm sau cache 60s như các khối khác.
- Builder `'hot-areas': () => null` đã đăng ký đúng vị trí thứ 5 trong `HOMEPAGE_LAYOUTS.grouped`
  ⇒ chỉ cần viết thân hàm, không đổi bố cục.
- Ecopark (thực tế thuộc Hưng Yên): vì khớp theo từ khóa chứ không theo địa giới nên **giữ**,
  không mâu thuẫn gì.
- **Kiểm chứng:** tạo 1 tin mẫu có "Vinhomes Smart City" trong tiêu đề → xuất hiện đúng tab
  đó; 1 tin có "Vinhomes Ocean Park" → **không** lọt vào tab "Vinhomes Smart City".

### B2. Tên trùng nhiều quận ở Hà Nội — slug kèm tên quận

Khách: giữ TẤT CẢ tên trùng (chúng là đơn vị hành chính khác nhau, không phải dữ liệu thừa),
và phân biệt bằng slug kèm quận: `/minh-khai-hai-ba-trung`, `/minh-khai-bac-tu-liem`,
`/minh-khai-hoai-duc`. Khách còn chỉ ra Phúc Thọ có "Vân Phúc" — bỏ dấu thành trùng "Van Phuc".

- Phải đếm trước xem có bao nhiêu cụm trùng trong 579 OLD_WARD + 126 WARD của Hà Nội, rồi
  mới quyết định đổi `urlSegment` cho **toàn bộ** hay chỉ nhóm bị trùng. Đổi toàn bộ thì URL
  dài và xấu cho cả những xã không trùng.
- ⚠️ Nghiêm trọng: `import-locations.ts` **khoá theo slug**, và chính chỗ này từng làm mất
  1 dòng ("Thị trấn Yên Viên" và "Xã Yên Viên" cùng slug `yen-vien`). Đổi quy tắc slug phải
  đi cùng việc chạy lại importer và **đối chiếu đúng 736 dòng**.
- Hà Nội đang `SEO_MODE=enforce` và **chưa go-live, robots chặn hết** ⇒ đây là thời điểm duy
  nhất đổi URL mà không mất gì. Làm sau go-live là dời URL đã index.
- **Không đụng Nghệ An**: nó đang có thứ hạng, và tên trùng ở đó không phải vấn đề khách nêu.

### B3. Tiền tố "HN" cho nội dung nạp tiền — có một rủi ro khách chưa thấy

Khách muốn **dùng chung một tài khoản ngân hàng** cho 2 site, phân biệt bằng nội dung
chuyển khoản có "HN" ở đầu.

Nội dung hiện tại là `NAP {userId bỏ gạch}` (`payment.controller.ts:32`), và được đọc lại
bằng regex `/NAP\s*([a-zA-Z0-9]+)/i` ở **hai** nơi (`payment.controller.ts:72`,
`payment.service.ts:173`). Thêm "HN" mà không sửa regex thì nó bắt luôn "HN…" thành user id
và **mọi giao dịch Hà Nội sẽ rơi**.

⚠️ **Vấn đề lớn hơn**: một tài khoản ngân hàng ⇒ SePay gửi webhook về **một** URL. Hai site
là **hai database tách rời**. Nên giao dịch của người dùng Hà Nội có thể được webhook về
backend Nghệ An, backend đó tra `userId` trong DB của mình, không thấy, và **bỏ qua tiền**.
Tiền tố "HN" là điều kiện CẦN để phân biệt, nhưng chưa ĐỦ — còn phải trả lời: SePay có gửi
được webhook tới 2 URL không?

- Nếu ĐƯỢC: mỗi backend chỉ xử lý giao dịch có tiền tố của mình, tiền tố lạ thì bỏ qua **im
  lặng** (không log lỗi, không báo động) — cấu hình qua env `DEPOSIT_PREFIX` (rỗng cho Nghệ
  An, `HN` cho Hà Nội).
- Nếu KHÔNG: phải một backend nhận rồi chuyển tiếp, hoặc dùng 2 tài khoản/2 sub-account.
- **Phải xác nhận với SePay trước khi viết code.** Đây là việc dính tiền thật, không đoán.

---

## C. Chờ tài sản / tài khoản từ khách

| Việc | Trạng thái |
|---|---|
| **Logo + favicon Hà Nội** | Khách nói đã gửi `logo ha noi.zip` (đủ .png + .svg) nhưng **KHÔNG có trên máy** — đã tìm cả `D:\An\web_bds_hanoi` và `Downloads`, chỉ thấy `Logo Nghe An.zip`. Cần anh tải về. |
| **SMTP** | 2 hộp thư `Admin@sanbdshanoi.vn` + `contact@sanbdshanoi.vn` đã đăng ký ở PA Vietnam kèm tên miền nhưng **chưa gửi/nhận được**; khách nhờ mình setup. Cần thông tin đăng nhập PA Vietnam. |
| **GA4 + Search Console** | Khách cấp tài khoản Google `nguyenduy20062025@gmail.com`, mình tạo Property mới cạnh cái đã có của nhadatxunghe.vn. Cần mật khẩu/quyền. |
| **Cloudflare** | Dùng bản **miễn phí**, cùng mail trên. Cần tài khoản. |
| **DNS `sanbdshanoi.vn`** | Vẫn chưa trỏ về `222.255.214.136` (site đang chạy trên `222-255-214-136.nip.io`). Tài khoản tên miền ở PA Vietnam. |

Email liên hệ hiển thị trên site Hà Nội: `Admin@sanbdshanoi.vn` / `contact@sanbdshanoi.vn`
→ điền vào `NEXT_PUBLIC_SUPPORT_EMAIL` khi go-live (xem `plan/07-runbook-go-live-ha-noi.md`).

---

## Thứ tự đề xuất

1. **A5** (Meta Pixel) — 2 phút, không cần deploy.
2. **A1 + A2** (nhãn tab + ghim TP Hà Tĩnh) — cùng một file, một nhịp deploy, khách thấy ngay.
3. **A3 + A4** (tick featured) — chỉ SQL, không deploy.
4. **A6** — thêm comment, gạch khỏi danh sách chờ.
5. **B2** (slug Hà Nội) — làm TRƯỚC go-live, có importer + đối chiếu số dòng.
6. **B1** (khu vực hot) — việc lớn nhất, có bảng mới + migration, deploy riêng một nhịp.
7. **B3** (tiền tố HN) — chỉ viết code sau khi xác nhận được SePay.

Mỗi nhịp: `tsc --noEmit` + `jest` sạch cả 2 workspace → commit → deploy **Nghệ An trước**
(A1/A2/A3 ảnh hưởng site thật) → verify → Hà Nội.
