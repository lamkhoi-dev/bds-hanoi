"use client";

import { useRouter } from 'next/navigation';

const selectClass =
  'font-sans w-full border border-borderLight rounded-xl p-3.5 outline-none input-glow bg-white cursor-pointer text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed';

export interface WardSelectGroup {
  label: string;
  /** href của mục đang chọn (khớp URL hiện tại), rỗng = đang ở "Tất cả". */
  value: string;
  options: { label: string; href: string }[];
}

/**
 * 2 dropdown "Xem tin theo xã/phường mới/cũ" trên trang quận/huyện (mục 25.5b PHẦN II).
 * Điều hướng bằng URL landing thật (option value = href đích, không phải `?ward=...`)
 * — query lạ sẽ bị 301/noindex ở `SEO_MODE=enforce` và sinh URL facet rác. `<option>`
 * không phải `<a>` nên không crawlable — CỐ Ý, tránh phát hàng trăm link nội bộ tới
 * trang chưa có tin trên mỗi trang quận.
 */
export default function WardJumpSelects({ selects }: { selects: WardSelectGroup[] }) {
  const router = useRouter();
  const visible = selects.filter((s) => s.options.length > 0);
  if (visible.length === 0) return null;

  return (
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {visible.map((s) => (
        <label key={s.label} className="flex items-center gap-2 text-sm text-gray-600">
          <span className="whitespace-nowrap shrink-0">{s.label}</span>
          <select
            className={selectClass}
            value={s.value}
            onChange={(e) => {
              if (e.target.value) router.push(e.target.value);
            }}
          >
            <option value="">Tất cả</option>
            {s.options.map((o) => (
              <option key={o.href} value={o.href}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
