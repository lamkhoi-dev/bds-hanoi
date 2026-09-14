"use client";

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import api from '@/lib/axios';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatNewsDateTime, shouldShowUpdated } from '@/lib/news/dates';
import { newsStatusBadge } from '@/lib/news/status-badge';

/**
 * Xem trước CHỈ trong quản trị — không bao giờ mở URL công khai `/news/{slug}` cho bài Nháp
 * hoặc Hẹn giờ, vì trang công khai (`news-visibility.ts` publicNewsWhere) sẽ trả 404 đúng như
 * người dùng thật sẽ thấy. Lấy dữ liệu qua `/news/admin/:id` (bỏ qua điều kiện hiển thị).
 */
export default function PreviewNews({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [news, setNews] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/news/admin/${id}`)
      .then((res) => setNews(res.data))
      .catch((err) => setError(getApiErrorMessage(err, 'Không tải được bài viết')))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <div className="text-center py-10">Đang tải...</div>;
  if (error || !news) return <div className="text-center py-10 text-red-600">{error || 'Không tìm thấy bài viết'}</div>;

  const badge = newsStatusBadge(news.status, news.publishedAt);
  const showUpdated = shouldShowUpdated(news.publishedAt, news.contentUpdatedAt);

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-16">
      <div className="flex items-center justify-between sticky top-0 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 z-10">
        <div className="flex items-center gap-3">
          <Link href={`/admin/news/${id}`} className="p-1.5 hover:bg-amber-100 rounded-full transition-colors">
            <ArrowLeft size={18} className="text-amber-800" />
          </Link>
          <span className="text-sm font-bold text-amber-800">Chế độ xem trước (chỉ quản trị)</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>{badge.label}</span>
        </div>
        {news.status === 'PUBLISHED' && news.slug && new Date(news.publishedAt).getTime() <= Date.now() && (
          <a
            href={`/news/${news.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-blue-700 hover:underline inline-flex items-center gap-1"
          >
            Mở trang công khai <ExternalLink size={12} />
          </a>
        )}
      </div>

      <article className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-200">
        {news.category && (
          <span className="inline-block text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full mb-3">
            {news.category.name}
          </span>
        )}
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-3">{news.title}</h1>
        {news.sapo && <p className="text-lg text-gray-600 mb-4">{news.sapo}</p>}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mb-8 border-b pb-6">
          {news.authorName && <span className="font-medium text-gray-700">{news.authorName}</span>}
          {news.publishedAt && <span>Đăng lúc {formatNewsDateTime(news.publishedAt)}</span>}
          {showUpdated && <span>· Cập nhật lúc {formatNewsDateTime(news.contentUpdatedAt)}</span>}
        </div>

        {news.thumbnail && (
          <figure className="mb-8">
            <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-md bg-gray-100">
              <Image src={news.thumbnail} alt={news.thumbnailAlt || news.title} fill className="object-cover" unoptimized />
            </div>
            {(news.thumbnailCaption || news.thumbnailCredit) && (
              <figcaption className="mt-2 text-sm text-gray-500 text-center">
                {news.thumbnailCaption}
                {news.thumbnailCaption && news.thumbnailCredit && ' — '}
                {news.thumbnailCredit}
              </figcaption>
            )}
          </figure>
        )}

        <div className="news-content" dangerouslySetInnerHTML={{ __html: news.content }} />

        {Array.isArray(news.sources) && news.sources.length > 0 && (
          <div className="mt-10 pt-6 border-t border-gray-100">
            <h2 className="text-sm font-bold text-gray-700 mb-2">Nguồn tham khảo</h2>
            <ul className="space-y-1">
              {news.sources.map((s: { title: string; url: string }, i: number) => (
                <li key={i} className="text-sm">
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </div>
  );
}
