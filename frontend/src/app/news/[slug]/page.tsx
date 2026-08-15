import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { serverApiUrl } from '@/lib/server-api';
import { notFound } from 'next/navigation';

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

  const plainTextDescription = newsItem.content ? newsItem.content.replace(/<[^>]*>?/gm, '').substring(0, 160) : '';

  return {
    title: newsItem.title,
    description: plainTextDescription,
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

  return (
    <article className="container mx-auto px-4 py-8 max-w-4xl bg-white shadow-sm rounded-xl mt-6 border border-gray-100">
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
