/**
 * Tạo (hoặc cập nhật) một tài khoản ADMIN đầu tiên trên CSDL trắng.
 *
 * Site mới dựng không có cách nào vào /admin: bảng User rỗng, và mọi script tạo admin
 * cũ (`backend/scripts/create-admin.js`, `make-admin.js/.ts`, `reset-admin.ts`) đều
 * KHÔNG dùng được trong container production — không nằm trong `dist/` được Dockerfile
 * copy, và bản `.js` còn `require('bcryptjs')` trong khi package chỉ có `bcrypt`.
 *
 * Script này nằm trong `src/scripts/` (được `nest build` biên dịch vào `dist/scripts/`,
 * đúng như `import-locations.ts`, `preflight-check.ts`...) nên chạy được thẳng trong
 * container: `docker exec <container> node dist/scripts/create-admin.js --apply`.
 *
 * Idempotent: chạy lại nhiều lần với cùng ADMIN_EMAIL chỉ cập nhật đúng 1 dòng (không
 * tạo trùng), và LUÔN đặt lại mật khẩu theo ADMIN_PASSWORD hiện tại — dùng để reset mật
 * khẩu quên cũng được, không chỉ tạo lần đầu.
 *
 * Chạy thử:  ADMIN_EMAIL=... ADMIN_PASSWORD=... node dist/scripts/create-admin.js
 * Chạy thật: ADMIN_EMAIL=... ADMIN_PASSWORD=... node dist/scripts/create-admin.js --apply
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Thiếu ADMIN_EMAIL hoặc ADMIN_PASSWORD trong biến môi trường.');
    process.exitCode = 1;
    return;
  }
  if (password.length < 8) {
    console.error('ADMIN_PASSWORD phải có ít nhất 8 ký tự.');
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  const hashed = await bcrypt.hash(password, 10);

  console.log(apply ? '=== CHẾ ĐỘ GHI THẬT ===' : '=== XEM TRƯỚC (thêm --apply để ghi) ===');
  console.log(`Email: ${email}`);
  console.log(existing ? `Đã có tài khoản (id=${existing.id}, role=${existing.role}) — sẽ cập nhật mật khẩu + role=ADMIN.` : 'Chưa có — sẽ tạo mới.');

  if (!apply) {
    console.log('\nChưa ghi gì. Thêm --apply để thực hiện.');
    return;
  }

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      password: hashed,
      name: 'Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      provider: 'LOCAL',
    },
    update: {
      password: hashed,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  console.log(`\nXong. id=${user.id}, role=${user.role}, status=${user.status}.`);
  console.log('Đăng nhập bằng email + mật khẩu vừa đặt, sau đó tự đổi mật khẩu trong Cài đặt.');
}

main()
  .catch((e) => {
    console.error('\nLỗi:', e.message ?? e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
