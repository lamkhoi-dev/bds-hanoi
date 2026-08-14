import { siteConfig } from '@/lib/site-config';
import type { Metadata } from 'next';

// Trước đây 9/10 trang hỗ trợ không có metadata nào — Google tự cắt mô tả từ thân
// trang (yêu cầu II.5). Tiêu đề KHÔNG kèm tên site: template ở layout.tsx đã nối sẵn.
export const metadata: Metadata = {
  title: 'Chính sách đăng tin',
  description: `Quy định về tin đăng miễn phí và tin trả phí trên ${siteConfig.name}, cùng danh sách các trường hợp tin bị từ chối kiểm duyệt.`,
  alternates: { canonical: '/support/posting-policy' },
};
export default function PostingPolicyPage() {
  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6">Chính sách đăng tin</h1>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 prose max-w-none text-gray-600">
          <h3 className="text-lg font-bold text-gray-800 mt-6">Tin miễn phí</h3>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Người dùng được đăng tin miễn phí theo giới hạn hệ thống quy định.</li>
            <li>Tin đăng phải đúng danh mục và khu vực.</li>
          </ul>

          <h3 className="text-lg font-bold text-gray-800 mt-6">Tin trả phí</h3>
          <p className="mb-2">Bao gồm:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Tin ghim</li>
            <li>Tin UP (khi vượt quá free)</li>
            <li>Đăng tin (khi vượt quá free)</li>
          </ul>
          <p className="mt-4">Tin trả phí được hiển thị nổi bật theo thời gian và vị trí quy định trên website.</p>

          <h3 className="text-lg font-bold text-gray-800 mt-6">Các trường hợp từ chối đăng tin</h3>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Nội dung sai sự thật.</li>
            <li>Thông tin không liên quan đến bất động sản.</li>
            <li>Nội dung vi phạm pháp luật.</li>
            <li>Hình ảnh phản cảm hoặc không phù hợp.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
