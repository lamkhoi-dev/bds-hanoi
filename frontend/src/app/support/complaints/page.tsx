export default function ComplaintsPage() {
  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6">Quy trình giải quyết khiếu nại</h1>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 prose max-w-none text-gray-600">
          <h3 className="text-lg font-bold text-gray-800 mt-6">Bước 1: Tiếp nhận</h3>
          <p className="mb-2">Người dùng gửi khiếu nại qua:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Email hỗ trợ</li>
            <li>Form liên hệ</li>
            <li>Hotline</li>
          </ul>

          <h3 className="text-lg font-bold text-gray-800 mt-6">Bước 2: Xác minh</h3>
          <p className="mt-2">Website kiểm tra thông tin liên quan và liên hệ các bên nếu cần.</p>

          <h3 className="text-lg font-bold text-gray-800 mt-6">Bước 3: Xử lý</h3>
          <p className="mt-2">Trong vòng 3–7 ngày làm việc kể từ khi nhận đủ thông tin.</p>

          <h3 className="text-lg font-bold text-gray-800 mt-6">Bước 4: Phản hồi kết quả</h3>
          <p className="mt-2">Kết quả xử lý sẽ được gửi tới người khiếu nại qua email hoặc số điện thoại đã đăng ký.</p>

          <h3 className="text-lg font-bold text-gray-800 mt-10">Lưu ý</h3>
          <p className="mt-2 italic bg-gray-50 p-4 rounded-md border-l-4 border-gray-400">
            Nhà Đất Xứ Nghệ là nền tảng kết nối thông tin. Website không phải là bên tham gia giao dịch mua bán hoặc cho thuê bất động sản giữa các bên và không chịu trách nhiệm đối với các thỏa thuận dân sự phát sinh giữa người đăng tin và người liên hệ.
          </p>
        </div>
      </div>
    </div>
  );
}
