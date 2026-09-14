/**
 * Tên các trang RIÊNG TƯ dưới `/user/` — khu vực tài khoản của người đang đăng nhập
 * (route group `app/user/(dashboard)` cộng vài trang lẻ ngoài group).
 *
 * MỘT nguồn duy nhất, dùng ở HAI nơi:
 *   - `app/robots.ts`: chặn Google index các trang này (chặn cả `/user/` sẽ chặn nhầm
 *     `/user/[slug]` — trang hồ sơ CÔNG KHAI).
 *   - `proxy.ts`: đảm bảo các trang này LUÔN đòi đăng nhập, kể cả khi tên trùng ngẫu
 *     nhiên với dạng `{tên}-{shortCode}` của link hồ sơ công khai (vd một trang tên
 *     "properties" đọc y hệt mẫu "chữ-chữ" mà PUBLIC_PROFILE_PATTERN chấp nhận).
 *
 * Thêm trang mới dưới `/user/` (ngoài `[slug]`) BẮT BUỘC thêm vào đây — quên là trang đó
 * vừa lọt vào Google vừa (nếu tên trùng mẫu shortCode) vừa mất luôn yêu cầu đăng nhập.
 */
export const USER_PRIVATE_SEGMENTS = [
  'my-listings',
  'packages',
  'properties',
  'requirements',
  'saved',
  'settings',
  'wallet',
  'favorites',
  'nap-tien',
  'recently-viewed',
  'transactions',
];
