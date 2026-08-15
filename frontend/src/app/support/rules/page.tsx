export default function RulesPage() {
  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6">Quy chế hoạt động</h1>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 prose max-w-none text-gray-600">
          <h3 className="text-lg font-bold text-gray-800 mt-6">1. Vai trò của website</h3>
          <p>Nhà Đất Xứ Nghệ là nền tảng kết nối người có nhu cầu đăng bán, cho thuê bất động sản với người có nhu cầu tìm kiếm bất động sản.</p>

          <h3 className="text-lg font-bold text-gray-800 mt-6">2. Trách nhiệm người đăng tin</h3>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Cung cấp thông tin chính xác.</li>
            <li>Chịu trách nhiệm pháp lý đối với nội dung đăng tải.</li>
            <li>Đảm bảo quyền sử dụng hợp pháp đối với hình ảnh và nội dung cung cấp.</li>
          </ul>

          <h3 className="text-lg font-bold text-gray-800 mt-6">3. Trách nhiệm người xem tin</h3>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Tự xác minh thông tin trước khi giao dịch.</li>
            <li>Tự chịu trách nhiệm về các quyết định giao dịch.</li>
          </ul>

          <h3 className="text-lg font-bold text-gray-800 mt-6">4. Trách nhiệm của website</h3>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Cung cấp nền tảng đăng tin và tìm kiếm.</li>
            <li>Hỗ trợ xử lý các trường hợp vi phạm khi phát hiện hoặc được phản ánh.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
