/**
 * Đọc file Excel khách gửi và sinh ra bộ JSON cây hành chính Hà Nội để COMMIT vào repo.
 *
 * Chạy ở máy dev (file xlsx không nằm trong repo):
 *   npx ts-node backend/src/scripts/extract-locations-xlsx.ts "D:\...\danh sách khu vực.xlsx"
 *
 * Vì sao tách hai bước extract -> import thay vì đọc thẳng xlsx lúc deploy:
 *   - Container không nhìn thấy file xlsx.
 *   - Khi khách gửi bản dữ liệu sửa, diff của PR cho thấy CHÍNH XÁC phường nào đổi,
 *     xem được trước khi động vào production.
 *   - `xlsx` chỉ cần lúc dev, không phải phụ thuộc runtime.
 *
 * Các bẫy trong file nguồn đã được xử lý (đã kiểm chứng trên XML thật):
 *   - Tên sheet lệch dấu ("phường xa mới hot") -> tra theo tên đã bỏ dấu.
 *   - Sheet "All phường xã mới" có HEADER LẶP GIỮA BẢNG ở dòng 54 -> lọc theo cột
 *     số thứ tự toàn cục phải là số, không hard-code số dòng.
 *   - Cột quận là ô MERGE (sheet mới) hoặc để trống (sheet cũ) -> forward-fill.
 *   - Tên phường/xã không nhất quán tiền tố (79/126 xã mới không có "Phường"/"Xã")
 *     -> giữ nguyên `name`, thêm `shortName` đã bóc tiền tố.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { slugify, stripAccents } from '../property/property-utils';
import {
  HANOI_DISTRICTS,
  buildDistrictGroupIndex,
  stripUnitPrefix,
} from './locations-hanoi-districts';

const PROVINCE = { name: 'Thành phố Hà Nội', shortName: 'Hà Nội', slug: 'ha-noi' };

interface WardNode {
  name: string;
  shortName: string;
  slug: string;
  urlSegment: string;
  externalRef: string;
}
interface DistrictNode {
  name: string;
  shortName: string;
  slug: string;
  urlSegment: string;
  sortOrder: number;
  /** Nhãn nhóm menu ngang ("Trung tâm"…) — khách gửi ở câu B1. */
  group: string | null;
  groupOrder: number;
  wards: WardNode[];
  oldWards: WardNode[];
}

/** Khoá so khớp: bỏ tiền tố đơn vị, bỏ dấu, thường hoá. */
function matchKey(value: string): string {
  return stripAccents(stripUnitPrefix(value)).toLowerCase().replace(/\s+/g, ' ').trim();
}

function normalizeSheetName(value: string): string {
  return stripAccents(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

function findSheet(wb: XLSX.WorkBook, wanted: string): XLSX.WorkSheet {
  const target = normalizeSheetName(wanted);
  const found = wb.SheetNames.find((n) => normalizeSheetName(n) === target);
  if (!found) {
    throw new Error(`Không tìm thấy sheet "${wanted}". Các sheet có: ${wb.SheetNames.join(', ')}`);
  }
  return wb.Sheets[found];
}

function rowsOf(ws: XLSX.WorkSheet): any[][] {
  return XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null, raw: true, blankrows: true });
}

function cell(row: any[], index: number): string {
  const v = row?.[index];
  if (v === null || v === undefined) return '';
  return String(v).trim().replace(/\s+/g, ' ');
}

function isNumericCell(row: any[], index: number): boolean {
  const v = row?.[index];
  if (v === null || v === undefined || v === '') return false;
  return Number.isFinite(Number(v));
}

function main() {
  const source = process.argv[2];
  if (!source) {
    console.error('Thiếu đường dẫn file xlsx.\n  npx ts-node backend/src/scripts/extract-locations-xlsx.ts "<đường dẫn>"');
    process.exit(1);
  }

  const wb = XLSX.readFile(source);
  const conflicts: any = { note: 'Các mục KHÔNG import được, cần khách làm rõ.', items: [] };

  // ---------- Khung 30 quận/huyện ----------
  const districts = new Map<string, DistrictNode>();
  HANOI_DISTRICTS.forEach((d, i) => {
    districts.set(matchKey(d.shortName), {
      name: d.name,
      shortName: d.shortName,
      slug: slugify(d.shortName),
      urlSegment: '',
      sortOrder: 1000 + i, // ghi đè bằng thứ tự trong sheet "quận huyện" nếu có
      group: null,
      groupOrder: 0,
      wards: [],
      oldWards: [],
    });
  });

  // ---------- Thứ tự hiển thị lấy từ sheet "quận huyện" ----------
  const orderRows = rowsOf(findSheet(wb, 'quận huyện'));
  let orderIndex = 0;
  const seenOrder = new Set<string>();
  for (const row of orderRows) {
    const raw = cell(row, 1);
    if (!raw) continue;
    const key = matchKey(raw);
    const node = districts.get(key);
    if (!node || seenOrder.has(key)) continue; // bỏ header và dòng "Huyện Chương Mỹ" lặp
    seenOrder.add(key);
    node.sortOrder = orderIndex++;
  }

  // ---------- Phường/xã MỚI ----------
  // cột 1 = tên, cột 2 = quận (merge -> forward-fill), cột 3 = số thứ tự toàn cục
  const newRows = rowsOf(findSheet(wb, 'All phường xã mới'));
  let currentDistrict = '';
  let newCount = 0;
  for (const row of newRows) {
    const districtCell = cell(row, 2);
    if (districtCell) currentDistrict = districtCell;
    if (!isNumericCell(row, 3)) continue; // loại header (kể cả header lặp ở dòng 54)

    const name = cell(row, 1);
    if (!name || !currentDistrict) continue;

    const node = districts.get(matchKey(currentDistrict));
    if (!node) {
      conflicts.items.push({ kind: 'UNKNOWN_DISTRICT', sheet: 'All phường xã mới', district: currentDistrict, ward: name });
      continue;
    }
    const shortName = stripUnitPrefix(name);
    node.wards.push({
      name,
      shortName,
      slug: slugify(shortName),
      urlSegment: '',
      externalRef: `W${cell(row, 3)}`,
    });
    newCount++;
  }

  // ---------- Phường/xã CŨ ----------
  // cột 1 = số thứ tự toàn cục, cột 2 = quận (để trống -> forward-fill), cột 3 = tên
  const oldRows = rowsOf(findSheet(wb, 'All phường xã cũ'));
  currentDistrict = '';
  let oldCount = 0;
  for (const row of oldRows) {
    const districtCell = cell(row, 2);
    if (districtCell && !isNumericCell(row, 2)) currentDistrict = districtCell;
    if (!isNumericCell(row, 1)) continue; // loại header

    const name = cell(row, 3);
    if (!name || !currentDistrict) continue;

    const node = districts.get(matchKey(currentDistrict));
    if (!node) {
      conflicts.items.push({ kind: 'UNKNOWN_DISTRICT', sheet: 'All phường xã cũ', district: currentDistrict, ward: name });
      continue;
    }
    const shortName = stripUnitPrefix(name);
    node.oldWards.push({
      name,
      shortName,
      slug: slugify(shortName),
      urlSegment: '',
      externalRef: `O${cell(row, 1)}`,
    });
    oldCount++;
  }

  // Phân nhóm menu ngang. buildDistrictGroupIndex() NÉM LỖI nếu danh sách khách gửi
  // lệch với bảng 30 quận chuẩn — thà dừng còn hơn âm thầm bỏ sót một quận khỏi menu.
  const groupIndex = buildDistrictGroupIndex();
  for (const d of districts.values()) {
    const g = groupIndex.get(d.shortName);
    if (!g) continue;
    d.group = g.group;
    d.groupOrder = g.groupOrder;
    // Thứ tự hiển thị bám theo thứ tự khách liệt kê trong nhóm, không theo sheet.
    d.sortOrder = g.groupOrder * 100 + g.orderInGroup;
  }

  const ordered = [...districts.values()].sort((a, b) => a.sortOrder - b.sortOrder);

  // ---------- Gán urlSegment duy nhất toàn cục ----------
  // Thứ tự cố định để kết quả tái lập được: CITY -> DISTRICT -> WARD -> OLD_WARD.
  //
  // QUAN TRỌNG: duyệt theo thứ tự BẢNG CHUẨN `HANOI_DISTRICTS`, KHÔNG theo `sortOrder`.
  // Việc gán segment là "ai đến trước lấy slug gốc", nên nếu bám theo thứ tự hiển thị
  // thì mỗi lần khách đổi cách phân nhóm menu là 4 phường trùng tên đổi chủ URL
  // (đã kiểm chứng: Phù Đổng/Phú Đông, Tiền Phong/Tiên Phong, Đồng Quang/Đông Quang).
  // URL phải độc lập với cách sắp xếp menu.
  const segmentOrder = HANOI_DISTRICTS.map((d) => districts.get(matchKey(d.shortName))!).filter(
    Boolean,
  );
  const used = new Set<string>([PROVINCE.slug]);
  const take = (candidates: string[]): string => {
    for (const c of candidates) {
      if (c && !used.has(c)) {
        used.add(c);
        return c;
      }
    }
    let i = 2;
    const base = candidates[candidates.length - 1] || 'khu-vuc';
    while (used.has(`${base}-${i}`)) i++;
    used.add(`${base}-${i}`);
    return `${base}-${i}`;
  };

  for (const d of segmentOrder) d.urlSegment = take([d.slug]);
  for (const d of segmentOrder) {
    for (const w of d.wards) {
      // Phường trùng tên quận (vd "Phường Hoàn Kiếm" trong "Quận Hoàn Kiếm") lấy
      // dạng "phuong-hoan-kiem" thay vì "hoan-kiem-hoan-kiem".
      w.urlSegment = take([w.slug, `phuong-${w.slug}`, `${w.slug}-${d.slug}`]);
    }
  }
  for (const d of segmentOrder) {
    for (const w of d.oldWards) {
      w.urlSegment = take([w.slug, `${w.slug}-cu`, `${w.slug}-${d.slug}-cu`]);
    }
  }

  // ---------- Danh sách nổi bật ----------
  const featured = { wards: [] as any[], oldWards: [] as any[] };

  const resolveFeatured = (sheetName: string, kind: 'WARD' | 'OLD_WARD') => {
    const rows = rowsOf(findSheet(wb, sheetName));
    const out: any[] = [];
    for (const row of rows) {
      const raw = cell(row, 1);
      if (!raw || raw.length > 40) continue;
      const key = matchKey(raw);
      // Chỉ khớp trong đúng loại: "Thanh Xuân" vừa là phường mới vừa là xã cũ ở Sóc Sơn.
      const hits: { district: string; shortName: string }[] = [];
      for (const d of ordered) {
        const pool = kind === 'WARD' ? d.wards : d.oldWards;
        for (const w of pool) {
          if (matchKey(w.shortName) === key) hits.push({ district: d.shortName, shortName: w.shortName });
        }
      }
      if (hits.length === 1) out.push({ ...hits[0], label: raw });
      else if (hits.length === 0) conflicts.items.push({ kind: 'FEATURED_NOT_FOUND', sheet: sheetName, value: raw });
      else conflicts.items.push({ kind: 'FEATURED_AMBIGUOUS', sheet: sheetName, value: raw, candidates: hits });
    }
    return out;
  };

  featured.wards = resolveFeatured('phường xa mới hot', 'WARD');
  featured.oldWards = resolveFeatured('Phường xã cũ hot', 'OLD_WARD');

  // ---------- "Khu vực hot": phần lớn KHÔNG phải đơn vị hành chính ----------
  const hotRows = rowsOf(findSheet(wb, 'khu vực hot'));
  const hotAreas: string[] = [];
  for (const row of hotRows) {
    const raw = cell(row, 1);
    if (!raw || raw.length > 40 || raw.includes(':')) continue;
    hotAreas.push(raw);
  }
  conflicts.items.push({
    kind: 'HOT_AREA_BLOCKED',
    note:
      'Sheet "khu vực hot" chủ yếu là tên dự án/khu đô thị (Vinhomes Smart City, Royal City, Ecopark...), ' +
      'không phải đơn vị hành chính và không có cột quận/huyện cha nên không dựng được breadcrumb. ' +
      'Chưa import — chờ khách trả lời câu A4 (nó là "Dự án" hay thực thể riêng?).',
    values: hotAreas,
  });

  // ---------- Ghi file ----------
  const outDir = path.resolve(__dirname, '..', '..', 'prisma', 'data', 'hanoi');
  fs.mkdirSync(outDir, { recursive: true });

  const tree = { province: PROVINCE, districts: ordered };
  writeJson(path.join(outDir, 'locations.hanoi.json'), tree);
  writeJson(path.join(outDir, 'featured.hanoi.json'), featured);
  writeJson(path.join(outDir, 'conflicts.hanoi.json'), conflicts);

  console.log(`Quận/huyện        : ${ordered.length}`);
  console.log(`Phường/xã mới     : ${newCount}`);
  console.log(`Phường/xã cũ      : ${oldCount}`);
  console.log(`urlSegment duy nhất: ${used.size} (kỳ vọng ${1 + ordered.length + newCount + oldCount})`);
  console.log(`Nổi bật - xã mới  : ${featured.wards.length}`);
  console.log(`Nổi bật - xã cũ   : ${featured.oldWards.length}`);
  console.log(`Mục cần làm rõ    : ${conflicts.items.length}  -> conflicts.hanoi.json`);
  console.log(`\nĐã ghi vào ${outDir}`);
}

function writeJson(file: string, data: unknown) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

main();
