/**
 * Tạo (hoặc đặt lại mật khẩu) một tài khoản NGƯỜI DÙNG THƯỜNG để thử nghiệm.
 *
 * Vì sao cần: trên site chưa cấu hình SMTP (Hà Nội hiện tại), luồng đăng ký tự phục vụ
 * KHÔNG dùng được — `register` gửi OTP kích hoạt qua email rồi mới cho đăng nhập
 * (`auth.service.ts`: status `INACTIVE` → "Tài khoản chưa được kích hoạt"). Không có
 * email thì không ai tạo nổi tài khoản để thử các luồng phía người dùng (đăng tin, nạp
 * tiền, lưu tin, bình luận...). Script này bỏ qua bước OTP bằng cách tạo thẳng tài khoản
 * ở trạng thái ACTIVE + emailVerified.
 *
 * Khác `create-admin.ts` ở đúng hai điểm: role mặc định là USER (không phải ADMIN) và
 * cho phép đặt số dư ban đầu để thử các chức năng trừ tiền mà không cần nạp thật.
 *
 * Idempotent: chạy lại với cùng email chỉ cập nhật 1 dòng, luôn đặt lại mật khẩu — dùng
 * để reset mật khẩu quên cũng được.
 *
 * Chạy thử:  TEST_EMAIL=... TEST_PASSWORD=... node dist/scripts/create-test-user.js
 * Ghi thật:  TEST_EMAIL=... TEST_PASSWORD=... node dist/scripts/create-test-user.js --apply
 * Tuỳ chọn:  TEST_NAME, TEST_PHONE, TEST_BALANCE (điểm, mặc định 0), TEST_ROLE (USER|MOD|ADMIN)
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

async function main() {
  const email = process.env.TEST_EMAIL?.trim();
  const password = process.env.TEST_PASSWORD;
  const name = process.env.TEST_NAME?.trim() || 'Tài khoản thử nghiệm';
  const phone = process.env.TEST_PHONE?.trim() || undefined;
  const balance = Number(process.env.TEST_BALANCE || 0);
  const role = (process.env.TEST_ROLE?.trim().toUpperCase() || 'USER') as 'USER' | 'MOD' | 'ADMIN';

  if (!email || !password) {
    console.error('Thiếu TEST_EMAIL hoặc TEST_PASSWORD trong biến môi trường.');
    process.exitCode = 1;
    return;
  }
  if (password.length < 8) {
    console.error('TEST_PASSWORD phải có ít nhất 8 ký tự.');
    process.exitCode = 1;
    return;
  }
  if (!['USER', 'MOD', 'ADMIN'].includes(role)) {
    console.error(`TEST_ROLE không hợp lệ: ${role} (chỉ USER | MOD | ADMIN).`);
    process.exitCode = 1;
    return;
  }
  if (!Number.isFinite(balance) || balance < 0) {
    console.error('TEST_BALANCE phải là số không âm.');
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  const hashed = await bcrypt.hash(password, 10);

  console.log(apply ? '=== CHẾ ĐỘ GHI THẬT ===' : '=== XEM TRƯỚC (thêm --apply để ghi) ===');
  console.log(`Email: ${email} | Tên: ${name} | Quyền: ${role} | Số dư: ${balance}`);
  console.log(
    existing
      ? `Đã có tài khoản (id=${existing.id}, role=${existing.role}) — sẽ đặt lại mật khẩu và kích hoạt.`
      : 'Chưa có — sẽ tạo mới ở trạng thái ACTIVE (bỏ qua bước OTP email).',
  );

  if (!apply) {
    console.log('\nChưa ghi gì. Thêm --apply để thực hiện.');
    return;
  }

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      password: hashed,
      name,
      phone,
      role,
      status: 'ACTIVE',
      emailVerified: true,
      balance,
    },
    // Không đụng `balance` khi cập nhật: tài khoản đang dùng thử có thể đã nạp/tiêu,
    // ghi đè sẽ làm sai số liệu đang kiểm chứng. Muốn đổi số dư thì sửa trong trang quản trị.
    update: {
      password: hashed,
      name,
      ...(phone ? { phone } : {}),
      role,
      status: 'ACTIVE',
      emailVerified: true,
    },
    select: { id: true, email: true, name: true, role: true, status: true, balance: true, shortCode: true },
  });

  console.log('\nXong:', JSON.stringify(user, null, 2));
  console.log('\nNhắc: đây là tài khoản dùng thử — đổi mật khẩu sau khi đăng nhập lần đầu.');
}

main()
  .catch((e) => {
    console.error(e?.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
