import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { serverApiUrl } from '@/lib/server-api';
import { toMediaUrl } from '@/lib/media';
import { notFound, permanentRedirect } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import Breadcrumb from '@/components/Breadcrumb';
import { buildBreadcrumbList, buildNewsArticle } from '@/lib/seo/schema';
import { siteConfig } from '@/lib/site-config';
import { newsTitle, newsDescription, newsCanonicalPath, isSelfCanonical } from '@/lib/news/seo';
import { newsBreadcrumb } from '@/lib/news/breadcrumb';
import { formatNewsDateTime, shouldShowUpdated } from '@/lib/news/dates';
import NewsCard from '@/components/news/NewsCard';
import PropertyCard from '@/components/PropertyCard';

async function getNewsItem(slug: string) {
  try {
    const res = await fetch(serverApiUrl(`/news/${slug}`), { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getRelated(id: string): Promise<{ articles: any[]; properties: any[] }> {
  try {
    const res = await fetch(serverApiUrl(`/news/${id}/related`), { next: { revalidate: 300 } });
    if (!res.ok) return { articles: [], properties: [] };
    return res.json();
  } catch {
    return { articles: [], properties: [] };
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const newsItem = await getNewsItem(resolvedParams.slug);

  if (!newsItem) {
    return { title: 'Không tìm thấy bài viết', robots: { index: false, follow: true } };
  }

  const title = newsTitle(newsItem);
  const description = newsDescription(newsItem);
  const canonicalPath = newsCanonicalPath({ canonicalUrl: newsItem.canonicalUrl, slug: newsItem.slug });
  const canonical = /^https?:\/\//i.test(canonicalPath) ? canonicalPath : siteConfig.absolute(canonicalPath);
  const selfUrl = siteConfig.absolute(`/news/${newsItem.slug}`);
  const thumb = newsItem.thumbnail ? toMediaUrl(newsItem.thumbnail) : '';
  const image = thumb ? siteConfig.absolute(thumb) : '';
  // Canonical trỏ nơi khác (bài đăng lại) -> không nên tự xin Google index bản sao này.
  const selfCanonical = isSelfCanonical({ canonicalUrl: newsItem.canonicalUrl, slug: newsItem.slug });

  return {
    title,
    description,
    ...(selfCanonical ? {} : { robots: { index: false, follow: true } }),
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: selfUrl,
      type: 'article',
      ...(newsItem.publishedAt ? { publishedTime: newsItem.publishedAt } : {}),
      ...(newsItem.contentUpdatedAt ? { modifiedTime: newsItem.contentUpdatedAt } : {}),
      ...(newsItem.authorName ? { authors: [newsItem.authorName] } : {}),
      images: image ? [{ url: image, width: 1200, height: 675, alt: newsItem.thumbnailAlt || title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function NewsDetail({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const newsItem = await getNewsItem(resolvedParams.slug);

  if (!newsItem) {
    notFound();
  }

  // Tra được qua slug cũ (previousSlugs) hoặc qua id -> 301 về URL chuẩn.
  if (newsItem.slug && newsItem.slug !== resolvedParams.slug) {
    permanentRedirect(`/news/${newsItem.slug}`);
  }

  const title = newsTitle(newsItem);
  const description = newsDescription(newsItem);
  const selfUrl = siteConfig.absolute(`/news/${newsItem.slug}`);
  const breadcrumbItems = newsBreadcrumb(newsItem);
  const showUpdated = shouldShowUpdated(newsItem.publishedAt, newsItem.contentUpdatedAt);
  const related = await getRelated(newsItem.id);

  return (
    <>
    <article className="container mx-auto px-4 py-8 max-w-4xl bg-white shadow-sm rounded-xl mt-6 border border-gray-100">
      <JsonLd
        graph={[
          buildBreadcrumbList(breadcrumbItems, `${selfUrl}#breadcrumb`),
          buildNewsArticle(newsItem, { url: selfUrl, description }),
        ]}
      />
      <Breadcrumb items={breadcrumbItems} />
      <Link href="/news" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-6">
        <ChevronLeft size={20} />
        Quay lại danh sách
      </Link>

      {newsItem.category && (
        <Link
          href={`/news/chuyen-muc/${newsItem.category.slug}`}
          className="inline-block text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full mb-3 hover:bg-blue-100 transition-colors"
        >
          {newsItem.category.name}
        </Link>
      )}

      <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-3">{newsItem.title}</h1>
      {newsItem.sapo && <p className="text-lg text-gray-600 mb-4">{newsItem.sapo}</p>}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mb-8 border-b pb-6">
        {newsItem.authorName && <span className="font-medium text-gray-700">{newsItem.authorName}</span>}
        {newsItem.publishedAt && <span>Đăng lúc {formatNewsDateTime(newsItem.publishedAt)}</span>}
        {showUpdated && <span>· Cập nhật lúc {formatNewsDateTime(newsItem.contentUpdatedAt)}</span>}
      </div>

      {newsItem.thumbnail && (
        <figure className="mb-10">
          <div className="relative w-full h-[300px] md:h-[500px] rounded-xl overflow-hidden shadow-md bg-gray-100">
            <Image
              src={newsItem.thumbnail}
              alt={newsItem.thumbnailAlt || newsItem.title}
              fill
              className="object-cover"
              unoptimized
              priority
            />
          </div>
          {(newsItem.thumbnailCaption || newsItem.thumbnailCredit) && (
            <figcaption className="mt-2 text-sm text-gray-500 text-center">
              {newsItem.thumbnailCaption}
              {newsItem.thumbnailCaption && newsItem.thumbnailCredit && ' — '}
              {newsItem.thumbnailCredit}
            </figcaption>
          )}
        </figure>
      )}

      <div className="news-content" dangerouslySetInnerHTML={{ __html: newsItem.content }} />

      {Array.isArray(newsItem.sources) && newsItem.sources.length > 0 && (
        <div className="mt-10 pt-6 border-t border-gray-100">
          <h2 className="text-sm font-bold text-gray-700 mb-2">Nguồn tham khảo</h2>
          <ul className="space-y-1">
            {newsItem.sources.map((s: { title: string; url?: string }, i: number) => (
              <li key={i} className="text-sm">
                {/* URL không bắt buộc (khách báo 16/9) — nguồn chỉ có tên hiện dạng chữ
                    thường, không phải link tới chính trang này (href="" trước đây). */}
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noreferrer nofollow" className="text-blue-600 hover:underline">
                    {s.title}
                  </a>
                ) : (
                  <span className="text-gray-600">{s.title}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>

    {related.articles.length > 0 && (
      <div className="container mx-auto px-4 max-w-4xl mt-10">
        <h2 className="text-xl font-extrabold text-gray-900 mb-4">Bài viết liên quan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {related.articles.map((a: any) => (
            <NewsCard key={a.id} news={a} />
          ))}
        </div>
      </div>
    )}

    {related.properties.length > 0 && (
      <div className="container mx-auto px-4 max-w-4xl mt-10 pb-12">
        <h2 className="text-xl font-extrabold text-gray-900 mb-4">Bất động sản liên quan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {related.properties.map((p: any) => (
            <PropertyCard key={p.id} item={p} />
          ))}
        </div>
      </div>
    )}
    </>
  );
}
