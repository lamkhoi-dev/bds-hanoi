/**
 * Nhập BỔ SUNG phường/xã cũ của TP Vinh vào CSDL nhadatxunghe.vn.
 *
 * Vì sao là script riêng chứ không dùng `import-locations.ts`: script kia nhập TOÀN BỘ
 * cây của một tỉnh và đặt `isActive = false` cho mọi bản ghi không có trong file. Nạp
 * một file chỉ chứa 33 xã cũ vào đó là tắt sạch khu vực Nghệ An/Hà Tĩnh đang chạy.
 * Script này CHỈ THÊM/CẬP NHẬT, không bao giờ vô hiệu hoá hay xoá bất cứ bản ghi nào.
 *
 * Đoạn URL được chọn lúc chạy, đối chiếu với các segment ĐANG CÓ trong CSDL, theo đúng
 * thứ tự ưu tiên của importer Hà Nội: {slug} -> {slug}-cu -> {slug}-vinh-cu -> -N.
 *
 * Chạy thử (không ghi):  node dist/src/scripts/import-vinh-old-wards.js
 * Chạy thật:             node dist/src/scripts/import-vinh-old-wards.js --apply
 */
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient, LocationType } from '@prisma/client';
import { slugify, stripAccents } from '../property/property-utils';
import { stripUnitPrefix } from '../location/location-utils';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

const DATA_FILE = path.join(__dirname, '..', '..', 'prisma', 'data', 'nghe-an', 'old-wards-vinh.json');

interface Payload {
  parentDistrict: { matchNames: string[]; displayName: string };
  oldWards: { name: string; externalRef: string }[];
}

function norm(s: string): string {
  return stripAccents(String(s || ''))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function main() {
  const payload: Payload = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

  // ---------- Tìm quận cha ----------
  const districts = await prisma.location.findMany({
    where: { type: LocationType.DISTRICT },
    select: { id: true, name: true, shortName: true, path: true, urlSegment: true },
  });
  const wanted = new Set(payload.parentDistrict.matchNames.map(norm));
  const matches = districts.filter(
    (d) => wanted.has(norm(d.name)) || wanted.has(norm(d.shortName ?? '')),
  );

  if (matches.length === 0) {
    throw new Error(
      `Không tìm thấy quận/huyện "${payload.parentDistrict.displayName}". ` +
        `Script này chỉ chạy trên CSDL Nghệ An, không phải Hà Nội.`,
    );
  }
  if (matches.length > 1) {
    // Không đoán: hai đơn vị cùng tên thì phải người quyết định.
    throw new Error(
      `Có ${matches.length} quận/huyện khớp "${payload.parentDistrict.displayName}": ` +
        matches.map((m) => `${m.name} (path=${m.path})`).join(' | '),
    );
  }
  const parent = matches[0];
  console.log(`Quận cha: ${parent.name} (path=${parent.path})`);

  // ---------- Tập segment đang dùng ----------
  const allSegments = await prisma.location.findMany({ select: { urlSegment: true } });
  const used = new Set(allSegments.map((s) => s.urlSegment).filter(Boolean) as string[]);

  const existingChildren = await prisma.location.findMany({
    where: { parentId: parent.id, type: LocationType.OLD_WARD },
    select: { id: true, slug: true, name: true, urlSegment: true, isActive: true },
  });
  const bySlug = new Map(existingChildren.map((c) => [c.slug, c]));

  const stats = { created: 0, updated: 0, unchanged: 0 };
  const plan: string[] = [];

  for (let i = 0; i < payload.oldWards.length; i++) {
    const w = payload.oldWards[i];
    const shortName = stripUnitPrefix(w.name);
    const slug = slugify(shortName);
    const existing = bySlug.get(slug);

    if (existing) {
      // Đã có: KHÔNG đụng vào urlSegment (URL có thể đang được Google index), chỉ bảo
      // đảm bản ghi đang bật và tên hiển thị khớp nguồn.
      const needsUpdate = existing.name !== w.name || existing.isActive !== true;
      if (!needsUpdate) {
        stats.unchanged++;
        continue;
      }
      stats.updated++;
      plan.push(`  CẬP NHẬT  ${w.name}  (segment giữ nguyên: ${existing.urlSegment})`);
      if (apply) {
        await prisma.location.update({
          where: { id: existing.id },
          data: { name: w.name, shortName, isActive: true, externalRef: w.externalRef },
        });
      }
      continue;
    }

    // Chưa có: chọn segment còn trống theo đúng thứ tự ưu tiên của importer Hà Nội.
    const candidates = [slug, `${slug}-cu`, `${slug}-${slugify(stripUnitPrefix(parent.name))}-cu`];
    let segment = candidates.find((c) => c && !used.has(c));
    if (!segment) {
      let n = 2;
      const base = `${slug}-cu`;
      while (used.has(`${base}-${n}`)) n++;
      segment = `${base}-${n}`;
    }
    used.add(segment);

    stats.created++;
    plan.push(`  THÊM      ${w.name}  ->  /${segment}`);
    if (apply) {
      await prisma.location.create({
        data: {
          name: w.name,
          shortName,
          type: LocationType.OLD_WARD,
          parentId: parent.id,
          slug,
          urlSegment: segment,
          path: `${parent.path}/${segment}`,
          depth: 2,
          sortOrder: i,
          externalRef: w.externalRef,
          isActive: true,
        },
      });
    }
  }

  console.log(plan.join('\n') || '  (không có thay đổi)');
  console.log(
    `\n${apply ? 'ĐÃ GHI' : 'CHẠY THỬ'} — thêm ${stats.created}, cập nhật ${stats.updated}, ` +
      `giữ nguyên ${stats.unchanged}.`,
  );
  if (!apply) console.log('Thêm --apply để ghi thật.');
  console.log('KHÔNG bản ghi nào bị vô hiệu hoá hay xoá.');
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
