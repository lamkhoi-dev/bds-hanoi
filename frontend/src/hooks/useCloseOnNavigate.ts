'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Đóng một popup khi URL đổi.
 *
 * Khách báo 25/08: "Bấm lọc ra kết quả, sau đó thêm hoặc thay lọc rồi bấm áp dụng thì không
 * tự động mất bộ lọc (bấm thoát bộ lọc thì vẫn thấy trang lọc mới)". Nguyên nhân: `SidebarFilter`
 * điều hướng bằng `router.push`, còn state `open` nằm ở lớp bọc (`HomeFilterButton`,
 * `MobileFilterButton`) nên không ai hạ nó xuống. Kết quả đã lọc xong nằm ngay sau tấm phủ.
 *
 * Bắt theo URL thay vì truyền callback vào `SidebarFilter`: component đó CỐ TÌNH không nhận
 * props (dùng chung cho sidebar tĩnh lẫn popup, xem chú thích trong file đó), và cách này
 * đúng cho mọi kiểu điều hướng — bấm áp dụng, gỡ một chip, hay bấm vào một link bên trong.
 *
 * Bỏ qua lần chạy đầu: effect luôn chạy khi mount, nếu không chặn thì popup vừa mở đã bị
 * đóng ngay ở những nơi popup mở sẵn theo URL.
 */
export function useCloseOnNavigate(close: () => void) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = `${pathname}?${searchParams?.toString() ?? ''}`;
  const previous = useRef<string | null>(null);

  useEffect(() => {
    if (previous.current === null) {
      previous.current = key;
      return;
    }
    if (previous.current === key) return;
    previous.current = key;
    close();
    // `close` cố tình không nằm trong mảng phụ thuộc: chỗ gọi thường truyền hàm mới mỗi lần
    // render, để vào đây là effect chạy lại liên tục.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
