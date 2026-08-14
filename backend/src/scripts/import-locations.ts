/**
 * Nhập cây hành chính từ JSON đã commit vào database.
 *
 * Chạy trong container (script được `nest build` biên dịch vào dist/):
 *   docker compose -f docker-compose.vps.yml exec backend node dist/scripts/import-locations.js
 *   docker compose -f docker-compose.vps.yml exec backend node dist/scripts/import-locations.js --apply
 *
 * Nguyên tắc:
 *   - KHÔNG BAO GIỜ deleteMany. Bản ghi biến mất khỏi file nguồn chỉ bị tắt
 *     (isActive=false) vì Property.wardId/districtId/locationId có thể đang trỏ tới,
 *     và mọi FK đều onDelete: SetNull — xoá là mất liên kết vĩnh viễn.
 *   - Idempotent: chạy lại với cùng dữ liệu phải ghi 0 dòng.
 *   - urlSegment lấy nguyên từ file JSON (đã được review trong PR). Nếu đụng bản ghi
 *     khác đang giữ segment đó thì DỪNG, không tự đổi — đổi ngầm sẽ làm URL đang được
 *     Google index bị 404.
 */
import { PrismaClient, LocationType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface WardNode {
  name: string;
  shortName: string;
  slug: string;
  urlSegment: string;
  externalRef: string;
}
interface DistrictNode extends Omit<WardNode, 'externalRef'> {
  sortOrder: number;
  group?: string | null;
  groupOrder?: number;
  wards: WardNode[];
  oldWards: WardNode[];
}
interface Tree {
  province: { name: string; shortName: string; slug: string };
  districts: DistrictNode[];
}

const stats = { created: 0, updated: 0, unchanged: 0, deactivated: 0 };

function dataDir(): string {
  return path.resolve(__dirname, '..', '..', 'prisma', 'data', 'hanoi');
}

function readJson<T>(file: string): T {
  const full = path.join(dataDir(), file);
  if (!fs.existsSync(full)) throw new Error(`Không tìm thấy ${full}. Chạy extract-locations-xlsx trước.`);
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

type Desired = {
  name: string;
  shortName: string;
  type: LocationType;
  parentId: string | null;
  slug: string;
  urlSegment: string;
  path: string;
  depth: number;
  sortOrder: number;
  /** Nhãn nhóm điều hướng, chỉ đặt ở cấp quận/huyện. null = không phân nhóm. */
  group?: string | null;
  groupOrder?: number;
  externalRef: string | null;
};

const apply = process.argv.includes('--apply');

/** Chèn hoặc cập nhật một node, trả về id. Ghi lại thống kê thay đổi. */
async function upsertNode(d: Desired, segmentOwners: Map<string, string>): Promise<string> {
  const existing = d.parentId
    ? await prisma.location.findFirst({
        where: { parentId: d.parentId, type: d.type, slug: d.slug },
      })
    : await prisma.location.findFirst({ where: { parentId: null, type: d.type, slug: d.slug } });

  // Chặn: segment này đang thuộc về bản ghi khác.
  const owner = segmentOwners.get(d.urlSegment);
  if (owner && (!existing || owner !== existing.id)) {
    throw new Error(
      `urlSegment "${d.urlSegment}" (${d.name}) đã thuộc về bản ghi khác (id=${owner}). ` +
        `Sửa file JSON rồi chạy lại — không tự đổi segment để tránh làm hỏng URL đã index.`,
    );
  }

  if (!existing) {
    if (!apply) {
      stats.created++;
      segmentOwners.set(d.urlSegment, `pending:${d.urlSegment}`);
      return `pending:${d.urlSegment}`;
    }
    const created = await prisma.location.create({ data: { ...d, isActive: true } });
    stats.created++;
    segmentOwners.set(d.urlSegment, created.id);
    return created.id;
  }

  const changed =
    existing.name !== d.name ||
    existing.shortName !== d.shortName ||
    existing.urlSegment !== d.urlSegment ||
    existing.path !== d.path ||
    existing.depth !== d.depth ||
    existing.sortOrder !== d.sortOrder ||
    existing.group !== (d.group ?? null) ||
    existing.groupOrder !== (d.groupOrder ?? 0) ||
    existing.externalRef !== d.externalRef ||
    existing.isActive !== true;

  if (!changed) {
    stats.unchanged++;
  } else {
    stats.updated++;
    if (apply) {
      await prisma.location.update({ where: { id: existing.id }, data: { ...d, isActive: true } });
    }
  }
  segmentOwners.set(d.urlSegment, existing.id);
  return existing.id;
}

async function main() {
  const tree = readJson<Tree>('locations.hanoi.json');
  const featured = readJson<{ wards: any[]; oldWards: any[] }>('featured.hanoi.json');

  console.log(apply ? '=== CHẾ ĐỘ GHI THẬT ===' : '=== XEM TRƯỚC (thêm --apply để ghi) ===');

  const all = await prisma.location.findMany({ select: { id: true, urlSegment: true } });
  const segmentOwners = new Map(all.map((l) => [l.urlSegment, l.id]));

  // ---- Tỉnh/thành ----
  const provincePath = tree.province.slug;
  const provinceId = await upsertNode(
    {
      name: tree.province.name,
      shortName: tree.province.shortName,
      type: LocationType.CITY,
      parentId: null,
      slug: tree.province.slug,
      urlSegment: tree.province.slug,
      path: provincePath,
      depth: 0,
      sortOrder: 0,
      externalRef: null,
    },
    segmentOwners,
  );

  const keptIds = new Set<string>([provinceId]);

  // ---- Quận/huyện và phường/xã ----
  for (const district of tree.districts) {
    const districtPath = `${provincePath}/${district.urlSegment}`;
    const districtId = await upsertNode(
      {
        name: district.name,
        shortName: district.shortName,
        type: LocationType.DISTRICT,
        parentId: provinceId,
        slug: district.slug,
        urlSegment: district.urlSegment,
        path: districtPath,
        depth: 1,
        sortOrder: district.sortOrder,
        group: district.group ?? null,
        groupOrder: district.groupOrder ?? 0,
        externalRef: null,
      },
      segmentOwners,
    );
    keptIds.add(districtId);

    const children: Array<[LocationType, WardNode[]]> = [
      [LocationType.WARD, district.wards],
      [LocationType.OLD_WARD, district.oldWards],
    ];
    for (const [type, list] of children) {
      for (let i = 0; i < list.length; i++) {
        const w = list[i];
        const id = await upsertNode(
          {
            name: w.name,
            shortName: w.shortName,
            type,
            parentId: districtId,
            slug: w.slug,
            urlSegment: w.urlSegment,
            path: `${districtPath}/${w.urlSegment}`,
            depth: 2,
            sortOrder: i,
            externalRef: w.externalRef,
          },
          segmentOwners,
        );
        keptIds.add(id);
      }
    }
  }

  // ---- Đánh dấu nổi bật ----
  // Xoá cờ cũ trước rồi mới đặt lại: nếu không, tên bị bỏ khỏi sheet sẽ không bao giờ
  // biến mất khỏi trang chủ.
  if (apply) {
    await prisma.location.updateMany({
      where: { path: { startsWith: `${provincePath}/` }, isFeatured: true },
      data: { isFeatured: false },
    });

    const marks: Array<[LocationType, any[]]> = [
      [LocationType.WARD, featured.wards],
      [LocationType.OLD_WARD, featured.oldWards],
    ];
    for (const [type, items] of marks) {
      for (const item of items) {
        const district = tree.districts.find((d) => d.shortName === item.district);
        const pool = type === LocationType.WARD ? district?.wards : district?.oldWards;
        const node = pool?.find((w) => w.shortName === item.shortName);
        if (!node) {
          console.warn(`  ! Bỏ qua nổi bật không khớp: ${item.district} / ${item.shortName}`);
          continue;
        }
        await prisma.location.updateMany({
          where: { urlSegment: node.urlSegment },
          data: { isFeatured: true },
        });
      }
    }
  }

  // ---- Tắt dữ liệu ngoài phạm vi ----
  // Cây toàn quốc do scripts/sync-locations.ts để lại chính là nguồn của lỗi khách báo:
  // "bộ lọc hiện xã của tỉnh khác".
  const outsiders = await prisma.location.count({
    where: { isActive: true, NOT: { OR: [{ path: provincePath }, { path: { startsWith: `${provincePath}/` } }] } },
  });
  if (apply && outsiders > 0) {
    const res = await prisma.location.updateMany({
      where: { isActive: true, NOT: { OR: [{ path: provincePath }, { path: { startsWith: `${provincePath}/` } }] } },
      data: { isActive: false },
    });
    stats.deactivated = res.count;
  } else {
    stats.deactivated = outsiders;
  }

  console.log(`  Tạo mới     : ${stats.created}`);
  console.log(`  Cập nhật    : ${stats.updated}`);
  console.log(`  Không đổi   : ${stats.unchanged}`);
  console.log(`  Tắt (ngoài ${tree.province.shortName}) : ${stats.deactivated}`);
  console.log(`  Nổi bật     : ${featured.wards.length} phường/xã mới, ${featured.oldWards.length} phường/xã cũ`);

  if (!apply) console.log('\nChưa ghi gì. Thêm --apply để thực hiện.');
}

main()
  .catch((e) => {
    console.error('\nLỖI:', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
