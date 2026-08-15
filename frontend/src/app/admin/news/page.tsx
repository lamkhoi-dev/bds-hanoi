"use client";

import { useCallback, useEffect, useState } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { getAuthToken, isUnauthorizedError } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import { confirmAction } from '@/lib/toast-helpers';
import Image from 'next/image';

export default function AdminNews() {
  const [newsList, setNewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const fetchNews = useCallback(async () => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/news', {
        params: {
          page,
          limit,
        }
      });
      setNewsList(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      if (!isUnauthorizedError(e)) console.error(e);
      toast.error('Lỗi khi tải danh sách tin tức');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleDelete = async (id: string) => {
    const confirmed = await confirmAction('Bạn có chắc chắn muốn xoá bài viết này không?');
    if (!confirmed) return;
    try {
      await api.delete(`/news/${id}`);
      toast.success('Đã xoá bài viết');
      if (newsList.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchNews();
      }
    } catch (e) {
      if (!isUnauthorizedError(e)) console.error(e);
      toast.error('Lỗi khi xoá bài viết');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-gray-900">Quản lý Tin tức</h1>
        <Link href="/admin/news/create" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={16} /> Thêm bài viết mới
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-mobile-table w-full md:min-w-[900px] text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Thumbnail</th>
                <th className="px-6 py-4">Tiêu đề</th>
                <th className="px-6 py-4">Ngày đăng</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-4">Đang tải...</td></tr>
              ) : newsList.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-4">Chưa có bài viết nào</td></tr>
              ) : newsList.map((news) => (
                <tr key={news.id} className="hover:bg-gray-50/50 transition-colors">
                  <td data-label="Thumbnail" className="px-6 py-4">
                    <div className="h-12 w-20 relative rounded overflow-hidden bg-gray-100">
                      {news.thumbnail ? (
                        <Image src={news.thumbnail} alt={news.title} fill className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-400 text-xs">No img</div>
                      )}
                    </div>
                  </td>
                  <td data-label="Tiêu đề" className="px-6 py-4">
                    <div className="font-bold text-gray-900 max-w-md truncate" title={news.title}>
                      {news.title}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">Slug: {news.slug}</div>
                  </td>
                  <td data-label="Ngày đăng" className="px-6 py-4">
                    <div className="text-gray-900">{new Date(news.createdAt).toLocaleDateString('vi-VN')}</div>
                  </td>
                  <td data-label="Thao tác" className="px-6 py-4 text-right space-x-2">
                    <Link href={`/admin/news/${news.id}`} className="inline-flex p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Chỉnh sửa">
                      <Edit size={18} />
                    </Link>
                    <button onClick={() => handleDelete(news.id)} className="inline-flex p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa bài">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <span className="text-sm text-gray-500">Hiển thị {newsList.length} của {total} bài viết</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="px-3 py-1 border border-gray-200 bg-white rounded text-sm disabled:opacity-50">Trước</button>
            {[page - 1, page, page + 1].filter((value) => value >= 1 && value <= totalPages).map((value) => (
              <button key={value} onClick={() => setPage(value)} className={`px-3 py-1 border border-gray-200 rounded text-sm ${value === page ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-white'}`}>{value}</button>
            ))}
            <button disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="px-3 py-1 border border-gray-200 bg-white rounded text-sm disabled:opacity-50">Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
}
