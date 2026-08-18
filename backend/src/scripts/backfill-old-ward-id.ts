/**
 * Điền `Property.oldWardId` cho tin đã đăng trước migration 20260818000000 (thêm FK
 * riêng cho phường/xã cũ). Trước đó xã cũ chỉ lưu ở cột `oldWard` (chuỗi tên, do
 * `LocationPicker.tsx` gửi `w.name`), không có FK — khối "phường/xã cũ" trên trang chủ
 * xếp hạng theo `oldWardId` nên tin cũ cần backfill mới được tính vào.
 *
 * Khớp BẮT BUỘC kèm `districtId` (không chỉ theo tên): có 13 nhóm tên xã cũ trùng nhau
 * giữa các quận/huyện (vd nhiều "Quang Trung"), khớp riêng theo tên sẽ gán nhầm quận.
 * Bỏ qua giá trị đặc biệt "Khác" (người đăng chọn khi xã cũ không có trong danh sách —
 * xem LocationPicker.tsx) vì không ứng với Location nào.
 *
 * NGUYÊN TẮC AN TOÀN:
 *  - CHỈ ghi `oldWardId` cho tin đang thiếu (`oldWardId IS NULL`). Không đụng cột nào khác.
 *  - Không xoá, không vô hiệu hoá bất cứ bản ghi nào.
 *  - Mặc định chạy thử. Phải thêm --apply mới ghi thật.
 *
 * Chạy thử:  node dist/scripts/backfill-old-ward-id.js
 * Chạy thật: node dist/scripts/backfill-old-ward-id.js --apply
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

async function main() {
  const rows = await prisma.property.findMany({
    where: {
      oldWardId: null,
      oldWard: { not: null },
      NOT: { oldWard: '' },
    },
    select: { id: true, oldWard: true, districtId: true, title: true },
  });

  console.log(`\nTin có oldWard (chuỗi) nhưng thiếu oldWardId: ${rows.length}`);

  let matched = 0;
  let skippedKhac = 0;
  let skippedNoDistrict = 0;
  let skippedNoMatch = 0;
  const noMatchSamples: string[] = [];

  for (const row of rows) {
    if (row.oldWard === 'Khác') {
      skippedKhac++;
      continue;
    }
    if (!row.districtId) {
      skippedNoDistrict++;
      continue;
    }

    // Ưu tiên khớp `name` (tên đầy đủ, đúng cách LocationPicker.tsx gửi hiện nay), rồi
    // lùi về `shortName` (tên rút gọn không tiền tố "Phường/Xã") — dữ liệu cũ hơn (trước
    // khi có dropdown xã cũ) lưu oldWard dạng rút gọn, vd "Vinh Tân" thay vì "Phường
    // Vinh Tân". Đo trên Nghệ An: khớp name 10/40, thêm shortName mới khớp phần lớn 18
    // dòng còn lại (vài dòng vẫn không khớp vì là dữ liệu rác, vd "Ytgv", "qưe").
    const location =
      (await prisma.location.findFirst({
        where: { type: 'OLD_WARD', parentId: row.districtId, name: row.oldWard! },
        select: { id: true },
      })) ??
      (await prisma.location.findFirst({
        where: { type: 'OLD_WARD', parentId: row.districtId, shortName: row.oldWard! },
        select: { id: true },
      }));

    if (!location) {
      skippedNoMatch++;
      if (noMatchSamples.length < 15) {
        noMatchSamples.push(`  ${(row.title ?? '').slice(0, 40).padEnd(42)} oldWard="${row.oldWard}" districtId=${row.districtId}`);
      }
      continue;
    }

    matched++;
    if (apply) {
      await prisma.property.update({ where: { id: row.id }, data: { oldWardId: location.id } });
    }
  }

  console.log(`\n${apply ? 'ĐÃ GHI' : 'CHẠY THỬ'} — khớp được ${matched}, bỏ qua "Khác" ${skippedKhac}, thiếu districtId ${skippedNoDistrict}, không khớp Location ${skippedNoMatch}.`);
  if (noMatchSamples.length > 0) {
    console.log(`\nVí dụ không khớp được (${noMatchSamples.length}/${skippedNoMatch}):`);
    console.log(noMatchSamples.join('\n'));
  }
  if (!apply) console.log('\nChưa ghi gì. Thêm --apply để thực hiện.');
}

main()
  .catch((e) => {
    console.error('\nLỗi:', e.message ?? e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
