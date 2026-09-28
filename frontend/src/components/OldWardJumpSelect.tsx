'use client';

import { useRouter } from 'next/navigation';

/**
 * Ô sổ xuống "Tìm BĐS theo Phường/xã cũ" trên `/khu-vuc` — thay cho dãy nút bấm phường/xã
 * cũ liệt kê hết ra (có huyện tới 25 xã cũ, kéo trang rất dài). Cùng cách điều hướng với
 * `WardJumpSelects` (value = href đích, điều hướng ngay khi chọn) nhưng đặt CÙNG HÀNG với
 * tên huyện, lệch phải, thay vì một khối riêng chiếm hẳn 1 dòng — khách yêu cầu 23/9 vì
 * trang huyện nhiều xã cũ phải kéo xuống quá nhiều.
 */
export default function OldWardJumpSelect({
  options,
}: {
  options: { slug: string; name: string; href: string }[];
}) {
  const router = useRouter();
  if (options.length === 0) return null;

  return (
    // `w-full sm:w-auto` — khách báo 27/9 ô "Tất cả" tràn viền ra ngoài trên mobile: trước đây
    // cả label lẫn select đều `shrink-0`/max-width cố định, khi wrap xuống dòng riêng (màn hẹp)
    // vẫn không co lại theo đúng bề rộng thẻ card. Giờ label chiếm trọn dòng trên mobile, select
    // tự co (`min-w-0 flex-1`) theo phần còn lại sau nhãn, không còn tràn.
    <label className="flex items-center gap-2 text-sm text-gray-500 w-full sm:w-auto">
      <span className="whitespace-nowrap shrink-0">Tìm BĐS theo Phường/xã cũ:</span>
      <select
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) router.push(e.target.value);
        }}
        // Màu cam — khách yêu cầu tách màu để dễ nhận biết hơn với xã mới (nút xám mặc định),
        // cùng tông cam vẫn dùng cho "phường/xã cũ" ở những chỗ khác trong site.
        className="min-w-0 flex-1 sm:flex-none border border-orange-300 rounded-lg pl-2 pr-7 py-1.5 text-sm text-orange-700 bg-orange-50 cursor-pointer outline-none hover:border-orange-400 focus:border-orange-400 sm:max-w-[180px]"
      >
        <option value="">Tất cả</option>
        {options.map((o) => (
          <option key={o.slug} value={o.href}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  );
}
