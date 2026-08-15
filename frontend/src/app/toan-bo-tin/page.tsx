import Link from 'next/link';
import { serverApiUrl } from '@/lib/server-api';
import PropertyCard from '@/components/PropertyCard';
import SearchControls from '@/components/SearchControls';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Toàn bộ tin đã đăng | Nhà Đất Xứ Nghệ',
  description: 'Danh sách toàn bộ tin tức bất động sản cập nhật mới nhất trên hệ thống Nhà Đất Xứ Nghệ.',
};

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

export default async function ToanBoTinPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const flatSearchParams = toFlatParams(resolvedSearchParams);
  
  const results = await getSearchResults(resolvedSearchParams);
  
  const { vips = [], ups = [], normals = [], total = 0 } = results;
  const page = flatSearchParams.page ? parseInt(flatSearchParams.page, 10) : 1;
  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const hasAnyResults = vips.length > 0 || ups.length > 0 || normals.length > 0;

  const buildPageUrl = (newPage: number) => {
    const params = new URLSearchParams(flatSearchParams);
    if (newPage > 1) {
      params.set('page', newPage.toString());
    } else {
      params.delete('page');
    }
    const query = params.toString();
    return `/toan-bo-tin${query ? `?${query}` : ''}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary-dark via-primary to-primary-light py-10 relative">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-3xl font-extrabold text-white mb-2">Toàn bộ tin đã đăng</h1>
          <p className="text-white/80">Cập nhật đầy đủ các bất động sản mới nhất trên hệ thống</p>
        </div>
      </div>

      <div className="w-full max-w-[1600px] xl:px-8 mx-auto px-4 py-10">
        {!hasAnyResults ? (
          <div className="text-center py-20 text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-100">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-lg font-bold text-gray-700 mb-2">Chưa có tin đăng nào.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {vips.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-amber-600 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    Tin nổi bật
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-6">
                  {vips.map((item: any) => (
                    <PropertyCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            {ups.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-blue-600">Tin chú ý</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-6">
                  {ups.map((item: any) => (
                    <PropertyCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}
            
            {normals.length > 0 && (
              <section>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                  <h3 className="text-lg font-bold text-gray-800">Tin cập nhật</h3>
                  <SearchControls />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-6">
                  {normals.map((item: any) => (
                    <PropertyCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

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
      </div>
    </div>
  );
}
