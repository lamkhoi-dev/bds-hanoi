/**
 * Nguồn duy nhất cho danh tính của site: domain, thương hiệu, phạm vi tỉnh.
 *
 * Trước đây base URL được tính bằng 5 biểu thức khác nhau nằm rải rác
 * (layout.tsx, robots.ts, sitemap.ts, tin/[slug_id]/page.tsx) và còn 2 domain
 * hard-code sai (`nhadatxunghe.vn` trong [...slug]/page.tsx, `website-bds.com`
 * trong Breadcrumb.tsx). Hệ quả: canonical của trang danh mục trỏ sang domain khác.
 *
 * Chỉ dùng biến NEXT_PUBLIC_* và truy cập tĩnh, để Next inline được lúc build và
 * module này dùng được ở cả server component lẫn client component.
 */

function env(value: string | undefined, fallback: string): string {
  const v = (value ?? '').trim();
  return v.length > 0 ? v : fallback;
}

const url = env(
  process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL,
  'http://localhost:3000',
).replace(/\/+$/, '');

const name = env(process.env.NEXT_PUBLIC_SITE_NAME, 'Nhà Đất Hà Nội');
const provinceName = env(process.env.NEXT_PUBLIC_PROVINCE_NAME, 'Hà Nội');
// PROVINCE_SLUG có thể là danh sách nhiều tỉnh cách nhau dấu phẩy (site "xứ Nghệ" phục
// vụ cả Nghệ An lẫn Hà Tĩnh, vd "nghe-an,ha-tinh") — dùng cho lọc dữ liệu đa tỉnh phía
// backend. Nhưng mọi nơi ở FRONTEND dùng slug này để dựng 1 URL đơn (link menu "BĐS
// {tỉnh}", so khớp trong bộ lọc) nên phải lấy đúng TỈNH CHÍNH (phần tử đầu) — dùng
// nguyên cả chuỗi sẽ ra href dạng "/nghe-an,ha-tinh" và 404.
const provinceSlugRaw = env(process.env.NEXT_PUBLIC_PROVINCE_SLUG, 'ha-noi');
const provinceSlug = provinceSlugRaw.split(',')[0].trim();
const appEnv = env(process.env.NEXT_PUBLIC_APP_ENV, 'production');

/**
 * Tên thương hiệu tách 2 dòng cho logo header, vd "Nhà Đất" / "Xứ Nghệ".
 *
 * Ưu tiên đọc trực tiếp từ 2 biến môi trường — suy luận qua "tên có kết thúc bằng tên
 * tỉnh không" (thuật toán cũ) chỉ đúng khi 2 chuỗi này thực sự trùng đuôi (site Hà Nội:
 * "Nhà Đất Hà Nội" kết thúc bằng "Hà Nội" — đúng), nhưng sai với site Nghệ An: tên
 * thương hiệu là "Nhà Đất Xứ Nghệ", đuôi thật là "Xứ Nghệ" chứ không phải "Nghệ An" —
 * suy luận cho ra rỗng, cả tên dồn về 1 dòng. Set thẳng 2 biến tránh phụ thuộc vào quan
 * hệ tình cờ giữa 2 chuỗi.
 */
const brandLine1Env = env(process.env.NEXT_PUBLIC_BRAND_LINE1, '');
const brandLine2Env = env(process.env.NEXT_PUBLIC_BRAND_LINE2, '');
const brandFallbackSuffix = name.endsWith(provinceName) ? provinceName : '';
const brandFallbackPrefix = brandFallbackSuffix
  ? name.slice(0, name.length - brandFallbackSuffix.length).trim()
  : '';
const brandLine1 = brandLine1Env || brandFallbackPrefix || name;
const brandLine2 = brandLine1Env ? brandLine2Env : brandFallbackSuffix;

export const siteConfig = {
  /** Base URL tuyệt đối, không có dấu / ở cuối. */
  url,
  name,
  shortName: env(process.env.NEXT_PUBLIC_SITE_SHORT_NAME, name),
  description: `Tìm kiếm mua bán nhà đất, căn hộ, chung cư tại ${provinceName} — thông tin minh bạch, cập nhật hằng ngày.`,
  keywords: [
    'Bất động sản',
    name,
    'Mua bán nhà đất',
    `Bất động sản ${provinceName}`,
    `Nhà đất ${provinceName}`,
  ],
  locale: 'vi_VN',

  /** Tỉnh/thành mà site này phục vụ. Mọi chỗ trước đây hard-code "Nghệ An" dùng cái này. */
  province: {
    name: provinceName,
    slug: provinceSlug,
  },

  /** Tên thương hiệu tách sẵn 2 dòng cho logo header — xem giải thích ở trên. */
  brand: {
    line1: brandLine1,
    line2: brandLine2,
  },

  /**
   * Bật khi APP_ENV=staging. robots.ts sẽ chặn index toàn site.
   * Giữ bật cho tới khi có dữ liệu Hà Nội thật + domain chính thức, nếu không
   * Google coi site này là bản trùng nội dung của site nguồn.
   */
  isStaging: appEnv === 'staging' || url.includes('staging'),

  ogImage: '/og-image.png',
  /** Ảnh raster cho Organization schema — Google không nhận SVG cho logo. */
  logo: '/icons/icon-512x512.png',

  contact: {
    phone: env(process.env.NEXT_PUBLIC_SUPPORT_PHONE, ''),
    email: env(process.env.NEXT_PUBLIC_SUPPORT_EMAIL, ''),
    facebook: env(process.env.NEXT_PUBLIC_FACEBOOK_URL, ''),
  },

  /** Ghép thành URL tuyệt đối. Chỉ dùng cho JSON-LD — Next không tự resolve JSON-LD. */
  absolute(path: string): string {
    if (/^https?:\/\//i.test(path)) return path;
    return `${url}${path.startsWith('/') ? path : `/${path}`}`;
  },
} as const;

export type SiteConfig = typeof siteConfig;
