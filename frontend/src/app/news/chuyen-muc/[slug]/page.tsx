import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverApiUrl } from '@/lib/server-api';
import { siteConfig } from '@/lib/site-config';
import Breadcrumb from '@/components/Breadcrumb';
import JsonLd from '@/components/JsonLd';
import { buildBreadcrumbList } from '@/lib/seo/schema';
import NewsCard from '@/components/news/NewsCard';
import NewsPagination from '@/components/news/NewsPagination';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12;

async function getCategory(slug: string) {
  try {
    const res = await fetch(serverApiUrl(`/news-categories/${slug}`), { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getNews(slug: string, page: number) {
  try {
    const res = await fetch(serverApiUrl(`/news?category=${slug}&page=${page}&limit=${PAGE_SIZE}`), { next: { revalidate: 0 } });
    if (!res.ok) return { data: [], total: 0 };
    const json = await res.json();
    return { data: json.data || [], total: json.total || 0 };
  } catch {
    return { data: [], total: 0 };
  }
}

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ slug }, { page: pageParam }] = await Promise.all([params, searchParams]);
  const category = await getCategory(slug);
  if (!category) return { title: 'Không tìm thấy chuyên mục', robots: { index: false, follow: true } };

  const page = Math.max(1, Number(pageParam) || 1);
  const { total } = await getNews(slug, page);
  const basePath = `/news/chuyen-muc/${slug}`;
  const title = `${category.name} — Tin tức bất động sản`;
  const description = category.description || `Tin tức, phân tích và kinh nghiệm về ${category.name.toLowerCase()}.`;

  return {
    title,
    description,
    alternates: { canonical: page > 1 ? `${basePath}?page=${page}` : basePath },
    // Chuyên mục chưa có bài (hoặc trang phân trang phụ) -> giữ crawl được nhưng không
    // index — cùng luật "0 tin -> noindex,follow" đang áp cho trang danh mục BĐS rỗng, và
    // cùng điều kiện sitemap đã loại chuyên mục rỗng (seo.service.ts getNewsCategoryUrls).
    ...(page > 1 || total === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function NewsCategoryPage({ params, searchParams }: PageProps) {
  const [{ slug }, { page: pageParam }] = await Promise.all([params, searchParams]);
  const category = await getCategory(slug);
  if (!category) notFound();

  const page = Math.max(1, Number(pageParam) || 1);
  const { data: newsList, total } = await getNews(slug, page);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Trang phân trang vượt tổng số trang thật -> không có nội dung ở đây, 404 thay vì 200
  // rỗng — cùng luật "page-out-of-range" đang áp cho trang danh mục BĐS (indexability.ts).
  if (page > 1 && page > pageCount) notFound();

  const basePath = `/news/chuyen-muc/${slug}`;
  const canonical = siteConfig.absolute(basePath);
  const breadcrumbItems = [{ name: 'Tin tức', url: '/news' }, { name: category.name }];

  return (
    <div className="container mx-auto px-4 py-8">
      <JsonLd graph={[buildBreadcrumbList(breadcrumbItems, `${canonical}#breadcrumb`)]} />
      <Breadcrumb items={breadcrumbItems} />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">{category.name}</h1>
      {category.description && <p className="text-gray-500 text-center max-w-2xl mx-auto mb-8">{category.description}</p>}
      {!category.description && <div className="mb-8" />}

      {newsList.length === 0 ? (
        <div className="text-center py-10 text-gray-500">Chuyên mục này chưa có bài viết nào.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsList.map((news: any) => (
              <NewsCard key={news.id} news={news} />
            ))}
          </div>
          <NewsPagination basePath={basePath} page={page} pageCount={pageCount} />
        </>
      )}
    </div>
  );
}
