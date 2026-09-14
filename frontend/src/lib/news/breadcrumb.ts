import type { BreadcrumbItem } from '@/lib/seo/schema';

/**
 * Trang chủ › Tin tức › [Chuyên mục] › Bài viết. "Trang chủ" KHÔNG có ở đây — cả
 * `<Breadcrumb>` lẫn `buildBreadcrumbList` đều tự thêm vào đầu (xem `Breadcrumb.tsx`).
 * Chuyên mục là tuỳ chọn — bài chưa gán chuyên mục thì bỏ qua cấp đó, không hiện "—" trống.
 */
export function newsBreadcrumb(news: { title: string; category?: { name: string; slug: string } | null }): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [{ name: 'Tin tức', url: '/news' }];
  if (news.category) {
    items.push({ name: news.category.name, url: `/news/chuyen-muc/${news.category.slug}` });
  }
  items.push({ name: news.title });
  return items;
}
