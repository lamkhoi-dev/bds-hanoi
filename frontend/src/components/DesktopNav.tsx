"use client";

import { useEffect, useRef, useState } from 'react';
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
      className={`hidden xl:flex flex-1 min-w-0 gap-x-3 xl:gap-x-5 px-2 mx-auto items-center flex-nowrap whitespace-nowrap ${
        groups.length > 0 ? '' : 'overflow-x-auto scrollbar-hide'
      }`}
    >
      {items.map((item) => (
        <NavLink key={item.label} {...item} />
      ))}

      {groups.length === 0 ? (
        // Nhánh mặc định: Nghệ An (Location.group = NULL toàn bộ) hoặc fetch lỗi.
        <NavLink label={`BĐS ${siteConfig.province.name}`} href={listingPath({ locationSlug: siteConfig.province.slug })} />
      ) : (
        groups.map((g) => <NavDropdown key={g.label} label={g.label} items={g.items} />)
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

/** Dropdown 1 cụm quận/huyện (Trung tâm / Cận trung tâm / Ngoại thành). */
function NavDropdown({ label, items }: { label: string; items: LocationNode[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="nav-link flex items-center gap-1 text-[13px] xl:text-[14px] font-semibold text-gray-700 hover:text-primary transition-colors duration-200 whitespace-nowrap"
      >
        {label}
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-2 z-50 w-72 bg-white rounded-xl shadow-xl border border-borderLight p-3 grid grid-cols-2 gap-1"
        >
          {items.map((loc) => (
            <Link
              key={loc.id}
              href={listingPath({ locationSlug: loc.slug ?? '' })}
              onClick={() => setOpen(false)}
              className="px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors whitespace-nowrap"
            >
              {loc.shortName || loc.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
