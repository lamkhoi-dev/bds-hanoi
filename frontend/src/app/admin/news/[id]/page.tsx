"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { getApiErrorMessage } from '@/lib/api-error';
import NewsForm from '@/components/admin/news/NewsForm';

export default function EditNews({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [news, setNews] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNewsItem = async () => {
      try {
        const res = await api.get(`/news/admin/${id}`);
        setNews(res.data);
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Lỗi khi tải thông tin bài viết'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchNewsItem();
  }, [id]);

  const handleSubmit = async (payload: any) => {
    setIsSubmitting(true);
    try {
      await api.patch(`/news/${id}`, payload);
      toast.success('Đã cập nhật bài viết');
      router.push('/admin/news');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Lỗi khi cập nhật bài viết'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="text-center py-10">Đang tải...</div>;
  if (!news) return <div className="text-center py-10 text-red-600">Không tìm thấy bài viết</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/news" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900">Sửa Bài Viết</h1>
        </div>
        <Link
          href={`/admin/news/${id}/preview`}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          Xem trước
        </Link>
      </div>

      <NewsForm mode="edit" initial={news} onSubmit={handleSubmit} submitting={isSubmitting} />
    </div>
  );
}
