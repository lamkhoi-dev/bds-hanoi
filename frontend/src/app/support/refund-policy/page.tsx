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
