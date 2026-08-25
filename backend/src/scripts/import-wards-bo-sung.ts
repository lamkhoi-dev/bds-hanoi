/**
 * Nhập BỔ SUNG phường/xã (mới và cũ) cho nhiều huyện cùng lúc — Nghệ An và Hà Tĩnh.
 *
 * Bản tổng quát của `import-vinh-old-wards.ts`, giữ nguyên tính chất quan trọng nhất của
 * script đó: **CHỈ THÊM/CẬP NHẬT, không bao giờ vô hiệu hoá hay xoá bất cứ bản ghi nào.**
 * Không dùng `import-locations.ts` được vì script kia nhập TOÀN BỘ cây một tỉnh rồi đặt
 * `isActive=false` cho mọi bản ghi vắng mặt trong file — nạp một file chỉ chứa phần bổ sung
 * vào đó là tắt sạch khu vực đang chạy.
 *
 * Nguồn dữ liệu: file khách gửi 25/08/2026 ("Rà soát danh sách xã cũ mới Nghệ An Hà Tĩnh").
 *
 * ## Hai cái bẫy đã tính trước
 *
 * 1. **Hai cây khu vực trùng tên.** CSDL Nghệ An có cây gốc (`nghe-an/…`, `ha-tinh/…` — cây
 *    mọi tin đăng thật tham chiếu) và cây rác từ lần đồng bộ toàn quốc (`tinh-nghe-an/…`).
 *    Khớp tên huyện không thôi sẽ dính cả hai. Nên bắt buộc lọc theo `provinceSlug` của file,
 *    và nếu vẫn còn nhiều hơn một ứng viên thì DỪNG, không đoán.
 *
 * 2. **Trùng `urlSegment` giữa các huyện.** Xã cũ trùng tên giữa các huyện là chuyện thường
 *    (Nghệ An và Hà Tĩnh đều có "Xã Sơn Lộc"). Chọn đoạn URL theo đúng thứ tự ưu tiên của
 *    importer Hà Nội: {slug} -> {slug}-{huyện} -> {slug}-{huyện}-N. Bản ghi ĐÃ CÓ thì
 *    KHÔNG đụng vào `urlSegment` — URL có thể đang được Google index.
 *
 * Chạy thử:  node dist/src/scripts/import-wards-bo-sung.js <file.json>
 * Ghi thật:  node dist/src/scripts/import-wards-bo-sung.js <file.json> --apply
 */
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient, LocationType } from '@prisma/client';
import { slugify, stripAccents } from '../property/property-utils';
import { stripUnitPrefix } from '../location/location-utils';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');
const fileArg = process.argv.slice(2).find((a) => !a.startsWith('--'));

interface WardIn {
  name: string;
  short?: string;
}
interface DistrictIn {
  displayName: string;
  matchNames: string[];
  wards: WardIn[];
  oldWards: WardIn[];
}
interface Payload {
  note?: string;
  provinceSlug: string;
  districts: DistrictIn[];
}

function norm(s: string): string {
  return stripAccents(String(s || ''))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function main() {
  if (!fileArg) throw new Error('Thiếu đường dẫn file dữ liệu.');
  const file = path.isAbsolute(fileArg) ? fileArg : path.resolve(process.cwd(), fileArg);
  const payload: Payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  const provinceSlug = payload.provinceSlug;

  console.log(`Nguồn: ${path.basename(file)}`);
  console.log(`Tỉnh:  ${provinceSlug}\n`);

  const allDistricts = await prisma.location.findMany({
    where: { type: LocationType.DISTRICT },
    select: { id: true, name: true, shortName: true, path: true, urlSegment: true, isActive: true },
  });

  // Tập đoạn URL đang dùng — nạp một lần, cập nhật dần trong bộ nhớ để tránh tự đụng chính mình.
  const used = new Set(
    (await prisma.location.findMany({ select: { urlSegment: true } }))
      .map((s) => s.urlSegment)
      .filter(Boolean) as string[],
  );

  const stats = { created: 0, updated: 0, unchanged: 0, skippedDistricts: 0 };
  const plan: string[] = [];

  for (const d of payload.districts) {
    const wanted = new Set(d.matchNames.map(norm));
    const matches = allDistricts.filter(
      (x) => wanted.has(norm(x.name)) || wanted.has(norm(x.shortName ?? '')),
    );
    // Chỉ nhận huyện nằm trong ĐÚNG tỉnh của file — chặn cây rác `tinh-*`.
    const inProvince = matches.filter(
      (x) => x.path === provinceSlug || x.path.startsWith(`${provinceSlug}/`),
    );

    if (inProvince.length === 0) {
      console.warn(`  ! BỎ QUA "${d.displayName}": không tìm thấy trong tỉnh ${provinceSlug}`);
      stats.skippedDistricts++;
      continue;
    }
    if (inProvince.length > 1) {
      // Không đoán: nhiều hơn một thì phải người quyết định.
      throw new Error(
        `Có ${inProvince.length} huyện khớp "${d.displayName}" trong ${provinceSlug}: ` +
          inProvince.map((x) => `${x.name} (${x.path})`).join(' | '),
      );
    }
    const parent = inProvince[0];
    const parentShort = slugify(stripUnitPrefix(parent.name));

    for (const [type, items] of [
      [LocationType.WARD, d.wards],
      [LocationType.OLD_WARD, d.oldWards],
    ] as const) {
      if (!items?.length) continue;

      const existing = await prisma.location.findMany({
        where: { parentId: parent.id, type },
        select: { id: true, slug: true, name: true, urlSegment: true, isActive: true },
      });
      const bySlug = new Map(existing.map((c) => [c.slug, c]));
      let order = existing.length;

      for (const w of items) {
        const shortName = w.short || stripUnitPrefix(w.name);
        const slug = slugify(shortName);
        const found = bySlug.get(slug);

        if (found) {
          const needs = found.name !== w.name || found.isActive !== true;
          if (!needs) {
            stats.unchanged++;
            continue;
          }
          stats.updated++;
          plan.push(`  CẬP NHẬT  ${parent.name} / ${w.name}  (giữ URL ${found.urlSegment})`);
          if (apply) {
            await prisma.location.update({
              where: { id: found.id },
              data: { name: w.name, shortName, isActive: true },
            });
          }
          continue;
        }

        const candidates = [slug, `${slug}-${parentShort}`];
        let segment = candidates.find((c) => c && !used.has(c));
        if (!segment) {
          let n = 2;
          const base = `${slug}-${parentShort}`;
          while (used.has(`${base}-${n}`)) n++;
          segment = `${base}-${n}`;
        }
        used.add(segment);

        stats.created++;
        plan.push(`  THÊM      ${parent.name} / ${w.name}  ->  /${segment}`);
        if (apply) {
          await prisma.location.create({
            data: {
              name: w.name,
              shortName,
              type,
              parentId: parent.id,
              slug,
              urlSegment: segment,
              path: `${parent.path}/${segment}`,
              depth: 2,
              sortOrder: order++,
              isActive: true,
            },
          });
        }
      }
    }
  }

  const head = plan.slice(0, 25);
  console.log(head.join('\n') || '  (không có thay đổi)');
  if (plan.length > head.length) console.log(`  … và ${plan.length - head.length} dòng nữa`);

  console.log(
    `\n${apply ? 'ĐÃ GHI' : 'CHẠY THỬ'} — thêm ${stats.created}, cập nhật ${stats.updated}, ` +
      `giữ nguyên ${stats.unchanged}, bỏ qua ${stats.skippedDistricts} huyện.`,
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
