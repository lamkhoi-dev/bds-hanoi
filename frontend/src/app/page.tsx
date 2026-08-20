import React from 'react';
import { siteConfig } from '@/lib/site-config';
import Link from 'next/link';
import Image from 'next/image';
import HomeFilterButton from '@/components/HomeFilterButton';
import HomepageSection from '@/components/HomepageSection';
import RecentlyViewed from '@/components/RecentlyViewed';
import FavoriteTags from '@/components/FavoriteTags';
import SearchForm from '@/components/SearchForm';
import { listingPath } from '@/lib/seo/canonical';
import Adsense from '@/components/Adsense';
import OnlineStatsGridItem from '@/components/OnlineStatsGridItem';
import { serverApiUrl } from '@/lib/server-api';
import ExploreMoreBehavioral from '@/components/ExploreMoreBehavioral';
import { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

async function getHomepageData() {
  try {
    const res = await fetch(serverApiUrl('/properties/homepage'), { next: { revalidate: 0 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json || null;
  } catch {
    return null;
  }
}

async function getHotLocations() {
  try {
    const res = await fetch(serverApiUrl('/properties/hot-locations'), { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getPublicSettings() {
  try {
    const res = await fetch(serverApiUrl('/settings/public'), { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getLocations() {
  try {
    const res = await fetch(serverApiUrl('/locations'), { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// getVinhProperties() đã bị xoá: nó gọi 6 lượt fetch SSR cho 6 phường của TP Vinh
// viết cứng, kèm slug tự chế. Khối "BĐS theo khu vực" giờ lấy từ Location.isFeatured
// do importer đặt theo sheet "hot" của khách.

// getLatestProjects() đã bị xoá: khối "Dự án" giờ nằm trong `sections[]` của
// /properties/homepage (xem HomepageSection.tsx) — bớt một lượt fetch SSR riêng mỗi
// lần tải trang chủ.

export default async function Home() {
  const [homepageData, hotLocations, locations, settings] = await Promise.all([
    getHomepageData(),
    getHotLocations(),
    getLocations(),
    getPublicSettings(),
  ]);

  const stats = homepageData?.stats || { properties: 100, users: 50, projects: 10, satisfaction: 99 };

  // Chỉ nhận khu vực CÓ đoạn URL thật từ cây khu vực. Bản cũ dự phòng bằng
  // generateSlug(tên), cho ra 'phuong-yen-hoa' trong khi urlSegment là 'yen-hoa' —
  // link dựng ra dẫn vào trang không tồn tại.
  const allWards = (locations || [])
    .flatMap((district: any) => district.children || [])
    .filter((w: any) => w?.name && w?.slug)
    .map((w: any) => ({ name: w.name, slug: w.slug }));
  
  // Randomize wards dynamically for explore tags
  const shuffledWards = [...allWards].sort(() => 0.5 - Math.random());
  // Không còn danh sách phường Nghệ An dự phòng: chưa có dữ liệu thì ẩn khối đi.
  const displayWards = shuffledWards.slice(0, 4);

  return (
    <div>


      {/* ===== HERO SECTION =====
          banner.svg nay là bộ logo mới khách gửi (19-8): logo + chữ "Nhà đất xứ Nghệ" +
          slogan "Đăng bán dễ dàng / tìm đất an tâm." — slogan là <text> màu TRẮNG nên chỉ
          đọc được trên nền tối #0a1930 này. Bản cũ (ảnh minh hoạ full-width, slogan "Đăng
          tin dễ dàng" vẽ dạng vector path nên không sửa được bằng code) vẫn còn ở
          public/logo/logo-full.svg nếu cần lùi.

          Vì file mới là LOGO ngang (tỉ lệ ~3.6:1) chứ không phải ảnh nền, nó được giới hạn
          bề rộng và căn giữa thay vì kéo full-width — kéo hết chiều ngang 1920px sẽ làm chữ
          to quá cỡ. Khoảng đệm dọc cũng siết lại theo yêu cầu "kéo phần đầu trang chủ lên,
          chỗ trống thừa nhiều" (mục 14). */}
      <section className="relative w-full bg-[#0a1930] overflow-hidden flex justify-center py-6 md:py-10">
        <h1 className="sr-only">
          Đăng bán, tìm mua và cho thuê bất động sản tại {siteConfig.province.name}
        </h1>
        <div className="w-full max-w-2xl px-4 relative">
          <Image
            src="/banner.svg"
            alt={`${siteConfig.name} — Đăng bán dễ dàng, tìm đất an tâm`}
            width={1033}
            height={290}
            className="w-full h-auto block"
            priority
          />
        </div>
      </section>

      {/* ===== SEARCH SECTION ===== */}
      <section className="relative z-10 px-4 mt-4 mb-6">
        <div className="container mx-auto max-w-4xl relative flex flex-col gap-3">
          <SearchForm />
          {/* Bộ lọc ngay dưới ô tìm kiếm, mở ra dạng popup nổi. */}
          <React.Suspense fallback={null}>
            <HomeFilterButton />
          </React.Suspense>
        </div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <section className="w-full max-w-[1600px] xl:px-8 mx-auto px-4 py-8 md:py-10 flex flex-col lg:flex-row gap-8 overflow-hidden">
        
        {/* Left Content (Listings) */}
        <div className="flex-1 overflow-hidden min-w-0">
          {/* Backend quyết thứ tự + nội dung từng khối qua `sections[]` (xem
              homepage-layout.ts) — frontend chỉ vẽ theo `kind`, không biết site nào
              đang chạy layout nào. Nghệ An (`classic`) và Hà Nội (`grouped`) dùng
              chung code này, khác nhau nhờ biến môi trường backend `SITE_LAYOUT`. */}
          {homepageData?.sections?.map((section: any, idx: number) => (
            <HomepageSection key={`${section.id}-${idx}`} section={section} />
          ))}
        </div>

        {/* Right Sidebar (Stats & Banner) */}
        <aside className="w-full lg:w-[320px] flex-shrink-0 mb-8 lg:mb-0">
          {/* Bộ lọc đã được KÉO LÊN đầu trang, ngay dưới ô tìm kiếm, dạng popup nổi —
              để trang chủ và trang chuyên mục dùng chung một cách lọc như khách yêu cầu.
              Trước đây nó nằm tận cuối trang trong cột bên phải. */}
          
          {/* Stats Box (Moved from top) */}
          <div className="mt-6 bg-white rounded-2xl shadow-card p-5 border border-borderLight/50">
            <h4 className="font-extrabold text-gray-800 mb-4 text-center border-b pb-2">Thống kê hệ thống</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center py-2">
                <p className="text-xl font-extrabold text-primary">{stats.properties}+</p>
                <p className="text-xs text-textSecondary font-medium mt-1">Tin đăng</p>
              </div>
              <div className="text-center py-2">
                <p className="text-xl font-extrabold text-primary">{stats.users}+</p>
                <p className="text-xs text-textSecondary font-medium mt-1">Khách hàng</p>
              </div>
              <div className="text-center py-2">
                <p className="text-xl font-extrabold text-primary">{stats.projects}+</p>
                <p className="text-xs text-textSecondary font-medium mt-1">Dự án</p>
              </div>
              <div className="text-center py-2">
                <p className="text-xl font-extrabold text-primary">{stats.satisfaction}%</p>
                <p className="text-xs text-textSecondary font-medium mt-1">Hài lòng</p>
              </div>
              <OnlineStatsGridItem isGloballyEnabled={settings?.showOnlineUsers !== false} />
            </div>
          </div>
          
          {/* Promo Banner Example */}
          <div className="mt-6 rounded-2xl overflow-hidden shadow-card relative bg-gradient-to-br from-accent to-accent-light p-6 text-white text-center">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px'}} />
            <h4 className="font-extrabold text-xl mb-2 relative z-10">Đăng tin miễn phí!</h4>
            <p className="text-white/80 text-sm mb-4 relative z-10">Tiếp cận hàng ngàn khách hàng tiềm năng ngay hôm nay.</p>
            <Link href="/post" className="inline-block bg-white text-accent font-bold px-6 py-2.5 rounded-xl shadow hover:shadow-lg transition-shadow relative z-10 hover:scale-105 duration-200">
              Đăng tin ngay
            </Link>
          </div>
        </aside>
      </section>

      {/* FAVORITE TAGS SECTION */}
      <FavoriteTags />

      {/* RECENTLY VIEWED SECTION */}
      <RecentlyViewed />

      {/* SEO Internal Link Locality Block & HOT LOCATIONS */}
      <section className="container mx-auto px-4 mb-16 animate-slide-up">
        <h2 className="text-xl font-extrabold text-textMain mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-accent rounded-full inline-block"></span>
          Khu vực hot trong ngày & Khám phá
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Dynamic Hot Locations */}
          {hotLocations.map((loc: any, i: number) => {
            return (
              <Link href={loc.href || listingPath({ locationSlug: loc.slug })} key={i} className="group relative rounded-2xl overflow-hidden h-40 shadow-sm border border-gray-100 hover:shadow-md transition-all block">
                <Image src={loc.image} alt={loc.name} width={400} height={160} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-bold text-lg">{loc.name}</h3>
                  <p className="text-sm text-gray-300">{loc.count} tin đăng</p>
                </div>
                <div className="absolute top-4 right-4 bg-accent text-white text-xs font-bold px-2 py-1 rounded">
                  HOT
                </div>
              </Link>
            );
          })}
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-card border border-borderLight/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Bất động sản nổi bật</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href={listingPath({ propertyTypeSlug: "dat-nen" })} className="text-gray-600 hover:text-primary transition-colors">Đất nền dự án</Link></li>
                <li><Link href={listingPath({ propertyTypeSlug: "nha-rieng" })} className="text-gray-600 hover:text-primary transition-colors">Nhà đất thổ cư</Link></li>
                <li><Link href={listingPath({ propertyTypeSlug: "chung-cu" })} className="text-gray-600 hover:text-primary transition-colors">Căn hộ chung cư</Link></li>
                {/* `/search` là trang noindex — hub cho thuê được index là `/cho-thue`. */}
                <li><Link href={listingPath({ transaction: 'cho-thue' })} className="text-gray-600 hover:text-primary transition-colors">Nhà đất cho thuê</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Tìm kiếm nhiều nhất</h3>
              <ul className="space-y-2 text-sm">
                {displayWards.map((w: any, i: number) => (
                  <li key={i}><Link href={listingPath({ locationSlug: w.slug })} className="text-gray-600 hover:text-primary transition-colors">Nhà đất {w.name}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Đất nền theo phường</h3>
              <ul className="space-y-2 text-sm">
                {displayWards.map((w: any, i: number) => (
                  <li key={i}><Link href={listingPath({ propertyTypeSlug: 'dat-nen', locationSlug: w.slug })} className="text-gray-600 hover:text-primary transition-colors">Đất nền {w.name}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Phân khúc giá</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/search?priceRangeKey=LT_1B" className="text-gray-600 hover:text-primary transition-colors">Bất động sản dưới 1 tỷ</Link></li>
                <li><Link href="/search?priceRangeKey=1B_2B" className="text-gray-600 hover:text-primary transition-colors">Bất động sản 1 - 2 tỷ</Link></li>
                <li><Link href="/search?priceRangeKey=2B_3B" className="text-gray-600 hover:text-primary transition-colors">Bất động sản 2 - 3 tỷ</Link></li>
                <li><Link href="/search?priceRangeKey=3B_5B" className="text-gray-600 hover:text-primary transition-colors">Bất động sản 3 - 5 tỷ</Link></li>
              </ul>
            </div>
          </div>
          
          <ExploreMoreBehavioral />
        </div>
        
        <Adsense className="mt-8 mb-4 max-w-7xl mx-auto px-4" />
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="bg-gradient-to-r from-primary-dark via-primary to-primary-light py-16 relative overflow-hidden">
        <div className="absolute top-10 right-10 w-32 h-32 bg-accent/10 rounded-full animate-float" />
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-white/5 rounded-2xl rotate-12 animate-float animation-delay-2000" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Bạn muốn đăng tin bất động sản?</h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">Đăng tin miễn phí, tiếp cận hàng triệu người mua tiềm năng trên nền tảng của chúng tôi.</p>
          <Link href="/post" className="btn-shimmer inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-accent to-accent-light text-white font-bold rounded-xl shadow-lg hover:shadow-glow-accent transition-all duration-300 hover:scale-105 text-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Đăng tin ngay
          </Link>
        </div>
      </section>
    </div>
  );
}

