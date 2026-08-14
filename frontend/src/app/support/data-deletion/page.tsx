import { siteConfig } from '@/lib/site-config';
// `layout.tsx` đã đặt template `%s | {tên site}` nên nối thêm tên site ở đây làm tiêu đề
// lặp thương hiệu hai lần (yêu cầu II.3).
export const metadata = {
  title: 'Yêu cầu xóa dữ liệu',
  description: `Hướng dẫn yêu cầu xóa dữ liệu cá nhân đã lưu tại ${siteConfig.name} khi bạn đăng nhập bằng Facebook, kèm các cách gửi yêu cầu và thời gian xử lý.`,
  alternates: { canonical: '/support/data-deletion' },
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6">Yêu cầu xóa dữ liệu</h1>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 prose max-w-none text-gray-600">
          <p>
            Nếu bạn đã đăng nhập <strong>{siteConfig.name}</strong> bằng Facebook và muốn xóa dữ liệu của mình, vui lòng thực hiện theo một trong các cách sau:
          </p>

          <h3 className="text-lg font-bold text-gray-800 mt-6">Cách 1: Xóa trực tiếp trên Website</h3>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Đăng nhập vào tài khoản của bạn.</li>
            <li>Vào phần <strong>Cài đặt tài khoản</strong>.</li>
            <li>Chọn <strong>"Xóa tài khoản"</strong> hoặc liên hệ quản trị viên để yêu cầu xóa dữ liệu.</li>
          </ul>

          <h3 className="text-lg font-bold text-gray-800 mt-6">Cách 2: Gửi Email Yêu cầu</h3>
          <p className="mt-2">Hoặc bạn có thể gửi email yêu cầu xóa dữ liệu tới địa chỉ email quản trị viên:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Email:</strong> <a href={`mailto:${siteConfig.contact.email}`} className="text-primary hover:underline">{siteConfig.contact.email}</a></li>
          </ul>
          
          <p className="mt-4">
            (Lưu ý: Vui lòng sử dụng chính email mà bạn đã đăng ký để gửi yêu cầu)
          </p>
          
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="m-0 font-medium text-gray-700">Chúng tôi sẽ xử lý yêu cầu xóa dữ liệu của bạn trong thời gian sớm nhất (tối đa 7 ngày làm việc).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
