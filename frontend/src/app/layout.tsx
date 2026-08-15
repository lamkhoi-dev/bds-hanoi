import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import Link from "next/link";

import Script from "next/script";
import "./globals.css";
import FloatingButtons from "@/components/FloatingButtons";
import CompareWidget from "@/components/CompareWidget";
import MobileMenu from "@/components/MobileMenu";
import MobileSwipeMenu from "@/components/MobileSwipeMenu";
import HeaderAuth from "@/components/HeaderAuth";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { OnlineProvider } from "@/contexts/OnlineContext";
import ConditionalVisibility from "@/components/ConditionalVisibility";
import { Phone, Mail, Plus } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { serverApiUrl } from '@/lib/server-api';

const beVietnamPro = Be_Vietnam_Pro({ 
  subsets: ["latin", "vietnamese"], 
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: '--font-be-vietnam-pro',
});
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  const verification = settings?.googleSearchConsoleId 
    ? { google: settings.googleSearchConsoleId } 
    : undefined;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      template: "%s | Nhà Đất Xứ Nghệ",
      default: "Nhà Đất Xứ Nghệ - Nền tảng Bất Động Sản hàng đầu",
    },
    description: "Tìm kiếm mua bán nhà đất, căn hộ, chung cư trên nền tảng bất động sản số 1 Nghệ An",
    keywords: ["Bất động sản", "Nhà Đất Xứ Nghệ", "Mua bán nhà đất", "Bất động sản Nghệ An", "Bất động sản Vinh"],
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Nhà Đất XN",
    },
    icons: {
      apple: "/icons/icon-192x192.png",
    },
    verification,
    openGraph: {
      title: {
        template: "%s | Nhà Đất Xứ Nghệ",
        default: "Nhà Đất Xứ Nghệ - Nền tảng Bất Động Sản hàng đầu",
      },
      description: "Tìm kiếm mua bán nhà đất, căn hộ, chung cư trên nền tảng bất động sản số 1 Nghệ An",
      url: siteUrl,
      siteName: "Nhà Đất Xứ Nghệ",
      images: [
        {
          url: `${siteUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: "Nhà Đất Xứ Nghệ",
        }
      ],
      locale: "vi_VN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: {
        template: "%s | Nhà Đất Xứ Nghệ",
        default: "Nhà Đất Xứ Nghệ - Nền tảng Bất Động Sản hàng đầu",
      },
      description: "Tìm kiếm mua bán nhà đất, căn hộ, chung cư trên nền tảng bất động sản số 1 Nghệ An",
      images: [`${siteUrl}/og-image.png`],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#1a56db",
};


async function getPublicSettings() {
  try {
    const res = await fetch(serverApiUrl('/settings/public'), { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getPublicSettings();
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="vi" data-scroll-behavior="smooth" className="overflow-x-clip" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Nhà Đất XN" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${beVietnamPro.className} ${beVietnamPro.variable} bg-background text-textMain antialiased overflow-x-clip`} suppressHydrationWarning>
        {(() => {
          const gaId = settings?.googleAnalyticsId || process.env.NEXT_PUBLIC_GA_ID;
          if (!gaId) return null;
          return (
            <>
              <Script 
                strategy="afterInteractive" 
                src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} 
              />
              <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                  __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${gaId}', {
                      page_path: window.location.pathname,
                    });
                  `,
                }}
              />
            </>
          );
        })()}
        {(settings?.facebookPixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID) && (
          <Script
            id="meta-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${(settings?.facebookPixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID)}');
                fbq('track', 'PageView');
              `,
            }}
          />
        )}
        <AuthProvider>
          <OnlineProvider>
        <div className="relative flex flex-col min-h-screen overflow-x-clip w-full">
        {/* ===== HEADER / NAVIGATION ===== */}
        <ConditionalVisibility>
          <header className="glass sticky top-0 z-50 border-b border-white/20">
              <div className="w-full max-w-[1920px] mx-auto px-4 xl:px-8">
              {/* Top Bar */}
              <div className="hidden md:flex justify-between items-center py-1.5 text-xs text-textSecondary border-b border-borderLight/50">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    Hotline: {process.env.NEXT_PUBLIC_SUPPORT_PHONE || '0868126826'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'contact@nhadatxunghe.vn'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Link href="/support/how-to-post" className="hover:text-primary transition">Hướng dẫn</Link>
                  <span>|</span>
                  <Link href="/news" className="hover:text-primary transition">Tin tức</Link>
                </div>
              </div>

                {/* Main Nav */}
              <div className="flex justify-between items-center py-3 sm:py-5 gap-1 sm:gap-2">
                <div className="flex items-center gap-0.5 sm:gap-4 min-w-0 flex-shrink">
                  {/* Mobile Menu Icon (moved to left) */}
                  <div className="-ml-2">
                    <MobileMenu />
                  </div>
                  {/* Logo */}
                  <Link href="/" className="flex items-center gap-1 sm:gap-3 group min-w-0 pr-0 xl:pr-4">
                    <img src="/logo/ngoi_nha.svg" alt="Nhà Đất Xứ Nghệ" className="h-7 sm:h-12 md:h-14 w-auto flex-shrink-0 object-contain transition-transform duration-300 group-hover:scale-105" />
                    <div className="flex flex-col justify-center min-w-0">
                      <img src="/logo/nha_dat_xu_nghe.svg" alt="Nhà Đất Xứ Nghệ" className="hidden sm:block h-8 md:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105 sm:mt-1 flex-shrink min-w-0" />
                      {/* Mobile 2-line Text */}
                      <div className="sm:hidden flex flex-col items-start leading-[1.1] font-black uppercase tracking-tight text-[11px] xs:text-[13px] drop-shadow-sm min-w-0">
                        <span className="text-[#1E88E5] truncate max-w-full">Nhà Đất</span>
                        <span className="text-[#FFB300] truncate max-w-full">Xứ Nghệ</span>
                      </div>
                    </div>
                  </Link>
                </div>

                {/* PC Menu */}
                <nav className="hidden xl:flex flex-1 min-w-0 overflow-x-auto scrollbar-hide gap-x-3 xl:gap-x-5 px-2 mx-auto items-center flex-nowrap whitespace-nowrap mask-edges">
                  {[
                    { label: 'Trang chủ', href: '/' },
                    { label: 'Đất nền', href: '/dat-nen' },
                    { label: 'Nhà riêng', href: '/nha-rieng' },
                    { label: 'Chung cư', href: '/chung-cu' },
                    { label: 'Dự án', href: '/du-an' },
                    { label: 'BĐS Nghệ An', href: '/nghe-an' },
                    { label: 'BĐS Hà Tĩnh', href: '/ha-tinh' },
                    { label: 'BĐS TP Vinh', href: '/thanh-pho-vinh' },
                    { label: 'Cho thuê', href: '/search?transactionType=CHO_THUE' },
                    { label: 'Tin tức', href: '/news' },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="nav-link text-[13px] xl:text-[14px] font-semibold text-gray-700 hover:text-primary transition-colors duration-200 relative group whitespace-nowrap shrink-0"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                  <Link
                    href="/post?type=CAN_MUA"
                    className="flex items-center gap-0.5 sm:gap-2 px-1.5 sm:px-4 py-1 sm:py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[10px] xs:text-[11px] sm:text-sm font-bold rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] whitespace-nowrap"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Cần mua</span>
                  </Link>
                  <Link
                    href="/post"
                    className="btn-shimmer flex items-center gap-0.5 sm:gap-2 px-1.5 sm:px-4 py-1 sm:py-2.5 bg-gradient-to-r from-accent to-accent-light text-white text-[10px] xs:text-[11px] sm:text-sm font-bold rounded-lg sm:rounded-xl shadow-md hover:shadow-glow-accent transition-all duration-300 hover:scale-[1.02] whitespace-nowrap"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Đăng bán</span>
                  </Link>
                  <HeaderAuth />
                </div>
              </div>
            </div>

            {/* Main Menu - Swipeable on Mobile */}
            <MobileSwipeMenu />
          </header>
        </ConditionalVisibility>

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 w-full">
          {children}
        </main>
        
        <ConditionalVisibility>
          <FloatingButtons />
          <CompareWidget />

          {/* ===== FOOTER ===== */}
          <Footer />
        </ConditionalVisibility>
        <Toaster position="top-right" />
        </div>
          </OnlineProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
