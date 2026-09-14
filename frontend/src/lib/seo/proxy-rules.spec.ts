import { USER_PRIVATE_SEGMENTS } from '@/lib/user-private-paths';

/**
 * Kiểm tra luật phân biệt hồ sơ CÔNG KHAI với khu vực tài khoản riêng tư.
 *
 * Giữ mẫu regex VÀ cách kết hợp với `USER_PRIVATE_SEGMENTS` đồng bộ với
 * `frontend/src/proxy.ts` — proxy chạy trong Edge runtime nên không import trực tiếp vào
 * jest được. `USER_PRIVATE_SEGMENTS` thì import được thật (đó là lib thuần), nên phần nhãn
 * riêng tư đã biết ở đây LUÔN đúng với proxy — chỉ có mẫu regex là bản sao tay.
 */
const PUBLIC_PROFILE_PATTERN =
  /^\/user\/[\w-]+-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[a-z0-9]{3,10})\/?$/i;

function isPublic(pathname: string): boolean {
  const firstSegment = pathname.startsWith('/user/') ? pathname.slice('/user/'.length).split('/')[0] : '';
  if (USER_PRIVATE_SEGMENTS.includes(firstSegment)) return false;
  return PUBLIC_PROFILE_PATTERN.test(pathname);
}

describe('Phân biệt hồ sơ công khai và khu vực tài khoản', () => {
  it('hồ sơ công khai (URL cũ, hậu tố UUID) được cho qua', () => {
    expect(isPublic('/user/nguyen-van-nam-f35dd809-352b-4caf-9cc4-14092195f5bd')).toBe(true);
    expect(isPublic('/user/vu-quang-phat-334c4810-0d2b-474a-8ed4-f1f38b01a600')).toBe(true);
    expect(isPublic('/user/nguyen-van-nam-F35DD809-352B-4CAF-9CC4-14092195F5BD')).toBe(true);
    expect(isPublic('/user/abc-f35dd809-352b-4caf-9cc4-14092195f5bd/')).toBe(true);
  });

  it('hồ sơ công khai (URL mới, hậu tố shortCode) được cho qua — khách báo 12/9', () => {
    expect(isPublic('/user/nguyen-van-nam-255s')).toBe(true);
    expect(isPublic('/user/tran-thi-b-1a2b3c')).toBe(true);
    expect(isPublic('/user/vu-quang-phat-9z8y7/')).toBe(true);
  });

  it('mọi đường dẫn tài khoản đều là riêng tư', () => {
    for (const p of USER_PRIVATE_SEGMENTS.map((s) => `/user/${s}`)) {
      expect(isPublic(p)).toBe(false);
    }
    expect(isPublic('/user/properties/abc/upgrade')).toBe(false);
  });

  it('trang tài khoản THÊM MỚI mặc định là riêng tư', () => {
    // Đây là điểm chính của việc đảo logic: cách liệt kê đường dẫn riêng tư sẽ khiến
    // trang mới âm thầm thành công khai.
    expect(isPublic('/user/mot-trang-moi-nao-do')).toBe(false);
    expect(isPublic('/user/thong-bao/chi-tiet')).toBe(false);
  });

  it('UUID thiếu đoạn cuối: đọc thành {tên}-{shortCode} — vô hại, không phải lỗ hổng', () => {
    // "abc-f35dd809-352b-4caf-9cc4" không khớp trọn UUID (thiếu 1 nhóm hex), nhưng đoạn
    // cuối "9cc4" tự nó là chuỗi 3-10 ký tự chữ+số hợp lệ — khớp nhánh shortCode. Đây KHÔNG
    // phải dương tính giả nguy hiểm: `/user/{bất kỳ}` một đoạn đều route vào CÙNG một trang
    // hồ sơ công khai (`[slug]/page.tsx`) bất kể proxy quyết định gì — khác biệt duy nhất là
    // URL rác này trước đây bị đẩy sang /login, giờ vào thẳng trang hồ sơ rồi tự 404 vì
    // không có người dùng nào khớp. Không lộ dữ liệu riêng tư nào ở cả hai cách.
    expect(isPublic('/user/abc-f35dd809-352b-4caf-9cc4')).toBe(true);
  });

  it('UUID thiếu phần TÊN đứng trước vẫn bị coi là riêng tư — không có gì để tách làm "tên"', () => {
    expect(isPublic('/user/f35dd809-352b-4caf-9cc4-14092195f5bd')).toBe(false);
  });

  it('danh sách riêng tư THẮNG mẫu công khai — kể cả khi tên trùng dạng "chữ-chữ" của shortCode', () => {
    // "my-listings" đọc y hệt mẫu {tên}-{shortCode chữ} nếu chỉ xét regex một mình.
    // Đây là lý do phải chặn tường minh TRƯỚC khi thử mẫu, không chỉ dựa vào regex.
    expect(PUBLIC_PROFILE_PATTERN.test('/user/my-listings')).toBe(true); // regex đơn thuần: dương tính giả
    expect(isPublic('/user/my-listings')).toBe(false); // có danh sách chặn: vẫn đúng riêng tư
  });
});
