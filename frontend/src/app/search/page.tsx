import Link from 'next/link';
import { propertyTypeByEnum, propertyTypeLabel } from '@/lib/seo/taxonomy';
import { Star } from 'lucide-react';
import SearchForm from '@/components/SearchForm';
import { serverApiUrl } from '@/lib/server-api';
import ExploreMoreContextual from '@/components/ExploreMoreContextual';
import PropertyCard from '@/components/PropertyCard';
import SearchControls from '@/components/SearchControls';
import MobileFilterButton from '@/components/MobileFilterButton';
import SidebarFilter from '@/components/SidebarFilter';
import GoogleAdPlaceholder from '@/components/GoogleAdPlaceholder';
import { Metadata } from 'next';
import { PRICE_RANGES_SELL, PRICE_RANGES_RENT, AREA_RANGES } from '@/constants/ranges';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type SearchParams = { [key: string]: string | string[] | undefined };
type PageProps = {
  searchParams: Promise<SearchParams>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toFlatParams(searchParams: SearchParams) {
  const flat: Record<string, string> = {};
  Object.entries(searchParams).forEach(([key, value]) => {
    const first = firstParam(value);
    if (first !== undefined) flat[key] = first;
  });
  return flat;
}

async function getSearchResults(searchParams: SearchParams) {
  try {
    const query = new URLSearchParams(toFlatParams(searchParams)).toString();
    const res = await fetch(serverApiUrl(`/properties/search?${query}`), { cache: 'no-store' });
    if (!res.ok) return { vips: [], ups: [], normals: [], total: 0 };
    return res.json();
  } catch {
    return { vips: [], ups: [], normals: [], total: 0 };
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


export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const q = firstParam(resolvedSearchParams.q) || '';
  const category = firstParam(resolvedSearchParams.propertyType) || firstParam(resolvedSearchParams.category) || '';
  const type = firstParam(resolvedSearchParams.transactionType) || firstParam(resolvedSearchParams.type) || '';
  
  // propertyTypeLabel đã có fallback 'Bất động sản' nên không cần chuỗi if.
  let catText = propertyTypeLabel(category);
  
  if (type === 'cho_thue' || type === 'CHO_THUE') catText = 'Cho thuê ' + catText.toLowerCase();
  else if (type === 'ban' || type === 'BAN') catText = 'Bán ' + catText.toLowerCase();

  const locText = q ? `tại ${q}` : '';
  const title = `${catText} ${locText} chính chủ, giá tốt nhất`;
  const description = `Danh sách ${catText.toLowerCase()} ${locText} mới nhất, cập nhật liên tục, thông tin minh bạch. Cung cấp nhiều lựa chọn với các mức giá phù hợp nhu cầu.`;

  return {
    title,
    description,
    // Trang tìm kiếm nội bộ sinh ra vô số tổ hợp tham số gần trùng nội dung — đúng
    // nhóm "Trang trùng lặp, chưa chọn trang chính tắc" đang chiếm 51 URL trong
    // Search Console. Cho phép crawl (follow) nhưng không index, và không đưa vào sitemap.
    robots: { index: false, follow: true },
    // Dù noindex vẫn khai canonical: Google có thể coi tham số lọc là URL riêng, và
    // canonical gom chúng về một đích thay vì để mỗi tổ hợp tự đứng một mình.
    alternates: { canonical: '/search' },
    openGraph: {
      title,
      description,
      type: 'website',
    }
  };
}

export default async function SearchPage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams = await searchParams;
  const flatSearchParams = toFlatParams(resolvedSearchParams);
  const q = flatSearchParams.q || '';
  const category = flatSearchParams.propertyType || flatSearchParams.category || '';
  const type = flatSearchParams.transactionType || flatSearchParams.type || '';

  const locations = await getLocations();

  const results = await getSearchResults(resolvedSearchParams);
  const vips: any[] = results.vips || [];
  const ups: any[] = results.ups || [];
  const normals: any[] = results.normals || [];
  const total = results.total || 0;
  const page = results.page ? parseInt(String(results.page), 10) : 1;
  const limit = results.limit || 20;
  const totalPages = Math.ceil(total / limit);
  const hasAnyResults = vips.length + ups.length + normals.length > 0;

  // SEO Description
  let seoDescription = '';
  let pageTitle = 'Kết quả tìm kiếm';
  if (category || type || q) {
    let catText = propertyTypeLabel(category);
    
    if (type === 'CHO_THUE' || type === 'cho_thue') catText = 'Cho thuê ' + catText.toLowerCase();
    else if (type === 'BAN' || type === 'ban') catText = 'Bán ' + catText.toLowerCase();

    const locText = q ? `tại ${q}` : '';
    seoDescription = `Danh sách ${catText} ${locText} mới nhất, cập nhật liên tục, thông tin minh bạch. ${catText} ${locText} giá rẻ, nhiều mức giá phù hợp với nhu cầu của bạn.`;
    pageTitle = `${catText} ${locText}`.trim();
  }

  // Filter Chips
  const activeFilters: Array<{label: string, key: string}> = [];
  const buildUrlWithout = (keyToRemove: string) => {
    const params = new URLSearchParams(flatSearchParams);
    params.delete(keyToRemove);
    params.delete('page');
    return `/search?${params.toString()}`;
  };

  const buildPageUrl = (newPage: number) => {
    const params = new URLSearchParams(flatSearchParams);
    params.set('page', newPage.toString());
    return `/search?${params.toString()}`;
  };

  if (q) activeFilters.push({ label: `Từ khóa: ${q}`, key: 'q' });
  if (category && category !== 'Tất cả danh mục' && category !== 'all') {
    // `CHO_THUE` lọt vào ô category ở dữ liệu cũ — không phải loại BĐS nên xử riêng.
    const catText = category === 'CHO_THUE' ? 'Cho thuê' : (propertyTypeByEnum(category)?.label ?? category);
    activeFilters.push({ label: `Loại BĐS: ${catText}`, key: 'category' });
  }
  if (flatSearchParams.transactionType && flatSearchParams.transactionType !== 'all') {
    const tx = flatSearchParams.transactionType;
    const label = tx === 'BAN' ? 'Bán' : tx === 'CHO_THUE' ? 'Cho thuê' : tx === 'CAN_MUA' ? 'Cần mua' : tx === 'CAN_THUE' ? 'Cần thuê' : tx;
    activeFilters.push({ label: `Hình thức: ${label}`, key: 'transactionType' });
  }

  // Support priceRangeKey and areaRangeKey from constants
  if (flatSearchParams.priceRangeKey) {
    const isRent = flatSearchParams.transactionType === 'CHO_THUE' || flatSearchParams.type === 'cho_thue';
    const ranges = isRent ? PRICE_RANGES_RENT : PRICE_RANGES_SELL;
    const range = ranges.find(r => r.key === flatSearchParams.priceRangeKey);
    activeFilters.push({ label: `Giá: ${range ? range.label : flatSearchParams.priceRangeKey}`, key: 'priceRangeKey' });
  }
  if (flatSearchParams.district) {
    activeFilters.push({ label: `Khu vực: ${flatSearchParams.district}`, key: 'district' });
  }
  if (flatSearchParams.areaRangeKey) {
    const range = AREA_RANGES.find(r => r.key === flatSearchParams.areaRangeKey);
    activeFilters.push({ label: `DT: ${range ? range.label : flatSearchParams.areaRangeKey}`, key: 'areaRangeKey' });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Search Header */}
      <div className="bg-gradient-to-r from-primary-dark via-primary to-primary-light py-10 relative">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-3xl font-extrabold text-white mb-6">{pageTitle}</h1>
          <SearchForm 
            initialQ={q} 
            initialCategory={category} 
            initialProvince={flatSearchParams.province} 
            initialDistrict={flatSearchParams.district} 
            initialArea={flatSearchParams.areaRangeKey}
          />
        </div>
      </div>

      {/* Results */}
      <div className="w-full max-w-[1600px] xl:px-8 mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* PC Sidebar Filter */}
          <div className="hidden lg:block lg:w-[320px] shrink-0">
            <SidebarFilter />
          </div>
          
          <div className="flex-1 min-w-0">
            {seoDescription && (
          <p className="text-sm text-gray-500 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm leading-relaxed">
            {seoDescription}
          </p>
        )}

        {/* Search Controls moved down */}

        {/* Filter Chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6 items-center">
            <span className="text-sm text-gray-500 font-medium">Đang lọc theo:</span>
            {activeFilters.map(filter => (
              <div key={filter.key} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium border border-primary/20">
                {filter.label}
                <Link href={buildUrlWithout(filter.key)} className="ml-1 hover:text-red-500 hover:bg-white rounded-full p-0.5 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </Link>
              </div>
            ))}
            <Link href="/search" className="text-sm text-gray-400 hover:text-red-500 underline ml-2 transition-colors">
              Xóa tất cả
            </Link>
          </div>
        )}
        
        {!hasAnyResults ? (
          <div className="text-center py-20 text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-100">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-lg font-bold text-gray-700 mb-2">Không tìm thấy bất động sản nào phù hợp.</p>
            <p className="mb-4">Vui lòng thử mở rộng khu vực tìm kiếm hoặc thay đổi mức giá, diện tích.</p>
            <div className="flex flex-col items-center gap-4">
              <Link href="/search" className="inline-block px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors">
                Xóa bộ lọc và thử lại
              </Link>
              <MobileFilterButton />
            </div>
          </div>
        ) : (
          <div className="space-y-10">

            {/* SearchControls removed from top */}

            {/* VIP Tier */}
            {vips.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
                  <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600">
                    Bất động sản VIP nổi bật
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {vips.map((item: any) => (
                    <PropertyCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            {/* NORMAL Tier */}
            {normals.filter((item: any) => !vips.some((vip: any) => vip.id === item.id)).length > 0 && (
              <section>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <h2 className="text-xl font-bold text-gray-800">Tin Cập Nhật Mới Nhất</h2>
                  <SearchControls />
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {normals.filter((item: any) => !vips.some((vip: any) => vip.id === item.id)).map((item: any) => (
                    <PropertyCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}


        <MobileFilterButton />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            {page > 1 ? (
              <Link href={buildPageUrl(page - 1)} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-primary transition-colors font-medium">
                Trang trước
              </Link>
            ) : (
              <button disabled className="px-4 py-2 border border-gray-100 rounded-lg text-gray-300 font-medium cursor-not-allowed">
                Trang trước
              </button>
            )}
            
            <div className="flex items-center gap-1 mx-2">
              <span className="text-sm text-gray-500">Trang <strong className="text-primary">{page}</strong> / {totalPages}</span>
            </div>

            {page < totalPages ? (
              <Link href={buildPageUrl(page + 1)} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-primary transition-colors font-medium">
                Trang sau
              </Link>
            ) : (
              <button disabled className="px-4 py-2 border border-gray-100 rounded-lg text-gray-300 font-medium cursor-not-allowed">
                Trang sau
              </button>
            )}
          </div>
        )}

        <ExploreMoreContextual 
          currentCategory={category} 
          transactionType={type} 
          ward={flatSearchParams.khuVuc || flatSearchParams.ward} 
          district={flatSearchParams.district} 
        />
          </div>
        </div>
      </div>
    </div>
  );
}
