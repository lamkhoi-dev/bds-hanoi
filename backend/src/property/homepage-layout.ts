/**
 * Đăng ký "bố cục" trang chủ — CƠ CHẾ RẼ NHÁNH DUY NHẤT giữa 2 site cho phần bố cục
 * (PHẦN II mục 25). Nguyên tắc: một image chạy đúng cho cả hai, khác nhau nhờ MỘT biến
 * môi trường runtime `SITE_LAYOUT`, không phải nhánh `if (tỉnh === ...)` rải khắp code.
 *
 * `classic` = bố cục Nghệ An ĐANG CHẠY THẬT, khách đã duyệt ở PHẦN I — mảng này COPY
 * NGUYÊN thứ tự đo bằng `curl .../properties/homepage` trước khi refactor (xem
 * `plan/04-phan-2-ha-noi.md`). TUYỆT ĐỐI không sửa mảng `classic` để "tiện" phục vụ Hà
 * Nội — đó là lỗi đã lường trước và né bằng cách tách 2 mảng độc lập theo id, không theo
 * vị trí trong code.
 *
 * `grouped` = bố cục PHẦN II theo mục 25 tài liệu khách, khách đã đính chính thứ tự tab
 * khu vực: xã CŨ (mục 4) đứng TRƯỚC xã MỚI (mục 6), xen giữa là "khu vực hot" (mục 5,
 * hiện là builder stub — đang chờ khách trả lời khối này là gì, xem plan mục 1).
 */
export type SectionId =
  | 'vip'
  | 'up'
  | 'ad'
  | 'districts'
  | 'wards-new'
  | 'wards-old'
  | 'hot-areas'
  | 'cat-DAT_NEN'
  | 'cat-NHA_RIENG'
  | 'cat-CHUNG_CU'
  | 'cat-DU_AN'
  | 'sale-type-tabs'
  | 'project-grid'
  | 'project-tabs'
  | 'rent-type-tabs'
  | 'other-type-tabs';

export const HOMEPAGE_LAYOUTS: Record<'classic' | 'grouped', readonly SectionId[]> = {
  classic: [
    'vip', 'up', 'ad',
    'districts', 'wards-new', 'wards-old',
    'cat-DAT_NEN', 'cat-NHA_RIENG', 'cat-CHUNG_CU', 'cat-DU_AN',
    'project-grid',
    'rent-type-tabs', 'other-type-tabs',
  ],
  grouped: [
    'vip', 'up', 'ad',
    'districts', 'wards-old', 'hot-areas', 'wards-new',
    'sale-type-tabs',
    'rent-type-tabs',
    'project-tabs',
  ],
};

export type SiteLayout = keyof typeof HOMEPAGE_LAYOUTS;

/**
 * Tiêu đề 3 khối "khu vực" — khác nhau theo site nên để cạnh `HOMEPAGE_LAYOUTS`, cùng một
 * nơi duy nhất quyết định bố cục theo site.
 *
 * Khách Nghệ An yêu cầu đặt tên theo địa danh cụ thể thay vì tên chung chung (19-8, mục
 * 11): "theo quận, huyện" → "Nghệ An", "theo phường, xã mới" → "TP Vinh". Hà Nội
 * (`grouped`) giữ tên chung vì ở đó khối phường/xã trải khắp 30 quận/huyện, không gói
 * trong một thành phố như TP Vinh.
 *
 * Tên tỉnh KHÔNG suy từ `ACTIVE_PROVINCE_SLUG`: site Nghệ An phục vụ cả Hà Tĩnh nên
 * "Bất động sản Nghệ An" là nhãn thương hiệu khách chọn, không phải tên tập dữ liệu.
 */
export const LOCATION_BLOCK_TITLES: Record<SiteLayout, Record<'districts' | 'wards-new' | 'wards-old', string>> = {
  classic: {
    districts: 'Bất động sản Nghệ An',
    'wards-new': 'Bất động sản TP Vinh',
    'wards-old': 'Bất động sản theo phường, xã cũ',
  },
  grouped: {
    districts: 'Bất động sản theo quận, huyện',
    'wards-new': 'Bất động sản theo phường, xã mới',
    'wards-old': 'Bất động sản theo phường, xã cũ',
  },
};

/**
 * Đọc `SITE_LAYOUT` — CỐ TÌNH không tiền tố `NEXT_PUBLIC_` (biến đó bị bake cứng vào
 * bundle lúc build, sẽ biến thành 2 image khác nhau, phá mục tiêu "một image cho cả hai
 * site"). Sai chính tả / thiếu biến / mất env đều lùi về 'classic' — chiều an toàn đúng,
 * vì đó là bố cục đang chạy thật và đã được khách duyệt.
 */
export function resolveLayout(raw: string | undefined = process.env.SITE_LAYOUT): SiteLayout {
  return raw === 'grouped' ? 'grouped' : 'classic';
}

/** Cache trang chủ tách theo layout — 2 site (hoặc đổi SITE_LAYOUT lúc dev) không đọc
 *  nhầm cache của nhau. Luôn dùng hàm này ở CẢ NƠI ĐỌC (getHomepageProperties) lẫn nơi
 *  XOÁ (invalidateHomepageCache) để tránh lệch key — bug đã từng gặp với key cũ. */
export function homepageCacheKey(layout: SiteLayout): string {
  return `homepage:structured:${layout}`;
}

/**
 * Nhãn hiển thị của một tab khu vực.
 *
 * Khách yêu cầu 21/08: bỏ "Phường/Xã/Huyện/Thị xã" ở đầu nhãn để mỗi dải tab hiện được
 * nhiều mục hơn — "Tab BĐS tại Vinh chỉ thấy được 2 menu". Riêng cấp thành phố thì giữ
 * "TP" ("Thành phố Vinh" → "TP Vinh") vì bỏ hẳn thành "Vinh" trần thì mất nghĩa.
 *
 * `Location.shortName` đã có sẵn 100% ở cả 2 DB và vốn đã cắt sạch tiền tố, nên không phải
 * tự parse tên — chỉ cần gắn lại "TP" cho đúng cấp. Nhận cấp qua `name` bắt đầu bằng
 * "Thành phố", KHÔNG liệt kê tên tỉnh, để Hà Nội dùng lại được y nguyên.
 */
export function tabLabel(loc: { name: string; shortName?: string | null }): string {
  const short = (loc.shortName ?? '').trim();
  if (!short) return loc.name;
  return /^thành phố\s/i.test(loc.name) ? `TP ${short}` : short;
}

/**
 * Bỏ tiền tố xong có thể sinh hai nhãn GIỐNG HỆT nhau trong cùng một dải: Hà Tĩnh có cả
 * "Huyện Kỳ Anh" lẫn "Thị xã Kỳ Anh", `shortName` của cả hai đều là "Kỳ Anh". Hai tab đọc
 * y nhau thì người dùng không biết bấm cái nào.
 *
 * Chỉ những mục BỊ TRÙNG mới lùi về tên đầy đủ; các mục khác vẫn gọn. Phải chạy ở tầng dựng
 * dải vì chỉ ở đó mới biết dải này gồm những gì.
 */
export function dedupeTabLabels<T extends { name: string; shortName?: string | null }>(
  locs: readonly T[],
): string[] {
  const labels = locs.map((l) => tabLabel(l));
  const count = new Map<string, number>();
  for (const l of labels) count.set(l, (count.get(l) ?? 0) + 1);
  return labels.map((l, i) => ((count.get(l) ?? 0) > 1 ? locs[i].name : l));
}

/**
 * Tab được GHIM vào một vị trí cố định, bất kể xếp hạng.
 *
 * Khách yêu cầu 21/08: "trên khối BĐS Nghệ An có 1 tab TP. Hà Tĩnh ở khoảng thứ 3 hoặc 4".
 * TP Hà Tĩnh chỉ có 2 tin nên luật xếp hạng (tỉnh chính trước → nhiều tin → mới nhất) đẩy
 * nó khỏi 9 mục đầu.
 *
 * Đặt ở đây chứ không thêm cột DB hay bật `isFeatured`: đây là quyết định TRÌNH BÀY của một
 * site, đúng chỗ của `homepage-layout.ts`. `position` đếm từ 1.
 */
export const PINNED_LOCATION_TABS: Record<
  SiteLayout,
  Partial<Record<'districts' | 'wards-new' | 'wards-old', readonly { urlSegment: string; position: number }[]>>
> = {
  classic: {
    districts: [{ urlSegment: 'thanh-pho-ha-tinh', position: 3 }],
  },
  grouped: {},
};
