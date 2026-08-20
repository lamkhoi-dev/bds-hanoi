# Runbook: go-live site Hà Nội

Mục đích: khi khách trả lời xong, việc mở site là **thao tác máy móc theo danh sách**,
không phải suy nghĩ lại. Mọi giá trị dưới đây đã đối chiếu với `/app/.env` thật trên VPS
Hà Nội ngày 2026-08-21.

VPS Hà Nội `222.255.214.136`, thư mục `/app`, file `docker-compose.vps.yml`.
Nghệ An `14.225.255.128` thư mục `/app-new` — **không đụng tới trong runbook này**.

Kết nối: `plink -ssh -batch -hostkey "SHA256:0zJ9dGMAS+SybGwowEbxNgBV1Oim9ltfeaPGajdUggo" -pw '<pass>' root@222.255.214.136`

---

## 0. Nguyên tắc phải nhớ

**Biến `NEXT_PUBLIC_*` được nướng vào bundle lúc build ⇒ đổi giá trị phải `build frontend`
rồi `up -d`, chỉ restart là KHÔNG ăn.** Biến không có tiền tố đó (`SITE_LAYOUT`,
`SEO_MODE` phía backend, `SMTP_*`, `PROVINCE_SLUG`) đọc lúc chạy ⇒ chỉ cần `up -d`.

Cột "Cần" dưới đây ghi rõ từng biến thuộc loại nào. Sai chỗ này là nguyên nhân số 1 của
"đã đổi env mà site không đổi gì".

---

## 1. Chặn cứng — không có thì KHÔNG mở được

| # | Thiếu gì | Hệ quả nếu mở khi chưa có |
|---|---|---|
| 1 | **SMTP** (`SMTP_HOST/PORT/USER/PASS/SECURE/FROM`) | Người dùng không nhận được email xác thực ⇒ **không tự đăng ký được**, không đăng tin được. Site coi như chỉ đọc. |
| 2 | **DNS `sanbdshanoi.vn`** + `www` → A record `222.255.214.136` | Caddy không xin được chứng chỉ Let's Encrypt ⇒ site không có HTTPS. `Caddyfile` cần **cả** bản ghi `www`, thiếu nó thì block redirect không cấp cert được. |
| 3 | **Tài khoản ngân hàng + SePay token riêng** | Tiền nạp của người dùng Hà Nội chảy vào **tài khoản của bên Nghệ An** (hiện đang là VPBANK 90718835 – nguyen quang duy). |

---

## 2. Danh sách đổi env, theo đúng thứ tự

| Biến | Hiện tại | Đổi thành | Cần |
|---|---|---|---|
| `SITE_DOMAIN` | `222-255-214-136.nip.io` | `sanbdshanoi.vn` | build frontend (vào `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`) |
| `APP_ENV` | `staging` | `production` | **build frontend** — nếu quên, `robots.txt` vẫn `Disallow: /` và Google không index gì |
| `NEXT_PUBLIC_SUPPORT_PHONE` | `0868126826` (**số Nghệ An**) | hotline Hà Nội | build frontend |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | trống | email Hà Nội | build frontend |
| `NEXT_PUBLIC_FACEBOOK_URL` | trống | Fanpage Hà Nội | build frontend |
| `NEXT_PUBLIC_BRAND_LINE1/2` | trống | 2 dòng chữ cạnh logo | build frontend |
| `NEXT_PUBLIC_GA_ID` | trống | GA4 measurement ID | build frontend |
| `SMTP_*` (6 biến) | trống | thông tin khách cấp | chỉ `up -d backend` |
| `SEO_MODE` | `enforce` ✅ | giữ nguyên | — |
| `SEO_ENFORCE_PAGINATION` | `1` ✅ | giữ nguyên | — |
| `SITE_LAYOUT` | `grouped` ✅ | giữ nguyên | — |
| `PROVINCE_SLUG` | `ha-noi` ✅ | giữ nguyên | — |
| `RUN_MIGRATIONS` | `false` ✅ | giữ `false` (không có migration mới) | — |

Đặt trong `/admin/settings` (không phải env): tài khoản ngân hàng, SePay token,
`googleSearchConsoleId`, `googleAnalyticsId`, `facebookPixelId`.

---

## 3. Việc phải làm trên DB / trong admin

1. **Xoá sạch dữ liệu mẫu.** Hiện có **18 tin + 4 dự án** do bên em tạo để khách xem giao
   diện. Đếm lại trước khi xoá, và chỉ xoá đúng những dòng đó (tin của user `Admin`).
   Nhớ xoá cả tin `10fqp` đang gắn SĐT thử `0912345678`.
2. **Đổi mật khẩu tài khoản admin** `admin@sanbdshanoi.vn` (mật khẩu hiện tại do bên em
   đặt lúc khởi tạo).
3. **Khối "khu vực hot"**: khi khách trả lời, viết thân hàm cho builder
   `'hot-areas': () => null` trong `backend/src/property/property.service.ts` — vị trí thứ
   5 của `HOMEPAGE_LAYOUTS.grouped` đã đặt sẵn, không phải sửa bố cục.
4. **4 xã mới hot còn thiếu** (Bảng 2 đánh số tới 32 nhưng dòng 5, 26, 27, 32 trống) ⇒
   hiện tick được 28/32. Khi khách bổ sung thì tick thêm trong `/admin/locations`.
5. **Vạn Phúc / Minh Khai**: bên em tạm gán Hà Đông và Hai Bà Trưng. Nếu khách nói khác
   thì sửa lại `isFeatured` cho đúng dòng.
6. **Logo + favicon Hà Nội**: thay `frontend/public/banner.svg` và bộ
   `frontend/public/icons/*`. Giữ tên file để không phải sửa code.

---

## 4. Trình tự thao tác

```
# 1. Sao lưu TRƯỚC mọi thứ
docker exec bds-postgres-prod pg_dump -U bds_hanoi_user bds_hanoi_db | gzip > /root/backup-golive-$(date +%F).sql.gz
cp /app/.env /app/.env.bak.golive

# 2. Sửa /app/.env theo bảng mục 2

# 3. Build lại cả hai (backend đọc SEO_MODE/SMTP runtime, nhưng build cho chắc cùng commit)
cd /app && git pull --ff-only origin main
docker compose -f docker-compose.vps.yml build frontend backend

# 4. Bật lên
docker compose -f docker-compose.vps.yml up -d
docker compose -f docker-compose.vps.yml ps        # tất cả phải healthy
```

---

## 5. Kiểm chứng sau go-live (chạy đúng các lệnh này)

```bash
D=https://sanbdshanoi.vn

# a. HTTPS + chứng chỉ + www redirect
curl -sI $D/ | head -1                        # 200
curl -sI https://www.sanbdshanoi.vn/ | head -1  # 301/308 về không-www

# b. robots.txt PHẢI hết Disallow: /   <-- quên build frontend là sai ở đây
curl -s $D/robots.txt | head -5

# c. Dạng URL (SEO_MODE=enforce)
curl -sI $D/ban/dat-nen        | head -1      # 200
curl -sI $D/dat-nen            | head -1      # 301 -> /ban/dat-nen
curl -sI $D/ban/dat-nen?page=1 | head -1      # 301
curl -sI $D/ban/dat-nen?page=0 | head -1      # 404

# d. Sitemap phải mang dạng URL mới, 0 URL dạng cũ
curl -s $D/sitemaps/landing-0.xml | grep -oE "$D/[^<]*" | grep -vcE "$D/(ban|cho-thue)(/|$)"   # phải = 0

# e. Không còn thông tin Nghệ An
curl -s $D/ | grep -c 0868126826              # phải = 0
curl -s $D/ | grep -ciE "nghệ an|xứ nghệ"     # phải = 0

# f. Trang chủ đủ 9 khối (có 'hot-areas' nếu đã làm)
curl -s $D/api/v1/properties/homepage | python -c "import sys,json;print([s['id'] for s in json.load(sys.stdin)['sections']])"

# g. Menu 3 nhóm + 2 dropdown lọc xã
curl -s $D/ | grep -oE "Trung tâm|Cận trung tâm|Ngoại thành" | sort -u
curl -s $D/ban/cau-giay | grep -c "<select"   # >= 2

# h. Dữ liệu mẫu đã xoá
docker exec bds-postgres-prod psql -U bds_hanoi_user -d bds_hanoi_db -tAc \
  'select count(*) from "Property" where "deletedAt" is null'
```

**Kiểm bằng tay (không curl được):** đăng ký 1 tài khoản thật → nhận được email xác thực
(chứng minh SMTP chạy); nạp tiền số nhỏ → tiền vào **đúng** tài khoản Hà Nội; đăng 1 tin
→ admin duyệt được; xem 1 tin trên điện thoại.

---

## 6. Lùi lại nếu sai

```
cp /app/.env.bak.golive /app/.env
cd /app && docker compose -f docker-compose.vps.yml build frontend && docker compose -f docker-compose.vps.yml up -d
```
Khôi phục DB (chỉ khi thật cần): `gunzip -c /root/backup-golive-<ngày>.sql.gz | docker exec -i bds-postgres-prod psql -U bds_hanoi_user -d bds_hanoi_db`

---

## 7. Còn nợ, không chặn go-live

- **Đăng nhập bằng SĐT (OTP Firebase)**: 7 biến `NEXT_PUBLIC_FIREBASE_*` đã có đường dẫn
  trong Dockerfile/compose nhưng **giá trị trống** ⇒ tính năng tắt. Cần khách lập project
  Firebase mới.
- **Meta Pixel**: `NEXT_PUBLIC_META_PIXEL_ID` trống, pixel cũ khách nói đã ngừng hoạt động.
- **Bảng ánh xạ phường/xã cũ → mới**: chưa có ⇒ người đăng tin chọn 2 mục độc lập, hệ
  thống không kiểm tra 2 lựa chọn có khớp nhau không.
