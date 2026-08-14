import type { Metadata } from 'next';

// Trang bản đồ là giao diện tra cứu, nội dung trùng với các trang danh mục.
export const metadata: Metadata = {
  title: 'Bản đồ bất động sản',
  robots: { index: false, follow: true },
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
