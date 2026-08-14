import { siteConfig } from '@/lib/site-config';
import type { Metadata } from 'next';

// Trước đây 9/10 trang hỗ trợ không có metadata nào — Google tự cắt mô tả từ thân
// trang (yêu cầu II.5). Tiêu đề KHÔNG kèm tên site: template ở layout.tsx đã nối sẵn.
export const metadata: Metadata = {
  title: 'Hướng dẫn đăng tin',
  description: `Hướng dẫn đăng tin bất động sản trên ${siteConfig.name} qua bốn bước: đăng nhập, chọn đăng tin mới, điền thông tin chi tiết và chờ kiểm duyệt.`,
  alternates: { canonical: '/support/how-to-post' },
};
export default function HowToPostPage() {
  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6">Hướng dẫn đăng tin</h1>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-primary mb-4">Bước 1: Đăng nhập tài khoản</h2>
          <p className="text-gray-600 mb-6">Bạn cần đăng nhập vào hệ thống. Nếu chưa có tài khoản, vui lòng đăng ký mới. Việc đăng ký hoàn toàn miễn phí.</p>
          
          <h2 className="text-xl font-bold text-primary mb-4">Bước 2: Chọn Đăng tin mới</h2>
          <p className="text-gray-600 mb-6">Click vào nút "Đăng tin" ở góc phải màn hình. Giao diện trang đăng tin sẽ hiện ra.</p>

          <h2 className="text-xl font-bold text-primary mb-4">Bước 3: Điền thông tin chi tiết</h2>
          <p className="text-gray-600 mb-6">Điền đầy đủ các thông tin quan trọng như: Tiêu đề, Loại hình (Bán/Cho thuê), Diện tích, Mức giá, Khu vực và Nội dung mô tả chi tiết. Hình ảnh là yếu tố quan trọng giúp tin đăng của bạn thu hút hơn.</p>

          <h2 className="text-xl font-bold text-primary mb-4">Bước 4: Chờ kiểm duyệt</h2>
          <p className="text-gray-600 mb-6">Sau khi hoàn tất, tin của bạn sẽ được chuyển sang trạng thái "Chờ duyệt". Đội ngũ Admin sẽ duyệt tin trong vòng 1-2 giờ làm việc.</p>
        </div>
      </div>
    </div>
  );
}
