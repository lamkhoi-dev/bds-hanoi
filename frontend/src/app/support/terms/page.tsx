export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6">Điều khoản dịch vụ (Terms of Service)</h1>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 prose max-w-none text-gray-600">
          <p className="mb-4 text-sm text-gray-500">Cập nhật lần cuối: Ngày 26 tháng 06 năm 2026</p>
          <p className="mb-4">Chào mừng bạn đến với Nhà Đất Xứ Nghệ. Việc truy cập và sử dụng trang web (và các ứng dụng liên quan) đồng nghĩa với việc bạn đã đọc, hiểu và đồng ý tuân thủ các Điều khoản dịch vụ dưới đây. Vui lòng đọc kỹ trước khi sử dụng dịch vụ.</p>

          <h3 className="text-lg font-bold text-gray-800 mt-6 border-b pb-2">1. Quy định chung &amp; Tài khoản người dùng</h3>
          <ul className="list-disc pl-5 space-y-2 mt-4">
            <li>Người dùng phải đủ 18 tuổi trở lên, hoặc có sự giám sát của người đại diện hợp pháp để đăng ký tài khoản và sử dụng dịch vụ.</li>
            <li>Bạn cam kết cung cấp thông tin cá nhân (Họ tên, Số điện thoại, Email) chính xác khi tạo tài khoản, kể cả khi đăng nhập qua bên thứ ba (Facebook, Google).</li>
            <li>Bạn có trách nhiệm tự bảo mật thông tin đăng nhập và chịu mọi trách nhiệm pháp lý cho mọi hoạt động phát sinh từ tài khoản của mình.</li>
            <li>Nghiêm cấm hành vi sử dụng tài khoản để lừa đảo, phát tán mã độc, hoặc thực hiện các hành vi vi phạm pháp luật Nhà nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.</li>
          </ul>

          <h3 className="text-lg font-bold text-gray-800 mt-8 border-b pb-2">2. Nội dung và Tin đăng Bất động sản</h3>
          <ul className="list-disc pl-5 space-y-2 mt-4">
            <li><strong>Tính chính xác:</strong> Người đăng tin hoàn toàn chịu trách nhiệm về tính xác thực, hợp pháp của nội dung, hình ảnh bất động sản và các thông tin liên hệ được đăng tải.</li>
            <li><strong>Quyền sở hữu trí tuệ:</strong> Bạn cam kết chỉ đăng tải các nội dung (hình ảnh, văn bản) mà bạn có quyền sở hữu hoặc quyền sử dụng hợp pháp. Nghiêm cấm sao chép trái phép.</li>
            <li><strong>Nội dung cấm:</strong> Không đăng tin mua bán các loại đất đai/tài sản đang có tranh chấp, bị kê biên, không có giấy tờ hợp lệ, hoặc các loại tài sản bị cấm giao dịch theo quy định của pháp luật. Không dùng từ ngữ thô tục, phân biệt vùng miền, đả kích chính trị - tôn giáo.</li>
          </ul>

          <h3 className="text-lg font-bold text-gray-800 mt-8 border-b pb-2">3. Quyền hạn và Trách nhiệm của Nhà Đất Xứ Nghệ</h3>
          <ul className="list-disc pl-5 space-y-2 mt-4">
            <li><strong>Kiểm duyệt nội dung:</strong> Ban quản trị có quyền (nhưng không có nghĩa vụ bắt buộc) kiểm tra, chỉnh sửa, ẩn hoặc xóa bỏ các tin đăng vi phạm Điều khoản dịch vụ, hoặc có dấu hiệu lừa đảo mà không cần báo trước.</li>
            <li><strong>Xử lý tài khoản:</strong> Chúng tôi có quyền từ chối cung cấp dịch vụ, tạm khóa hoặc xóa vĩnh viễn tài khoản nếu phát hiện người dùng vi phạm nghiêm trọng các quy định này.</li>
            <li><strong>Từ chối bảo đảm:</strong> Nhà Đất Xứ Nghệ đóng vai trò là nền tảng trung gian kết nối người mua và người bán. Chúng tôi không đảm bảo, không can thiệp và không chịu trách nhiệm pháp lý đối với các giao dịch thực tế, hợp đồng đặt cọc hay mua bán giữa các bên.</li>
          </ul>

          <h3 className="text-lg font-bold text-gray-800 mt-8 border-b pb-2">4. Nền tảng bên thứ ba (Facebook, Google)</h3>
          <p className="mb-2 mt-4">Khi bạn kết nối tài khoản với Facebook hoặc Google:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Bạn đồng ý cho chúng tôi thu thập thông tin cơ bản (Tên, Email, Ảnh đại diện) theo đúng Chính sách bảo mật của chúng tôi và Tiêu chuẩn của nền tảng đó.</li>
            <li>Bạn phải tuân thủ cả Điều khoản dịch vụ của Facebook/Google khi tương tác thông qua công cụ đăng nhập này.</li>
          </ul>

          <h3 className="text-lg font-bold text-gray-800 mt-8 border-b pb-2">5. Giải quyết tranh chấp</h3>
          <p className="mb-4 mt-4">Mọi tranh chấp phát sinh giữa người dùng và Nhà Đất Xứ Nghệ trong quá trình sử dụng website sẽ được ưu tiên giải quyết thông qua thương lượng, hòa giải. Nếu không thể thương lượng, vụ việc sẽ được đưa ra cơ quan Tòa án có thẩm quyền tại Việt Nam để giải quyết theo quy định của pháp luật hiện hành.</p>

          <h3 className="text-lg font-bold text-gray-800 mt-8 border-b pb-2">6. Thay đổi điều khoản</h3>
          <p className="mb-4 mt-4">Chúng tôi giữ quyền thay đổi, bổ sung các Điều khoản dịch vụ này bất cứ lúc nào để phù hợp với quy định của pháp luật và định hướng phát triển của nền tảng. Phiên bản mới sẽ có hiệu lực ngay khi được đăng tải công khai trên trang này. Việc bạn tiếp tục sử dụng dịch vụ đồng nghĩa với việc chấp nhận các thay đổi đó.</p>

        </div>
      </div>
    </div>
  );
}
