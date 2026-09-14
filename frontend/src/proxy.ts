import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { USER_PRIVATE_SEGMENTS } from './lib/user-private-paths';

/**
 * Hồ sơ CÔNG KHAI của người dùng: `/user/{ten-nguoi-dung}-{uuid}` (URL cũ) hoặc
 * `/user/{ten-nguoi-dung}-{shortCode}` (URL mới, 12/9 — khách báo "link user quá dài").
 *
 * Trước đây mọi đường dẫn dưới `/user/` đều bị bắt đăng nhập, nên Googlebot vào trang
 * hồ sơ công khai chỉ nhận 307 về `/login` — trang không bao giờ được index (Search
 * Console có 12 URL `/user/*` bị bỏ qua).
 *
 * Logic được ĐẢO lại thay vì liệt kê từng đường dẫn riêng tư: mặc định mọi thứ dưới
 * `/user/` là riêng tư, chỉ hồ sơ công khai (nhận diện bằng hậu tố UUID hoặc shortCode)
 * mới được cho qua. Nhờ vậy thêm một trang tài khoản mới sẽ TỰ ĐỘNG được bảo vệ — cách
 * liệt kê đường dẫn riêng tư thì trang mới sẽ âm thầm thành công khai.
 *
 * shortCode là chữ+số ngắn (base36) — về mặt CHUỖI có thể trùng ngẫu nhiên với một trang
 * riêng tư đặt tên kiểu "chữ-chữ" (vd một trang tên lẻ nào đó sau này). Vì vậy vẫn phải
 * chặn CỨNG các trang riêng tư đã biết ở `USER_PRIVATE_SEGMENTS` TRƯỚC khi thử mẫu công
 * khai — hai lớp phòng thủ độc lập, không lớp nào một mình đủ an toàn.
 */
const PUBLIC_PROFILE_PATTERN =
  /^\/user\/[\w-]+-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[a-z0-9]{3,10})\/?$/i;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const firstSegment = pathname.startsWith('/user/') ? pathname.slice('/user/'.length).split('/')[0] : '';
  const isKnownPrivateSegment = USER_PRIVATE_SEGMENTS.includes(firstSegment);
  const looksLikePublicProfile = !isKnownPrivateSegment && PUBLIC_PROFILE_PATTERN.test(pathname);

  if (pathname.startsWith('/user/') && !looksLikePublicProfile) {
    const isLoggedIn = request.cookies.get('isLoggedIn');

    if (!isLoggedIn || isLoggedIn.value !== '1') {
      const loginUrl = new URL(`/login?returnUrl=${encodeURIComponent(pathname)}`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  /**
   * `?page=1` là URL TRÙNG HỆT bản gốc — phải 301 về URL không có tham số `page`.
   *
   * Vì sao làm ở tầng này chứ không trong trang: khách yêu cầu đúng mã **301**
   * (19-8, mục 6), còn `permanentRedirect()` của Next phát **308**. Chỉ ở middleware
   * mới đặt được mã tuỳ ý.
   *
   * Chỉ bắt đúng chuỗi `"1"`. Các giá trị sai định dạng (`0`, `-1`, `abc`, `01`) CỐ Ý
   * để trang tự trả 404 qua bảng luật `indexability.ts` — chúng là trang không tồn tại,
   * không phải URL trùng lặp, nên không được 301 về đâu cả.
   *
   * Áp cho mọi đường dẫn, không riêng trang danh mục: `page=1` luôn là giá trị mặc định
   * ở mọi trang có phân trang (`/du-an/{slug}`, `/user/{slug}`), và ở trang không phân
   * trang thì nó là tham số rác. Bỏ nó không bao giờ đổi nội dung hiển thị.
   *
   * Giới hạn GET/HEAD: 301 một request POST sẽ làm mất thân request.
   */
  if (
    (request.method === 'GET' || request.method === 'HEAD') &&
    request.nextUrl.searchParams.get('page') === '1'
  ) {
    const url = request.nextUrl.clone();
    url.searchParams.delete('page');
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/user/:path*',
    // Chỉ chạy khi URL thực sự có `?page=` — request thường không đi qua middleware.
    { source: '/:path*', has: [{ type: 'query', key: 'page' }] },
  ],
};
