# Các bước deploy sau khi push được `32ff6dd` + `6103ce9`

> **Cập nhật 25/08: ĐÃ PUSH XONG.** `origin/main` giờ ở `edb3007`. Credential GitHub đã hoạt
> động trở lại sau khi dọn tiến trình `git-credential-manager` treo. Không còn chờ gì ở bước
> này nữa.

Sau đó làm đúng thứ tự dưới đây. Hai nhịp tách nhau vì nhịp 2 có **migration**.

---

## Nhịp 1 — Nghệ An (site thật): nhãn tab gọn + ghim TP Hà Tĩnh

Không migration, không đụng dữ liệu.

```bash
cd /app-new && git pull --ff-only origin main
docker compose -f docker-compose.vps.yml build frontend backend
docker compose -f docker-compose.vps.yml up -d frontend backend
```

Kiểm chứng (chờ ~60s cho cache trang chủ hết hạn):

```bash
curl -s https://nhadatxunghe.vn/api/v1/properties/homepage | python3 -c "
import sys,json; d=json.load(sys.stdin)
for s in d['sections']:
    if s.get('kind')=='tabs': print(s['id'], [t['title'] for t in s['tabs']])"
```

Kỳ vọng:
- Khối `districts`: `TP Vinh, Nam Đàn, TP Hà Tĩnh, Diễn Châu, …` — **TP Hà Tĩnh ở vị trí 3**.
- Nhãn không còn "Huyện/Phường/Xã/Thị xã".
- Nếu có cả "Huyện Kỳ Anh" lẫn "Thị xã Kỳ Anh" trong cùng dải thì **cả hai** hiện tên đầy đủ.
- Xem bằng mắt ở 1280px: dải "BĐS Nghệ An" hiện được nhiều tab hơn trước; ở 375px hai tab
  cạnh nhau vẫn bấm tách bạch.

Không được đổi: 12 khối `sections`, số tin/user, `/post` vẫn 200.

## Nhịp 2 — Hà Nội: bảng `HotArea` + 31 khu vực hot + slug xã trùng tên

```bash
cd /app && git pull --ff-only origin main

# 1. Sao lưu TRƯỚC khi chạy migration
docker exec bds-postgres-prod pg_dump -U bds_hanoi_user bds_hanoi_db | gzip > /root/backup-truoc-hotarea-$(date +%F).sql.gz

# 2. Bật migration ĐÚNG MỘT LẦN rồi trả lại false
sed -i 's/^RUN_MIGRATIONS=false/RUN_MIGRATIONS=true/' .env
docker compose -f docker-compose.vps.yml build frontend backend
docker compose -f docker-compose.vps.yml up -d frontend backend
docker logs bds-backend-prod 2>&1 | grep -i migrat | tail -5     # phải thấy 20260823000000_hot_area
sed -i 's/^RUN_MIGRATIONS=true/RUN_MIGRATIONS=false/' .env

# 3. Nạp 31 khu vực hot (chạy thử trước, xem danh sách rồi mới --apply)
docker exec bds-backend-prod node dist/scripts/import-hot-areas.js
docker exec bds-backend-prod node dist/scripts/import-hot-areas.js --apply

# 4. Cập nhật slug xã trùng tên: importer khớp theo (parentId, type, slug) nên đây là
#    UPDATE tại chỗ, KHÔNG tạo dòng mới. Đối chiếu số dòng ngay sau đó.
docker exec bds-backend-prod node dist/scripts/import-locations.js --apply
docker exec bds-postgres-prod psql -U bds_hanoi_user -d bds_hanoi_db -tAc \
  'select count(*) from "Location" where "isActive"'      # PHẢI = 736
```

Kiểm chứng:

```bash
B=https://222-255-214-136.nip.io
# 3 URL đúng như khách nêu
for u in minh-khai-hai-ba-trung minh-khai-bac-tu-liem minh-khai-hoai-duc; do
  echo -n "$u: "; curl -s -k -o /dev/null -w '%{http_code}\n' "$B/ban/$u"; done

# Khối khu vực hot xuất hiện ở đúng vị trí thứ 5
curl -s -k $B/api/v1/properties/homepage | python3 -c "
import sys,json; print([s['id'] for s in json.load(sys.stdin)['sections']])"
```

Kỳ vọng: `sections` có `hot-areas` **đứng giữa `wards-old` và `wards-new`**; 3 URL trên trả
200. Nếu `hot-areas` **không** xuất hiện thì đúng như thiết kế: 18 tin mẫu hiện tại chẳng có
tin nào chứa cụm từ nào trong 31 tên — cần một tin thử để xác nhận.

Thử end-to-end khối khu vực hot:
```bash
# Đăng (hoặc sửa) 1 tin có "Vinhomes Smart City" trong tiêu đề -> phải hiện đúng tab đó.
# Một tin "Vinhomes Ocean Park" KHÔNG được lọt vào tab "Vinhomes Smart City".
```

---

## KHÔNG bật trong đợt này

`DEPOSIT_PREFIX` — code đã xong, mặc định **rỗng** = hành vi cũ. Chỉ đặt `DEPOSIT_PREFIX=HN`
cho Hà Nội **sau khi** xác nhận với SePay rằng webhook gửi được tới 2 URL. Xem cảnh báo đầy
đủ ở `backend/src/payment/deposit-prefix.ts`.

## Lùi lại

Nhịp 1: `git checkout <commit trước> && build && up -d`.
Nhịp 2: khôi phục từ `/root/backup-truoc-hotarea-<ngày>.sql.gz`, và
`git checkout backend/prisma/data/hanoi/locations.hanoi.json` rồi chạy lại importer.

---

# KẾT QUẢ THỰC TẾ — 25/08/2026

Cả hai nhịp đã chạy xong. Ghi lại số đo thật, không phải kỳ vọng.

## Nhịp 1 — Nghệ An (`14.225.255.128:/app-new`, HEAD `6d117bf`)

```
districts -> TP Vinh, Diễn Châu, TP Hà Tĩnh, Nam Đàn, Đô Lương, Hoàng Mai,
             Thái Hoà, Nghi Lộc, Hưng Nguyên, Tất cả các khu vực
wards-new -> Thành Vinh, Trường Vinh, Vinh Phú, Vinh Hưng, Vinh Lộc, Cửa Lò
wards-old -> Vinh Tân, Nghi Phong, Nghi Phú
```

- **TP Hà Tĩnh đứng vị trí 3** ✓ ; nhãn hết tiền tố "Thành phố/Huyện/Thị xã" ✓
- Số tab hiện được: **9** (trước deploy là 6) — đúng mục đích khách nêu.
- 12 khối giữ nguyên; `/`, `/post`, `/ban`, `/nha-dat-ban` đều 200.
- 188 tin (167 còn sống) / 41 user — không đổi.
- **Không có bảng `HotArea`** trên máy này (`RUN_MIGRATIONS=false`) và log backend **0 lỗi**
  ⇒ xác nhận bằng thực nghiệm rằng bố cục `classic` không bao giờ chạm tới nó.

## Nhịp 2 — Hà Nội (`222.255.214.136:/app`, HEAD `6808895`)

- Sao lưu: `/root/backup-truoc-hotarea-2026-08-25.sql.gz` (53K, `gzip -t` hợp lệ).
- Migration `20260823000000_hot_area` áp đúng một lần, `RUN_MIGRATIONS` đã trả về `false`.
- `HotArea` = **31** dòng.
- Importer địa giới: **tạo mới 0 / cập nhật 76 / không đổi 660** → `Location` vẫn đúng **736**.
- 3 URL khách nêu đều **200**: `/ban/minh-khai-hai-ba-trung`, `/ban/minh-khai-bac-tu-liem`,
  `/ban/minh-khai-hoai-duc`.
- `sections` = `vip, ad, districts, wards-old, hot-areas, wards-new, sale-type-tabs,
  rent-type-tabs, project-tabs` — `hot-areas` đúng giữa `wards-old` và `wards-new`.
- Nổi bật: **30** WARD + 32 OLD_WARD.

### Bằng chứng khối "khu vực hot" khớp đúng 100%

```
TAB Vinhomes Smart City  -> Bán liền kề Vinhomes Smart City Mẫu
TAB Vinhomes Ocean Park  -> Bán shophouse Vinhomes Ocean Park Mẫu
TAB Ecopark              -> Bán biệt thự Ecopark Mẫu view hồ
```

Hai tab cùng chữ "Vinhomes" **không lẫn tin của nhau** — đây chính là ca mà Meilisearch sẽ
làm sai vì nó tách từ. 28/31 khu vực chưa có tin nên bị bỏ khỏi dải, đúng thiết kế.

## Một cái bẫy bắt được ngay trước khi ghi

`import-locations.ts:208-227` **xoá sạch `isFeatured` trong phạm vi tỉnh rồi set lại theo
`featured.hanoi.json`**. Hoàng Liệt + Từ Liêm trước đó chỉ được bật bằng SQL, nên lần chạy
importer này sẽ đá **30 → 28**, huỷ đúng thứ khách yêu cầu. Đã đưa hai xã vào file nguồn
(commit `6808895`) rồi mới chạy `--apply`; chạy thử lần hai xác nhận "Nổi bật: 30" mới ghi.

Nghệ An **không** dính bẫy này: `import-locations.ts` khoá cứng vào thư mục dữ liệu Hà Nội
(dòng 45) và chỉ reset trong `provincePath` của Hà Nội. Nhưng lưu ý: 7 xã cũ nổi bật của
Nghệ An hiện **chỉ tồn tại trong DB**, không có file nguồn — khôi phục từ bản sao lưu cũ sẽ
mất chúng.
