"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import SidebarFilter from '@/components/SidebarFilter';

/**
 * Nút mở bộ lọc trên TRANG CHỦ, đặt ngay dưới ô tìm kiếm.
 *
 * Trước đây bộ lọc nằm tận cuối trang, trong cột bên phải — khách yêu cầu kéo lên đầu
 * trang và làm dạng popup nổi, để cách lọc ở trang chủ giống hệt trang chuyên mục.
 *
 * Dùng lại nguyên `SidebarFilter` thay vì dựng bản thứ hai: mọi luật lọc (chọn huyện
 * rồi mới cho chọn xã, tách xã mới / xã cũ, đọc URL bằng parseListingPath) chỉ nằm ở
 * một chỗ, sửa một lần là cả hai nơi cùng đổi.
 */
export default function HomeFilterButton() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Khách yêu cầu (19-8, mục 15): nút này làm DÀI và ghi chữ đầy đủ giống nút ở
          trang chuyên mục (MobileFilterButton) — bỏ chữ "và" trong câu. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors shadow-sm"
      >
        <SlidersHorizontal className="w-5 h-5" />
        Lọc để tìm kiếm nhanh, chính xác hơn
      </button>

      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-start justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm overflow-y-auto"
              onClick={() => setOpen(false)}
            >
              <div
                className="w-full max-w-lg mt-4 sm:mt-12 mb-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between bg-white rounded-t-2xl px-4 py-3 border-b border-gray-100">
                  <span className="font-bold text-gray-800">Bộ lọc</span>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Đóng"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {/* `sticky top-24` của SidebarFilter vô nghĩa trong popup nên bỏ đi. */}
                <div className="[&>div]:!static [&>div]:!mb-0 [&>div]:rounded-t-none">
                  <SidebarFilter />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
