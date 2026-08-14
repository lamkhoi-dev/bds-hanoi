import { siteConfig } from '@/lib/site-config';
import type { Metadata } from 'next';

// Trước đây 9/10 trang hỗ trợ không có metadata nào — Google tự cắt mô tả từ thân
// trang (yêu cầu II.5). Tiêu đề KHÔNG kèm tên site: template ở layout.tsx đã nối sẵn.
export const metadata: Metadata = {
  title: 'Chính sách thanh toán',
  description: `Các hình thức thanh toán được chấp nhận tại ${siteConfig.name}, cách nạp tiền vào tài khoản và quy trình xác nhận giao dịch sau khi thanh toán.`,
  alternates: { canonical: '/support/payment-policy' },
};
export default function PaymentPolicyPage() {
  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6">Chính sách thanh toán</h1>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 prose max-w-none text-gray-600">
          <h3 className="text-lg font-bold text-gray-800 mt-6">Hình thức thanh toán</h3>
          <p className="mb-2">Người dùng có thể thanh toán thông qua:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Chuyển khoản ngân hàng.</li>
            <li>Các phương thức thanh toán được website hỗ trợ.</li>
          </ul>

          <h3 className="text-lg font-bold text-gray-800 mt-6">Xác nhận thanh toán</h3>
          <p className="mb-2">Sau khi thanh toán thành công:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Hệ thống tự động hoặc quản trị viên sẽ kích hoạt dịch vụ tương ứng.</li>
            <li>Thời gian xử lý thông thường không quá 24 giờ.</li>
          </ul>

        </div>
      </div>
    </div>
  );
}
