export type SiteLayout = 'classic' | 'grouped';

/**
 * Đọc `SITE_LAYOUT` — biến RUNTIME phía backend/server, KHÔNG tiền tố `NEXT_PUBLIC_`.
 *
 * ⚠️ CHỈ DÙNG TRONG SERVER COMPONENT. Gọi trong client component sẽ luôn trả về
 * 'classic' MÀ KHÔNG BÁO LỖI GÌ (biến không có tiền tố NEXT_PUBLIC_ không được Next.js
 * inline vào bundle client, `process.env.SITE_LAYOUT` ở đó luôn là `undefined`) — đây
 * là lỗi im lặng, khó phát hiện khi test bằng mắt vì 'classic' cũng là một giá trị hợp
 * lệ, chỉ là sai ý.
 *
 * Dùng cùng giá trị với backend (`backend/src/property/homepage-layout.ts`) để 2
 * dropdown lọc phường/xã (mục 25.5b PHẦN II) chỉ hiện đúng site Hà Nội — xem gate kép ở
 * `[...slug]/page.tsx` (cờ NÀY + kiểm tra đoạn URL đang xem có đúng là DISTRICT không).
 */
export function siteLayout(): SiteLayout {
  return process.env.SITE_LAYOUT === 'grouped' ? 'grouped' : 'classic';
}
