import React from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
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
import JsonLd from '@/components/JsonLd';
import { buildBreadcrumbList } from '@/lib/seo/schema';
import type { BreadcrumbItem } from '@/lib/seo/schema';
import { siteConfig } from '@/lib/site-config';
import { getLocationDictionary, formatSegmentPath } from '@/lib/seo/locations';
import type { LocationDictionary } from '@/lib/seo/locations';
import { PROPERTY_TYPES, propertyTypeBySlug } from '@/lib/seo/taxonomy';
import { parseListingPath } from '@/lib/seo/route';
import type { ListingRoute } from '@/lib/seo/route';
import { parseListingQuery, buildListingUrl, totalPages, listingPath, LISTING_PAGE_SIZE } from '@/lib/seo/canonical';
import { decideIndexability, applyMode, getSeoMode } from '@/lib/seo/indexability';
import { getRouteFacts } from '@/lib/seo/facts';
import { siteLayout } from '@/lib/site-layout';
import WardJumpSelects, { type WardSelectGroup } from '@/components/WardJumpSelects';

export const dynamic = 'force-dynamic';

/**
 * Sinh title/H1/description cho trang danh mục.
 *
 * Thay cho `formatSlugToName` cũ — một từ điển hard-code 35 dòng chỉ phủ Nghệ An/Hà Tĩnh,
 * và với khu vực không có trong từ điển thì viết hoa thô nên ra "phường Truong Vinh",
 * còn description thì nối cứng ", Nghệ An". Tên có dấu giờ tra từ `/locations/segments`.
 *
 * Đồng thời sửa lỗi `isRent = false` hard-code: `cho-thue` vốn nằm trong danh sách
 * danh mục nên mọi URL /cho-thue/* đều ra title "Bán cho thuê ..." trên ~800 URL sitemap.
 */
function getListingCopy(route: ListingRoute, dict: LocationDictionary) {
  const provinceName = siteConfig.province.name;

  // `cho-thue` giờ là đoạn giao dịch chứ không phải danh mục, nên không còn cảnh
  // `isRent = false` gán cứng sinh title "Bán cho thuê ..." trên ~800 URL sitemap.
  const action = route.transaction === 'cho-thue' ? 'cho thuê' : 'bán';

  const typeLabel = propertyTypeBySlug(route.propertyTypeSlug)?.label ?? '';
  const locationName = route.locationSlug ? (dict[route.locationSlug]?.name ?? null) : null;

  const coreCat = typeLabel ? `${action} ${typeLabel.toLowerCase()}` : `nhà đất ${action}`;
  const titleCore = coreCat.charAt(0).toUpperCase() + coreCat.slice(1);

  const place = locationName ?? provinceName;
  const h1Text = `${titleCore} ${place}`;
  // KHÔNG nối tên site ở đây: `layout.tsx` đã đặt template `%s | {tên site}` nên nối
  // thêm sẽ ra "Bán đất nền Nghệ An | Nhà Đất Xứ Nghệ | Nhà Đất Xứ Nghệ" trên MỌI
  // trang danh mục — đúng lỗi lặp thương hiệu ở mục II.3 của khách.
  const title = h1Text;

  // Chỉ thêm tên tỉnh khi khu vực chưa tự chứa nó, tránh "Cầu Giấy, Hà Nội, Hà Nội".
  const descPlace = place.toLowerCase().includes(provinceName.toLowerCase())
    ? place
    : `${place}, ${provinceName}`;
  const description = `Cập nhật tin ${coreCat} ${descPlace}. Xem giá, diện tích, vị trí, pháp lý và thông tin liên hệ người đăng tin.`;

  return { h1Text, title, description, typeLabel, locationName, place };
}

type PageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Chạy trọn lớp quyết định SEO cho một request.
 *
 * generateMetadata và thân trang cùng gọi hàm này; phần parse là thuần còn phần fetch
 * đã bọc React cache(), nên gọi hai lần không phát sinh round-trip thứ hai.
 */
async function resolveListingPage(
  slugParts: string[],
  rawSearchParams: Record<string, string | string[] | undefined>,
) {
  const parse = parseListingPath(slugParts);
  const query = parseListingQuery(rawSearchParams);
  const dict = await getLocationDictionary();

  if (parse.kind !== 'listing') {
    const decision = applyMode(
      decideIndexability({ parse, query, facts: { location: null, total: 0 } }),
      getSeoMode(),
    );
    return { parse, query, dict, route: null, facts: null, data: null, decision };
  }

  const mode = getSeoMode();
  const { facts, data } = await getRouteFacts(parse.route, query, dict);
  // Bảng tĩnh trong next.config.mjs lo được /{loại} và /{loại}/{khu-vực}. Riêng dạng
  // một đoạn /{khu-vực} thì phải biết đoạn đó CÓ PHẢI khu vực không — cần tra CSDL,
  // nên xử lý ở đây.
  const decision = applyMode(
    decideIndexability({ parse, query, facts, redirectLegacyShape: mode === 'enforce' }),
    mode,
  );

  return { parse, query, dict, route: parse.route, facts, data, decision };
}


export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slugParts = Array.isArray(resolvedParams.slug) ? resolvedParams.slug : [];
  const { route, query, dict, decision } = await resolveListingPage(slugParts, await searchParams);

  if (!route) {
    return { title: 'Không tìm thấy trang', robots: { index: false, follow: true } };
  }

  const { title, description } = getListingCopy(route, dict);

  // Trang có bộ lọc trỏ canonical về URL không lọc; trang thường tự trỏ (giữ cả số trang).
  const canonical = query.hasFilters
    ? route.currentPath
    : buildListingUrl(route.currentPath, query.page, {});

  return {
    title,
    description,
    // Một chỗ duy nhất quyết định index/noindex, dùng chung với thân trang và sitemap.
    ...(decision.action === 'index' ? {} : { robots: { index: false, follow: true } }),
    alternates: { canonical },
    openGraph: { title, description, type: 'website' },
  };
}


// Category/Location SEO Landing Pages
export default async function CategoryLandingPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slugParts = Array.isArray(resolvedParams.slug) ? resolvedParams.slug : [];

  const { route, query, dict, data, decision } = await resolveListingPage(slugParts, resolvedSearchParams);

  // Thi hành quyết định. Ở chế độ report (mặc định), applyMode đã hạ notFound/redirect
  // xuống noindex nên hai nhánh dưới không chạy — deploy an toàn, quan sát log trước.
  if (decision.action === 'notFound') notFound();
  if (decision.action === 'redirect') permanentRedirect(decision.to);
  if (!route) notFound();

  const { h1Text, typeLabel, locationName } = getListingCopy(route, dict);
  const page = query.page;
  const pageCount = totalPages(data?.total ?? 0);

  // Breadcrumb: phần tử cuối là trang hiện tại nên không gắn url.
  const breadcrumbs: BreadcrumbItem[] = [];
  if (typeLabel) {
    breadcrumbs.push({
      name: typeLabel,
      url: route.locationSlug ? `/${route.propertyTypeSlug}` : undefined,
    });
  }
  if (locationName) {
    breadcrumbs.push({ name: locationName });
  }

  const loaiBds = route.propertyTypeSlug ?? 'tat-ca';
  const loaiBdsSlug = loaiBds;
  const khuVuc = route.locationSlug ?? 'toan-quoc';
  const fullSlug = slugParts.join('/');
  const formattedLoaiBds = typeLabel;
  const formattedKhuVuc = locationName ?? siteConfig.province.name;
  
  // Danh sách quận/huyện lấy từ chính từ điển khu vực thay vì mảng cứng 8 huyện Nghệ An.
  // Chỉ lấy cấp DISTRICT, giới hạn 12 mục để khối link nội bộ không phình ra.
  const popularLocations = Object.entries(dict)
    .filter(([, info]) => info.type === 'DISTRICT')
    .slice(0, 12)
    .map(([segment, info]) => ({ name: info.name, slug: segment }));

  const seoCategories = PROPERTY_TYPES.map((t) => ({ name: t.label, slug: t.slug }));

  const isGlobalCategoryPage = loaiBds !== 'tat-ca' && khuVuc === 'toan-quoc';
  const isLocationPage = loaiBds === 'tat-ca' && khuVuc !== 'toan-quoc';

  // 2 dropdown "Xem tin theo xã/phường mới/cũ" (mục 25.5b PHẦN II) — GATE KÉP: vừa cờ
  // layout vừa dữ liệu (đoạn URL đang xem đúng là DISTRICT). Không được suy thuần từ
  // dữ liệu: TP Vinh (Nghệ An) cũng là DISTRICT và cũng có WARD+OLD_WARD con (33 xã cũ
  // đã import) — bỏ cờ thì Nghệ An tự mọc thêm dropdown, phá luật "PHẦN II chỉ Hà Nội".
  let wardSelectGroups: WardSelectGroup[] = [];
  if (siteLayout() === 'grouped' && route.locationSlug) {
    const currentInfo = dict[route.locationSlug];
    // Đang xem 1 quận/huyện thì chính nó là cha cần lọc; đang xem 1 phường/xã thì cha
    // là `.parent` — giữ được ngữ cảnh (dropdown hiện đúng phường đang chọn) khi người
    // dùng đã nhảy sâu vào 1 phường/xã cụ thể.
    const districtSlug =
      currentInfo?.type === 'DISTRICT'
        ? route.locationSlug
        : currentInfo?.type === 'WARD' || currentInfo?.type === 'OLD_WARD'
          ? currentInfo.parent
          : undefined;

    if (districtSlug) {
      const buildOptions = (type: 'WARD' | 'OLD_WARD') =>
        Object.entries(dict)
          .filter(([, info]) => info.parent === districtSlug && info.type === type)
          .map(([segment, info]) => ({
            label: info.name,
            href: listingPath({ transaction: route.transaction, propertyTypeSlug: route.propertyTypeSlug, locationSlug: segment }),
          }));

      const currentHref = (type: 'WARD' | 'OLD_WARD') =>
        currentInfo?.type === type
          ? listingPath({ transaction: route.transaction, propertyTypeSlug: route.propertyTypeSlug, locationSlug: route.locationSlug! })
          : '';

      wardSelectGroups = [
        { label: 'Xem tin theo xã/phường mới:', value: currentHref('WARD'), options: buildOptions('WARD') },
        { label: 'Xem tin theo xã/phường cũ:', value: currentHref('OLD_WARD'), options: buildOptions('OLD_WARD') },
      ];
    }
  }


  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="w-full max-w-[1600px] xl:px-8 mx-auto">
        {breadcrumbs.length > 0 && (
          <>
            <JsonLd
              graph={[
                buildBreadcrumbList(
                  breadcrumbs,
                  siteConfig.absolute(`/${slugParts.join('/')}#breadcrumb`),
                ),
              ]}
            />
            <Breadcrumb items={breadcrumbs} />
          </>
        )}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-textMain capitalize">
            {h1Text}
          </h1>
          <ShareButtons title={`Danh sách bất động sản: ${h1Text}`} />
        </div>

        <WardJumpSelects selects={wardSelectGroups} />

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
        {/* Khách yêu cầu bộ lọc mobile nằm ngay dưới ô tìm kiếm — trước đây đặt sau
            khối VIP + banner quảng cáo bên dưới. */}
        <div className="mb-6 lg:hidden w-full">
          <MobileFilterButton />
        </div>
<div className="flex flex-col lg:flex-row gap-8">
          <div className="hidden lg:block lg:w-[320px] shrink-0">
            <SidebarFilter />
          </div>
          <div className="flex-1 min-w-0">
        {!data ? (
          <div className="bg-white rounded-2xl p-8 shadow-card text-center text-gray-500">
            {/* Trước đây dội nguyên slug người dùng gõ vào HTML — với URL rác thì đó là
                nội dung do người lạ điều khiển, lại nằm trên trang index được. */}
            <p>Không tải được danh sách tin. Vui lòng thử lại.</p>
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
                <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
              {data.normals && data.normals.filter((item: any) => !data.vips?.some((vip: any) => vip.id === item.id)).length > 0 ? (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {data.normals.filter((item: any) => !data.vips?.some((vip: any) => vip.id === item.id)).map((item: any) => (
                      <PropertyCard key={item.id} item={item} />
                    ))}
                  </div>

                  {/*
                    Phân trang.
                    - Trước đây "còn trang sau" đoán bằng `normals.length === limit`, nên
                      trang cuối vừa đầy vẫn hiện nút "Trang sau" dẫn tới trang rỗng.
                      Nay dùng tổng số trang thật (backend đã luôn trả `total`).
                    - Link trước đây trải nguyên `...resolvedSearchParams` nên mọi tham số
                      rác được nhân bản sang từng trang. buildListingUrl chỉ phát tham số
                      trong danh sách trắng.
                  */}
                  {pageCount > 1 && (
                    <>
                      {/* Next Metadata API không có trường prev/next — phát thẻ link thô,
                          Next sẽ nâng chúng lên <head>. */}
                      {page > 1 && (
                        <link rel="prev" href={buildListingUrl(route.currentPath, page - 1, query.filters)} />
                      )}
                      {page < pageCount && (
                        <link rel="next" href={buildListingUrl(route.currentPath, page + 1, query.filters)} />
                      )}
                      <div className="mt-10 flex justify-center gap-2">
                        {page > 1 && (
                          <Link href={buildListingUrl(route.currentPath, page - 1, query.filters)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                            Trang trước
                          </Link>
                        )}
                        <span className="px-4 py-2 bg-primary text-white rounded-lg">
                          Trang {page} / {pageCount}
                        </span>
                        {page < pageCount && (
                          <Link href={buildListingUrl(route.currentPath, page + 1, query.filters)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                            Trang sau
                          </Link>
                        )}
                      </div>
                    </>
                  )}
                  
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
                  <div className="bg-white rounded-2xl p-8 shadow-card text-center">
                    {/* Khách yêu cầu: đổi "Chưa có bài đăng nào" thành "không có kết quả
                        tìm kiếm phù hợp", bỏ tiêu đề/mô tả, thêm gợi ý về trang chủ và
                        gợi ý dùng bộ lọc. */}
                    <p className="text-gray-600 mb-5">Không có kết quả tìm kiếm phù hợp.</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Link href="/" className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors">
                        Về trang chủ
                      </Link>
                      <Link href="/search" className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                        Mở bộ lọc tìm kiếm
                      </Link>
                    </div>
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
                    href={listingPath({ transaction: route.transaction, propertyTypeSlug: route.propertyTypeSlug, locationSlug: loc.slug })}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-primary hover:text-white hover:border-primary transition-colors"
                  >
                    {formattedLoaiBds} {loc.name}
                  </Link>
                ))}
                
                {isLocationPage && seoCategories.map(cat => (
                  <Link 
                    key={cat.slug} 
                    href={listingPath({ transaction: route.transaction, propertyTypeSlug: cat.slug, locationSlug: route.locationSlug })}
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
