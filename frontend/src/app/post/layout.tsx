import type { Metadata } from 'next';

// page.tsx là client component nên không export được metadata; đặt ở layout.
// /post đã từng lọt vào kết quả tìm kiếm Google (mục I.11 trong danh sách fix SEO).
// Dùng meta noindex chứ KHÔNG dùng Disallow trong robots.txt — bị chặn crawl thì
// Googlebot không đọc được thẻ noindex và URL sẽ kẹt trong chỉ mục.
export const metadata: Metadata = {
  title: 'Đăng tin bất động sản',
  robots: { index: false, follow: true },
};

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
