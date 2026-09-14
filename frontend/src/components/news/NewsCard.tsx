import Link from 'next/link';
import Image from 'next/image';
import { formatNewsDate } from '@/lib/news/dates';

export interface NewsCardItem {
  id: string;
  slug: string;
  title: string;
  sapo?: string | null;
  thumbnail?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  category?: { name: string; slug: string } | null;
}

/** Thẻ tóm tắt bài viết — dùng chung ở `/news` và `/news/chuyen-muc/{slug}` để hai trang không lệch giao diện. */
export default function NewsCard({ news }: { news: NewsCardItem }) {
  return (
    <Link
      href={`/news/${news.slug}`}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col"
    >
      <div className="relative w-full h-48 bg-gray-100">
        {news.thumbnail ? (
          <Image src={news.thumbnail} alt={news.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-400">Không có ảnh</div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="text-xs text-blue-600 font-bold mb-2 uppercase tracking-wider">
          {news.category?.name || 'Tin tức'}
        </div>
        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
          {news.title}
        </h3>
        {news.sapo && <p className="text-gray-600 text-sm line-clamp-2 mb-3">{news.sapo}</p>}
        <p className="text-gray-500 text-sm mt-auto">{formatNewsDate(news.publishedAt || news.createdAt || new Date())}</p>
      </div>
    </Link>
  );
}
