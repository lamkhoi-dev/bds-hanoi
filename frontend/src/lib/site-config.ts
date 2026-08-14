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
const provinceSlug = env(process.env.NEXT_PUBLIC_PROVINCE_SLUG, 'ha-noi');
const appEnv = env(process.env.NEXT_PUBLIC_APP_ENV, 'production');

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
