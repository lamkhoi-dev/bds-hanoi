import type { Metadata } from 'next';

// page.tsx là client component nên không export được metadata; đặt ở layout (cùng khuôn
// với app/post/layout.tsx).
//
// Khách phản hồi 19-8: /login chỉ bị chặn trong robots.txt mà KHÔNG có thẻ noindex —
// theo tài liệu Google, URL bị robots.txt chặn thì Googlebot không đọc được thẻ noindex,
// nên URL vẫn có thể xuất hiện trong kết quả nếu được liên kết từ nơi khác. Vì vậy phải
// đi kèm việc GỠ '/login' khỏi mảng disallow trong app/robots.ts — giữ cả hai thì thẻ
// này vô tác dụng.
export const metadata: Metadata = {
  title: 'Đăng nhập',
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
