"use client";

import { useState } from 'react';
import Link from 'next/link';
import { listingPath } from '@/lib/seo/canonical';
import { propertyTypesByEnum } from '@/lib/seo/taxonomy';
import { siteConfig } from '@/lib/site-config';
import type { LocationNode } from '@/lib/locations/group';
import NavDropdown from './NavDropdown';

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
    ...propertyTypesByEnum(['DAT_NEN', 'NHA_RIENG', 'CHUNG_CU', ...(siteConfig.features.villaMenu ? (['BIET_THU'] as const) : [])]).map((t) => ({
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
