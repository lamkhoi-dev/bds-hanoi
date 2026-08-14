import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';

/**
 * Các đường dẫn thuộc khu vực tài khoản (route group `app/user/(dashboard)`).
 * Liệt kê tường minh vì `/user/[slug]` là trang hồ sơ CÔNG KHAI, chặn cả `/user/`
 * sẽ chặn nhầm nó. P7 sẽ đổi khu vực tài khoản sang `/tai-khoan/` để rút gọn còn 1 dòng.
 */
const ACCOUNT_PATHS = [
  '/user$',
  '/user/my-listings',
  '/user/packages',
  '/user/properties',
  '/user/requirements',
  '/user/saved',
  '/user/settings',
  '/user/wallet',
  '/user/favorites',
  '/user/nap-tien',
  '/user/recently-viewed',
  '/user/transactions',
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url;

  if (siteConfig.isStaging) {
    return {
      rules: { userAgent: '*', disallow: '/' },
      sitemap: `${baseUrl}/sitemap.xml`,
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/login',
        '/register',
        '/forgot-password',
        '/change-password',
        '/auth-success',
        '/api/',
        ...ACCOUNT_PATHS,
      ],
      // KHÔNG chặn /search, /post, /so-sanh, /map và các trang khu vực rỗng:
      // chúng dùng thẻ meta noindex. Bị Disallow thì Googlebot không đọc được thẻ
      // noindex, URL đã trót được index sẽ kẹt lại vĩnh viễn dưới dạng "URL-only".
      // (/post đã từng xuất hiện trong kết quả tìm kiếm nên phải gỡ được ra.)
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
