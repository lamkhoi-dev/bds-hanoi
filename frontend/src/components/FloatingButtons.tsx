"use client";

import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import { Phone, MessageCircle, ArrowUp, Home, Search, Facebook } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function FloatingButtons() {
  const [showTopBtn, setShowTopBtn] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Trước đây số điện thoại / Zalo / Facebook của site Nghệ An bị viết cứng ở đây.
  const supportPhone = siteConfig.contact.phone;
  const supportZaloUrl = `https://zalo.me/${supportPhone}`;
  const supportFacebookUrl = siteConfig.contact.facebook;

  return (
    <>
      {!pathname?.startsWith('/tin/') && (
        <div className="hidden md:flex fixed bottom-6 right-6 z-[300] flex-col gap-3 items-end">
          <Link
            href="/post?type=CAN_MUA"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold px-4 py-2.5 rounded-full shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:shadow-xl hover:scale-105 transition-all"
          >
            <Search className="w-5 h-5" />
            <span>Gửi yêu cầu BĐS</span>
          </Link>
          <Link
            href="/post"
            className="flex items-center gap-2 bg-white text-primary font-bold px-4 py-2.5 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-100 hover:shadow-xl hover:scale-105 transition-all"
          >
            <Home className="w-5 h-5 text-accent" />
            Đăng tin BĐS
          </Link>
          <a
            href={`tel:${supportPhone}`}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-green-500 text-white shadow-[0_4px_20px_rgba(34,197,94,0.4)] hover:shadow-xl hover:scale-110"
            title="Gọi ngay"
          >
            <Phone className="w-5 h-5" />
          </a>
          <a
            href={supportZaloUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-blue-500 text-white shadow-[0_4px_20px_rgba(59,130,246,0.4)] hover:shadow-xl hover:scale-110"
            title="Chat Zalo"
          >
            <span className="font-bold text-[13px] tracking-wide">Zalo</span>
          </a>
          <a
            href={supportFacebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-[#1877F2] text-white shadow-[0_4px_20px_rgba(24,119,242,0.4)] hover:shadow-xl hover:scale-110"
            title="Facebook"
          >
            <Facebook className="w-5 h-5" />
          </a>
          {showTopBtn && (
            <button
              onClick={scrollToTop}
              className="w-10 h-10 bg-gray-800/80 backdrop-blur text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition-all mt-2"
              title="Lên đầu trang"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </>
  );
}

