/**
 * Sinh lại slug cho các bài tin tức đã bị hỏng bởi hàm slugify cũ.
 *
 * Hàm cũ (`news.service.ts` trước khi sửa) không chuẩn hoá NFD, nên
 *   "Thông qua hồ sơ điều chỉnh" -> "th-ng-qua-h-s-i-u-ch-nh"
 *
 * Script này tính lại slug đúng và đẩy slug cũ vào `previousSlugs` để URL đã được
 * Google index vẫn 301 sang URL mới thay vì 404.
 *
 * Chạy:
 *   node dist/scripts/backfill-news-slugs.js            # xem trước, không ghi
 *   node dist/scripts/backfill-news-slugs.js --apply    # ghi thật
 */
import { PrismaClient } from '@prisma/client';
import { slugify } from '../property/property-utils';

const prisma = new PrismaClient();

async function main() {
  const apply = process.argv.includes('--apply');
  const all = await prisma.news.findMany({
    select: { id: true, title: true, slug: true, previousSlugs: true },
    orderBy: { createdAt: 'asc' },
  });

  const used = new Set(all.map((n) => n.slug));
  const changes: { id: string; title: string; from: string; to: string }[] = [];

  for (const item of all) {
    const desired = slugify(item.title) || 'tin-tuc';
    if (desired === item.slug) continue;

    let next = desired;
    if (used.has(next)) {
      let i = 2;
      while (used.has(`${desired}-${i}`)) i++;
      next = `${desired}-${i}`;
    }
    used.delete(item.slug);
    used.add(next);
    changes.push({ id: item.id, title: item.title, from: item.slug, to: next });
  }

  console.log(`Tổng bài: ${all.length}`);
  console.log(`Cần đổi slug: ${changes.length}`);
  for (const c of changes) {
    console.log(`  ${c.from}\n    -> ${c.to}    (${c.title})`);
  }

  if (!apply) {
    console.log('\nXem trước. Thêm --apply để ghi.');
    return;
  }

  for (const c of changes) {
    const current = await prisma.news.findUnique({
      where: { id: c.id },
      select: { previousSlugs: true },
    });
    await prisma.news.update({
      where: { id: c.id },
      data: {
        slug: c.to,
        previousSlugs: Array.from(new Set([...(current?.previousSlugs ?? []), c.from])),
      },
    });
  }
  console.log(`\nĐã cập nhật ${changes.length} bài.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
