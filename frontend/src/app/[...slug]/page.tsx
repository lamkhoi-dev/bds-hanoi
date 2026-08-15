import React from 'react';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { Metadata } from 'next';
import Adsense from '@/components/Adsense';
import ShareButtons from '@/components/ShareButtons';
import PropertyCard from '@/components/PropertyCard';
import { serverApiUrl } from '@/lib/server-api';
import SearchControls from '@/components/SearchControls';
import MobileFilterButton from '@/components/MobileFilterButton';
import SearchForm from '@/components/SearchForm';
import SidebarFilter from '@/components/SidebarFilter';
import GoogleAdPlaceholder from '@/components/GoogleAdPlaceholder';
import Breadcrumb from '@/components/Breadcrumb';

export const dynamic = 'force-dynamic';

const formatSlugToName = (slug: string) => {
  // Tách các phần nếu có dấu / (VD: ban/nghe-an)
  const parts = slug.split('/');
  const formattedParts = parts.map(part => {
    try {
      part = decodeURIComponent(part);
    } catch (e) {}
    let name = part.replace(/-/g, ' ');
    // Từ điển thay thế
    const map: Record<string, string> = {
      'ha tinh': 'Hà Tĩnh',
      'nghe an': 'Nghệ An',
      'thanh pho vinh': 'Thành phố Vinh',
      'thi xa cua lo': 'Thị xã Cửa Lò',
      'thi xa thai hoa': 'Thị xã Thái Hòa',
      'thi xa hoang mai': 'Thị xã Hoàng Mai',
      'thi xa hong linh': 'Thị xã Hồng Lĩnh',
      'thi xa ky anh': 'Thị xã Kỳ Anh',
      'huyen dien chau': 'Huyện Diễn Châu',
      'huyen hung nguyen': 'Huyện Hưng Nguyên',
      'huyen nghi loc': 'Huyện Nghi Lộc',
      'huyen do luong': 'Huyện Đô Lương',
      'huyen quynh luu': 'Huyện Quỳnh Lưu',
      'huyen nam dan': 'Huyện Nam Đàn',
      'huyen thanh chuong': 'Huyện Thanh Chương',
      'h dien chau': 'Huyện Diễn Châu',
      'h hung nguyen': 'Huyện Hưng Nguyên',
      'h nghi loc': 'Huyện Nghi Lộc',
      'h do luong': 'Huyện Đô Lương',
      'tx cua lo': 'Thị xã Cửa Lò',
      'tx thai hoa': 'Thị xã Thái Hòa',
      'tx hoang mai': 'Thị xã Hoàng Mai',
      'ban': 'Bán',
      'cho thue': 'Cho thuê',
      'cho-thue': 'Cho thuê',
      'dat nen': 'Đất nền',
      'nha rieng': 'Nhà riêng',
      'nha mat pho': 'Nhà mặt phố',
      'biet thu': 'Biệt thự',
      'chung cu': 'Chung cư',
      'mat bang kho xuong': 'Mặt bằng kho xưởng',
      'bds khac': 'Bất động sản khác',
      'du an': 'Dự án',
      'tat ca': 'Tất cả'
    };
    
    Object.keys(map)
      .sort((a, b) => b.length - a.length)
      .forEach(key => {
      if (name.toLowerCase() === key) {
        name = map[key];
      } else if (name.toLowerCase().includes(key)) {
        name = name.replace(new RegExp(key, 'gi'), map[key]);
      }
    });
    
    // Capitalize remaining lower case parts like "phuong truong vinh" -> "phường Trường Vinh"
    if (name.toLowerCase().startsWith('phuong ')) {
      name = 'phường ' + name.slice(7).replace(/\b\w/g, l => l.toUpperCase());
    } else if (name.toLowerCase().startsWith('tx ')) {
      name = 'Thị xã ' + name.slice(3).replace(/\b\w/g, l => l.toUpperCase());
    } else if (name.toLowerCase().startsWith('tp ')) {
      name = 'TP ' + name.slice(3).replace(/\b\w/g, l => l.toUpperCase());
    } else if (name.toLowerCase().startsWith('h ')) {
      name = name.slice(2).replace(/\b\w/g, l => l.toUpperCase()) + ', Nghệ An';
    }

    return name;
  });
  
  return formattedParts.join(' - ');
};

function getSeoMetadataTexts(loaiBds: string, khuVuc: string) {
  const formattedLoaiBds = formatSlugToName(loaiBds);
  const formattedKhuVuc = khuVuc !== 'toan-quoc' ? formatSlugToName(khuVuc) : 'Nghệ An';
  
  const isRent = false; // SEO URLs are exclusively for BAN
  
  let coreCat = '';
  if (loaiBds === 'tat-ca' || formattedLoaiBds.toLowerCase() === 'bất động sản' || formattedLoaiBds.toLowerCase() === 'tất cả') {
    coreCat = 'nhà đất bán';
  } else {
    coreCat = formattedLoaiBds.toLowerCase();
    if (!coreCat.startsWith('bán ')) {
      coreCat = `bán ${coreCat}`;
    }
  }

  // Capitalize first letter
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const titleCore = capitalize(coreCat);
  
  let h1Text = '';
  let title = '';
  let description = '';

  if (khuVuc === 'toan-quoc') {
    // Nhóm 1: /{loai-bds} -> e.g. /dat-nen
    h1Text = `${titleCore} Nghệ An`;
    title = `${titleCore} Nghệ An | Nhà Đất Xứ Nghệ`;
    description = `Cập nhật tin ${coreCat} Nghệ An. Xem giá, diện tích, vị trí, pháp lý và thông tin liên hệ người đăng tin.`;
  } else if (loaiBds === 'tat-ca') {
    // Nhóm 2: /{khu-vuc} -> e.g. /phuong-truong-vinh
    h1Text = `${titleCore} ${formattedKhuVuc}`;
    title = `${titleCore} ${formattedKhuVuc} | Nhà Đất Xứ Nghệ`;
    description = `Cập nhật tin ${coreCat} ${formattedKhuVuc}. Xem giá, diện tích, vị trí, pháp lý và thông tin liên hệ người đăng tin.`;
  } else {
    // Nhóm 3: /{loai-bds}/{khu-vuc} -> e.g. /dat-nen/phuong-truong-vinh
    h1Text = `${titleCore} ${formattedKhuVuc}`;
    title = `${titleCore} ${formattedKhuVuc} | Nhà Đất Xứ Nghệ`;
    
    // Add Nghệ An if missing in description for better local SEO
    const descKhuVuc = formattedKhuVuc.toLowerCase().includes('nghệ an') || formattedKhuVuc.toLowerCase().includes('hà tĩnh') 
      ? formattedKhuVuc 
      : `${formattedKhuVuc}, Nghệ An`;
      
    description = `Cập nhật tin ${coreCat} ${descKhuVuc}. Xem giá, diện tích, vị trí, pháp lý và thông tin liên hệ người đăng tin.`;
  }

  return { h1Text, title, description, formattedLoaiBds, formattedKhuVuc };
}

type PageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const parseSlug = (slugParts: string[]) => {
  const CATEGORIES = ['dat-nen', 'nha-rieng', 'nha-mat-pho', 'biet-thu', 'chung-cu', 'du-an', 'mat-bang-kho-xuong', 'bds-khac', 'tat-ca', 'cho-thue'];
  
  let loaiBds = 'tat-ca';
  let loaiBdsSlug = 'tat-ca';
  let khuVuc = 'toan-quoc';
  
  let i = 0;
  
  if (i < slugParts.length && CATEGORIES.includes(slugParts[i])) {
    i++;
  }

  if (i > 0) {
    loaiBds = slugParts.slice(0, i).join('-');
    loaiBdsSlug = slugParts.slice(0, i).join('/');
  }

  if (i < slugParts.length) {
    khuVuc = slugParts.slice(i).join('/');
  }
  
  return { loaiBds, khuVuc, loaiBdsSlug };
};

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug?: string[] }>; searchParams: Promise<{ [key: string]: string | string[] | undefined }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slugParts = Array.isArray(resolvedParams.slug) ? resolvedParams.slug : [];
  
  const { loaiBds, khuVuc } = parseSlug(slugParts);
  
  const { title, description } = getSeoMetadataTexts(loaiBds, khuVuc);

  const page = resolvedSearchParams?.page ? `?page=${resolvedSearchParams.page}` : '';

  return {
    title,
    description,
    alternates: {
      canonical: `https://nhadatxunghe.vn/${slugParts.join('/')}${page}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

async function getSeoData(loaiBds: string, khuVuc: string, queryString: string) {
  try {
    const res = await fetch(serverApiUrl(`/properties/seo?loaiBds=${loaiBds}&khuVuc=${khuVuc}&${queryString}`), { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Category/Location SEO Landing Pages
export default async function CategoryLandingPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slugParts = Array.isArray(resolvedParams.slug) ? resolvedParams.slug : [];
  const fullSlug = slugParts.join('/');
  
  if (fullSlug === 'sitemap') {
    redirect('/sitemap.xml');
  }
  
  if (fullSlug === 'sitemap.xml') {
    // If Next.js catch-all accidentally catches sitemap.xml, return 404 to let Next.js handle it natively
    notFound();
  }
  
  const { loaiBds, khuVuc, loaiBdsSlug } = parseSlug(slugParts);
  const pageValue = Array.isArray(resolvedSearchParams.page) ? resolvedSearchParams.page[0] : resolvedSearchParams.page;
  const page = pageValue ? parseInt(pageValue, 10) : 1;
  
  const queryParams = new URLSearchParams();
  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v));
      } else {
        queryParams.append(key, value);
      }
    }
  });
  
  const data = await getSeoData(loaiBds, khuVuc, queryParams.toString());
  
  const { h1Text, formattedLoaiBds, formattedKhuVuc } = getSeoMetadataTexts(loaiBds, khuVuc);
  
  const breadcrumbs = [];
  if (loaiBds !== 'tat-ca') {
    breadcrumbs.push({ name: formattedLoaiBds, url: `/${loaiBdsSlug}` });
  }
  if (khuVuc !== 'toan-quoc') {
    breadcrumbs.push({ name: formattedKhuVuc, url: `/${fullSlug}` });
  }
  
  const popularLocations = [
    { name: 'Thành phố Vinh', slug: 'thanh-pho-vinh' },
    { name: 'Thị xã Cửa Lò', slug: 'thi-xa-cua-lo' },
    { name: 'Huyện Diễn Châu', slug: 'huyen-dien-chau' },
    { name: 'Huyện Hưng Nguyên', slug: 'huyen-hung-nguyen' },
    { name: 'Huyện Nghi Lộc', slug: 'huyen-nghi-loc' },
    { name: 'Thị xã Thái Hòa', slug: 'thi-xa-thai-hoa' },
    { name: 'Thị xã Hoàng Mai', slug: 'thi-xa-hoang-mai' },
    { name: 'Huyện Đô Lương', slug: 'huyen-do-luong' },
  ];

  const seoCategories = [
    { name: 'Đất nền', slug: 'dat-nen' },
    { name: 'Nhà riêng', slug: 'nha-rieng' },
    { name: 'Chung cư', slug: 'chung-cu' },
    { name: 'Dự án', slug: 'du-an' },
    { name: 'Mặt bằng, kho xưởng', slug: 'mat-bang-kho-xuong' },
    { name: 'BĐS Khác', slug: 'bds-khac' },
    { name: 'Cho thuê', slug: 'cho-thue' },
  ];

  const isGlobalCategoryPage = loaiBds !== 'tat-ca' && khuVuc === 'toan-quoc';
  const isLocationPage = loaiBds === 'tat-ca' && khuVuc !== 'toan-quoc';

  
  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="w-full max-w-[1600px] xl:px-8 mx-auto">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-textMain capitalize">
            {h1Text}
          </h1>
          <ShareButtons title={`Danh sách bất động sản: ${h1Text}`} />
        </div>

        <div className="mb-8">
          <SearchForm 
            initialCategory={
              loaiBds === 'dat-nen' ? 'DAT_NEN' :
              loaiBds === 'nha-rieng' ? 'NHA_RIENG' :
              loaiBds === 'chung-cu' ? 'CHUNG_CU' :
              loaiBds === 'mat-bang-kho-xuong' ? 'MAT_BANG' :
              loaiBds === 'du-an' ? 'DU_AN' :
              loaiBds === 'biet-thu' ? 'BIET_THU' :
              loaiBds === 'bds-khac' ? 'BDS_KHAC' : ''
            }
            initialDistrict={khuVuc !== 'toan-quoc' ? formattedKhuVuc : ''}
          />
        </div>
<div className="flex flex-col lg:flex-row gap-8">
          <div className="hidden lg:block lg:w-[320px] shrink-0">
            <SidebarFilter />
          </div>
          <div className="flex-1 min-w-0">
        {!data ? (
          <div className="bg-white rounded-2xl p-8 shadow-card text-center text-gray-500">
            <p>Hệ thống đang đồng bộ dữ liệu bài đăng cho chuyên mục <strong>{fullSlug}</strong>...</p>
          </div>
        ) : (
          <div className="space-y-12">
            
            



            {/* VIP Tier */}
            {data.vips && data.vips.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
                  <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600">
                    Bất động sản VIP nổi bật
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-6">
                  {data.vips.map((item: any) => (
                    <PropertyCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            <div className="my-8">
              <GoogleAdPlaceholder />
            </div>

            {/* NORMAL Tier */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                <h2 className="text-xl font-bold text-gray-800">Tin Cập Nhật Mới Nhất</h2>
                <SearchControls />
              </div>
              <div className="mb-6 lg:hidden w-full">
                <MobileFilterButton />
              </div>
              {data.normals && data.normals.filter((item: any) => !data.vips?.some((vip: any) => vip.id === item.id)).length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-6">
                    {data.normals.filter((item: any) => !data.vips?.some((vip: any) => vip.id === item.id)).map((item: any) => (
                      <PropertyCard key={item.id} item={item} />
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="mt-10 flex justify-center gap-2">
                    {page > 1 && (
                      <Link href={`/${fullSlug}?${new URLSearchParams({...resolvedSearchParams as Record<string, string>, page: (page - 1).toString()}).toString()}`} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                        Trang trước
                      </Link>
                    )}
                    <span className="px-4 py-2 bg-primary text-white rounded-lg">Trang {page}</span>
                    {data.normals.length === data.limit && (
                      <Link href={`/${fullSlug}?${new URLSearchParams({...resolvedSearchParams as Record<string, string>, page: (page + 1).toString()}).toString()}`} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                        Trang sau
                      </Link>
                    )}
                  </div>
                  
                  {/* Promote Banner - Bottom */}
                  <div className="bg-gradient-to-r from-primary-dark via-primary to-primary-light rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between text-white shadow-lg animate-fade-in relative overflow-hidden mt-12">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                    <div className="relative z-10 mb-6 md:mb-0 text-center md:text-left">
                      <h3 className="text-2xl font-bold mb-2">Bạn muốn đăng tin giống vậy?</h3>
                      <p className="text-white/80">Tiếp cận hàng triệu khách hàng tiềm năng ngay hôm nay.</p>
                    </div>
                    <Link href="/post" className="relative z-10 px-8 py-3 bg-accent text-white font-bold rounded-xl shadow-md hover:bg-accent-light transition-colors whitespace-nowrap">
                      Đăng tin ngay
                    </Link>
                  </div>
                </>
              ) : (
                data.normals && data.normals.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 shadow-card text-center text-gray-500">
                    <p className="mb-4">Chưa có bài đăng nào.</p>
                  </div>
                ) : (
                  <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-500">Chưa có tin thường nào.</p>
                  </div>
                )
              )}
            </section>

          {/* SEO 2-tier block */}
          <div className="mt-12 bg-white rounded-2xl p-6 md:p-8 shadow-card border border-gray-100">
            <h2 className="text-xl md:text-2xl font-bold text-textMain mb-4">
              {h1Text}
            </h2>
            <div className="prose prose-sm md:prose-base max-w-none text-gray-600">
              <p>
                Chào mừng bạn đến với trang danh sách <strong>{h1Text}</strong>. 
                Tại đây, chúng tôi cung cấp thông tin mới nhất và chính xác nhất về thị trường bất động sản. 
                Bạn có thể dễ dàng tìm kiếm, so sánh và lựa chọn những bất động sản phù hợp với nhu cầu của mình.
              </p>
              <p>
                Hệ thống được cập nhật liên tục hàng ngày, đảm bảo mang đến những tin đăng chất lượng, 
                đã qua kiểm duyệt, giúp quá trình giao dịch diễn ra an toàn, nhanh chóng và thuận lợi nhất.
              </p>
            </div>
          </div>
          
          {/* Adsense Below Pagination */}
          <div className="mt-8">
            <Adsense className="max-w-4xl mx-auto" />
          </div>

          {/* SEO 2-tier Internal Links */}
          {(isGlobalCategoryPage || isLocationPage) && (
            <div className="mt-8 bg-white rounded-2xl p-6 shadow-card border border-gray-100">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">
                {isGlobalCategoryPage 
                  ? `${formattedLoaiBds} theo khu vực` 
                  : `Bất động sản ${formattedKhuVuc} theo loại`}
              </h2>
              <div className="flex flex-wrap gap-2">
                {isGlobalCategoryPage && popularLocations.map(loc => (
                  <Link 
                    key={loc.slug} 
                    href={`/${loaiBds}/${loc.slug}`}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-primary hover:text-white hover:border-primary transition-colors"
                  >
                    {formattedLoaiBds} {loc.name}
                  </Link>
                ))}
                
                {isLocationPage && seoCategories.map(cat => (
                  <Link 
                    key={cat.slug} 
                    href={`/${cat.slug}/${khuVuc}`}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-primary hover:text-white hover:border-primary transition-colors"
                  >
                    {cat.name} {formattedKhuVuc}
                  </Link>
                ))}
              </div>
            </div>
          )}

          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
