"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Menu, X, Home, Building2, MapPin, User, Plus } from 'lucide-react';
import { useLocations } from '@/hooks/useLocations';
import { useAuth } from '@/contexts/AuthContext';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<number[]>([0]);
  const { locations } = useLocations();
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
        { label: 'Đất nền', href: '/dat-nen' },
        { label: 'Nhà riêng', href: '/nha-rieng' },
        { label: 'Chung cư', href: '/chung-cu' },
        { label: 'Dự án', href: '/du-an' },
        { label: 'Mặt bằng / kho xưởng', href: '/mat-bang-kho-xuong' },
        { label: 'Khu vực BĐS', href: '/khu-vuc' },
      ]
    },
    {
      title: 'Cho thuê',
      icon: <Home className="w-5 h-5 text-gray-500" />,
      links: [
        { label: 'Cho thuê đất nền', href: '/search?transactionType=CHO_THUE&propertyType=DAT_NEN' },
        { label: 'Cho thuê nhà riêng', href: '/search?transactionType=CHO_THUE&propertyType=NHA_RIENG' },
        { label: 'Cho thuê chung cư', href: '/search?transactionType=CHO_THUE&propertyType=CHUNG_CU' },
        { label: 'Cho thuê dự án', href: '/search?transactionType=CHO_THUE&propertyType=DU_AN' },
        { label: 'Cho thuê mặt bằng', href: '/search?transactionType=CHO_THUE&propertyType=MAT_BANG' },
        { label: 'Cho thuê BĐS khác', href: '/search?transactionType=CHO_THUE&propertyType=BDS_KHAC' },
      ]
    },
    {
      title: 'Khu vực',
      icon: <MapPin className="w-5 h-5 text-gray-500" />,
      links: [
        { label: 'TP Vinh', href: '/thanh-pho-vinh' },
        { label: 'TX Cửa Lò', href: '/thi-xa-cua-lo' },
        { label: 'Huyện Diễn Châu', href: '/huyen-dien-chau' },
        { label: 'BĐS Hà Tĩnh', href: '/ha-tinh' },
        { label: 'TX Thái Hòa', href: '/thi-xa-thai-hoa' },
        { label: 'TX Hoàng Mai', href: '/thi-xa-hoang-mai' },
        { label: 'Huyện Đô Lương', href: '/huyen-do-luong' },
        { label: 'Huyện Quỳnh Lưu', href: '/huyen-quynh-luu' },
        { label: 'Huyện Nam Đàn', href: '/huyen-nam-dan' },
        { label: 'Huyện Hưng Nguyên', href: '/huyen-hung-nguyen' },
        { label: 'Huyện Nghi Lộc', href: '/huyen-nghi-loc' },
        { label: 'Huyện Thanh Chương', href: '/huyen-thanh-chuong' },
        { label: 'Khu vực khác...', href: '/khu-vuc' },
      ]
    },
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
                href="/toan-bo-tin"
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
