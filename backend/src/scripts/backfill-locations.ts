/**
 * Điền `slug` cho những bản ghi Location đang thiếu, TRƯỚC khi chạy migration
 * 20260814020000_location_url_segments.
 *
 * Vì sao phải là script chứ không phải SQL: slug tiếng Việt cần bỏ dấu
 * ("Phường Hưng Phúc" -> "hung-phuc"), Postgres thuần không làm được nếu không cài
 * thêm extension. Migration cố ý DỪNG khi gặp slug rỗng thay vì bịa giá trị — script
 * này là bước phải chạy trước đó.
 *
 * Đo trên production nhadatxunghe.vn ngày 2026-08-15: 67/11.690 bản ghi thiếu slug,
 * tất cả đều là OLD_WARD (xã cũ được thêm vào mà không sinh slug).
 *
 * NGUYÊN TẮC AN TOÀN:
 *  - CHỈ ghi vào những dòng đang thiếu slug. Dòng đã có slug KHÔNG bị đụng tới, nên
 *    mọi URL đang được Google index giữ nguyên.
 *  - Không xoá, không vô hiệu hoá bất cứ bản ghi nào.
 *  - Mặc định chạy thử. Phải thêm --apply mới ghi thật.
 *
 * Chạy thử:  node dist/src/scripts/backfill-locations.js
 * Chạy thật: node dist/src/scripts/backfill-locations.js --apply
 */
import { PrismaClient } from '@prisma/client';
import { slugify } from '../property/property-utils';
import { stripUnitPrefix } from '../location/location-utils';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

async function main() {
  // `type` ở giai đoạn này vẫn là chuỗi tự do (enum chỉ có sau migration), nên truy vấn
  // thô để không phụ thuộc Prisma Client đã sinh theo schema mới hay chưa.
  const missing = await prisma.$queryRaw<
    { id: string; name: string; parentId: string | null; type: string }[]
  >`SELECT "id", "name", "parentId", "type"::text AS "type"
      FROM "Location"
     WHERE "slug" IS NULL OR trim("slug") = ''
     ORDER BY "name"`;

  console.log(`\nBản ghi Location thiếu slug: ${missing.length}`);
  if (missing.length === 0) {
    console.log('Không có gì phải làm.\n');
    return;
  }

  // Tập slug đang dùng, theo phạm vi (parentId, type) — đúng khoá duy nhất mà
  // migration sẽ tạo: @@unique([parentId, type, slug]).
  const existing = await prisma.$queryRaw<
    { parentId: string | null; type: string; slug: string }[]
  >`SELECT "parentId", "type"::text AS "type", "slug"
      FROM "Location"
     WHERE "slug" IS NOT NULL AND trim("slug") <> ''`;

  const used = new Set(existing.map((r) => `${r.parentId ?? ''}|${r.type}|${r.slug}`));

  // urlSegment sẽ được migration gán = slug rồi tạo UNIQUE toàn cục, nên slug mới
  // cũng phải duy nhất TOÀN CỤC, không chỉ trong phạm vi cha.
  const usedGlobal = new Set(existing.map((r) => r.slug));

  const plan: { id: string; name: string; slug: string }[] = [];

  for (const row of missing) {
    const base = slugify(stripUnitPrefix(row.name)) || slugify(row.name) || 'khu-vuc';

    // Xã CŨ hay trùng tên với phường mới cùng quận -> ưu tiên hậu tố "-cu" cho dễ đọc,
    // rồi mới tới đánh số.
    const candidates =
      row.type === 'OLD_WARD' ? [base, `${base}-cu`] : [base, `${base}-2`];

    let slug = candidates.find(
      (c) => !usedGlobal.has(c) && !used.has(`${row.parentId ?? ''}|${row.type}|${c}`),
    );
    if (!slug) {
      let i = 2;
      const stem = row.type === 'OLD_WARD' ? `${base}-cu` : base;
      while (
        usedGlobal.has(`${stem}-${i}`) ||
        used.has(`${row.parentId ?? ''}|${row.type}|${stem}-${i}`)
      ) {
        i++;
      }
      slug = `${stem}-${i}`;
    }

    used.add(`${row.parentId ?? ''}|${row.type}|${slug}`);
    usedGlobal.add(slug);
    plan.push({ id: row.id, name: row.name, slug });
  }

  for (const p of plan) {
    console.log(`  ${p.name.padEnd(28)} -> ${p.slug}`);
  }

  if (apply) {
    // Một transaction: hoặc điền hết, hoặc không dòng nào — không để nửa vời.
    await prisma.$transaction(
      plan.map(
        (p) => prisma.$executeRaw`UPDATE "Location" SET "slug" = ${p.slug} WHERE "id" = ${p.id}`,
      ),
    );
    console.log(`\nĐÃ GHI ${plan.length} bản ghi.`);
  } else {
    console.log(`\nCHẠY THỬ — chưa ghi gì. Thêm --apply để ghi thật.`);
  }
  console.log('Không bản ghi nào bị xoá hay vô hiệu hoá.\n');
}

main()
  .catch((e) => {
    console.error('\nLỗi:', e.message ?? e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
