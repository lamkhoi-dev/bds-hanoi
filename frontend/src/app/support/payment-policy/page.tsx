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
