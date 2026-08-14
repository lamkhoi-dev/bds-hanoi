import type { Metadata } from 'next';

// Trang chức năng so sánh: nội dung phụ thuộc lựa chọn của từng người dùng nên
// không có giá trị index. Xem chú thích trong app/post/layout.tsx về lý do dùng
// meta noindex thay vì Disallow.
export const metadata: Metadata = {
  title: 'So sánh bất động sản',
  robots: { index: false, follow: true },
};

export default function SoSanhLayout({ children }: { children: React.ReactNode }) {
  return children;
}
