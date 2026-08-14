import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { serverApiUrl } from '@/lib/server-api';
import { notFound, permanentRedirect } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import Breadcrumb from '@/components/Breadcrumb';
import { buildArticle, buildBreadcrumbList } from '@/lib/seo/schema';
import { siteConfig } from '@/lib/site-config';

/** Bỏ thẻ HTML để lấy mô tả thuần văn bản, dùng chung cho meta và JSON-LD. */
function plainDescription(content?: string | null) {
  return content ? content.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim().substring(0, 160) : '';
}

async function getNewsItem(slug: string) {
  try {
    const res = await fetch(serverApiUrl(`/news/${slug}`), { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const newsItem = await getNewsItem(resolvedParams.slug);

  if (!newsItem) {
    return {
      title: 'Không tìm thấy bài viết',
    };
  }

  const plainTextDescription = plainDescription(newsItem.content);

  return {
    title: newsItem.title,
    description: plainTextDescription,
    // Canonical tương đối, để metadataBase trong layout.tsx tự resolve sang domain thật.
    alternates: { canonical: `/news/${newsItem.slug}` },
    openGraph: {
      title: newsItem.title,
      description: plainTextDescription,
      images: newsItem.thumbnail ? [{ url: newsItem.thumbnail }] : [],
    }
  };
}

export default async function NewsDetail({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const newsItem = await getNewsItem(resolvedParams.slug);

  if (!newsItem) {
    notFound();
  }

  // Bài tra được qua slug cũ (previousSlugs) hoặc qua id -> 301 về URL chuẩn.
  if (newsItem.slug && newsItem.slug !== resolvedParams.slug) {
    permanentRedirect(`/news/${newsItem.slug}`);
  }

  const canonical = siteConfig.absolute(`/news/${newsItem.slug}`);
  const breadcrumbItems = [
    { name: 'Tin tức', url: '/news' },
    { name: newsItem.title },
  ];

  return (
    <article className="container mx-auto px-4 py-8 max-w-4xl bg-white shadow-sm rounded-xl mt-6 border border-gray-100">
      <JsonLd
        graph={[
          buildBreadcrumbList(breadcrumbItems, `${canonical}#breadcrumb`),
          buildArticle(newsItem, { url: canonical, description: plainDescription(newsItem.content) }),
        ]}
      />
      <Breadcrumb items={breadcrumbItems} />
      <Link href="/news" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-6">
        <ChevronLeft size={20} />
        Quay lại danh sách
      </Link>

      <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-4">{newsItem.title}</h1>
      
      <div className="flex items-center text-sm text-gray-500 mb-8 border-b pb-6">
        <span>Đăng lúc: {new Date(newsItem.createdAt).toLocaleDateString('vi-VN')} {new Date(newsItem.createdAt).toLocaleTimeString('vi-VN')}</span>
      </div>

      {newsItem.thumbnail && (
        <div className="relative w-full h-[300px] md:h-[500px] rounded-xl overflow-hidden mb-10 shadow-md">
          <Image src={newsItem.thumbnail} alt={newsItem.title} fill className="object-cover" unoptimized />
        </div>
      )}

      <div 
        className="prose prose-lg max-w-none text-gray-800 leading-relaxed ql-editor"
        dangerouslySetInnerHTML={{ __html: newsItem.content }}
      />
    </article>
  );
}
