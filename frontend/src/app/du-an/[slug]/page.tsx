import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { serverApiUrl } from '@/lib/server-api';
import { siteConfig } from '@/lib/site-config';
import { toMediaUrl } from '@/lib/media';
import { parseListingRef, buildListingUrl, totalPages } from '@/lib/seo/canonical';
import PropertyCard from '@/components/PropertyCard';
import JsonLd from '@/components/JsonLd';
import Breadcrumb from '@/components/Breadcrumb';
import { buildBreadcrumbList } from '@/lib/seo/schema';
import type { BreadcrumbItem } from '@/lib/seo/schema';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * `/du-an/{slug}-{shortCode}`. `shortCode` là đủ để tra ra dự án (unique toàn cục,
 * xem `ProjectService.findByShortCode`), `slug` chỉ để URL đẹp — cùng nguyên tắc với
 * `/tin/{slug}-{shortCode}`.
 */
async function getProjectDetail(slugParam: string, page: number) {
  const { ref } = parseListingRef(slugParam ?? '');
  if (!ref) return null;

  try {
    const res = await fetch(
      serverApiUrl(`/projects/by-code/${encodeURIComponent(ref)}?page=${page}&limit=20`),
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.project ? data : null;
  } catch {
    return null;
  }
}

function getPage(searchParams: { [key: string]: string | string[] | undefined }) {
  const raw = searchParams.page;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const page = value ? Number(value) : 1;
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const page = getPage(resolvedSearchParams);
  const data = await getProjectDetail(resolvedParams.slug, page);

  if (!data) {
    return { title: 'Không tìm thấy dự án', robots: { index: false, follow: true } };
  }

  const { project, total } = data;
  const canonical = `/du-an/${project.slug}-${project.shortCode}`;
  const description = stripHtml(String(project.description || '')).slice(0, 155) ||
    `Thông tin dự án ${project.name} và các tin đăng liên quan.`;
  const image = project.thumbnail ? toMediaUrl(project.thumbnail) : undefined;

  return {
    title: project.name,
    description,
    // Dự án chưa có tin nào -> noindex,follow (đúng luật "trang danh mục rỗng" đã áp
    // dụng cho mọi landing page khác trong site, xem indexability.ts).
    ...((total ?? 0) === 0 ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical },
    openGraph: {
      title: project.name,
      description,
      url: canonical,
      type: 'website',
      images: image ? [{ url: image, alt: project.name }] : undefined,
    },
  };
}

export default async function ProjectDetailPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const page = getPage(resolvedSearchParams);
  const data = await getProjectDetail(resolvedParams.slug, page);

  if (!data) {
    // Không khớp dự án nào -- gồm cả 5 URL cũ (/du-an/phuong-vinh-phu, /du-an/nghe-an,
    // ...) từng là trang danh mục lọc propertyType=DU_AN theo khu vực. Chấp nhận mất
    // khả năng lọc đó (tính năng phụ, lưu lượng thấp) để đổi lấy trang danh mục Dự án.
    permanentRedirect('/du-an');
  }

  const { project, normals = [], vips = [], total = 0 } = data;
  const currentPath = `/du-an/${project.slug}-${project.shortCode}`;
  const canonical = siteConfig.absolute(currentPath);
  const pageCount = totalPages(total);
  const properties = [...vips, ...normals.filter((p: any) => !vips.some((v: any) => v.id === p.id))];

  const breadcrumbItems: BreadcrumbItem[] = [
    { name: 'Dự án', url: '/du-an' },
    { name: project.name },
  ];

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-[1600px] mx-auto">
        <JsonLd graph={[buildBreadcrumbList(breadcrumbItems, `${canonical}#breadcrumb`)]} />
        <Breadcrumb items={breadcrumbItems} />

        <div className="bg-white rounded-2xl shadow-card border border-borderLight/50 overflow-hidden mb-8 mt-4">
          {project.thumbnail && (
            <div className="relative w-full h-[220px] md:h-[320px] bg-gray-100">
              <Image src={toMediaUrl(project.thumbnail)} alt={project.name} fill className="object-cover" priority />
            </div>
          )}
          <div className="p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-extrabold text-textMain mb-2">{project.name}</h1>
            <p className="text-textSecondary mb-4">
              {[project.ward, project.district, project.city].filter(Boolean).join(', ') || 'Đang cập nhật địa điểm'}
            </p>
            {project.description && (
              <div
                className="prose prose-sm md:prose-base max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: project.description }}
              />
            )}
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Tin đăng thuộc dự án</h2>
            <span className="text-sm text-textSecondary">{total} tin</span>
          </div>

          {properties.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-card text-center text-gray-500">
              Chưa có tin đăng nào thuộc dự án này.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {properties.map((item: any) => (
                  <PropertyCard key={item.id} item={item} />
                ))}
              </div>

              {pageCount > 1 && (
                <>
                  {page > 1 && (
                    <link rel="prev" href={buildListingUrl(currentPath, page - 1, {})} />
                  )}
                  {page < pageCount && (
                    <link rel="next" href={buildListingUrl(currentPath, page + 1, {})} />
                  )}
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
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
