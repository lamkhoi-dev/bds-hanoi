"use client";
import React, { useState, useEffect } from 'react';
import { listingPath } from '@/lib/seo/canonical';
import { PROPERTY_TYPES } from '@/lib/seo/taxonomy';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Menu, X, Home, Building2, MapPin, User, Plus } from 'lucide-react';
import { useLocations, groupLocations } from '@/hooks/useLocations';
import { useAuth } from '@/contexts/AuthContext';

/** Loại BĐS hiện trên menu, theo thứ tự. Nhãn/slug vẫn lấy từ taxonomy. */
const MENU_TYPE_ORDER: readonly string[] = ['DAT_NEN', 'NHA_RIENG', 'CHUNG_CU', 'DU_AN', 'MAT_BANG'];
const MENU_TYPES = MENU_TYPE_ORDER
  .map((e) => PROPERTY_TYPES.find((t) => t.enum === e))
  .filter((t): t is (typeof PROPERTY_TYPES)[number] => Boolean(t));

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<number[]>([0]);
  const { locations } = useLocations();
  const locationGroups = groupLocations(locations);
  const { user, logout } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const groups = [
    {
      title: 'Bán',
      icon: <Building2 className="w-5 h-5 text-gray-500" />,
      links: [
        // Trước đây 5 link viết cứng dạng URL cũ (`/dat-nen`…), P5 đã 301 chúng sang
        // `/ban/{loại}` nên menu đang đẩy người dùng qua một bước chuyển hướng.
        ...MENU_TYPES.map((t) => ({
          label: t.label,
          href: listingPath({ transaction: 'ban', propertyTypeSlug: t.slug }),
        })),
        { label: 'Khu vực BĐS', href: '/khu-vuc' },
      ]
    },
    {
      title: 'Cho thuê',
      icon: <Home className="w-5 h-5 text-gray-500" />,
      links: [
        // Cả 6 link trước đây trỏ vào `/search?...` — trang noindex, không có canonical
        // và không sinh landing. `/cho-thue/{loại}` mới là hub được index.
        ...MENU_TYPES.map((t) => ({
          label: `Cho thuê ${t.label.toLowerCase()}`,
          href: listingPath({ transaction: 'cho-thue', propertyTypeSlug: t.slug }),
        })),
      ]
    },
    // Khách đã gửi bảng phân nhóm (câu B1): Hà Nội chia Trung tâm / Cận trung tâm /
    // Ngoại thành, mỗi nhóm 10 quận. Nhóm lấy từ `Location.group` chứ không viết cứng,
    // nên Nghệ An (không phân nhóm) tự động giữ một mục "Khu vực" phẳng như cũ.
    ...(locationGroups.length > 0
      ? locationGroups.map((g) => ({
          title: g.label,
          icon: <MapPin className="w-5 h-5 text-gray-500" />,
          links: g.items.map((d) => ({
            label: d.shortName || d.name,
            href: listingPath({ locationSlug: d.slug }),
          })),
        }))
      : [
          {
            title: 'Khu vực',
            icon: <MapPin className="w-5 h-5 text-gray-500" />,
            links: locations.slice(0, 10).map((d: any) => ({
              label: d.shortName || d.name,
              href: listingPath({ locationSlug: d.slug }),
            })),
          },
        ]),
    {
      title: 'Dành cho bạn',
      icon: <User className="w-5 h-5 text-gray-500" />,
      links: [
        { label: 'Tin đã xem', href: '/user/recently-viewed' },
        { label: 'Tin đã lưu', href: '/user/saved' },
        { label: 'So sánh tin', href: '/so-sanh' },
        { label: 'Nhu cầu của tôi', href: '/user/requirements' },
      ]
    },
    {
      title: 'Tài khoản',
      icon: <User className="w-5 h-5 text-gray-500" />,
      links: [
        { label: 'Tin đã đăng', href: '/user/my-listings' },
        { label: 'Ví điện tử', href: '/user/wallet' },
        { label: 'Gói dịch vụ', href: '/user/packages' },
        { label: 'Cài đặt', href: '/user/settings' },
      ]
    }
  ];

  const drawerContent = (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[100] transition-opacity"
          onClick={toggleMenu}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 left-0 h-full w-[280px] bg-white z-[101] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <span className="font-extrabold text-lg text-primary">MENU</span>
          <button 
            onClick={toggleMenu} 
            className="p-2 bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="flex flex-col space-y-4 px-3">
            <div className="mb-2">
              <Link
                href="/ban"
                onClick={toggleMenu}
                className="flex items-center gap-2 px-4 py-2 font-bold text-gray-800 text-sm uppercase tracking-wider hover:text-primary transition-colors"
              >
                <Building2 className="w-5 h-5 text-gray-500" />
                Toàn bộ tin đã đăng
              </Link>
            </div>
            {groups.map((group, idx) => (
              <div key={idx} className="mb-2">
                <div 
                  className="flex items-center justify-between px-4 py-2 font-bold text-gray-800 text-sm uppercase tracking-wider cursor-pointer"
                  onClick={() => {
                    if (expandedGroups.includes(idx)) {
                      setExpandedGroups(expandedGroups.filter(i => i !== idx));
                    } else {
                      setExpandedGroups([...expandedGroups, idx]);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    {group.icon}
                    {group.title}
                  </div>
                  <span className="text-gray-400 font-normal">{expandedGroups.includes(idx) ? '—' : '+'}</span>
                </div>
                {expandedGroups.includes(idx) && (
                  <div className="flex flex-col mt-1 space-y-1">
                    {group.links.map(link => (
                      <Link
                        key={link.label}
                        href={link.href}
                        onClick={toggleMenu}
                        className="px-10 py-2 text-sm text-gray-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          
          <div className="mt-8 px-5">
            <div className="w-full h-px bg-gray-100 mb-6"></div>
            <div className="flex flex-col gap-3">
              {user ? (
                <button
                  onClick={() => { logout(); toggleMenu(); }}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors"
                >
                  <User className="w-5 h-5" />
                  Đăng xuất
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={toggleMenu}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gray-50 text-textMain font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <User className="w-5 h-5" />
                  Đăng nhập
                </Link>
              )}
              <div className="flex gap-2 w-full">
                <Link
                  href="/post?type=CAN_MUA"
                  onClick={toggleMenu}
                  className="flex flex-1 items-center justify-center gap-1 py-2 bg-blue-500 text-white font-bold rounded-xl shadow-md hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Cần mua
                </Link>
                <Link
                  href="/post"
                  onClick={toggleMenu}
                  className="flex flex-1 items-center justify-center gap-1 py-2 bg-accent text-white font-bold rounded-xl shadow-glow-accent hover:bg-accent-light transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Đăng bán
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex items-center">
      <button 
        onClick={toggleMenu} 
        className="p-2 text-textMain hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Toggle Menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {mounted && createPortal(drawerContent, document.body)}
    </div>
  );
}
