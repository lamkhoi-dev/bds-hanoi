/**
 * Vá lại ảnh chèn trong bài tin tức đã lưu SAI đường dẫn trước khi sửa `news-html.ts`
 * (16/9): `isOwnMediaUrl` cắt luôn đoạn `/bds-uploads` khi rút gọn URL tuyệt đối về tương
 * đối, nên `<img src="https://domain/bds-uploads/optimized-....webp">` bị lưu thành
 * `<img src="/optimized-....webp">` — thiếu tầng thư mục, trình duyệt gọi 404, ảnh không
 * hiển thị đúng như khách báo.
 *
 * Sửa `news-html.ts` chỉ chặn được các bài LƯU SAU thời điểm deploy — bài ĐÃ LƯU TRƯỚC ĐÓ
 * vẫn còn nguyên đường dẫn sai trong CSDL, phải vá riêng. Chỉ khớp đúng dạng đường dẫn
 * `optimized-<timestamp>-<số ngẫu nhiên>.webp` (quy ước đặt tên của `upload.controller.ts`)
 * để không đụng nhầm ảnh khác.
 *
 * Chạy thử:  node dist/scripts/fix-news-image-urls.js
 * Ghi thật:  node dist/scripts/fix-news-image-urls.js --apply
 */
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

// `src="/optimized-...` KHÔNG đứng ngay sau `/bds-uploads` -> đường dẫn thiếu tầng thư mục.
const BROKEN_SRC = /src="\/optimized-(\d+-\d+\.webp)"/g;

async function main() {
  const rows = await prisma.news.findMany({ select: { id: true, slug: true, content: true } });
  console.log(`Kiểm ${rows.length} bài.\n`);

  const toWrite: { id: string; slug: string; before: string; after: string; count: number }[] = [];

  for (const row of rows) {
    let count = 0;
    const after = row.content.replace(BROKEN_SRC, (_m, rest) => {
      count++;
      return `src="/bds-uploads/optimized-${rest}"`;
    });
    if (count > 0) toWrite.push({ id: row.id, slug: row.slug, before: row.content, after, count });
  }

  console.log(`Bài cần vá: ${toWrite.length}`);
  for (const w of toWrite) console.log(`  ${w.slug}: ${w.count} ảnh`);

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
  const backupPath = path.join(backupDir, `news-image-urls-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(toWrite.map(({ id, slug, before }) => ({ id, slug, content: before })), null, 2));
  console.log(`\nĐã sao lưu nội dung gốc: ${backupPath}`);

  // Raw SQL — đây là vá đường dẫn kỹ thuật, không phải sửa nội dung, không đụng
  // `updatedAt`/`contentUpdatedAt` (cùng nguyên tắc với `sanitize-news-content.ts`).
  for (const w of toWrite) {
    await prisma.$executeRaw`UPDATE "News" SET "content" = ${w.after} WHERE "id" = ${w.id}`;
  }
  console.log(`ĐÃ GHI — vá ${toWrite.length} bài.`);
}

main()
  .catch((e) => {
    console.error(e?.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
