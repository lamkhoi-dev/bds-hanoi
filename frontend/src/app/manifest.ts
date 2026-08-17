import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';

/**
 * Thay cho `public/manifest.json` tĩnh (từng hard-code "Nhà Đất Xứ Nghệ" — sai brand
 * khi site chạy cho Hà Nội). File convention của Next tự sinh `/manifest.webmanifest`
 * và tự chèn `<link rel="manifest">`, đọc theo `siteConfig` nên đúng brand cho cả 2 tỉnh.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} - Nền tảng Bất Động Sản`,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F7FA',
    theme_color: '#1565C0',
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    categories: ['business', 'lifestyle'],
    lang: 'vi',
    dir: 'ltr',
  };
}
