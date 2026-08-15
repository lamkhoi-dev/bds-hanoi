import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { serverApiUrl } from '@/lib/server-api';
import { siteConfig } from '@/lib/site-config';
import { toMediaUrl } from '@/lib/media';
import JsonLd from '@/components/JsonLd';
import Breadcrumb from '@/components/Breadcrumb';
import { buildBreadcrumbList } from '@/lib/seo/schema';
import type { BreadcrumbItem } from '@/lib/seo/schema';

export const revalidate = 300;

async function getProjects(): Promise<any[]> {
  try {
    const res = await fetch(serverApiUrl('/projects'), { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const projects = await getProjects();
  const title = `Danh sách Dự án bất động sản ${siteConfig.province.name}`;
  const description = `Tổng hợp các dự án bất động sản tại ${siteConfig.province.name}: vị trí, mô tả và các tin đăng thuộc từng dự án.`;

  return {
    title,
    description,
    // Chưa có dự án nào -> noindex,follow, giữ crawl được để tự lật lại thành index khi
    // có dự án đầu tiên. Cùng luật với trang danh mục rỗng (xem indexability.ts).
    ...(projects.length === 0 ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical: '/du-an' },
    openGraph: { title, description, type: 'website' },
  };
}

export default async function ProjectListPage() {
  const projects = await getProjects();
  const breadcrumbItems: BreadcrumbItem[] = [{ name: 'Dự án' }];

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-[1600px] mx-auto">
        <JsonLd graph={[buildBreadcrumbList(breadcrumbItems, siteConfig.absolute('/du-an#breadcrumb'))]} />
        <Breadcrumb items={breadcrumbItems} />

        <div className="mb-8 mt-4 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-3">Dự án Bất Động Sản</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Tổng hợp các dự án bất động sản tại {siteConfig.province.name}. Chọn một dự án để xem toàn bộ tin đăng thuộc dự án đó.
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-card text-center text-gray-500">
            Chưa có dự án nào được công bố.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: any) => (
              <Link
                key={project.id}
                href={`/du-an/${project.slug}-${project.shortCode}`}
                className="group bg-white rounded-2xl overflow-hidden border border-borderLight shadow-sm card-lift"
              >
                <div className="relative aspect-[16/10] bg-gray-100">
                  {project.thumbnail ? (
                    <Image
                      src={toMediaUrl(project.thumbnail)}
                      alt={project.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-gray-300">
                      <img width={64} height={64} src="/logo/logo-icon.svg" alt="" className="w-16 h-16 opacity-30" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-bold text-textMain group-hover:text-primary transition-colors line-clamp-2">
                    {project.name}
                  </h2>
                  <p className="text-sm text-textSecondary mt-2 line-clamp-1">
                    {[project.ward, project.district, project.city].filter(Boolean).join(', ') || 'Đang cập nhật địa điểm'}
                  </p>
                  <p className="text-xs text-textLight mt-3">{project._count?.properties ?? 0} tin đăng</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
