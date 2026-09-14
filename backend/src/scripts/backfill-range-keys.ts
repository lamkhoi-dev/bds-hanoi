/**
 * Sửa lại NHÃN KHOẢNG (`priceRangeKey`/`areaRangeKey`) và biên (`priceMin/Max`,
 * `areaMin/Max`) của tin CŨ cho khớp với GIÁ/DIỆN TÍCH CỤ THỂ đã lưu.
 *
 * Vì sao cần: trước 12/9, `applyRangeKeys` chỉ tính biên TỪ nhãn khoảng người đăng tự chọn,
 * không bao giờ kiểm ngược lại xem nhãn đó có khớp với giá/diện tích cụ thể hay không. Người
 * đăng gõ "Giá cụ thể" 1,4 tỷ nhưng lỡ để nguyên "Khoảng giá" ở 2-3 tỷ (giá trị mặc định
 * hoặc gõ nhầm) thì CSDL giữ nguyên sai lệch đó mãi — tin bị lọc/hiển thị theo khoảng SAI.
 * Đo trên site 12/9: cùng mức giá 2 tỷ có tin gắn nhãn "1-2 tỷ", có tin gắn "2-3 tỷ"; diện
 * tích 100 m² cũng lệch tương tự.
 *
 * Script này chạy CHÍNH XÁC logic `applyRangeKeys` (property-utils.ts) đã sửa 12/9 — không
 * viết lại công thức ở đây, để không có hai nơi tính khác nhau.
 *
 * An toàn: chỉ sửa tin CÓ giá/diện tích cụ thể VÀ nhãn/biên hiện tại KHÔNG khớp. Tin chỉ có
 * nhãn (không giá cụ thể — người đăng chủ động chọn "khoảng giá") không bị đụng tới.
 *
 * Chạy thử:  node dist/scripts/backfill-range-keys.js
 * Ghi thật:  node dist/scripts/backfill-range-keys.js --apply
 */
import { PrismaClient } from '@prisma/client';
import { applyRangeKeys } from '../property/property-utils';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

async function main() {
  const rows = await prisma.property.findMany({
    where: { deletedAt: null },
    select: {
      id: true, shortCode: true, transactionType: true, isNegotiable: true,
      price: true, priceRangeKey: true, priceMin: true, priceMax: true,
      area: true, areaRangeKey: true, areaMin: true, areaMax: true,
    },
  });

  console.log(`Kiểm ${rows.length} tin.\n`);

  let fixed = 0;
  const preview: string[] = [];

  for (const r of rows) {
    const data: Record<string, any> = {
      transactionType: r.transactionType,
      isNegotiable: r.isNegotiable,
      price: r.price !== null ? Number(r.price) : null,
      priceRangeKey: r.priceRangeKey,
      area: r.area,
      areaRangeKey: r.areaRangeKey,
    };
    applyRangeKeys(data);

    const changed: string[] = [];
    if (data.priceRangeKey !== r.priceRangeKey) changed.push(`priceRangeKey ${r.priceRangeKey ?? '(trống)'} -> ${data.priceRangeKey ?? '(trống)'}`);
    if (data.areaRangeKey !== r.areaRangeKey) changed.push(`areaRangeKey ${r.areaRangeKey ?? '(trống)'} -> ${data.areaRangeKey ?? '(trống)'}`);

    if (changed.length === 0) continue;
    fixed++;
    preview.push(`  ${r.shortCode ?? r.id}: ${changed.join(', ')}`);

    if (apply) {
      await prisma.property.update({
        where: { id: r.id },
        data: {
          priceRangeKey: data.priceRangeKey,
          priceMin: data.priceMin,
          priceMax: data.priceMax,
          areaRangeKey: data.areaRangeKey,
          areaMin: data.areaMin,
          areaMax: data.areaMax,
          pricePerM2: data.pricePerM2,
          pricePerM2Display: data.pricePerM2Display,
          // KHÔNG ghi `price`/`isNegotiable`: script này chỉ sửa NHÃN suy ra từ giá đã có,
          // không được tự ý xoá hay đổi giá trị người dùng đã nhập.
        },
      });
    }
  }

  console.log(preview.slice(0, 50).join('\n') || '  (không có tin nào lệch)');
  if (preview.length > 50) console.log(`  … và ${preview.length - 50} tin nữa`);

  console.log(`\n${apply ? 'ĐÃ SỬA' : 'CHẠY THỬ'} — ${fixed}/${rows.length} tin lệch nhãn khoảng.`);
  if (!apply) console.log('Thêm --apply để ghi thật.');
  if (apply && fixed > 0) {
    console.log('\n⚠ Nhớ chạy tiếp: node dist/scripts/reindex-search.js (nạp lại chỉ mục tìm kiếm).');
  }
}

main()
  .catch((e) => {
    console.error(e?.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
