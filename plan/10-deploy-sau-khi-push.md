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
