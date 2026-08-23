/**
 * Nạp 31 "khu vực hot" của Hà Nội (Bảng 4 tài liệu khách, sheet "khu vực hot").
 *
 * Khối này KHÔNG phải đơn vị hành chính và KHÔNG phải Dự án — khách trả lời 21/08:
 * "các khu vực này nó không thuộc quận huyện hay phường xã nào cả mà tin đăng trong khu
 * vực hot này được lấy đúng tin có từ khóa như tên khu vực (lấy đúng nghĩa là trong tin có
 * chứa cụm từ giống hệt với tên khu vực hot, không lấy mở rộng...)".
 *
 * CHỈ chạy cho site Hà Nội. Nghệ An (bố cục `classic`) không có khối này trong
 * HOMEPAGE_LAYOUTS nên dù bảng có dữ liệu cũng không hiện gì — nhưng vẫn không nên nạp,
 * để `/admin` bên đó không thấy danh sách vô nghĩa.
 *
 * Idempotent: khoá theo `name`, chạy lại chỉ cập nhật `slug`/`sortOrder`, không tạo trùng.
 * Không tự xoá tên đã có trong DB mà không còn trong danh sách — chỉ CẢNH BÁO, vì admin có
 * thể đã thêm tay và xoá nhầm thì mất cấu hình.
 *
 * Chạy thử:  node dist/scripts/import-hot-areas.js
 * Chạy thật: node dist/scripts/import-hot-areas.js --apply
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

/** Đúng thứ tự khách đánh số 1..31 trong Bảng 4. Thứ tự này quyết định tab nào lên trước. */
const HOT_AREAS = [
  'An Hưng',
  'Linh Đàm',
  'Văn Phú',
  'Vinhomes Smart City',
  'Vinhomes Ocean Park',
  'Vinhomes Riverside',
  'Ciputra',
  'Splendora',
  // Ecopark thực tế thuộc Hưng Yên. VẪN giữ: khối này khớp theo TỪ KHOÁ trong nội dung tin
  // chứ không theo địa giới, nên không mâu thuẫn gì (đã nêu với khách, khách không loại ra).
  'Ecopark',
  'Royal City',
  'Times City',
  'Goldmark City',
  'Mỹ Đình Pearl',
  'The Manor',
  'Keangnam',
  'Mandarin Garden',
  'Park Hill',
  'Mỹ Đình 1',
  'Mỹ Đình 2',
  'Hồ Tây',
  'Ngoại Giao Đoàn',
  'Láng Hạ',
  'Trung Kính',
  'Phương Liệt',
  'Gamuda Gardens',
  'Thanh Hà',
  'Nam An Khánh',
  'Bắc An Khánh',
  'The Matrix One',
  'Imperia Sky Garden',
  'Sunshine City',
] as const;

/**
 * Bỏ dấu rồi gạch nối. Dùng lại quy tắc quen thuộc của repo thay vì kéo thêm thư viện —
 * `Mỹ Đình 1` -> `my-dinh-1`, `The Matrix One` -> `the-matrix-one`.
 */
function toSlug(name: string): string {
  return name
    .normalize('NFD')
    // Dải dấu tổ hợp U+0300..U+036F. Dựng bằng `new RegExp` với chuỗi escape thay vì dán
    // ký tự thật vào regex literal: dán thẳng thì chỉ một lần lưu file sai encoding là dải
    // này hỏng âm thầm, slug mọc đầy dấu mà không ai thấy lỗi.
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  // Slug trùng nhau thì `@unique` sẽ nổ giữa chừng và để lại nửa vời — chặn trước khi ghi.
  const slugs = HOT_AREAS.map(toSlug);
  const dup = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dup.length > 0) {
    console.error('Slug bị trùng, dừng lại:', [...new Set(dup)]);
    process.exit(1);
  }

  const existing = await prisma.hotArea.findMany({ select: { name: true } });
  const existingNames = new Set(existing.map((r) => r.name));
  const toCreate = HOT_AREAS.filter((n) => !existingNames.has(n));
  const orphan = existing.filter((r) => !(HOT_AREAS as readonly string[]).includes(r.name));

  console.log(`Trong DB: ${existing.length} | Trong danh sách: ${HOT_AREAS.length}`);
  console.log(`Sẽ tạo mới: ${toCreate.length}`, toCreate.length ? toCreate.slice(0, 5) : '');
  if (orphan.length > 0) {
    console.warn(`⚠ ${orphan.length} dòng có trong DB nhưng KHÔNG có trong danh sách (không tự xoá):`);
    console.warn('  ', orphan.map((r) => r.name).join(', '));
  }

  if (!apply) {
    console.log('\nĐây là chạy thử. Thêm --apply để ghi thật.');
    return;
  }

  for (let i = 0; i < HOT_AREAS.length; i++) {
    const name = HOT_AREAS[i];
    await prisma.hotArea.upsert({
      where: { name },
      update: { slug: slugs[i], sortOrder: i + 1 },
      create: { name, slug: slugs[i], sortOrder: i + 1, isActive: true },
    });
  }

  const after = await prisma.hotArea.count();
  console.log(`\nXong. Tổng số dòng HotArea: ${after} (kỳ vọng ≥ ${HOT_AREAS.length}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
