"use client";

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { listingPath } from '@/lib/seo/canonical';
import { propertyTypesByEnum } from '@/lib/seo/taxonomy';
import { siteConfig } from '@/lib/site-config';
import type { LocationNode } from '@/lib/locations/group';

/**
 * Menu ngang desktop (`<nav>` PC ở `layout.tsx`) — tách thành client component vì mục
 * khu vực cần dropdown tương tác (`layout.tsx` là server component).
 *
 * Mục khu vực rẽ nhánh theo DỮ LIỆU (không cần cờ, đúng cách `MobileMenu.tsx` đang làm
 * và đã chạy ổn trên cả 2 site): `groups.length === 0` là NHÁNH MẶC ĐỊNH — giữ nguyên
 * link phẳng `BĐS {tỉnh}` (Nghệ An, và cả khi fetch /locations lỗi ở layout.tsx); có
 * nhóm (Hà Nội: Trung tâm/Cận trung tâm/Ngoại thành) mới vẽ dropdown.
 */
export default function DesktopNav({
  groups,
}: {
  groups: { label: string; items: LocationNode[] }[];
}) {
  // Cụm nào đang mở dropdown (tối đa 1 cụm một lúc).
  const [openLabel, setOpenLabel] = useState<string | null>(null);

  const items = [
    // Đường dẫn dựng qua listingPath để đổi dạng URL chỉ cần đổi một cờ, và link nội
    // bộ không bao giờ trỏ vào một 301.
    { label: 'Trang chủ', href: '/' },
    ...propertyTypesByEnum(['DAT_NEN', 'NHA_RIENG', 'CHUNG_CU']).map((t) => ({
      label: t.label,
      href: listingPath({ propertyTypeSlug: t.slug }),
    })),
    // Không còn là link category theo taxonomy nữa — /du-an giờ là trang danh mục Dự
    // án (thực thể riêng, xem model Project). URL không đổi nên không ảnh hưởng SEO.
    { label: 'Dự án', href: '/du-an' },
  ];

  const tailItems = [
    // Trang cho thuê giờ có URL SEO riêng thay vì đẩy về /search.
    { label: 'Cho thuê', href: listingPath({ transaction: 'cho-thue' }) },
    { label: 'Tin tức', href: '/news' },
  ];

  return (
    <nav
      // `overflow-x-auto` giữ thanh menu nằm gọn trong phần của nó: thừa mục thì cuộn
      // ngang, KHÔNG tràn đè lên nút "Cần mua"/"Đăng bán" bên phải. Dropdown khu vực được
      // vẽ qua portal (xem `NavDropdown`) nên không bị overflow này cắt — không cần bật/tắt
      // overflow theo trạng thái mở như trước (cách cũ khiến menu Hà Nội đè chồng lên các
      // nút ở màn ~1280px, và khi mở dropdown thì cả thanh tràn ra đè tiếp).
      className="hidden xl:flex flex-1 min-w-0 gap-x-3 xl:gap-x-5 px-2 mx-auto items-center flex-nowrap whitespace-nowrap overflow-x-auto scrollbar-hide"
    >
      {items.map((item) => (
        <NavLink key={item.label} {...item} />
      ))}

      {groups.length === 0 ? (
        // Nhánh mặc định: Nghệ An (Location.group = NULL toàn bộ) hoặc fetch lỗi.
        <NavLink label={`BĐS ${siteConfig.province.name}`} href={listingPath({ locationSlug: siteConfig.province.slug })} />
      ) : (
        groups.map((g) => (
          <NavDropdown
            key={g.label}
            label={g.label}
            items={g.items}
            open={openLabel === g.label}
            onOpenChange={(v) => setOpenLabel(v ? g.label : null)}
          />
        ))
      )}

      {tailItems.map((item) => (
        <NavLink key={item.label} {...item} />
      ))}
    </nav>
  );
}

function NavLink({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="nav-link text-[13px] xl:text-[14px] font-semibold text-gray-700 hover:text-primary transition-colors duration-200 relative group whitespace-nowrap shrink-0"
    >
      {label}
    </Link>
  );
}

/** Bề rộng dropdown (`w-72` = 18rem = 288px) — dùng để kẹp vị trí không tràn màn hình. */
const DROPDOWN_WIDTH = 288;

/**
 * Dropdown 1 cụm quận/huyện (Trung tâm / Cận trung tâm / Ngoại thành).
 *
 * Trạng thái đóng/mở do `DesktopNav` giữ để mở cụm này thì cụm kia tự đóng (trước đây mở
 * được cả ba cùng lúc).
 *
 * Menu được vẽ qua PORTAL ra `document.body` với `position: fixed`, không nằm trong `<nav>`:
 * `<nav>` phải để `overflow-x-auto` (chống tràn đè nút bên phải) mà overflow như vậy sẽ cắt
 * mọi con `absolute`; còn `<header>` có `backdrop-filter` nên `fixed` bên trong nó bị tính
 * theo header chứ không theo màn hình. Vị trí tính từ nút lúc bấm và kẹp trong màn hình —
 * cụm "Ngoại thành" nằm sát mép phải ở màn ~1280px, trước đây menu bị tràn ra ngoài.
 */
function NavDropdown({
  label,
  items,
  open,
  onOpenChange,
}: {
  label: string;
  items: LocationNode[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const toggle = () => {
    if (!open && wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
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
    // Menu neo theo vị trí lúc mở nên cuộn (cả thanh nav cuộn ngang) hay đổi cỡ cửa sổ
    // đều đóng lại thay vì để nó lệch khỏi nút.
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className="nav-link flex items-center gap-1 text-[13px] xl:text-[14px] font-semibold text-gray-700 hover:text-primary transition-colors duration-200 whitespace-nowrap"
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
