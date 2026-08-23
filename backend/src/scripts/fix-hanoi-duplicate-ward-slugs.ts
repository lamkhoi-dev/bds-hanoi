/**
 * Gắn tên quận vào `urlSegment` của những phường/xã CŨ bị TRÙNG TÊN giữa các quận (Hà Nội).
 *
 * Khách yêu cầu 21/08: "không phải thừa mà do tên hành chính giống nhau, nên để lại tất cả.
 * Mình đề nghị xử lý tên trùng ví dụ như khi gắn slug cho link thì kèm theo tên huyện/quận:
 * /minh-khai-hai-ba-trung, /minh-khai-bac-tu-liem, /minh-khai-hoai-duc".
 *
 * ## Hiện trạng đã đo (23/08) — KHÔNG có lỗi trùng slug
 *
 * 126/126 WARD và 579/579 OLD_WARD đều có `urlSegment` duy nhất. Cái sai là **không nhất
 * quán và mơ hồ**: trong mỗi nhóm trùng tên, bản ghi được nhập TRƯỚC giành lấy slug trơn còn
 * các bản sau mới bị thêm hậu tố, nên đọc slug không biết là quận nào:
 *
 *     Minh Khai   -> minh-khai (Hai Bà Trưng) | minh-khai-cu (Bắc Từ Liêm) | minh-khai-hoai-duc-cu (Hoài Đức)
 *     Quang Trung -> quang-trung (Đống Đa) | quang-trung-cu (Hà Đông) | quang-trung-phu-xuyen-cu | quang-trung-son-tay-cu
 *
 * Script này đổi TẤT CẢ thành viên của mỗi nhóm sang `{tên}-{quận}`, đúng ví dụ khách đưa.
 * 23 nhóm, khoảng 49 dòng.
 *
 * ## Vì sao sửa FILE JSON chứ không UPDATE thẳng DB
 *
 * `import-locations.ts` khớp bản ghi theo `(parentId, type, slug)` — KHÔNG theo `urlSegment`
 * — và lấy `urlSegment` nguyên văn từ file. Nên sửa file rồi chạy lại importer là cập nhật
 * ĐÚNG CHỖ, không tạo dòng mới, không mất dòng. Nếu chỉ UPDATE thẳng DB thì lần import sau
 * sẽ ghi đè ngược lại giá trị cũ trong file.
 *
 * Chỉ đụng `oldWards`: nhóm trùng tên đều nằm ở đó, và đổi slug phường/xã MỚI là chạm vào
 * thứ khách đang duyệt nội dung.
 *
 * Chạy thử:  node dist/scripts/fix-hanoi-duplicate-ward-slugs.js
 * Ghi file:  node dist/scripts/fix-hanoi-duplicate-ward-slugs.js --apply
 * (Sau đó phải chạy lại import-locations rồi đối chiếu đủ 736 dòng.)
 */
import * as fs from 'fs';
import * as path from 'path';

const apply = process.argv.includes('--apply');

const FILE = path.resolve(__dirname, '../../prisma/data/hanoi/locations.hanoi.json');

interface Node {
  name: string;
  shortName: string;
  slug: string;
  urlSegment: string;
  externalRef?: string;
}
interface District extends Node {
  wards?: Node[];
  oldWards?: Node[];
}

function main() {
  const raw = fs.readFileSync(FILE, 'utf8');
  const tree = JSON.parse(raw) as { province: any; districts: District[] };

  // Gom theo TÊN (đã chuẩn hoá về slug để "Vân Phúc"/"Vạn Phúc" bỏ dấu ra khác nhau vẫn so
  // được đúng — khách có nhắc ca này ở Phúc Thọ).
  const byName = new Map<string, { district: District; ward: Node }[]>();
  for (const district of tree.districts) {
    for (const ward of district.oldWards ?? []) {
      const key = ward.slug;
      const list = byName.get(key) ?? [];
      list.push({ district, ward });
      byName.set(key, list);
    }
  }

  const taken = new Set<string>();
  for (const d of tree.districts) {
    taken.add(d.urlSegment);
    for (const w of [...(d.wards ?? []), ...(d.oldWards ?? [])]) taken.add(w.urlSegment);
  }

  const changes: { from: string; to: string; name: string; district: string }[] = [];
  const conflicts: string[] = [];

  for (const [, group] of byName) {
    // Chỉ xử lý nhóm trải TRÊN NHIỀU QUẬN. Trùng tên trong cùng một quận thì thêm tên quận
    // cũng không phân biệt được gì — để nguyên hậu tố cũ.
    const districts = new Set(group.map((g) => g.district.urlSegment));
    if (group.length < 2 || districts.size < 2) continue;

    for (const { district, ward } of group) {
      const next = `${ward.slug}-${district.urlSegment}`;
      if (next === ward.urlSegment) continue;
      // Slug mới đã có chủ khác -> dừng, không đoán. Thà không đổi còn hơn đổi trùng.
      if (taken.has(next)) {
        conflicts.push(`${ward.name} (${district.shortName}): "${next}" đã bị chiếm`);
        continue;
      }
      taken.delete(ward.urlSegment);
      taken.add(next);
      changes.push({ from: ward.urlSegment, to: next, name: ward.name, district: district.shortName });
      ward.urlSegment = next;
    }
  }

  console.log(`Nhóm trùng tên liên quận: ${[...byName.values()].filter((g) => new Set(g.map((x) => x.district.urlSegment)).size > 1).length}`);
  console.log(`Số dòng sẽ đổi urlSegment: ${changes.length}`);
  for (const c of changes) console.log(`  ${c.from}  ->  ${c.to}   (${c.name}, ${c.district})`);
  if (conflicts.length) {
    console.error(`\n⚠ ${conflicts.length} chỗ xung đột, KHÔNG đổi:`);
    for (const c of conflicts) console.error('  ', c);
  }

  // Chốt an toàn: tổng số dòng và tính duy nhất phải giữ nguyên sau khi đổi.
  const allSegments: string[] = [];
  for (const d of tree.districts) {
    allSegments.push(d.urlSegment);
    for (const w of [...(d.wards ?? []), ...(d.oldWards ?? [])]) allSegments.push(w.urlSegment);
  }
  const dup = allSegments.filter((s, i) => allSegments.indexOf(s) !== i);
  if (dup.length > 0) {
    console.error('\nDỪNG: sinh ra urlSegment trùng nhau:', [...new Set(dup)]);
    process.exit(1);
  }
  console.log(`\nTổng urlSegment (quận + xã mới + xã cũ): ${allSegments.length}, tất cả duy nhất.`);

  if (!apply) {
    console.log('\nĐây là chạy thử. Thêm --apply để ghi lại file JSON.');
    return;
  }
  fs.writeFileSync(FILE, JSON.stringify(tree, null, 2) + '\n', 'utf8');
  console.log(`\nĐã ghi ${FILE}. Bước tiếp: chạy lại import-locations rồi đối chiếu đủ 736 dòng.`);
}

main();
