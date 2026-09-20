/**
 * Nạp DỮ LIỆU MẪU cho site Hà Nội (staging) để giao diện không bị trống khi thử nghiệm.
 *
 * Làm gì:
 *   1. Tạo 4 tài khoản người đăng mẫu (`*@demo.invalid`, SĐT giả `0900 000 00x`).
 *   2. Làm giàu 18 tin mẫu đã có (mô tả, chi tiết, toạ độ, ảnh, người đăng) — KHÔNG đổi tiêu đề/giá/diện tích/địa điểm.
 *   3. Thêm ~51 tin mới trải khắp các quận/huyện, có VIP/UP, gắn từ khoá "khu vực hot".
 *   4. Gắn ảnh + mô tả cho 4 dự án mẫu, thêm 2 dự án.
 *   5. Vài bình luận (có trả lời) và vài yêu cầu "Cần mua".
 * Tin tức đăng riêng qua API (`news-demo` phía Python) để đi đúng đường làm sạch HTML của service.
 *
 * AN TOÀN:
 *   - Chỉ chạy khi `APP_ENV=staging` — từ chối ở site chạy thật (Nghệ An là `production`).
 *   - Mặc định là chạy thử (không ghi). Thêm `--apply` để ghi thật.
 *   - Idempotent: tin đã có (theo tiêu đề) được cập nhật, không tạo trùng.
 *   - `--cleanup` gỡ TOÀN BỘ dữ liệu mẫu do script này tạo/gắn (tin của 4 người đăng mẫu, họ, 2 dự án thêm mới,
 *     bình luận, yêu cầu). Dùng trước khi mở site chính thức.
 *
 * Cần: `DEMO_IMAGES_FILE` (JSON khoá ảnh → url đã tải lên qua /upload/image). Ghi ra `DEMO_MANIFEST_OUT`.
 * Xong phải nạp lại chỉ mục tìm kiếm:  node dist/scripts/reindex-search.js
 *
 * Chạy thử:  APP_ENV=staging DEMO_IMAGES_FILE=/tmp/demo-images.json node dist/scripts/seed-demo-hanoi.js
 * Ghi thật:  ... node dist/scripts/seed-demo-hanoi.js --apply
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { applyProjectLocation, applyRangeKeys, slugify } from '../property/property-utils';
import {
  AGENTS,
  COMMENTS,
  DISTRICT_CENTER,
  DISTRICT_FACTS,
  DemoListing,
  EXISTING,
  ImgRecipe,
  LISTINGS,
  PROJECTS,
  REQUIREMENTS,
} from './demo-data-hanoi';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');
const cleanup = process.argv.includes('--cleanup');

// ---------- tiện ích ----------
function hash(str: string): number {
  return crypto.createHash('md5').update(str).digest().readUInt32BE(0);
}
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(arr: readonly T[], h: number, off = 0): T => arr[(h + off) % arr.length];
const DAY = 24 * 3600 * 1000;

function fmtMoney(v: number, txn: string): string {
  if (txn === 'CHO_THUE') return `${(v / 1e6).toString().replace('.', ',')} triệu/tháng`;
  if (v >= 1e9) return `${(v / 1e9).toFixed(2).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',')} tỷ`;
  return `${Math.round(v / 1e6)} triệu`;
}
const lower = (s?: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : '');

// ---------- sinh mô tả ----------
interface DescIn {
  title: string; txn: string; type: string; district: string; ward?: string | null; oldWard?: string | null; street?: string | null;
  price: number; area: number; bed?: number | null; bath?: number | null; floors?: number | null; front?: number | null; road?: number | null;
  dir?: string | null; legal?: string | null; furn?: string | null; note?: string | null; negotiable?: boolean; projectName?: string;
}

function whereText(d: DescIn): string {
  const w = d.oldWard ? `${d.ward} (khu vực ${d.oldWard} cũ)` : d.ward;
  return [d.street, w, d.district].filter(Boolean).join(', ');
}

function describe(d: DescIn): string {
  const h = hash(d.title);
  const where = whereText(d);
  const isHouse = d.type === 'NHA_RIENG' || d.type === 'BIET_THU';
  const house = d.type === 'BIET_THU' ? 'biệt thự' : 'nhà';
  const rent = d.txn === 'CHO_THUE';
  const price = fmtMoney(d.price, d.txn);

  // --- đoạn 1: mở đầu + đặc điểm
  let open: string;
  if (/trang trại/i.test(d.title)) {
    open = `Cần bán trang trại rộng ${d.area.toLocaleString('vi-VN')}m² tại ${where}, khuôn viên bằng phẳng, có sẵn đường bê tông vào tận nơi và nguồn nước ổn định.`;
  } else if (/homestay/i.test(d.title)) {
    open = `Cho thuê cơ sở homestay ${d.area}m² tại ${where}, ${d.bed ?? 8} phòng riêng khép kín, sân vườn rộng, view núi thoáng đãng — phù hợp vận hành lưu trú hoặc tổ chức sự kiện nhỏ.`;
  } else if (d.type === 'DAT_NEN' && rent) {
    open = `Cho thuê mặt bằng đất trống ${d.area}m² tại ${where}, phù hợp làm kho bãi, bãi xe hoặc tập kết vật liệu.`;
  } else if (d.type === 'DAT_NEN') {
    open = pick([
      `Bán lô đất ${d.area}m² tại ${where}${d.front ? `, mặt tiền ${d.front}m` : ''}${d.road ? `, đường trước đất rộng ${d.road}m` : ''}.`,
      `Chủ nhà cần bán lô đất vuông vắn ${d.area}m² ngay ${where}${d.road ? `, đường rộng ${d.road}m` : ''}.`,
    ], h);
  } else if (d.type === 'MAT_BANG') {
    open = rent
      ? `Cho thuê mặt bằng ${d.area}m² tại ${where}${d.front ? `, mặt tiền ${d.front}m` : ''}, phù hợp cửa hàng, showroom hoặc văn phòng.`
      : `Bán mặt bằng ${d.area}m² tại ${where}${d.front ? `, mặt tiền ${d.front}m` : ''}, phù hợp kinh doanh, văn phòng hoặc kho xưởng.`;
  } else if (d.type === 'CHUNG_CU' || d.type === 'DU_AN') {
    const prj = d.projectName ? ` thuộc dự án ${d.projectName}` : '';
    open = rent
      ? `Cho thuê căn hộ ${d.area}m²${d.bed ? ` ${d.bed} phòng ngủ` : ''}${prj} tại ${where}.`
      : pick([
          `Cần bán căn hộ ${d.area}m²${d.bed ? ` ${d.bed} phòng ngủ` : ''}${prj} tại ${where}.`,
          `Chính chủ gửi bán căn ${d.area}m²${prj} tại ${where}${d.bed ? `, ${d.bed} phòng ngủ` : ''}.`,
        ], h);
  } else {
    open = rent
      ? `Cho thuê ${house} ${d.area}m²${d.floors ? `, ${d.floors} tầng` : ''} tại ${where}.`
      : pick([
          `Chính chủ cần bán ${house} ${d.area}m²${d.floors ? ` ${d.floors} tầng` : ''} tại ${where}.`,
          `Cần bán ${house} ${d.area}m²${d.floors ? ` xây ${d.floors} tầng` : ''} ngay ${where}, khu dân cư ổn định.`,
          `Gia đình chuyển nơi ở nên cần bán ${house} tại ${where}, diện tích ${d.area}m²${d.floors ? `, ${d.floors} tầng` : ''}.`,
        ], h);
  }

  const feats: string[] = [];
  if (isHouse && d.floors) feats.push(`Kết cấu ${d.floors} tầng${d.bed ? `, ${d.bed} phòng ngủ` : ''}${d.bath ? `, ${d.bath} phòng vệ sinh khép kín` : ''}.`);
  if ((d.type === 'CHUNG_CU' || d.type === 'DU_AN') && d.bed) feats.push(`${d.bed} phòng ngủ${d.bath ? `, ${d.bath} phòng vệ sinh` : ''}, ban công thoáng, ánh sáng tự nhiên tốt.`);
  if (d.front || d.road) {
    const r = d.road ? `đường trước ${isHouse ? 'nhà' : 'lô'} rộng ${d.road}m${d.road >= 5 ? ', ô tô ra vào thuận tiện' : ''}` : '';
    feats.push(`${d.front ? `Mặt tiền ${d.front}m` : ''}${d.front && r ? ', ' : ''}${r}.`.replace(/^,\s*/, ''));
  }
  if (d.dir) feats.push(`Hướng ${d.dir}, đón gió mát và ánh sáng tự nhiên.`);
  if (d.furn && d.furn !== 'Không có') feats.push(`Nội thất ${lower(d.furn)}${d.furn === 'Đầy đủ' ? ' — vào ở ngay' : ''}.`);
  const p1 = [open, ...feats].join(' ');

  // --- đoạn 2: vị trí
  const facts = DISTRICT_FACTS[d.district] ?? [];
  const p2 = [...(facts.length ? [pick(facts, h, 1)] : []), d.note].filter(Boolean).join(' ');

  // --- đoạn 3: pháp lý / giá / liên hệ
  const p3 = rent
    ? `Giá thuê ${price}. Đặt cọc 1–2 tháng, thanh toán theo tháng hoặc quý. Có thể xem nhà mọi khung giờ — liên hệ để hẹn lịch.`
    : `Pháp lý: ${d.legal ? lower(d.legal) : 'đầy đủ, rõ ràng'}. Hỗ trợ làm thủ tục sang tên nhanh gọn và vay ngân hàng nếu cần. ${d.negotiable ? 'Giá thương lượng, liên hệ trực tiếp để trao đổi.' : 'Giá đã tốt, thương lượng nhẹ với người thiện chí.'} Liên hệ để xem trực tiếp.`;

  return [p1, p2, p3].filter(Boolean).join('\n\n');
}

function surroundingsFor(type: string): string {
  switch (type) {
    case 'CHUNG_CU': case 'DU_AN': return 'Siêu thị, trường học, công viên và bệnh viện trong bán kính 1km';
    case 'DAT_NEN': return 'Chợ, trường học, trạm y tế trong bán kính 1km';
    case 'MAT_BANG': return 'Khu dân cư đông, nhiều cửa hàng, bãi đỗ xe';
    default: return 'Trường học, chợ, siêu thị và công viên trong bán kính 500m';
  }
}

// ---------- ảnh ----------
type ImgInfo = { url: string; width?: number; height?: number; cat: string };
let IMGS: Record<string, ImgInfo> = {};
const keysByCat: Record<string, string[]> = {};
const cursor: Record<string, number> = {};
const ALT: Record<string, string> = {
  villa: 'Mặt tiền căn nhà', garden: 'Mặt tiền căn nhà', apt: 'Toà nhà chung cư', living: 'Phòng khách', bedroom: 'Phòng ngủ',
  kitchen: 'Khu bếp', bath: 'Phòng tắm', land: 'Khu đất', commercial: 'Mặt bằng kinh doanh', city: 'Toàn cảnh khu vực', skyline: 'Toàn cảnh khu vực',
};
function nextKey(cat: string, taken: Set<string>): string | null {
  const arr = keysByCat[cat] ?? [];
  if (!arr.length) return null;
  for (let i = 0; i < arr.length; i++) {
    const idx = ((cursor[cat] ?? 0) + i) % arr.length;
    const k = arr[idx];
    if (!taken.has(k)) { cursor[cat] = idx + 1; return k; }
  }
  return null;
}
const LANDMARK = new Set(['c12', 'c13', 'c14', 'c22', 'c26', 'c42']);
/** Ảnh chính theo dự án; tin không thuộc dự án thì dò theo từ khoá trong tiêu đề. */
const PROJECT_HERO: Record<string, string[]> = { royal: ['c14', 'c13'], times: ['c22'], ocean: ['c42'], eco: ['c46'] };
function heroFor(title: string, project?: string): string | undefined {
  if (project && PROJECT_HERO[project]) return PROJECT_HERO[project][hash(title) % PROJECT_HERO[project].length];
  if (/Keangnam/i.test(title)) return 'c12';
  return undefined;
}
const RECIPES: Record<ImgRecipe, string[]> = {
  house: ['villa', 'living', 'bedroom', 'kitchen', 'bath'],
  apt: ['apt', 'living', 'bedroom', 'kitchen', 'bath'],
  land: ['land', 'land', 'skyline', 'land'],
  shop: ['commercial', 'commercial', 'commercial', 'commercial'],
  project: ['apt', 'skyline', 'living', 'villa', 'bedroom'],
  farm: ['garden', 'land', 'garden', 'land', 'garden'],
};
function imagesFor(recipe: ImgRecipe, n?: number, hero?: string): { url: string; alt: string; width?: number; height?: number }[] {
  const cats = RECIPES[recipe].slice(0, n ?? RECIPES[recipe].length);
  const taken = new Set<string>();
  const out: { url: string; alt: string; width?: number; height?: number }[] = [];
  const push = (k: string) => {
    taken.add(k);
    const im = IMGS[k];
    out.push({ url: im.url, alt: ALT[im.cat] ?? 'Ảnh minh hoạ', width: im.width, height: im.height });
  };
  if (hero && IMGS[hero]) push(hero);
  for (const cat of hero && IMGS[hero] ? cats.slice(1) : cats) {
    const k = nextKey(cat, taken) ?? nextKey('city', taken);
    if (k) push(k);
  }
  return out;
}

// ---------- main ----------
async function main() {
  if ((process.env.APP_ENV ?? '').trim() !== 'staging') {
    console.error(`Từ chối chạy: APP_ENV="${process.env.APP_ENV ?? ''}" (chỉ chạy khi APP_ENV=staging — không nạp dữ liệu mẫu vào site chạy thật).`);
    process.exit(2);
  }
  // Lớp chặn thứ hai: `APP_ENV` chỉ là biến người chạy tự truyền nên không đủ tin cậy. Tên CSDL
  // thì không tự đổi được — CSDL Hà Nội là `bds_hanoi_db`, Nghệ An là `bds_db`.
  const dbName = (process.env.DATABASE_URL ?? '').replace(/\?.*$/, '').split('/').pop() ?? '';
  if (!/hanoi/i.test(dbName)) {
    console.error(`Từ chối chạy: CSDL "${dbName}" không phải CSDL Hà Nội (tên phải chứa "hanoi").`);
    process.exit(2);
  }
  console.log(`CSDL: ${dbName}`);
  console.log(cleanup ? '=== DỌN DỮ LIỆU MẪU ===' : apply ? '=== CHẾ ĐỘ GHI THẬT ===' : '=== CHẠY THỬ (thêm --apply để ghi) ===');

  if (cleanup) return doCleanup();

  const imgFile = process.env.DEMO_IMAGES_FILE || '/tmp/demo-images.json';
  IMGS = JSON.parse(fs.readFileSync(imgFile, 'utf-8'));
  // Ảnh chụp một công trình CỤ THỂ (Royal City, Times City, Keangnam, Ocean Park) chỉ dùng làm ảnh chính của tin/dự án
  // thuộc đúng công trình đó — đưa vào vòng quay chung thì tin "Royal City" có thể hiện ảnh biển hiệu Times City.
  for (const [k, v] of Object.entries(IMGS)) if (!LANDMARK.has(k)) (keysByCat[v.cat] ??= []).push(k);
  console.log('Ảnh:', Object.keys(IMGS).length, '|', Object.entries(keysByCat).map(([c, a]) => `${c}:${a.length}`).join(' '));

  // ---- địa danh
  const locs = await prisma.location.findMany({ select: { id: true, name: true, type: true, parentId: true } });
  const city = locs.find((l) => l.type === 'CITY' && l.name === 'Hà Nội') ?? locs.find((l) => l.type === 'CITY');
  if (!city) throw new Error('Không thấy Location CITY Hà Nội.');
  const districtId = (name: string) => locs.find((l) => l.type === 'DISTRICT' && l.name === name && l.parentId === city.id)?.id ?? null;
  const wardId = (dId: string | null, name?: string) => (dId && name ? locs.find((l) => l.type === 'WARD' && l.parentId === dId && l.name === name)?.id ?? null : null);
  const oldWardId = (dId: string | null, name?: string) => (dId && name ? locs.find((l) => l.type === 'OLD_WARD' && l.parentId === dId && l.name === name)?.id ?? null : null);
  const missing: string[] = [];

  // ---- người đăng mẫu
  const agentIds: string[] = [];
  for (const a of AGENTS) {
    const existing = await prisma.user.findUnique({ where: { email: a.email } });
    if (existing) { agentIds.push(existing.id); continue; }
    if (!apply) { agentIds.push(`dry-${a.email}`); continue; }
    const u = await prisma.user.create({
      data: {
        email: a.email, name: a.name, phone: a.phone, bio: a.bio, slug: slugify(a.name),
        password: await bcrypt.hash(crypto.randomBytes(18).toString('base64'), 10),
        role: 'USER', status: 'ACTIVE', emailVerified: true, isPhoneVisible: true, purpose: 'SELL_BDS',
      },
    });
    agentIds.push(u.id);
  }
  console.log('Người đăng mẫu:', agentIds.length);

  // ---- dự án
  const projectIds: Record<string, string> = {};
  const projectNames: Record<string, string> = {};
  for (const pr of PROJECTS) {
    const dId = districtId(pr.district);
    const wId = wardId(dId, pr.ward);
    if (!dId) missing.push(`quận ${pr.district}`);
    if (pr.ward && !wId) missing.push(`phường ${pr.ward} (${pr.district})`);
    const thumb = IMGS[pr.thumb[0]]?.url ?? null;
    const data: any = {
      description: pr.html, thumbnail: thumb, city: 'Hà Nội', district: pr.district, ward: pr.ward ?? null, oldWard: pr.oldWard ?? null,
      provinceId: city.id, districtId: dId, wardId: wId, contentUpdatedAt: new Date(),
    };
    const exist = await prisma.project.findFirst({ where: { name: pr.name } });
    projectNames[pr.key] = pr.name.replace(/ Mẫu$/, '');
    if (exist) {
      projectIds[pr.key] = exist.id;
      if (apply) await prisma.project.update({ where: { id: exist.id }, data });
    } else if (apply) {
      let shortCode = '';
      for (let i = 0; i < 20; i++) {
        shortCode = crypto.randomBytes(4).readUInt32BE(0).toString(36).slice(0, 5).padStart(5, '0');
        if (!(await prisma.project.findUnique({ where: { shortCode } }))) break;
      }
      const c = await prisma.project.create({ data: { ...data, name: pr.name, slug: slugify(pr.name), shortCode, status: 'VISIBLE' } });
      projectIds[pr.key] = c.id;
    } else projectIds[pr.key] = `dry-${pr.key}`;
  }
  console.log('Dự án:', PROJECTS.length);

  const manifest: any[] = [];
  const now = Date.now();
  const nextShort = async () => {
    const r = await prisma.$queryRaw<{ n: bigint }[]>`SELECT nextval('property_short_code_seq') AS n`;
    return BigInt(r[0].n).toString(36);
  };
  const uniqueCode = async () => {
    for (let i = 0; i < 20; i++) {
      const c = `BDS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      if (!(await prisma.property.findUnique({ where: { propertyCode: c } }))) return c;
    }
    throw new Error('Không sinh được propertyCode');
  };
  const uniqueSlug = async (title: string) => {
    const base = slugify(title);
    return (await prisma.property.findUnique({ where: { slug: base } })) ? `${base}-${Math.random().toString(36).substring(2, 8)}` : base;
  };

  // hàm dựng phần dữ liệu dùng chung cho tin mới & tin cũ
  const build = (x: {
    title: string; txn: string; type: string; district: string; ward?: string | null; oldWard?: string | null; street?: string | null;
    price: number; area: number; bed?: number | null; bath?: number | null; floors?: number | null; front?: number | null; road?: number | null;
    dir?: string | null; legal?: string | null; furn?: string | null; tier?: 'VIP' | 'UP'; project?: string; agent: number; days: number;
    img: ImgRecipe; nImg?: number; negotiable?: boolean; note?: string | null;
  }) => {
    const r = rng(hash(x.title));
    const createdAt = new Date(now - x.days * DAY - Math.floor(r() * 10 * 3600 * 1000));
    const c = DISTRICT_CENTER[x.district] ?? [21.0285, 105.8542];
    const lat = +(c[0] + (r() - 0.5) * 0.03).toFixed(6);
    const lng = +(c[1] + (r() - 0.5) * 0.03).toFixed(6);
    const dId = districtId(x.district);
    if (!dId) missing.push(`quận ${x.district} (${x.title.slice(0, 30)})`);
    const wId = wardId(dId, x.ward ?? undefined);
    if (x.ward && !wId) missing.push(`phường ${x.ward} / ${x.district}`);
    const owId = oldWardId(dId, x.oldWard ?? undefined);
    if (x.oldWard && !owId) missing.push(`phường cũ ${x.oldWard} / ${x.district}`);
    const description = describe({
      ...x, projectName: x.project ? projectNames[x.project] : undefined,
    });
    const imgs = imagesFor(x.img, x.nImg, heroFor(x.title, x.project));
    const data: any = {
      title: x.title, description, transactionType: x.txn, propertyType: x.type,
      city: 'Hà Nội', district: x.district, ward: x.ward ?? null, oldWard: x.oldWard ?? null, street: x.street ?? null,
      provinceId: city.id, districtId: dId, wardId: wId, oldWardId: owId,
      price: x.price, area: x.area, bedrooms: x.bed ?? null, bathrooms: x.bath ?? null, floors: x.floors ?? null,
      frontage: x.front ?? null, roadWidth: x.road ?? null, direction: x.dir ?? null, legal: x.legal ?? null, furniture: x.furn ?? null,
      surroundings: surroundingsFor(x.type), lat, lng, isNegotiable: !!x.negotiable,
      status: 'APPROVED', tier: x.tier ?? 'NORMAL',
      tierExpiresAt: x.tier === 'VIP' ? new Date(now + 25 * DAY) : x.tier === 'UP' ? new Date(now + 20 * DAY) : null,
      phone: AGENTS[x.agent].phone, userId: agentIds[x.agent],
      createdAt, publishedAt: createdAt, pushedAt: x.tier === 'UP' ? new Date(now - Math.floor(r() * 20) * 3600 * 1000) : createdAt, contentUpdatedAt: createdAt,
      views: 15 + Math.floor(r() * 1100), likes: Math.floor(r() * 40), callClicks: Math.floor(r() * 26), zaloClicks: Math.floor(r() * 20),
      images: imgs.map((i) => i.url),
    };
    applyRangeKeys(data);
    return { data, imgs };
  };

  // ---- 1) tin đã có
  const existingRows = await prisma.property.findMany({ where: { title: { in: Object.keys(EXISTING) } } });
  const rowByTitle = new Map(existingRows.map((p) => [p.title, p]));
  for (const [title, patch] of Object.entries(EXISTING)) {
    const row = rowByTitle.get(title);
    if (!row) { console.warn('  ! Không thấy tin đã có:', title); continue; }
    const { data, imgs } = build({
      title, txn: row.transactionType, type: row.propertyType, district: row.district ?? '', ward: row.ward, oldWard: row.oldWard,
      street: patch.street, price: Number(row.price), area: Number(row.area), bed: patch.bed === undefined ? row.bedrooms : patch.bed,
      bath: patch.bath === undefined ? row.bathrooms : patch.bath, floors: patch.floors, front: patch.front, road: patch.road,
      dir: patch.dir, legal: patch.legal, furn: patch.furn, tier: patch.tier, project: patch.project, agent: patch.agent, days: patch.days,
      img: patch.img, nImg: patch.nImg, note: patch.note,
    });
    // KHÔNG đổi địa điểm/giá/diện tích/tiêu đề của tin đã có
    for (const k of ['title', 'transactionType', 'propertyType', 'city', 'district', 'ward', 'oldWard', 'provinceId', 'districtId', 'wardId', 'oldWardId', 'price', 'area', 'status']) delete data[k];
    // Chạy lại thì giữ ngày đăng/lượt xem đã đặt ở lần đầu (lần đầu tin còn thuộc admin, chưa thuộc người đăng mẫu nào).
    if (agentIds.includes(row.userId)) for (const k of ['createdAt', 'publishedAt', 'contentUpdatedAt', 'pushedAt', 'views', 'likes', 'callClicks', 'zaloClicks', 'tierExpiresAt']) delete data[k];
    let final = data;
    if (patch.project) final = { ...(await applyProjectLocation(prisma as any, { ...data, projectId: projectIds[patch.project] })) };
    manifest.push({ title, id: row.id, shortCode: row.shortCode, existing: true, tier: patch.tier ?? 'NORMAL' });
    if (!apply) continue;
    delete final.images; // ghi bằng imageObjects + mảng images ở dưới
    await prisma.$transaction([
      prisma.propertyImage.deleteMany({ where: { propertyId: row.id } }),
      prisma.property.update({ where: { id: row.id }, data: { ...final, images: imgs.map((i) => i.url) } }),
      prisma.propertyImage.createMany({ data: imgs.map((im, idx) => ({ propertyId: row.id, url: im.url, alt: im.alt, sortOrder: idx, isThumbnail: idx === 0, width: im.width ?? null, height: im.height ?? null })) }),
    ]);
  }
  console.log('Tin đã có được làm giàu:', existingRows.length);

  // ---- 2) tin mới (đã có theo tiêu đề thì làm mới nội dung/ảnh, giữ nguyên ngày đăng & mã)
  let created = 0, refreshed = 0;
  for (const l of LISTINGS as DemoListing[]) {
    const { data, imgs } = build({ ...l, bed: l.bed ?? null, bath: l.bath ?? null });
    let final = data;
    if (l.project) final = await applyProjectLocation(prisma as any, { ...data, projectId: projectIds[l.project] });
    const dup = await prisma.property.findFirst({ where: { title: l.title } });
    if (dup) {
      refreshed++;
      manifest.push({ title: l.title, id: dup.id, shortCode: dup.shortCode, tier: l.tier ?? 'NORMAL' });
      if (!apply) continue;
      const upd: any = { ...final };
      for (const k of ['title', 'createdAt', 'publishedAt', 'contentUpdatedAt', 'pushedAt', 'views', 'likes', 'callClicks', 'zaloClicks', 'tierExpiresAt', 'images']) delete upd[k];
      await prisma.$transaction([
        prisma.propertyImage.deleteMany({ where: { propertyId: dup.id } }),
        prisma.property.update({ where: { id: dup.id }, data: { ...upd, images: imgs.map((i) => i.url) } }),
        prisma.propertyImage.createMany({ data: imgs.map((im, idx) => ({ propertyId: dup.id, url: im.url, alt: im.alt, sortOrder: idx, isThumbnail: idx === 0, width: im.width ?? null, height: im.height ?? null })) }),
      ]);
      continue;
    }
    if (!apply) { created++; continue; }
    const shortCode = await nextShort();
    const p = await prisma.property.create({
      data: {
        ...final, images: imgs.map((i) => i.url), propertyCode: await uniqueCode(), slug: await uniqueSlug(l.title), shortCode,
        imageObjects: { create: imgs.map((im, idx) => ({ url: im.url, alt: im.alt, sortOrder: idx, isThumbnail: idx === 0, width: im.width ?? null, height: im.height ?? null })) },
      },
    });
    manifest.push({ title: l.title, id: p.id, shortCode: p.shortCode, tier: l.tier ?? 'NORMAL' });
    created++;
  }
  console.log(`Tin mới: tạo ${created}, làm mới (đã có) ${refreshed}`);

  // ---- 3) bình luận
  let cm = 0;
  for (const c of COMMENTS) {
    const prop = await prisma.property.findFirst({ where: { title: c.listing } });
    if (!prop || !apply) continue;
    const dup = await prisma.comment.findFirst({ where: { propertyId: prop.id, content: c.text } });
    if (dup) continue;
    const parent = await prisma.comment.create({ data: { propertyId: prop.id, userId: agentIds[c.by], content: c.text, createdAt: new Date(now - 2 * DAY) } });
    cm++;
    if (c.reply) { await prisma.comment.create({ data: { propertyId: prop.id, userId: agentIds[c.reply.by], content: c.reply.text, parentId: parent.id, createdAt: new Date(now - 1 * DAY) } }); cm++; }
  }
  console.log('Bình luận:', cm);

  // ---- 4) yêu cầu "Cần mua"
  let rq = 0;
  for (const r of REQUIREMENTS) {
    if (!apply) continue;
    if (await prisma.requirement.findFirst({ where: { phone: r.phone, content: r.content } })) continue;
    await prisma.requirement.create({
      data: {
        name: r.name, phone: r.phone, transactionType: r.txn, propertyType: r.type, locationId: r.district ? districtId(r.district) : null,
        priceMin: r.priceMin ?? null, priceMax: r.priceMax ?? null, areaMin: r.areaMin ?? null, areaMax: r.areaMax ?? null,
        content: r.content, status: r.status, createdAt: new Date(now - Math.floor(hash(r.phone) % 9) * DAY),
      },
    });
    rq++;
  }
  console.log('Yêu cầu Cần mua:', rq);

  if (missing.length) console.warn('CẢNH BÁO thiếu địa danh (bỏ FK, vẫn lưu tên chữ):', Array.from(new Set(missing)).join(' | '));
  const out = process.env.DEMO_MANIFEST_OUT || '/tmp/demo-manifest.json';
  fs.writeFileSync(out, JSON.stringify({ properties: manifest, projects: projectIds }, null, 1));
  console.log('Manifest:', out, '| Tổng tin trong manifest:', manifest.length);
  if (!apply) console.log('\nChưa ghi gì. Thêm --apply để thực hiện. Sau đó: node dist/scripts/reindex-search.js');
  else console.log('\nXong. Nhớ chạy: node dist/scripts/reindex-search.js');
}

async function doCleanup() {
  const agents = await prisma.user.findMany({ where: { email: { in: AGENTS.map((a) => a.email) } }, select: { id: true } });
  const ids = agents.map((a) => a.id);
  const props = await prisma.property.count({ where: { userId: { in: ids } } });
  const reqs = await prisma.requirement.count({ where: { phone: { in: REQUIREMENTS.map((r) => r.phone) } } });
  const newProjects = await prisma.project.findMany({ where: { name: { in: PROJECTS.filter((p) => ['royal', 'gamuda'].includes(p.key)).map((p) => p.name) } }, select: { id: true, name: true } });
  console.log(`Sẽ xoá: ${props} tin của ${ids.length} người đăng mẫu, ${reqs} yêu cầu, ${newProjects.length} dự án thêm mới, ${ids.length} tài khoản.`);
  if (!apply) { console.log('Thêm --apply để xoá thật (rồi chạy reindex-search).'); return; }
  const propIds = (await prisma.property.findMany({ where: { userId: { in: ids } }, select: { id: true } })).map((p) => p.id);
  await prisma.requirement.deleteMany({ where: { phone: { in: REQUIREMENTS.map((r) => r.phone) } } });
  await prisma.property.deleteMany({ where: { userId: { in: ids } } }); // cascade ảnh, bình luận
  // reindex-search chỉ ghi đè theo id, KHÔNG xoá tài liệu mồ côi — nên gỡ khỏi chỉ mục tại đây.
  try {
    const { Meilisearch } = await eval(`import('meilisearch')`);
    const client = new Meilisearch({ host: process.env.MEILISEARCH_HOST || 'http://localhost:7700', apiKey: process.env.MEILISEARCH_KEY || process.env.MEILISEARCH_MASTER_KEY });
    if (propIds.length) await client.index('properties').deleteDocuments(propIds);
    console.log('Đã gỡ', propIds.length, 'tài liệu khỏi Meilisearch.');
  } catch (e: any) {
    console.warn('Không gỡ được khỏi Meilisearch:', e?.message ?? e, '— chạy reindex-search hoặc xoá tay.');
  }
  await prisma.project.deleteMany({ where: { id: { in: newProjects.map((p) => p.id) } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  console.log('Đã xoá. Bài tin tức mẫu xoá riêng bằng news-demo --cleanup.');
}

main()
  .catch((e) => {
    console.error(e?.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
