/**
 * Tính lại `pricePerM2` và `pricePerM2Display` cho tin đăng đã có.
 *
 * Hai trường này được tính lúc TẠO/SỬA tin rồi lưu vào bảng, nên khi công thức đổi thì
 * tin cũ vẫn giữ giá trị cũ cho tới lần sửa tiếp theo. Sau khi thống nhất công thức
 * (mục "chưa thống nhất giá/m2"), phải chạy script này một lần để tin cũ hiển thị
 * giống tin mới.
 *
 * CHỈ ghi hai cột đó. Không đụng giá, diện tích, trạng thái hay bất cứ trường nào khác.
 * Mặc định chạy thử; phải --apply mới ghi.
 *
 * Chạy thử:  node dist/scripts/recalc-price-per-m2.js
 * Chạy thật: node dist/scripts/recalc-price-per-m2.js --apply
 */
import { PrismaClient } from '@prisma/client';
import {
  calculatePricePerM2,
  formatPricePerM2,
  PRICE_NEGOTIABLE_LABEL,
} from '../property/property-utils';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

async function main() {
  const rows = await prisma.property.findMany({
    select: {
      id: true,
      title: true,
      price: true,
      area: true,
      priceMin: true,
      priceMax: true,
      areaMin: true,
      areaMax: true,
      isNegotiable: true,
      priceRangeKey: true,
      pricePerM2: true,
      pricePerM2Display: true,
    },
  });

  // price/priceMin/priceMax là Decimal trong Prisma, không phải number.
  const num = (v: unknown): number | null =>
    v === null || v === undefined ? null : Number(v);

  let changed = 0;
  let same = 0;
  const samples: string[] = [];

  for (const p of rows) {
    const negotiable = p.isNegotiable || p.priceRangeKey === 'THOA_THUAN';

    const value = negotiable
      ? null
      : calculatePricePerM2(
          num(p.priceMin), num(p.priceMax), p.areaMin, p.areaMax, num(p.price), p.area,
        );
    const display = negotiable ? PRICE_NEGOTIABLE_LABEL : formatPricePerM2(value);

    if (p.pricePerM2Display === display && (p.pricePerM2 ?? null) === (value ?? null)) {
      same++;
      continue;
    }

    changed++;
    if (samples.length < 15) {
      samples.push(
        `  ${(p.title ?? '').slice(0, 40).padEnd(42)} ${String(p.pricePerM2Display ?? '(trống)').padEnd(20)} -> ${display}`,
      );
    }
    if (apply) {
      await prisma.property.update({
        where: { id: p.id },
        data: { pricePerM2: value, pricePerM2Display: display },
      });
    }
  }

  console.log(`\nTổng tin: ${rows.length}`);
  if (samples.length > 0) {
    console.log(`\nVí dụ thay đổi (${samples.length}/${changed}):`);
    console.log(samples.join('\n'));
  }
  console.log(`\n${apply ? 'ĐÃ GHI' : 'CHẠY THỬ'} — đổi ${changed}, giữ nguyên ${same}.`);
  if (!apply) console.log('Thêm --apply để ghi thật.');
  console.log('Chỉ ghi pricePerM2 và pricePerM2Display, không đụng trường nào khác.\n');
}

main()
  .catch((e) => {
    console.error('\nLỗi:', e.message ?? e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
