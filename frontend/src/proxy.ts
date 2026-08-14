import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Hồ sơ CÔNG KHAI của người dùng: `/user/{ten-nguoi-dung}-{uuid}`.
 *
 * Trước đây mọi đường dẫn dưới `/user/` đều bị bắt đăng nhập, nên Googlebot vào trang
 * hồ sơ công khai chỉ nhận 307 về `/login` — trang không bao giờ được index (Search
 * Console có 12 URL `/user/*` bị bỏ qua).
 *
 * Logic được ĐẢO lại thay vì liệt kê từng đường dẫn riêng tư: mặc định mọi thứ dưới
 * `/user/` là riêng tư, chỉ hồ sơ công khai (nhận diện bằng hậu tố UUID) mới được
 * cho qua. Nhờ vậy thêm một trang tài khoản mới sẽ TỰ ĐỘNG được bảo vệ — cách liệt kê
 * đường dẫn riêng tư thì trang mới sẽ âm thầm thành công khai.
 */
const PUBLIC_PROFILE_PATTERN =
  /^\/user\/[\w-]+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/?$/i;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/user/') && !PUBLIC_PROFILE_PATTERN.test(pathname)) {
    const isLoggedIn = request.cookies.get('isLoggedIn');

    if (!isLoggedIn || isLoggedIn.value !== '1') {
      const loginUrl = new URL(`/login?returnUrl=${encodeURIComponent(pathname)}`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/user/:path*'],
};
