import { Check } from 'lucide-react';
import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import type { Metadata } from 'next';

// Trước đây 9/10 trang hỗ trợ không có metadata nào — Google tự cắt mô tả từ thân
// trang (yêu cầu II.5). Tiêu đề KHÔNG kèm tên site: template ở layout.tsx đã nối sẵn.
export const metadata: Metadata = {
  title: 'Bảng giá dịch vụ',
  description: `Bảng giá tin thường, tin VIP và dịch vụ đẩy tin trên ${siteConfig.name}. So sánh quyền lợi từng gói để chọn hình thức đăng tin phù hợp.`,
  alternates: { canonical: '/support/pricing' },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-8 text-center">Bảng giá dịch vụ</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tin Thường */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Tin Thường</h2>
            <p className="text-4xl font-extrabold text-primary mb-6">Miễn phí</p>
            <ul className="space-y-3 text-gray-600 flex-1">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Hiển thị trong kết quả tìm kiếm</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Tối đa 8 ảnh</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Nếu không có ảnh, hệ thống tự tạo thumbnail</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Thời hạn hiển thị theo quy định hệ thống</li>
            </ul>
            <Link href="/post" className="w-full py-3 mt-6 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200 transition text-center block">Đăng ngay</Link>
          </div>

          {/* Tin VIP */}
          <div className="bg-primary p-8 rounded-2xl shadow-lg border border-primary relative flex flex-col text-white transform md:-translate-y-4">
            <div className="absolute top-0 right-0 bg-accent text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">Khuyên dùng</div>
            <h2 className="text-xl font-bold mb-2">Tin VIP</h2>
            <p className="text-4xl font-extrabold mb-6">50.000đ<span className="text-sm font-normal">/tin</span></p>
            <ul className="space-y-3 text-white/90 flex-1">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> Hiển thị trong khu vực tin nổi bật</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> Tối đa 8 ảnh</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> Nhãn VIP thu hút</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> Thời hạn VIP theo cấu hình hệ thống</li>
            </ul>
            <Link href="/user/my-listings" className="w-full py-3 mt-6 bg-white text-primary font-bold rounded-xl hover:bg-gray-50 transition text-center block">Đăng ngay</Link>
          </div>

          {/* Tin Đẩy (Up) */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Đẩy tin (Up)</h2>
            <p className="text-4xl font-extrabold text-accent mb-6">10.000đ<span className="text-sm text-gray-500 font-normal">/lần</span></p>
            <ul className="space-y-3 text-gray-600 flex-1">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Đẩy tin lên cao trong danh sách tìm kiếm</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Có cooldown giữa các lần up</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Giới hạn theo quy định hệ thống</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Có 1 lượt up miễn phí/ngày nếu bật</li>
            </ul>
            <Link href="/user/my-listings" className="w-full py-3 mt-6 bg-accent text-white font-bold rounded-xl hover:bg-accent-light transition text-center block">Mua gói đẩy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
