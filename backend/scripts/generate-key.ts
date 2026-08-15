import * as crypto from 'crypto';

const generateKey = () => {
  console.log('\n🔐 SCRIPT TẠO KHÓA BẢO MẬT AES-256 CHO DỰ ÁN BĐS 🔐\n');
  
  // Tạo 32 bytes (256 bits) ngẫu nhiên
  const key = crypto.randomBytes(32).toString('hex');
  
  console.log('✅ Khóa bảo mật (Master Key) của bạn đã được tạo thành công:\n');
  console.log(`\x1b[32m${key}\x1b[0m\n`);
  
  console.log('👉 HƯỚNG DẪN CÀI ĐẶT:');
  console.log('1. Copy chuỗi khóa màu xanh ở trên.');
  console.log('2. Mở file .env ở cả backend và root của project (nếu có).');
  console.log('3. Thêm hoặc cập nhật dòng sau:\n');
  console.log(`   ENCRYPTION_KEY=${key}\n`);
  console.log('⚠️ CẢNH BÁO: TÚYỆT ĐỐI KHÔNG để lộ khóa này cho bất kỳ ai. Nếu mất khóa, bạn sẽ không thể giải mã được token Webhook đã lưu trong Database.\n');
};

generateKey();
