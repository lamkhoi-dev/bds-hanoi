import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { serverApiUrl } from '@/lib/server-api';
import { siteConfig } from '@/lib/site-config';
import { buildListingUrl, totalPages, LISTING_PAGE_SIZE } from '@/lib/seo/canonical';
import PropertyCard from '@/components/PropertyCard';
import JsonLd from '@/components/JsonLd';
import Breadcrumb from '@/components/Breadcrumb';
import { buildBreadcrumbList } from '@/lib/seo/schema';
import type { BreadcrumbItem } from '@/lib/seo/schema';

/**
 * Trang đích của tab "Khu vực hot" trên trang chủ.
 *
 * Khách bắt lỗi 27/9: bấm tab "Hồ Tây" ra trang tìm kiếm chung (`/search?q=`) — trang đó
 * khớp MỜ (Meilisearch tách từ, đồng nghĩa, bỏ qua lỗi chính tả) nên lẫn cả tin không có
 * cụm "Hồ Tây". Khu vực hot phải khớp đúng nguyên cụm từ, nên có route riêng gọi API
 * `/properties/hot-area/:slug` — dùng CHUNG mệnh đề `hotAreaMatch` với tab trang chủ.
 */
type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function getPage(searchParams: { [key: string]: string | string[] | undefined }) {
  const raw = searchParams.page;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const page = value ? Number(value) : 1;
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

async function getHotArea(slug: string, page: number) {
  try {
    const res = await fetch(
      serverApiUrl(`/properties/hot-area/${encodeURIComponent(slug)}?page=${page}&limit=${LISTING_PAGE_SIZE}`),
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getPage(await searchParams);
  const data = await getHotArea(slug, page);
  if (!data?.area) {
    return { title: 'Không tìm thấy khu vực', robots: { index: false, follow: true } };
  }

  const name: string = data.area.name;
  const title = `Bất động sản ${name}`;
  const description = `Tin bán, cho thuê nhà đất tại ${name} mới nhất, chính chủ, thông tin minh bạch, cập nhật liên tục.`;
  const canonical = `/khu-vuc-hot/${data.area.slug}`;

  return {
    title,
    description,
    // Khu vực chưa có tin thì noindex (cùng luật "trang danh mục rỗng" của các landing khác).
    ...((data.total ?? 0) === 0 ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
  };
}

export default async function HotAreaPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const page = getPage(await searchParams);
  const data = await getHotArea(slug, page);
  if (!data?.area) notFound();

  const { area, items = [], total = 0 } = data as { area: { name: string; slug: string }; items: any[]; total: number };
  const currentPath = `/khu-vuc-hot/${area.slug}`;
  const pageCount = totalPages(total);

  const breadcrumbItems: BreadcrumbItem[] = [{ name: 'Khu vực hot' }, { name: area.name }];

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-[1600px] mx-auto">
        <JsonLd graph={[buildBreadcrumbList(breadcrumbItems, `${siteConfig.absolute(currentPath)}#breadcrumb`)]} />
        <Breadcrumb items={breadcrumbItems} />

        <div className="mt-4 mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-textMain mb-2">Bất động sản {area.name}</h1>
          <p className="text-textSecondary text-sm md:text-base">
            {total > 0
              ? `${total} tin đăng có nhắc đúng cụm “${area.name}” trong tiêu đề hoặc mô tả, mới nhất trước.`
              : `Chưa có tin đăng nào nhắc đến “${area.name}”.`}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-card text-center text-gray-500">
            Chưa có tin đăng nào ở khu vực này.{' '}
            <Link href="/" className="text-primary font-medium hover:underline">Về trang chủ</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item: any) => (
                <PropertyCard key={item.id} item={item} />
              ))}
            </div>

            {pageCount > 1 && (
              <div className="mt-10 flex justify-center gap-2">
                {page > 1 && (
                  <Link href={buildListingUrl(currentPath, page - 1, {})} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                    Trang trước
                  </Link>
                )}
                <span className="px-4 py-2 bg-primary text-white rounded-lg">
                  Trang {page} / {pageCount}
                </span>
                {page < pageCount && (
                  <Link href={buildListingUrl(currentPath, page + 1, {})} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                    Trang sau
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
