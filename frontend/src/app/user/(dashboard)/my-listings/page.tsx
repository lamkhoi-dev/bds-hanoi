import { Metadata } from 'next';
import MyListingsClient from './MyListingsClient';

export const metadata: Metadata = {
  title: 'Danh sách tin đã đăng | Nhà Đất Xứ Nghệ',
  description: 'Danh sách các tin bất động sản bạn đã đăng trên Nhà Đất Xứ Nghệ.',
};

export default function MyListingsPage() {
  return <MyListingsClient />;
}
