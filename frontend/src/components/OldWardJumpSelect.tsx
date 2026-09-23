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
    <label className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
      <span className="whitespace-nowrap">Tìm BĐS theo Phường/xã cũ:</span>
      <select
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) router.push(e.target.value);
        }}
        className="border border-gray-200 rounded-lg pl-2 pr-7 py-1.5 text-sm text-gray-700 bg-white cursor-pointer outline-none hover:border-primary focus:border-primary max-w-[180px]"
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
