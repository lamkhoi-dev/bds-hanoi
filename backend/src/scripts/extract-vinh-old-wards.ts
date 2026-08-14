/**
 * Trích danh sách phường/xã CŨ của TP Vinh từ sheet "Các phường xã cũ Ở Vinh"
 * (`bds_doc/danh sách khu vực.xlsx`) ra JSON commit vào git.
 *
 * Đây là mục PHẦN I "Bổ sung xã cũ đầy đủ của thành phố Vinh" — dữ liệu của site
 * nhadatxunghe.vn, không phải Hà Nội. Chính sheet cũng ghi "Data này dùng cho
 * nhadatxunghe.vn".
 *
 * Vì sao chỉ xuất TÊN mà không xuất sẵn `urlSegment`: đây là import BỔ SUNG vào một
 * CSDL đã có sẵn hàng nghìn khu vực Nghệ An/Hà Tĩnh. Đoạn URL phải được chọn sao cho
 * không đụng bản ghi đang tồn tại, mà tập đang tồn tại chỉ biết được lúc chạy import
 * trên đúng CSDL đó. Chốt cứng từ đây là chắc chắn đụng ("Phường Cửa Nam" rất có thể
 * đã có ở cấp phường mới).
 *
 * Chạy:  npx ts-node src/scripts/extract-vinh-old-wards.ts "<đường dẫn>/danh sách khu vực.xlsx"
 */
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { stripAccents } from '../property/property-utils';

const SHEET_HINT = 'cac phuong xa cu o vinh';
const OUT_DIR = path.join(__dirname, '..', '..', 'prisma', 'data', 'nghe-an');
const OUT_FILE = path.join(OUT_DIR, 'old-wards-vinh.json');

/** Quận/huyện cha. Khớp theo tên đã bỏ dấu nên "TP Vinh"/"Thành phố Vinh" đều nhận. */
const PARENT_DISTRICT = {
  matchNames: ['thanh pho vinh', 'tp vinh', 'vinh'],
  displayName: 'Thành phố Vinh',
};

function norm(s: string): string {
  return stripAccents(String(s || ''))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function findSheet(wb: XLSX.WorkBook): XLSX.WorkSheet {
  // Tên tab trong file nguồn hay lệch dấu, nên khớp theo bản đã bỏ dấu.
  const name = wb.SheetNames.find((n) => norm(n) === SHEET_HINT);
  if (!name) {
    throw new Error(
      `Không thấy sheet "${SHEET_HINT}". Các sheet có trong file: ${wb.SheetNames.join(', ')}`,
    );
  }
  return wb.Sheets[name];
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Thiếu đường dẫn tới "danh sách khu vực.xlsx"');
    process.exit(1);
  }

  const wb = XLSX.readFile(file);
  const rows: any[][] = XLSX.utils.sheet_to_json(findSheet(wb), { header: 1, blankrows: false });

  const names: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    // Lọc theo cột số thứ tự thay vì bỏ qua N dòng đầu: cách này loại được cả dòng
    // tiêu đề lặp giữa bảng mà không phải chốt cứng số dòng.
    const order = Number(row?.[0]);
    const raw = String(row?.[1] ?? '').trim();
    if (!Number.isFinite(order) || !raw || raw.length > 60) continue;

    const key = norm(raw);
    if (seen.has(key)) {
      console.warn(`  Bỏ qua dòng trùng: "${raw}"`);
      continue;
    }
    seen.add(key);
    names.push(raw);
  }

  if (names.length === 0) throw new Error('Không đọc được dòng nào từ sheet.');

  const payload = {
    note:
      'Phường/xã CŨ của TP Vinh, dùng cho site nhadatxunghe.vn. urlSegment do ' +
      'import-vinh-old-wards.ts sinh lúc chạy để tránh đụng dữ liệu Nghệ An sẵn có.',
    parentDistrict: PARENT_DISTRICT,
    oldWards: names.map((name, i) => ({ name, externalRef: `VINH-O${i + 1}` })),
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf8');

  console.log(`Phường/xã cũ TP Vinh: ${names.length}`);
  console.log(`Đã ghi ${OUT_FILE}`);
}

main();
