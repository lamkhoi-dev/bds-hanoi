# Quy trình deploy nhadatxunghe.vn — có đường lùi ở mọi bước

VPS `14.225.255.128` (`bdsnghean-frwo-wszz`). Viết ra để anh duyệt TRƯỚC khi chạy.

---

## Hiện trạng đã khảo sát (chỉ đọc)

| | |
|---|---|
| Thư mục triển khai | `/app` — **không phải git repo**, code copy tay lên, image build tại chỗ |
| Container | 7 cái, chạy 4–5 tuần. `bds-backend-prod` và `bds-caddy` đang **unhealthy** |
| Đĩa | 40G, đã dùng 16G, **còn 23G** — đủ để build song song |
| CSDL | `bds_db` / `bds_user`. 177 tin · 40 người dùng · 11.690 khu vực · 2 tin tức · 153 giao dịch · 290 ảnh |
| Lịch sử migration | 11 bản ghi, **0 bản dở dang** → `migrate deploy` chỉ áp 6 cái mới |
| `.env` | 24 biến, **thiếu 9 biến mới** |

## Đã diễn tập trên bản sao (trên máy dev, không đụng VPS)

6 migration chạy sạch. Đối chiếu trước/sau: **6/6 bảng khớp tuyệt đối, 0 dòng mất**.
`urlSegment` kế thừa slug cũ ⇒ URL đang index không đổi. 172/172 tin giữ nguyên khu vực.

**1 blocker đã vá:** 67 khu vực có slug rỗng (xã cũ Nghệ An) làm migration dừng giữa
chừng. Script `backfill-locations.ts` đã viết và thử xong.

---

## Nguyên tắc

1. **Không xoá gì.** Khu vực 63 tỉnh khác được ẩn bằng bộ lọc `path`, dòng vẫn nằm
   nguyên trong bảng. Bật lại chỉ là đổi một biến môi trường.
2. **Mọi bước phá huỷ đều có ảnh chụp trước đó**: dump CSDL, tar `/app`, tag image.
3. **Dừng ngay khi có bước nào sai**, không chạy tiếp.
4. `SEO_MODE=report` ⇒ **không dời một URL landing nào** của site đang chạy.

---

## Các bước

### B0. Ảnh chụp để lùi (chưa đổi gì đang chạy)

```sh
# CSDL — đã làm lúc khảo sát
ls -lh /root/backups/bds_db-20260815-122156.sql.gz     # 600K, đã kiểm đọc được

# Mã nguồn + cấu hình đang chạy
tar czf /root/backups/app-20260815.tar.gz -C / app

# Image đang chạy -> tag để lùi được
docker tag app-backend:latest  app-backend:rollback-20260815
docker tag app-frontend:latest app-frontend:rollback-20260815
docker images | grep rollback
```

### B1. Lấy mã nguồn mới sang thư mục RIÊNG

`/app` cũ **giữ nguyên**, không đụng. Site vẫn chạy bình thường suốt bước này.

```sh
git clone https://github.com/lamkhoi-dev/bds-hanoi.git /app-new
cd /app-new && git log --oneline -3
```

### B2. Dựng `.env` cho site Nghệ An

Giữ nguyên 24 biến bí mật hiện có, thêm 9 biến mới:

```sh
cp /app/.env /app-new/.env
cat >> /app-new/.env <<'EOF'

# --- Biến mới của đợt nâng cấp ---
SITE_DOMAIN=nhadatxunghe.vn
SITE_NAME=Nhà Đất Xứ Nghệ
PROVINCE_NAME=Nghệ An
# Danh sách: site "xứ Nghệ" phục vụ CẢ Nghệ An lẫn Hà Tĩnh.
PROVINCE_SLUG=nghe-an,ha-tinh
APP_ENV=production
# report = nhận hết bản vá SEO nhưng KHÔNG dời URL landing nào.
SEO_MODE=report
# Bật đúng lần deploy này, xong trả về false.
RUN_MIGRATIONS=false
REDIS_ENABLED=true
FIREBASE_SERVICE_ACCOUNT=
EOF
```

> ⚠️ `FIREBASE_SERVICE_ACCOUNT` để trống thì đăng nhập Facebook/Google qua Firebase
> không chạy. Cần khoá MỚI sau khi thu hồi khoá cũ đã lộ trong lịch sử git.

### B3. Build image mới — site cũ vẫn đang chạy

```sh
cd /app-new
docker compose -f docker-compose.vps.yml build
```

Build xong mà site vẫn chưa đổi gì. Hỏng ở đây thì chỉ cần `rm -rf /app-new`.

### B4. Vá 67 slug rỗng — **bước GHI đầu tiên vào CSDL thật**

```sh
docker compose -f docker-compose.vps.yml run --rm \
  -e RUN_MIGRATIONS=false backend node dist/src/scripts/backfill-locations.js
# đọc kỹ 67 dòng in ra, rồi mới:
docker compose -f docker-compose.vps.yml run --rm \
  -e RUN_MIGRATIONS=false backend node dist/src/scripts/backfill-locations.js --apply
```

Chỉ ghi vào 67 dòng đang thiếu slug. Không đụng dòng nào khác.

### B5. Tiền kiểm lần cuối

```sh
docker compose -f docker-compose.vps.yml run --rm backend node dist/src/scripts/preflight-check.js
```

Còn dòng `[CHẶN]` nào thì **dừng**, không chạy tiếp.

### B6. Đổi sang bản mới — **downtime bắt đầu**

```sh
cd /app     && docker compose -f docker-compose.vps.yml down
cd /app-new && RUN_MIGRATIONS=true docker compose -f docker-compose.vps.yml up -d
docker compose -f docker-compose.vps.yml logs -f backend   # xem migration chạy
```

### B7. Kiểm sau khi lên

```sh
docker ps                                   # 7 container, không còn unhealthy
curl -sI https://nhadatxunghe.vn/           # 200
curl -sI https://www.nhadatxunghe.vn/       # 301 về apex
curl -s  https://nhadatxunghe.vn/robots.txt
curl -sI https://nhadatxunghe.vn/dat-nen/huyen-anh-son   # 200, URL cũ KHÔNG đổi
curl -s  https://nhadatxunghe.vn/sitemap.xml | head -20
```

Đối chiếu số bản ghi với bảng ở đầu file — phải khớp từng con số.

### B8. Trả `RUN_MIGRATIONS` về false

```sh
sed -i 's/^RUN_MIGRATIONS=true/RUN_MIGRATIONS=false/' /app-new/.env
```

---

## Đường lùi

**Hỏng ở B1–B3** (chưa đụng gì): `rm -rf /app-new`. Site không hề bị ảnh hưởng.

**Hỏng ở B4** (đã ghi 67 slug): khôi phục CSDL từ dump.
```sh
gunzip -c /root/backups/bds_db-20260815-122156.sql.gz \
  | docker exec -i bds-postgres-prod psql -U bds_user -d bds_db
```

**Hỏng ở B6+** (đã đổi container): lùi cả code lẫn CSDL.
```sh
cd /app-new && docker compose -f docker-compose.vps.yml down
docker tag app-backend:rollback-20260815  app-backend:latest
docker tag app-frontend:rollback-20260815 app-frontend:latest
gunzip -c /root/backups/bds_db-20260815-122156.sql.gz \
  | docker exec -i bds-postgres-prod psql -U bds_user -d bds_db
cd /app && docker compose -f docker-compose.vps.yml up -d
```

---

## Sau khi chạy ổn

- Nhập xã cũ TP Vinh: `node dist/src/scripts/import-vinh-old-wards.js` (thử) rồi `--apply`.
  33 đơn vị, chỉ thêm, không tắt gì.
- Gửi lại sitemap trong Search Console, theo dõi 2 tuần.
- Chỉ đổi `SEO_MODE=enforce` nếu khách muốn dời URL landing sang dạng `/ban/...`.
