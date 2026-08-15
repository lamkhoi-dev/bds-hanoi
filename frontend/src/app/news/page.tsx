import Link from 'next/link';
import Image from 'next/image';
import { serverApiUrl } from '@/lib/server-api';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tin Tức Bất Động Sản',
  description: 'Cập nhật tin tức thị trường bất động sản, chia sẻ kinh nghiệm mua bán, đầu tư nhà đất.',
};

async function getNews() {
  try {
    const res = await fetch(serverApiUrl('/news?page=1&limit=50'), { next: { revalidate: 0 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function NewsPage() {
  const newsList = await getNews();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">Tin Tức Bất Động Sản</h1>
      
      {newsList.length === 0 ? (
        <div className="text-center py-10 text-gray-500">Chưa có bài viết nào.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsList.map((news: any) => (
            <Link key={news.id} href={`/news/${news.slug}`} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
              <div className="relative w-full h-48 bg-gray-100">
                {news.thumbnail ? (
                  <Image src={news.thumbnail} alt={news.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-400">Không có ảnh</div>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="text-xs text-blue-600 font-bold mb-2 uppercase tracking-wider">Tin tức</div>
                <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                  {news.title}
                </h3>
                <p className="text-gray-500 text-sm mt-auto">
                  {new Date(news.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
