import PropertyBlock from '@/components/PropertyBlock';
import PropertyTabs from '@/components/PropertyTabs';
import ProjectGrid from '@/components/ProjectGrid';
import GoogleAdPlaceholder from '@/components/GoogleAdPlaceholder';

/**
 * Render MỘT khối trên trang chủ theo `kind` mà backend gắn — xem
 * `backend/src/property/homepage-layout.ts`. Backend quyết thứ tự + nội dung khối
 * (mảng `sections[]`), frontend chỉ biết cách vẽ từng `kind`, không biết site nào đang
 * chạy layout nào.
 *
 * `default: return null` không phải phòng thủ hình thức: nó cho phép backend thêm
 * `kind` mới về sau mà một bản frontend cũ hơn không trắng cả trang chủ.
 */
export default function HomepageSection({ section }: { section: any }) {
  switch (section.kind) {
    case 'block':
      return <PropertyBlock title={section.title} items={section.items} moreLink={section.href} />;

    case 'tabs':
      return (
        <PropertyTabs
          title={section.title}
          tabs={section.tabs.map((t: any) => ({
            id: t.key,
            label: t.title,
            items: t.items,
            href: t.href,
            asLink: t.asLink,
          }))}
        />
      );

    case 'ad':
      return (
        <div className="w-full mb-8">
          <GoogleAdPlaceholder />
        </div>
      );

    case 'project-grid':
      return <ProjectGrid title={section.title} href={section.href} projects={section.projects} />;

    default:
      return null;
  }
}
