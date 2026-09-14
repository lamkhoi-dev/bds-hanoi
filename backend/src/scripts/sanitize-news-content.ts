/**
 * Làm sạch HTML của các bài tin tức ĐÃ CÓ TRƯỚC khi có `sanitizeNewsHtml` (12/9) — trình
 * soạn thảo cũ (`SimpleEditor` qua `document.execCommand`) không lọc gì cả, nội dung có thể
 * còn `<b>`/`<font>`/`<div align>` hoặc (hiếm) ảnh dán trực tiếp base64 chưa bị chặn.
 *
 * An toàn:
 *   - Sao lưu TOÀN BỘ `content` gốc ra file JSON trước khi ghi bất cứ dòng nào.
 *   - Chỉ GHI ĐÈ bài có nội dung THỰC SỰ đổi sau khi làm sạch — bài đã sạch từ trước
 *     (đăng qua trình soạn thảo mới) không bị đụng tới, không đẩy `updatedAt`.
 *   - Báo cáo ĐỘ DÀI CHỮ THUẦN trước/sau mỗi bài — làm sạch không được LÀM MẤT CHỮ, chỉ
 *     được đổi thẻ/thuộc tính. Lệch độ dài là dấu hiệu sanitize cắt nhầm nội dung thật,
 *     dừng lại để người chạy tự xem, không tự động ghi bài đó.
 *
 * Chạy thử:  node dist/scripts/sanitize-news-content.js
 * Ghi thật:  node dist/scripts/sanitize-news-content.js --apply
 */
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { sanitizeNewsHtml, newsPlainText } from '../news/news-html';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

function sanitizeOptions() {
  const internalHosts = (process.env.FRONTEND_URL || '').split(',').map((s) => s.trim()).filter(Boolean);
  const mediaBaseUrls = [process.env.PUBLIC_UPLOAD_BASE_URL].filter(Boolean) as string[];
  return { internalHosts, mediaBaseUrls };
}

async function main() {
  const rows = await prisma.news.findMany({ select: { id: true, slug: true, content: true } });
  console.log(`Kiểm ${rows.length} bài.\n`);

  const options = sanitizeOptions();
  const toWrite: { id: string; slug: string; before: string; after: string }[] = [];
  const suspicious: { id: string; slug: string; before: number; after: number }[] = [];
  let unchanged = 0;

  for (const row of rows) {
    const cleaned = sanitizeNewsHtml(row.content, options);
    if (cleaned === row.content) {
      unchanged++;
      continue;
    }
    const beforeLen = newsPlainText(row.content).length;
    const afterLen = newsPlainText(cleaned).length;
    if (afterLen < beforeLen) {
      suspicious.push({ id: row.id, slug: row.slug, before: beforeLen, after: afterLen });
      continue; // KHÔNG ghi — cần người chạy tự xem lại bài này.
    }
    toWrite.push({ id: row.id, slug: row.slug, before: row.content, after: cleaned });
  }

  console.log(`Không đổi gì: ${unchanged}`);
  console.log(`Sẽ làm sạch:  ${toWrite.length}`);
  for (const w of toWrite.slice(0, 30)) console.log(`  ${w.slug}`);
  if (toWrite.length > 30) console.log(`  … và ${toWrite.length - 30} bài nữa`);

  if (suspicious.length > 0) {
    console.log(`\n⚠ ${suspicious.length} bài BỊ BỎ QUA vì làm sạch có thể mất chữ — tự kiểm tay:`);
    for (const s of suspicious) console.log(`  ${s.slug}: chữ thuần ${s.before} -> ${s.after} ký tự`);
  }

  if (!apply) {
    console.log('\nCHẠY THỬ — thêm --apply để ghi thật.');
    return;
  }

  if (toWrite.length === 0) {
    console.log('\nKhông có gì để ghi.');
    return;
  }

  const backupDir = path.resolve(process.cwd(), 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `news-content-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(toWrite.map(({ id, slug, before }) => ({ id, slug, content: before })), null, 2));
  console.log(`\nĐã sao lưu nội dung gốc: ${backupPath}`);

  // Raw SQL để không đụng `updatedAt`/`contentUpdatedAt` — đây là dọn định dạng kỹ thuật,
  // không phải một lần "sửa nội dung" mà độc giả cần thấy "ngày cập nhật" nhảy theo.
  for (const w of toWrite) {
    await prisma.$executeRaw`UPDATE "News" SET "content" = ${w.after} WHERE "id" = ${w.id}`;
  }
  console.log(`ĐÃ GHI — làm sạch ${toWrite.length} bài.`);
}

main()
  .catch((e) => {
    console.error(e?.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
