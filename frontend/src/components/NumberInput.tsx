"use client";

import { formatThousands, parseThousands } from '@/lib/number-format';

/**
 * Ô nhập số HIỆN dấu chấm phân cách hàng nghìn trong lúc gõ, nhưng GIÁ TRỊ đưa ra ngoài
 * (`onChange`) luôn là số thuần — nơi dùng không cần biết gì về định dạng hiển thị.
 *
 * Khách báo 12/9: "Trong mục kiểm duyệt tin, cho dấu phẩy hoặc chấm (phân cách hàng nghìn):
 * 1.400.000.000 thay cho 1400000000". `type="number"` của trình duyệt không hiện được dấu
 * chấm xen giữa số — phải dùng `type="text"` kèm định dạng/đọc-ngược tay
 * (`lib/number-format.ts`).
 */
export default function NumberInput({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: number | string;
  onChange: (value: number | '') => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      className={className}
      placeholder={placeholder}
      value={formatThousands(value === '' ? null : value)}
      onChange={(e) => {
        const parsed = parseThousands(e.target.value);
        onChange(parsed === null ? '' : parsed);
      }}
    />
  );
}
