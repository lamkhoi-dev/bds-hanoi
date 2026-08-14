import { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';
import MyListingsClient from './MyListingsClient';

// `layout.tsx` đã đặt template `%s | {tên site}` — nối thêm ở đây là lặp thương hiệu.
export const metadata: Metadata = {
  title: 'Danh sách tin đã đăng',
  description: `Danh sách các tin bất động sản bạn đã đăng trên ${siteConfig.name}.`,
};

export default function MyListingsPage() {
  return <MyListingsClient />;
}
