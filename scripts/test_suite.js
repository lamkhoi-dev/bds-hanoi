const axios = require('axios');
const assert = require('assert');

const API_URL = 'http://localhost/api';

async function runTests() {
  console.log(' Bắt đầu quá trình kiểm thử tự động toàn diện dự án BĐS...');
  let token = '';
  let userId = '';
  let propertyIds = [];
  
  const testUser = {
    email: `test_${Date.now()}@test.com`,
    password: 'password123',
    name: 'Auto Tester'
  };

  try {
    // 1. Kiểm thử Đăng ký
    console.log('\n[1] Đăng ký tài khoản...');
    const registerRes = await axios.post(`${API_URL}/auth/register`, testUser);
    const registeredUser = registerRes.data.user || registerRes.data;
    assert(registeredUser.email === testUser.email, 'Email đăng ký không khớp');
    console.log(' Đăng ký thành công');

    // 2. Kiểm thử Đăng nhập
    console.log('\n[2] Đăng nhập...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    token = loginRes.data.access_token;
    userId = loginRes.data.user.id;
    assert(token, 'Không nhận được Access Token');
    console.log(' Đăng nhập thành công');

    // Set axios default header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // 3. Kiểm thử Nạp tiền (Ví)
    console.log('\n[3] Kiểm tra Nạp tiền (Deposit)...');
    const depositRes = await axios.post(`${API_URL}/users/deposit`, { amount: 100000 });
    assert(depositRes.data.user.balance >= 100000, 'Số dư không được cập nhật chính xác');
    console.log(` Nạp thành công. Số dư hiện tại: ${depositRes.data.user.balance} VND`);

    // 4. Kiểm thử Đăng 3 tin miễn phí
    console.log('\n[4] Kiểm tra Đăng 3 tin miễn phí...');
    for (let i = 1; i <= 3; i++) {
      const propRes = await axios.post(`${API_URL}/properties`, {
        title: `Tin test tự động số ${i}`,
        description: 'Bán nhà mặt phố, giá siêu rẻ',
        price: i * 1000000000,
        area: 50 + i * 10,
        transactionType: 'BAN',
        propertyType: 'NHA_RIENG',
        city: 'Hà Nội',
        district: 'Quận Cầu Giấy',
        ward: 'Phường Dịch Vọng'
      });
      propertyIds.push(propRes.data.id);
      console.log(`   Đăng thành công tin ${i} (ID: ${propRes.data.id})`);
    }

    // 5. Kiểm thử Chặn tin thứ 4
    console.log('\n[5] Kiểm tra Chặn tin thứ 4 (Luật giới hạn 3 tin/ngày)...');
    try {
      await axios.post(`${API_URL}/properties`, {
        title: `Tin test thứ 4 (Nên bị chặn)`,
        price: 4000000000
      });
      throw new Error('Lỗi: Hệ thống không chặn tin thứ 4!');
    } catch (e) {
      if (e.response && e.response.status === 400) {
        console.log(' Hệ thống đã chặn thành công tin thứ 4 với thông báo:', e.response.data.message);
      } else {
        throw e;
      }
    }

    // 6. Kiểm thử Mua gói VIP (Sẽ thất bại nếu tin chưa được duyệt)
    console.log('\n[6] Kiểm tra Nâng cấp VIP (Với tin CHỜ DUYỆT)...');
    try {
      await axios.post(`${API_URL}/properties/${propertyIds[0]}/promote`, { type: 'VIP' });
      throw new Error('Lỗi: Hệ thống cho phép UP/VIP tin chưa duyệt!');
    } catch (e) {
      if (e.response && e.response.status === 400) {
        console.log(' Hệ thống chặn thành công việc mua VIP cho tin chưa duyệt.');
      } else {
        throw e;
      }
    }

    // We can't easily test Admin approval without admin token or db access directly here, 
    // so we'll test Search API and Public Profile API.
    
    // 7. Kiểm thử Lấy Public Profile
    console.log('\n[7] Kiểm tra Public Profile API...');
    const profileRes = await axios.get(`${API_URL}/users/public/auto-tester--${userId}`);
    assert(profileRes.data.id === userId, 'ID Profile không khớp');
    console.log(' Lấy Public Profile thành công. Avatar:', profileRes.data.avatar || 'Trống');

    // 8. Kiểm thử Search API
    console.log('\n[8] Kiểm tra Search API (Meilisearch)...');
    const searchRes = await axios.get(`${API_URL}/properties/search?category=NHA_RIENG`);
    assert(Array.isArray(searchRes.data.hits), 'Kết quả tìm kiếm không phải là mảng');
    console.log(` Search API hoạt động, tìm thấy ${searchRes.data.hits.length} kết quả (đã duyệt).`);

    console.log('\n TOÀN BỘ CÁC BÀI TEST ĐÃ HOÀN TẤT THÀNH CÔNG! HỆ THỐNG VẬN HÀNH ỔN ĐỊNH.');

  } catch (err) {
    console.error('\n TEST THẤT BẠI:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

runTests();
