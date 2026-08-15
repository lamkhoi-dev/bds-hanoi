"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { uploadImage } from '@/lib/upload';
import Image from 'next/image';
import SimpleEditor from '@/components/SimpleEditor';

export default function CreateNews() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setThumbnail(url);
      toast.success('Tải ảnh lên thành công!');
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi tải ảnh lên');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await api.post('/news', {
        title,
        content,
        thumbnail,
      });
      toast.success('Đã đăng bài viết mới');
      router.push('/admin/news');
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi đăng bài viết');
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

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Tiêu đề bài viết <span className="text-red-500">*</span></label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Nhập tiêu đề..."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Ảnh đại diện (Thumbnail)</label>
          <div className="flex items-start gap-4">
            <div className="relative w-40 h-28 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
              {thumbnail ? (
                <Image src={thumbnail} alt="Thumbnail" fill className="object-cover" />
              ) : (
                <ImageIcon className="text-gray-400" size={32} />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
                {isUploading ? 'Đang tải lên...' : 'Chọn ảnh'}
                <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={isUploading} />
              </label>
              <p className="text-xs text-gray-500">Kích thước khuyến nghị: 800x450px. Tối đa 5MB.</p>
              {thumbnail && (
                <button type="button" onClick={() => setThumbnail('')} className="text-red-500 text-sm font-medium block">
                  Xoá ảnh
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Nội dung <span className="text-red-500">*</span></label>
          <div className="h-[400px] mb-12">
            <SimpleEditor 
              value={content} 
              onChange={setContent} 
              className="h-full rounded-lg"
            />
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {isSubmitting ? 'Đang lưu...' : 'Lưu bài viết'}
          </button>
        </div>
      </form>
    </div>
  );
}
