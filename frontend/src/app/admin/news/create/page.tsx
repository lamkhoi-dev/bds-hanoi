"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { getApiErrorMessage } from '@/lib/api-error';
import NewsForm from '@/components/admin/news/NewsForm';

export default function CreateNews() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (payload: any) => {
    setIsSubmitting(true);
    try {
      await api.post('/news', payload);
      toast.success('Đã lưu bài viết mới');
      router.push('/admin/news');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Lỗi khi đăng bài viết'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/news" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900">Thêm Bài Viết Mới</h1>
        </div>
      </div>

      <NewsForm mode="create" onSubmit={handleSubmit} submitting={isSubmitting} />
    </div>
  );
}
