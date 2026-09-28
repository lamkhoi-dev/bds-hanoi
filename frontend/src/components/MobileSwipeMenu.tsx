"use client";

import { useRef, useState, useEffect } from 'react';
import { listingPath } from '@/lib/seo/canonical';
import { propertyTypesByEnum } from '@/lib/seo/taxonomy';
import { siteConfig } from '@/lib/site-config';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import NavDropdown from './NavDropdown';
import type { LocationNode } from '@/lib/locations/group';

// Bỏ 2 mục địa danh Nghệ An ('Nhà đất Vinh', 'BĐS Hà Tĩnh') — link chết trên site
// Hà Nội. Đường dẫn dựng qua listingPath để đổi dạng URL chỉ ở một chỗ.
const headItems = [{ label: 'Trang chủ', href: '/' }];

const tailItems = [
  ...propertyTypesByEnum(['DAT_NEN', 'NHA_RIENG', 'CHUNG_CU', ...(siteConfig.features.villaMenu ? (['BIET_THU'] as const) : [])]).map((t) => ({
    label: t.label,
    href: listingPath({ propertyTypeSlug: t.slug }),
  })),
  // Không còn là link category theo taxonomy nữa — /du-an giờ là trang danh mục Dự án
  // (thực thể riêng, xem model Project). URL không đổi nên không ảnh hưởng SEO đã index.
  { label: 'Dự án', href: '/du-an' },
  { label: 'Cho thuê', href: listingPath({ transaction: 'cho-thue' }) },
  { label: 'Tin tức', href: '/news' },
];

const navLinkClass = 'nav-link text-[14px] font-semibold text-gray-700 hover:text-primary transition-colors duration-200 relative group whitespace-nowrap';

export default function MobileSwipeMenu({
  groups = [],
}: {
  /** Cụm quận/huyện (Trung tâm/Cận trung tâm/Ngoại thành) — rỗng thì giữ link phẳng như cũ.
   *  Cùng dữ liệu và cách rẽ nhánh với `DesktopNav`, chỉ khác nơi hiển thị: khách báo 27/9
   *  menu ngang cuộn được trên mobile chưa có 3 khu vực này, mới chỉ có ở PC. */
  groups?: { label: string; items: LocationNode[] }[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showIndicator, setShowIndicator] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openLabel, setOpenLabel] = useState<string | null>(null);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      // If we've scrolled near the end (within 10px), hide the indicator
      setShowIndicator(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    setMounted(true);
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  return (
    <div className="lg:hidden border-t border-borderLight/30 bg-white/50 backdrop-blur-sm relative">
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="w-full overflow-x-auto scrollbar-hide"
      >
        <div className="px-4 md:px-8">
          <nav className="flex items-center gap-5 py-2.5 min-w-max">
            {headItems.map((item) => (
              <Link key={item.label} href={item.href} className={navLinkClass}>
                {item.label}
              </Link>
            ))}

            {groups.length === 0 ? (
              <Link
                href={listingPath({ locationSlug: siteConfig.province.slug })}
                className={navLinkClass}
              >
                {`BĐS ${siteConfig.province.name}`}
              </Link>
            ) : (
              groups.map((g) => (
                <NavDropdown
                  key={g.label}
                  label={g.label}
                  items={g.items}
                  open={openLabel === g.label}
                  onOpenChange={(v) => setOpenLabel(v ? g.label : null)}
                  triggerClassName={navLinkClass + ' flex items-center gap-1'}
                />
              ))
            )}

            {tailItems.map((item) => (
              <Link key={item.label} href={item.href} className={navLinkClass}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Fade gradient & arrow indicator for scroll */}
      {mounted && showIndicator && (
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white/90 to-transparent pointer-events-none flex items-center justify-end pr-1 text-primary">
          <ChevronRight className="w-4 h-4 animate-pulse opacity-70" />
        </div>
      )}
    </div>
  );
}
