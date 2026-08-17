import { siteConfig } from '@/lib/site-config';
import type { Metadata } from 'next';

// Trước đây 9/10 trang hỗ trợ không có metadata nào — Google tự cắt mô tả từ thân
// trang (yêu cầu II.5). Tiêu đề KHÔNG kèm tên site: template ở layout.tsx đã nối sẵn.
export const metadata: Metadata = {
  title: 'Chính sách quyền riêng tư',
  description: `${siteConfig.name} thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn như thế nào, kèm hướng dẫn thực hiện quyền truy cập và xóa dữ liệu.`,
  alternates: { canonical: '/support/privacy' },
};
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6">Chính sách Quyền riêng tư (Privacy Policy)</h1>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 prose max-w-none text-gray-600">
          <p className="mb-4 text-sm text-gray-500">Cập nhật lần cuối: Ngày 26 tháng 06 năm 2026</p>
          <p className="mb-4">Chào mừng bạn đến với {siteConfig.name}. Chúng tôi tôn trọng quyền riêng tư của bạn và cam kết bảo vệ dữ liệu cá nhân của người dùng. Chính sách này giải thích cách chúng tôi thu thập, sử dụng, chia sẻ và bảo vệ thông tin của bạn khi sử dụng trang web và ứng dụng của chúng tôi, bao gồm cả khi bạn đăng nhập thông qua các dịch vụ của bên thứ ba như Facebook hoặc Google.</p>

          <h3 className="text-lg font-bold text-gray-800 mt-6 border-b pb-2">1. Thông tin chúng tôi thu thập</h3>
          <p className="mb-2 mt-4">Chúng tôi thu thập các loại thông tin sau:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Thông tin bạn cung cấp:</strong> Bao gồm họ tên, số điện thoại, địa chỉ email, và nội dung tin đăng bất động sản khi bạn đăng ký tài khoản hoặc sử dụng dịch vụ.</li>
            <li><strong>Thông tin từ nền tảng bên thứ ba (Facebook/Google):</strong> Khi bạn sử dụng tính năng &quot;Đăng nhập bằng Facebook&quot; hoặc Google, chúng tôi có thể nhận được thông tin công khai từ hồ sơ của bạn (như Tên, Địa chỉ Email, và Ảnh đại diện) theo sự cho phép của bạn trên nền tảng đó.</li>
            <li><strong>Thông tin kỹ thuật:</strong> Địa chỉ IP, loại trình duyệt, hệ điều hành và lịch sử truy cập trên website để đảm bảo an ninh và tối ưu hóa hệ thống.</li>
          </ul>

          <h3 className="text-lg font-bold text-gray-800 mt-8 border-b pb-2">2. Cách chúng tôi sử dụng thông tin</h3>
          <p className="mb-2 mt-4">Thông tin thu thập được sử dụng để:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Tạo, xác thực và quản lý tài khoản của bạn trên nền tảng.</li>
            <li>Cung cấp, cá nhân hóa và cải thiện các dịch vụ, tính năng của website.</li>
            <li>Xử lý và quản lý các tin đăng bất động sản của bạn.</li>
            <li>Liên hệ hỗ trợ khách hàng, gửi thông báo về bảo mật hoặc cập nhật chính sách.</li>
            <li>Ngăn chặn các hành vi gian lận, lừa đảo hoặc vi phạm pháp luật.</li>
          </ul>

          <h3 className="text-lg font-bold text-gray-800 mt-8 border-b pb-2">3. Chia sẻ thông tin</h3>
          <p className="mb-2 mt-4">Chúng tôi cam kết <strong>không bán, cho thuê hoặc chia sẻ</strong> thông tin cá nhân của bạn cho bên thứ ba vì mục đích thương mại. Thông tin chỉ được chia sẻ trong các trường hợp sau:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Khi có sự đồng ý rõ ràng từ bạn.</li>
            <li>Khi có yêu cầu hợp pháp từ các cơ quan nhà nước có thẩm quyền theo quy định của pháp luật Việt Nam.</li>
            <li>Với các đối tác cung cấp dịch vụ (như dịch vụ lưu trữ, gửi SMS) với điều kiện họ cam kết bảo mật nghiêm ngặt dữ liệu này.</li>
          </ul>

          <h3 className="text-lg font-bold text-gray-800 mt-8 border-b pb-2">4. Bảo mật dữ liệu</h3>
          <p className="mb-4 mt-4">Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức phù hợp để bảo vệ dữ liệu cá nhân của bạn khỏi việc truy cập, sử dụng hoặc tiết lộ trái phép. Tuy nhiên, không có phương thức truyền tải qua Internet nào là an toàn 100%, do đó chúng tôi không thể đảm bảo an toàn tuyệt đối nhưng sẽ nỗ lực tối đa để bảo vệ dữ liệu của bạn.</p>

          <h3 className="text-lg font-bold text-gray-800 mt-8 border-b pb-2">5. Quyền của người dùng &amp; Hướng dẫn xóa dữ liệu (Theo chuẩn Facebook/Google)</h3>
          <p className="mb-4 mt-4">Bạn có quyền xem, chỉnh sửa hoặc yêu cầu xóa dữ liệu cá nhân của mình bất kỳ lúc nào.</p>
          <p className="mb-2 font-semibold">Nếu bạn đăng nhập bằng tài khoản Facebook và muốn xóa quyền truy cập cũng như dữ liệu của bạn trên hệ thống của chúng tôi, vui lòng thực hiện các bước sau:</p>
          <ul className="list-disc pl-5 space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <li><strong>Bước 1:</strong> Đăng nhập vào tài khoản Facebook cá nhân của bạn.</li>
            <li><strong>Bước 2:</strong> Đi tới <strong>Cài đặt &amp; quyền riêng tư (Settings &amp; Privacy)</strong> &gt; <strong>Cài đặt (Settings)</strong>.</li>
            <li><strong>Bước 3:</strong> Chọn <strong>Ứng dụng và trang web (Apps and Websites)</strong>.</li>
            <li><strong>Bước 4:</strong> Tìm ứng dụng <strong>{siteConfig.name}</strong> trong danh sách.</li>
            <li><strong>Bước 5:</strong> Nhấn vào <strong>Xóa (Remove)</strong> để gỡ bỏ quyền truy cập.</li>
            <li><strong>Bước 6 (Quan trọng):</strong> Để yêu cầu chúng tôi xóa vĩnh viễn toàn bộ dữ liệu của bạn (bao gồm email, tin đăng, số điện thoại) khỏi hệ thống máy chủ, vui lòng gửi email tới <strong>{siteConfig.contact.email}</strong> với tiêu đề &quot;Yêu cầu xóa dữ liệu tài khoản&quot; hoặc gọi điện trực tiếp tới số Hotline hỗ trợ. Chúng tôi sẽ thực hiện xóa hoàn toàn dữ liệu của bạn trong vòng 24 - 48 giờ.</li>
          </ul>

          <h3 className="text-lg font-bold text-gray-800 mt-8 border-b pb-2">6. Liên hệ</h3>
          <p className="mb-2 mt-4">Nếu bạn có bất kỳ câu hỏi nào về Chính sách bảo mật này hoặc cần hỗ trợ về dữ liệu cá nhân, vui lòng liên hệ với chúng tôi qua:</p>
          <ul className="list-disc pl-5 space-y-2">
            {siteConfig.contact.email && <li><strong>Email:</strong> {siteConfig.contact.email}</li>}
            {/* Không còn fallback cứng '0868126826' (số Nghệ An) — thiếu biến thì ẩn
                hẳn dòng này thay vì hiện nhầm số của site khác. */}
            {siteConfig.contact.phone && <li><strong>Hotline:</strong> {siteConfig.contact.phone}</li>}
            <li><strong>Địa chỉ:</strong> {siteConfig.province.name}, Việt Nam</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
