"use client";

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { listingPath } from '@/lib/seo/canonical';
import type { LocationNode } from '@/lib/locations/group';

/** Bề rộng dropdown (`w-72` = 18rem = 288px) — dùng để kẹp vị trí không tràn màn hình. */
const DROPDOWN_WIDTH = 288;

/**
 * Dropdown 1 cụm quận/huyện (Trung tâm / Cận trung tâm / Ngoại thành).
 *
 * Tách riêng khỏi `DesktopNav.tsx` (27/9) để dùng lại được cho `MobileSwipeMenu.tsx` — menu
 * ngang cuộn được trên mobile trước đó chưa có 3 khu vực này (khách báo 27/9: "mới chỉ có
 * trên PC"). Cơ chế mở bằng `onClick` (không phải hover) nên chạm tay trên mobile vẫn dùng
 * được y hệt, không cần viết lại logic riêng cho cảm ứng.
 *
 * Trạng thái đóng/mở do component cha giữ (`openLabel`) để mở cụm này thì cụm kia tự đóng.
 *
 * Menu vẽ qua PORTAL ra `document.body` với `position: fixed`, không nằm trong thanh nav:
 * thanh nav phải để `overflow-x-auto` (chống tràn đè các nút bên phải, hoặc cuộn ngang trên
 * mobile) mà overflow như vậy sẽ cắt mọi con `absolute`; còn `<header>` có `backdrop-filter`
 * nên `fixed` bên trong nó bị tính theo header chứ không theo màn hình. Vị trí tính từ nút
 * lúc bấm và kẹp trong màn hình — cụm sát mép phải vẫn không tràn ra ngoài.
 */
export default function NavDropdown({
  label,
  items,
  open,
  onOpenChange,
  triggerClassName,
}: {
  label: string;
  items: LocationNode[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Cho phép chỉnh cỡ chữ khác nhau giữa DesktopNav và MobileSwipeMenu. */
  triggerClassName?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Vị trí nút lúc mở menu — dùng để biết sau đó nút có bị xê dịch (cuộn nav / cuộn trang) không.
  const anchorRef = useRef({ left: 0, bottom: 0 });
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const toggle = () => {
    if (!open && wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      anchorRef.current = { left: r.left, bottom: r.bottom };
      const maxLeft = Math.max(8, window.innerWidth - DROPDOWN_WIDTH - 8);
      setPos({ top: r.bottom + 8, left: Math.min(Math.max(8, r.left), maxLeft) });
    }
    onOpenChange(!open);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => onOpenChange(false);
    const onClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      close();
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    // Menu neo theo vị trí lúc mở nên đổi cỡ cửa sổ, hoặc cuộn làm NÚT xê dịch (thanh nav cuộn
    // ngang, trang cuộn) thì đóng lại thay vì để nó lệch khỏi nút. Không đóng theo mọi sự kiện
    // cuộn: click vào nút đang lấp ló ở mép nav làm trình duyệt/Playwright cuộn nav TRƯỚC khi
    // menu mở, nhưng sự kiện `scroll` tới trễ hơn — đóng theo nó thì menu vừa mở đã tắt.
    const onScroll = () => {
      const r = wrapRef.current?.getBoundingClientRect();
      if (!r) return;
      if (Math.abs(r.left - anchorRef.current.left) > 1 || Math.abs(r.bottom - anchorRef.current.bottom) > 1) close();
    };
    window.addEventListener('resize', close);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className={
          triggerClassName ??
          'nav-link flex items-center gap-1 text-[13px] xl:text-[14px] font-semibold text-gray-700 hover:text-primary transition-colors duration-200 whitespace-nowrap'
        }
      >
        {label}
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: pos.top, left: pos.left, width: DROPDOWN_WIDTH }}
            className="fixed z-[60] bg-white rounded-xl shadow-xl border border-borderLight p-3 grid grid-cols-2 gap-1"
          >
            {items.map((loc) => (
              <Link
                key={loc.id}
                href={listingPath({ locationSlug: loc.slug ?? '' })}
                onClick={() => onOpenChange(false)}
                className="px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors whitespace-nowrap"
              >
                {loc.shortName || loc.name}
              </Link>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
