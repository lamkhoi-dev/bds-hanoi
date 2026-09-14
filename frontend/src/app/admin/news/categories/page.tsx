"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { confirmAction } from '@/lib/toast-helpers';
import { getApiErrorMessage } from '@/lib/api-error';

interface NewsCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { news: number };
}

const EMPTY_FORM = { name: '', description: '', sortOrder: 0, isActive: true };

export default function NewsCategoriesPage() {
  const [categories, setCategories] = useState<NewsCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [current, setCurrent] = useState<NewsCategoryRow | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/news-categories/admin/all');
      setCategories(res.data);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Lỗi khi tải danh sách chuyên mục'));
    } finally {
      setLoading(false);
    }
  };

  const openModal = (cat: NewsCategoryRow | null = null) => {
    setCurrent(cat);
    setFormData(
      cat
        ? { name: cat.name, description: cat.description || '', sortOrder: cat.sortOrder, isActive: cat.isActive }
        : EMPTY_FORM,
    );
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Tên chuyên mục không được để trống');
      return;
    }
    setSaving(true);
    try {
      if (current) {
        await api.patch(`/news-categories/${current.id}`, formData);
        toast.success('Đã cập nhật chuyên mục');
      } else {
        await api.post('/news-categories', formData);
        toast.success('Đã thêm chuyên mục');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Lỗi khi lưu chuyên mục'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: NewsCategoryRow) => {
    const confirmed = await confirmAction(`Xoá chuyên mục "${cat.name}"?`);
    if (!confirmed) return;
    try {
      await api.delete(`/news-categories/${cat.id}`);
      toast.success('Đã xoá chuyên mục');
      fetchCategories();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Lỗi khi xoá chuyên mục'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/news" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900">Chuyên mục Tin tức</h1>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
        >
          <Plus size={18} /> Thêm chuyên mục
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="admin-mobile-table w-full text-left border-collapse md:min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
              <th className="p-4 font-semibold">Tên chuyên mục</th>
              <th className="p-4 font-semibold">Slug</th>
              <th className="p-4 font-semibold text-center">Số bài</th>
              <th className="p-4 font-semibold text-center">Trạng thái</th>
              <th className="p-4 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center p-8 text-gray-500">Đang tải...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={5} className="text-center p-8 text-gray-500">Chưa có chuyên mục nào.</td></tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td data-label="Tên chuyên mục" className="p-4 text-sm font-semibold text-gray-800">{c.name}</td>
                  <td data-label="Slug" className="p-4 text-sm text-gray-600">/news/chuyen-muc/{c.slug}</td>
                  <td data-label="Số bài" className="p-4 text-sm text-gray-600 text-center">{c._count?.news ?? 0}</td>
                  <td data-label="Trạng thái" className="p-4 text-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded-md ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.isActive ? 'Hoạt động' : 'Đã ẩn'}
                    </span>
                  </td>
                  <td data-label="Thao tác" className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => openModal(c)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(c)} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">{current ? 'Sửa chuyên mục' : 'Thêm chuyên mục mới'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên chuyên mục</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                {current && <p className="text-xs text-gray-400 mt-1">Đổi tên KHÔNG đổi đường dẫn /news/chuyen-muc/{current.slug} (giữ nguyên link đã chia sẻ).</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả (không bắt buộc)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-20 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự hiển thị</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) || 0 })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Hoạt động (hiện trên trang công khai)</label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Hủy</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
                  {saving ? 'Đang lưu...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
