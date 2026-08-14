# Review dự án Website-BDS + đối chiếu VPS 14.225.255.128

Ngày review: 2026-08-13 · Repo: https://github.com/LofizDev/Website-BDS · Domain: https://nhadatxunghe.vn

---

## 1. Tổng quan repo

| Mục | Giá trị |
|---|---|
| Nhánh up-to-date | **`origin/main`** — `553858d`, 15/07/2026 00:36 |
| `origin/devhuy` | `29107d4`, 15/07/2026 00:36 — đã merge hết vào main (main +5 / devhuy +0) |
| `origin/feature/update-seo-ui-config` | `fa975d7`, 28/06/2026 — **cũ, main hơn 272 commit** → nên xoá |
| Kiến trúc | npm workspaces monorepo: `frontend` (Next 16 + React 18 + Tailwind 3) · `backend` (NestJS 11 + Prisma 6) |
| Hạ tầng | Postgres 15 · Redis 7 · MeiliSearch 1.7 · MinIO · Caddy 2 (TLS tự động) |
| Quy mô | backend 75 file TS / ~9.2k dòng · frontend 120 file / ~17.4k dòng · 60 route page |
| Data model | 27 model Prisma, 11 migration — **đã apply đủ trên prod, không drift** |

## 2. Trạng thái VPS

Debian 12 · 4 vCPU · 3.8 GB RAM (đang dùng 2.4 GB, **swap = 0**) · disk 40 GB (42%) · uptime 33 ngày.
Docker 29.6.1, compose project `app` tại `/app`, file `docker-compose.vps.yml`.

7/7 container chạy. Site trả **HTTP 200** (`/`, `/api/v1/health`, `/api/v1/properties`), TLS Let's Encrypt hợp lệ.
DB có dữ liệu thật: 177 Property · 40 User · 290 PropertyImage · 153 Transaction.

## 3. KẾT LUẬN ĐỒNG BỘ: **CHƯA ĐỒNG BỘ**

`/app` **không phải git repo** → deploy bằng copy file thủ công. Image build **14/07 08:16**, trong khi main HEAD là **15/07 00:36**.

Dấu vết: `backend/src` copy nguyên khối lúc **10/07 11:41**, sau đó chỉ patch tay đúng 1 file `property.service.ts` ngày **12/07**. `frontend/src` copy ~10/07 nhưng nhiều file vẫn là bản 28/06–08/07.

**7 file source lệch** (216/220 file còn lại khớp 100%):

| File | VPS đang chạy | main có thêm | Ảnh hưởng |
|---|---|---|---|
| `backend/.../property.controller.ts` | `await incrementView()` | non-blocking `.catch()` | Chậm khi mở chi tiết tin |
| `backend/.../property.service.ts` | không cache | cache `property:{id}` + `clearPropertyCache()` | Tăng tải DB |
| `backend/.../requirement.service.ts` | chỉ hiện phường mới | `phường mới (phường cũ)` | Sai hiển thị địa chỉ |
| `backend/.../viewed-property.service.ts` | 2–3 query | `upsert` 1 query | Chậm hơn |
| `frontend/.../news/[slug]/page.tsx` | `force-dynamic` + `no-store` | ISR `revalidate: 300` | Render lại mọi request |
| `frontend/.../tin/[slug_id]/page.tsx` | `<PropertyDetailClient />` | truyền `initialProperty` | **Mất SSR → xấu SEO trang tin** |
| `frontend/src/lib/axios.ts` | không timeout | `timeout: 10000` | Treo vô hạn khi API chậm |

Thiếu commit: **`29107d4` "Finalize MVP"** (15/07) và **`220165e`** (oldWard trong requirement, 10/07 14:40).

### 3.1 Đối chiếu đầy đủ cây file (phạm vi Docker build: `backend/` + `frontend/`)

VPS 387 file · main 323 file.

| Nhóm | Số lượng | Nội dung |
|---|---|---|
| **Dư trên VPS** | 65 | Rác main đã xoá: `ssh_test1–9.js`, `ssh-script.js`, `ssh_sync.js`, `deploy_vps*.js` (5), `check*.js` (4), `fix_*.js` (4), `test*.js` (7), `update_vps*.js`/`update_env.js`/`update_guard_vps.js`, `seed_avatars_*.js`, `upload_vps.js`, `reset_pass.js`, `get_admin_pass.js`, `ui_tester.js`, `build_log.txt`, `test_output.txt`… + `frontend/*.pem` (cert test), `frontend/tsconfig.tsbuildinfo`, `frontend/next-env.d.ts` (artifact), `frontend/.env` (config, đúng là không commit) |
| **Thiếu trên VPS** | 1 | `backend/clear_logs.js` — vô hại |
| **Khác nội dung** | 10 | 7 file code chạy thật (bảng trên) + 3 file phụ trợ: `backend/delete_logs.js`, `backend/scripts/seed-sample.ts`, `frontend/toggle-local-dns.bat` |

**Không có file nào trên VPS mới hơn main** — cả 10 file lệch đều khớp chính xác một commit cũ trong lịch sử git → không ai sửa code trực tiếp trên server, deploy đè không mất gì.

Ngoài `backend/`+`frontend/`, `/app` root còn 1 bản backend source phẳng (`src/`, `prisma/`, `scripts/`, `nest-cli.json`, `tsconfig.json`…) sót từ layout deploy cũ — **không được Docker dùng** (build context là `./backend`), chỉ gây nhầm lẫn.

### 3.2 🔴 BLOCKER: main hiện KHÔNG build được backend

`backend/Dockerfile` dòng 18–21:
```
COPY --from=builder /app/start.sh ./start.sh
RUN sed -i 's/\r$//' ./start.sh && chmod +x ./start.sh
CMD ["./start.sh"]
```
Nhưng **`backend/start.sh` không tồn tại trong main** — bị commit `f0265ac` "chore: clean up backend and frontend garbage scripts" xoá nhầm cùng đám script rác. Trong repo chỉ còn bản `extract_test/backend/start.sh`.

→ `docker compose -f docker-compose.vps.yml build backend` từ clone sạch của main sẽ **fail ngay tại COPY**. Phải khôi phục file này trước khi deploy. Nội dung (lấy từ VPS, giống hệt `extract_test/backend/start.sh`):
```sh
#!/bin/sh
set -e
echo "Starting application..."
if [ -f "dist/src/main.js" ]; then
  node dist/src/main.js
else
  node dist/main
fi
```
Lưu ý thêm: `start.sh` **không chạy `prisma migrate deploy`** → migration không tự áp khi deploy, phải chạy tay.

⚠️ Lưu ý khi deploy: bản main của `viewed-property.service.ts` **bỏ kiểm tra** `status ∈ {APPROVED, SOLD}` và `deletedAt` → sẽ ghi lượt xem cho cả tin đã xoá/chờ duyệt. Nên cân nhắc thêm lại check này trước khi lên prod. (Unique index `ViewedProperty_userId_propertyId_key` đã tồn tại trên DB nên `upsert` chạy được.)

## 4. Vấn đề phát hiện

### 🔴 Nghiêm trọng — xử lý ngay
1. **MinIO mở public + mật khẩu mặc định.** `http://14.225.255.128:9001` trả HTTP 200, `.env` vẫn để `MINIO_ROOT_USER=admin` / `MINIO_ROOT_PASSWORD=admin123`. Bất kỳ ai cũng đọc/xoá/thay được toàn bộ ảnh upload.
2. **Private key Firebase bị commit lên GitHub public** — 2 file: `nha-dat-xu-nghe-8504d-firebase-adminsdk-fbsvc-23395ac32d.json` (root) và `backend/firebase-service-account.json`. Phải revoke key.
3. **Backend API mở public qua HTTP cổng 4000** → bypass HTTPS, JWT và mật khẩu truyền cleartext.
4. **Không có firewall** (iptables policy ACCEPT, không ufw), **không fail2ban**, SSH root + password cổng 22.
5. **Mật khẩu root VPS đã lộ qua ảnh chat** → đổi ngay.

### 🟠 Cao
6. **`postgres` thiếu `restart: always`** → VPS reboot là DB không lên, site chết.
7. **Không có backup tự động.** `ENABLE_SCHEDULED_BACKUP` không set (mặc định `false`). Backup gần nhất **10/07**, hơn 1 tháng.

### 🟡 Trung bình
8. **Healthcheck Caddy sai hoàn toàn** — chạy `pg_isready` trong container Caddy (copy-paste nhầm từ postgres) → exit 127, unhealthy 96.8k lần. Đồng thời **postgres bị mất healthcheck**.
9. **Healthcheck backend sai** — `wget http://localhost:4000/health`: route thật là `/api/v1/health`, và `localhost` → `::1` trong khi Node bind `0.0.0.0`. Fail 86.6k lần liên tục.
10. **Redis chạy nhưng vô dụng** — code bật qua `REDIS_ENABLED === 'true'`, compose không set biến này → cache rơi về in-memory, Bull queue không đăng ký. Tốn RAM trên máy 3.8 GB không swap.
11. **Không có swap** trên máy 3.8 GB đã dùng 2.4 GB.

### 🟢 Thấp
12. MeiliSearch data từ 23/06, không đồng bộ từ đó.
13. `frontend.env` commit trong repo trỏ IP cũ `103.163.215.39`.
14. Nhánh `feature/update-seo-ui-config` chết, nên xoá.

---

## 5. Kế hoạch xử lý

| # | Việc | Kiểm chứng |
|---|---|---|
| 1 | Đổi mật khẩu root VPS; tạo user non-root + SSH key, tắt `PermitRootLogin` và `PasswordAuthentication` | `ssh` bằng password bị từ chối |
| 2 | Revoke 2 service account Firebase trong Google Cloud Console, tạo key mới, gỡ khỏi git + `.gitignore` | Key cũ gọi API trả 401 |
| 3 | Đổi `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD` trong `.env`, bỏ `ports` 9000/9001 khỏi compose (chỉ đi qua Caddy) | `Test-NetConnection :9001` = False |
| 4 | Bỏ `ports: 4000:4000` của backend khỏi compose | `Test-NetConnection :4000` = False, site vẫn 200 |
| 5 | Cài `ufw` (chỉ mở 22/80/443) + `fail2ban` | `ufw status` = active |
| 6 | Sửa compose: trả healthcheck `pg_isready` về postgres, Caddy dùng `wget /`, backend dùng `wget http://127.0.0.1:4000/api/v1/health`; thêm `restart: always` cho postgres | `docker ps` không còn `(unhealthy)` |
| 7 | Thêm `REDIS_ENABLED=true` vào compose backend (hoặc gỡ hẳn Redis nếu không dùng) | Log backend không còn fallback in-memory |
| 8 | Bật `ENABLE_SCHEDULED_BACKUP=true` + cron `pg_dump` ra ngoài VPS | Có file backup mới trong 24h |
| 8b | **Khôi phục `backend/start.sh` vào main** (commit lại), nếu không backend không build được | `docker compose build backend` chạy qua |
| 9 | Dựng lại `/app` thành **git clone** nhánh `main`, viết script deploy `git pull && docker compose build && up -d` | `git -C /app status` sạch, `git log -1` = `553858d` |
| 10 | Deploy main lên prod (sau khi cân nhắc lại check status ở `viewed-property.service.ts`) | 7 file hết lệch; trang `/tin/[slug]` có HTML SSR trong `view-source` |
| 11 | Thêm 2 GB swap | `free -h` thấy swap |
| 12 | Xoá nhánh `feature/update-seo-ui-config` | `git branch -r` còn main + devhuy |
