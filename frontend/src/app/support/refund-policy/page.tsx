import { siteConfig } from '@/lib/site-config';
import type { Metadata } from 'next';

// Trước đây 9/10 trang hỗ trợ không có metadata nào — Google tự cắt mô tả từ thân
// trang (yêu cầu II.5). Tiêu đề KHÔNG kèm tên site: template ở layout.tsx đã nối sẵn.
export const metadata: Metadata = {
  title: 'Chính sách hoàn tiền',
  description: `Điều kiện, thời hạn và thủ tục hoàn tiền cho các dịch vụ trả phí đã mua trên ${siteConfig.name}, cùng các trường hợp không được hoàn tiền.`,
  alternates: { canonical: '/support/refund-policy' },
};
export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6">Chính sách hoàn tiền</h1>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 prose max-w-none text-gray-600">
          <h4 className="text-lg font-bold text-gray-800 mt-4">Trường hợp được hoàn tiền</h4>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Thanh toán trùng lặp.</li>
            <li>Thanh toán thành công nhưng dịch vụ không được kích hoạt do lỗi hệ thống.</li>
            <li>Lỗi phát sinh từ phía website.</li>
          </ul>

          <h4 className="text-lg font-bold text-gray-800 mt-6">Trường hợp không hoàn tiền</h4>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Người dùng đã sử dụng dịch vụ.</li>
            <li>Tin đăng bị xóa do vi phạm quy định.</li>
            <li>Người dùng nhập sai thông tin khi thanh toán.</li>
          </ul>

          <h4 className="text-lg font-bold text-gray-800 mt-6">Thời gian xử lý</h4>
          <p className="mt-2">Từ 3–15 ngày làm việc tùy hình thức thanh toán.</p>
        </div>
      </div>
    </div>
  );
}
