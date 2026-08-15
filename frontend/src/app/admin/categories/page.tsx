"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { confirmAction } from '@/lib/toast-helpers';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<any>(null);
  useAuth();
  const [formData, setFormData] = useState({ name: '', slug: '', isActive: true, parentId: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/categories');
      setCategories(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = currentCategory ? `/admin/categories/${currentCategory.id}` : '/admin/categories';
    const method = currentCategory ? 'PUT' : 'POST';

    const dataToSend = {
      ...formData,
      parentId: formData.parentId || null
    };

    try {
      await api({
        method,
        url,
        data: dataToSend
      });
      setIsModalOpen(false);
      fetchCategories();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmAction('Bạn có chắc muốn xóa danh mục này?');
    if (!confirmed) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      fetchCategories();
      toast.success('Đã xóa danh mục');
    } catch (e) {
      toast.error('Lỗi khi xóa danh mục');
      console.error(e);
    }
  };

  const openModal = (category: any = null) => {
    setCurrentCategory(category);
    if (category) {
      setFormData({ name: category.name, slug: category.slug, isActive: category.isActive, parentId: category.parentId || '' });
    } else {
      setFormData({ name: '', slug: '', isActive: true, parentId: '' });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="p-4 lg:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Quản lý Danh mục</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách các danh mục bất động sản</p>
        </div>
        <button onClick={() => openModal()} className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center gap-2 text-sm">
          <Plus size={18} /> Thêm danh mục
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="admin-mobile-table w-full text-left border-collapse md:min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
              <th className="p-4 font-semibold rounded-tl-xl">ID</th>
              <th className="p-4 font-semibold">Tên danh mục</th>
              <th className="p-4 font-semibold">Slug</th>
              <th className="p-4 font-semibold text-center">Trạng thái</th>
              <th className="p-4 font-semibold text-right rounded-tr-xl">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const buildTreeAndFlatten = (cats: any[], parentId: string | null = null, level = 0): any[] => {
                const result: any[] = [];
                const children = cats.filter(c => c.parentId === parentId);
                for (const child of children) {
                  result.push({ ...child, level });
                  result.push(...buildTreeAndFlatten(cats, child.id, level + 1));
                }
                return result;
              };

              const displayList = buildTreeAndFlatten(categories);

              if (loading) {
                return <tr><td colSpan={5} className="text-center p-8 text-gray-500">Đang tải...</td></tr>;
              }
              if (displayList.length === 0) {
                return <tr><td colSpan={5} className="text-center p-8 text-gray-500">Chưa có dữ liệu.</td></tr>;
              }

              return displayList.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td data-label="ID" className="p-4 text-sm text-gray-500 max-w-[120px] truncate">{c.id}</td>
                  <td data-label="Tên danh mục" className="p-4 text-sm font-semibold text-gray-800">
                    <div style={{ paddingLeft: `${c.level * 20}px` }} className="flex items-center gap-2">
                      {c.level > 0 && <span className="text-gray-300">↳</span>}
                      {c.name}
                    </div>
                  </td>
                  <td data-label="Slug" className="p-4 text-sm text-gray-600">{c.slug}</td>
                  <td data-label="Trạng thái" className="p-4 text-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded-md ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.isActive ? 'Hoạt động' : 'Đã ẩn'}
                    </span>
                  </td>
                  <td data-label="Thao tác" className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => openModal(c)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">{currentCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input required type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục cha</label>
                <select 
                  value={formData.parentId} 
                  onChange={e => setFormData({...formData, parentId: e.target.value})} 
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Không có --</option>
                  {categories.filter(c => !currentCategory || c.id !== currentCategory.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="rounded text-primary focus:ring-primary w-4 h-4" />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Hoạt động</label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Hủy</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
