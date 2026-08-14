import { siteConfig } from '@/lib/site-config';
import type { JsonLdNode } from './types';

/** @id ổn định để các node khác tham chiếu chéo trong cùng một @graph. */
export const ORGANIZATION_ID = siteConfig.absolute('/#organization');

/**
 * Organization schema — mục III.3 trong danh sách fix SEO ("CẦN LÀM: thêm tại trang chủ
 * với tên thương hiệu, URL, logo, thông tin liên hệ và mạng xã hội chính thức").
 * Đặt ở layout để mọi trang đều có, không chỉ trang chủ.
 */
export function buildOrganization(): JsonLdNode {
  const sameAs = [siteConfig.contact.facebook].filter(Boolean);

  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: siteConfig.name,
    url: siteConfig.absolute('/'),
    // Google không nhận SVG cho Organization.logo — dùng ảnh raster.
    logo: {
      '@type': 'ImageObject',
      url: siteConfig.absolute(siteConfig.logo),
      width: 512,
      height: 512,
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: siteConfig.province.name,
    },
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(siteConfig.contact.email ? { email: siteConfig.contact.email } : {}),
    ...(siteConfig.contact.phone
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: siteConfig.contact.phone,
            contactType: 'customer service',
            areaServed: 'VN',
            availableLanguage: ['vi'],
          },
        }
      : {}),
  };
}
