import Link from 'next/link';
import Image from 'next/image';
import { Building2 } from 'lucide-react';
import { toMediaUrl } from '@/lib/media';

/**
 * Khối "Dự án nổi bật" dạng grid ảnh (bố cục `classic`, mục 11 PHẦN I) — tách nguyên
 * JSX từ `page.tsx` ra component riêng, KHÔNG đổi class/markup nào, để bố cục Nghệ An
 * giữ đúng từng pixel. Trước đây `page.tsx` tự fetch `/projects/homepage?limit=4`
 * riêng; giờ dữ liệu này nằm trong `sections` của `/properties/homepage`, bớt một lượt
 * fetch SSR mỗi lần tải trang chủ.
 */
export default function ProjectGrid({
  title,
  href,
  projects,
}: {
  title: string;
  href: string;
  projects: any[];
}) {
  if (!projects || projects.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <Link href={href} className="text-sm font-semibold text-primary hover:underline whitespace-nowrap">
          Xem toàn bộ
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {projects.map((project: any) => (
          <Link
            key={project.id}
            href={`/du-an/${project.slug}-${project.shortCode}`}
            className="group bg-white rounded-2xl overflow-hidden border border-borderLight shadow-sm card-lift"
          >
            <div className="relative aspect-[4/3] bg-gray-100">
              {project.thumbnail ? (
                <Image
                  src={toMediaUrl(project.thumbnail)}
                  alt={project.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-gray-300">
                  <Building2 className="w-10 h-10" />
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="text-sm font-bold text-textMain group-hover:text-primary transition-colors line-clamp-2">
                {project.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
