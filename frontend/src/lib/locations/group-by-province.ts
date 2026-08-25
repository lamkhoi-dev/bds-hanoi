/**
 * Nhóm quận/huyện theo TỈNH cho trang `/khu-vuc`.
 *
 * Khách 25/08: "Trang /khu-vuc sắp xếp lại các huyện, tp, tx Nghệ An, sau đó là của Hà Tĩnh
 * (hiện đang để lẫn nhau)".
 *
 * Bản cũ đọc thẳng mọi bản ghi `type === 'DISTRICT'` ra một danh sách phẳng rồi sắp theo tên,
 * nên 20 huyện Nghệ An và 13 huyện Hà Tĩnh trộn vào nhau theo bảng chữ cái — người xem không
 * biết huyện nào thuộc tỉnh nào.
 *
 * Thứ tự tỉnh lấy từ `NEXT_PUBLIC_PROVINCE_SLUG` (`nghe-an,ha-tinh`), KHÔNG sắp theo tên:
 * thứ tự khai chính là thứ tự khách muốn, và tỉnh chính phải đứng trước.
 */

export interface DistrictLike {
  slug: string;
  name: string;
  /** urlSegment của tỉnh cha. */
  parent?: string;
}

export interface ProvinceGroup {
  slug: string;
  name: string;
  districts: { slug: string; name: string }[];
}

/**
 * @param districts   danh sách quận/huyện phẳng
 * @param provinceNameOf  tra tên hiển thị của tỉnh theo urlSegment
 * @param order       thứ tự tỉnh mong muốn (từ cấu hình site)
 */
export function groupDistrictsByProvince(
  districts: DistrictLike[],
  provinceNameOf: (slug: string) => string | undefined,
  order: string[],
): ProvinceGroup[] {
  const byProvince = new Map<string, { slug: string; name: string }[]>();
  for (const d of districts) {
    // Quận/huyện không rõ tỉnh cha vẫn phải hiện, gom vào nhóm '' xếp cuối — thà thừa một
    // nhóm "khác" còn hơn im lặng nuốt mất khu vực khỏi trang liệt kê.
    const key = d.parent ?? '';
    const list = byProvince.get(key) ?? [];
    list.push({ slug: d.slug, name: d.name });
    byProvince.set(key, list);
  }

  const rank = new Map(order.map((slug, i) => [slug, i]));
  const keys = [...byProvince.keys()].sort((a, b) => {
    // Tỉnh không có trong cấu hình xếp sau tỉnh có, rồi mới so tên.
    const ra = rank.has(a) ? (rank.get(a) as number) : Number.MAX_SAFE_INTEGER;
    const rb = rank.has(b) ? (rank.get(b) as number) : Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b, 'vi');
  });

  return keys.map((slug) => ({
    slug,
    name: provinceNameOf(slug) ?? slug,
    districts: byProvince
      .get(slug)!
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'vi')),
  }));
}
