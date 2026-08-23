/**
 * Ba câu hỏi thuần về cây khu vực mà ô chọn địa điểm cần trả lời. Tách khỏi
 * `components/LocationPicker.tsx` theo đúng khuôn `lib/locations/group.ts`: component là
 * React nên jest (`roots: src/lib`) không chạy tới, còn ba hàm này là logic dễ sai nhất
 * trong cả màn hình — phải test được.
 *
 * Hình dạng dữ liệu là thứ `GET /locations` trả về: mảng PHẲNG các quận/huyện của MỌI tỉnh
 * đang phục vụ, mỗi dòng kèm `parent: {id, name}` và `children` gồm cả WARD lẫn OLD_WARD.
 */

export interface DistrictNode {
  id: string;
  name: string;
  parent?: { id: string; name: string } | null;
  children?: { id: string; name: string; type: string }[];
}

/**
 * Danh sách tỉnh, suy TỪ CHÍNH dữ liệu — không viết cứng, không thêm request.
 *
 * Trước 23/08 ô "Tỉnh / Thành phố" render đúng MỘT `<option>` cứng bằng
 * `NEXT_PUBLIC_PROVINCE_NAME`, trong khi backend đã phục vụ `PROVINCE_SLUG=nghe-an,ha-tinh`.
 * Hậu quả trên site thật: 13 huyện Hà Tĩnh nằm trong ô "Khu vực" dưới nhãn "Nghệ An", mà Hà
 * Tĩnh chưa có dòng phường/xã nào ⇒ ô "Phường/Xã mới" bắt buộc nhưng rỗng, **không ai đăng
 * được tin ở Hà Tĩnh** (khách báo 21/08).
 *
 * Giữ nguyên thứ tự xuất hiện trong dữ liệu — backend đã xếp tỉnh chính trước.
 */
export function provincesOf(locations: DistrictNode[]): string[] {
  const names: string[] = [];
  for (const d of locations ?? []) {
    const name = d?.parent?.name;
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

/** Tỉnh CHA của khu vực đang chọn, tra theo tên. `null` khi chưa chọn hoặc không tìm thấy. */
export function provinceOfDistrict(
  locations: DistrictNode[],
  districtName: string,
): string | null {
  if (!districtName) return null;
  return (locations ?? []).find((d) => d.name === districtName)?.parent?.name ?? null;
}

/**
 * Khu vực này có phường/xã MỚI để chọn không.
 *
 * Nguồn DUY NHẤT quyết định ô "Phường/Xã mới" có bắt buộc hay không — `LocationPicker` dùng
 * để quyết dấu `*`, `app/post/page.tsx` dùng để quyết có chặn gửi form. Nếu hai bên tự suy
 * riêng thì sẽ có lúc form không hiện `*` mà vẫn chặn, hoặc ngược lại.
 *
 * Bám DỮ LIỆU chứ không liệt kê tên tỉnh: hôm nào nhập xong phường/xã Hà Tĩnh thì ô đó tự
 * bắt buộc trở lại, không phải sửa code lần nữa.
 */
export function districtHasWards(locations: DistrictNode[], districtName: string): boolean {
  const district = (locations ?? []).find((d) => d.name === districtName);
  return Boolean(district?.children?.some((c) => c.type === 'WARD'));
}
