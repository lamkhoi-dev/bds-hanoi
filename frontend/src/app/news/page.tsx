import { serverApiUrl } from '@/lib/server-api';
import { Metadata } from 'next';
import NewsCard from '@/components/news/NewsCard';
import NewsPagination from '@/components/news/NewsPagination';

// Trang đọc tin bằng `revalidate: 0` nên không tĩnh hoá được; khai báo tường minh để
// `next build` không báo DYNAMIC_SERVER_USAGE và bỏ dở việc sinh trang.
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12;

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string }> }): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  return {
    title: 'Tin tức bất động sản',
    description: 'Cập nhật tin tức thị trường bất động sản, chia sẻ kinh nghiệm mua bán và kiến thức đầu tư nhà đất.',
    // Trang danh sách tin tức vốn thiếu canonical, mà `?page=` lại sinh URL biến thể.
    alternates: { canonical: page > 1 ? `/news?page=${page}` : '/news' },
    // Từ trang 2 trở đi không có gì mới để index riêng — vẫn cho bot đi tiếp (follow).
    ...(page > 1 ? { robots: { index: false, follow: true } } : {}),
  };
}

async function getNews(page: number) {
  try {
    const res = await fetch(serverApiUrl(`/news?page=${page}&limit=${PAGE_SIZE}`), { next: { revalidate: 0 } });
    if (!res.ok) return { data: [], total: 0 };
    const json = await res.json();
    return { data: json.data || [], total: json.total || 0 };
  } catch (error) {
    console.error(error);
    return { data: [], total: 0 };
  }
}

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { data: newsList, total } = await getNews(page);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">Tin Tức Bất Động Sản</h1>

      {newsList.length === 0 ? (
        <div className="text-center py-10 text-gray-500">Chưa có bài viết nào.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsList.map((news: any) => (
              <NewsCard key={news.id} news={news} />
            ))}
          </div>
          <NewsPagination basePath="/news" page={page} pageCount={pageCount} />
        </>
      )}
    </div>
  );
}
