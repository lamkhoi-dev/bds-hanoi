import type { Metadata } from 'next';

// Xem giải thích ở app/login/layout.tsx — cùng lý do (khách phản hồi 19-8) và cùng ràng
// buộc: phải gỡ '/register' khỏi disallow trong app/robots.ts, nếu không Googlebot bị
// chặn crawl sẽ không đọc được thẻ noindex này.
export const metadata: Metadata = {
  title: 'Đăng ký tài khoản',
  robots: { index: false, follow: true },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
