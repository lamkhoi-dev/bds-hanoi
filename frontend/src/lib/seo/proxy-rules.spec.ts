/**
 * Kiểm tra luật phân biệt hồ sơ CÔNG KHAI với khu vực tài khoản riêng tư.
 *
 * Giữ mẫu regex đồng bộ với `frontend/src/proxy.ts` — proxy chạy trong Edge runtime
 * nên không import trực tiếp vào jest được.
 */
const PUBLIC_PROFILE_PATTERN =
  /^\/user\/[\w-]+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/?$/i;

const isPublic = (p: string) => PUBLIC_PROFILE_PATTERN.test(p);

describe('Phân biệt hồ sơ công khai và khu vực tài khoản', () => {
  it('hồ sơ công khai được cho qua (không bắt đăng nhập)', () => {
    expect(isPublic('/user/nguyen-van-nam-f35dd809-352b-4caf-9cc4-14092195f5bd')).toBe(true);
    expect(isPublic('/user/vu-quang-phat-334c4810-0d2b-474a-8ed4-f1f38b01a600')).toBe(true);
    expect(isPublic('/user/nguyen-van-nam-F35DD809-352B-4CAF-9CC4-14092195F5BD')).toBe(true);
    expect(isPublic('/user/abc-f35dd809-352b-4caf-9cc4-14092195f5bd/')).toBe(true);
  });

  it('mọi đường dẫn tài khoản đều là riêng tư', () => {
    for (const p of [
      '/user/my-listings',
      '/user/packages',
      '/user/properties',
      '/user/requirements',
      '/user/saved',
      '/user/settings',
      '/user/wallet',
      '/user/favorites',
      '/user/nap-tien',
      '/user/recently-viewed',
      '/user/transactions',
      '/user/properties/abc/upgrade',
    ]) {
      expect(isPublic(p)).toBe(false);
    }
  });

  it('trang tài khoản THÊM MỚI mặc định là riêng tư', () => {
    // Đây là điểm chính của việc đảo logic: cách liệt kê đường dẫn riêng tư sẽ khiến
    // trang mới âm thầm thành công khai.
    expect(isPublic('/user/mot-trang-moi-nao-do')).toBe(false);
    expect(isPublic('/user/thong-bao/chi-tiet')).toBe(false);
  });

  it('không nhận nhầm UUID thiếu/thừa đoạn', () => {
    expect(isPublic('/user/abc-f35dd809-352b-4caf-9cc4')).toBe(false);
    expect(isPublic('/user/f35dd809-352b-4caf-9cc4-14092195f5bd')).toBe(false); // thiếu phần tên
  });
});
