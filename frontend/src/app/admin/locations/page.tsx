"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Star } from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { confirmAction } from '@/lib/toast-helpers';

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  useAuth();
  const [formData, setFormData] = useState({ name: '', slug: '', type: 'CITY', parentId: '', isFeatured: false, isSeoEnabled: false });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/locations');
      setLocations(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = currentLocation ? `/admin/locations/${currentLocation.id}` : '/admin/locations';
    const method = currentLocation ? 'PUT' : 'POST';

    const payload = {
      ...formData,
      parentId: formData.parentId || undefined
    };

    try {
      await api({
        method,
        url,
        data: payload
      });
      setIsModalOpen(false);
      fetchLocations();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmAction('Bạn có chắc muốn xóa vị trí này?');
    if (!confirmed) return;
    try {
      await api.delete(`/admin/locations/${id}`);
      fetchLocations();
      toast.success('Đã xóa vị trí');
    } catch (e) {
      toast.error('Lỗi khi xóa vị trí');
      console.error(e);
    }
  };

  const openModal = (loc: any = null) => {
    setCurrentLocation(loc);
    if (loc) {
      setFormData({ 
        name: loc.name, 
        slug: loc.slug, 
        type: loc.type, 
        parentId: loc.parentId || '', 
        isFeatured: loc.isFeatured || false,
        isSeoEnabled: loc.isSeoEnabled || false
      });
    } else {
      setFormData({ name: '', slug: '', type: 'CITY', parentId: '', isFeatured: false, isSeoEnabled: false });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="p-4 lg:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Quản lý Vị trí</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách Tỉnh/Thành, Quận/Huyện</p>
        </div>
        <button onClick={() => openModal()} className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center gap-2 text-sm">
          <Plus size={18} /> Thêm vị trí
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="admin-mobile-table w-full text-left border-collapse md:min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
              <th className="p-4 font-semibold rounded-tl-xl">ID</th>
              <th className="p-4 font-semibold">Tên vị trí</th>
              <th className="p-4 font-semibold">Loại</th>
              <th className="p-4 font-semibold">Slug</th>
              <th className="p-4 font-semibold text-center">Nổi bật (Trang chủ)</th>
              <th className="p-4 font-semibold text-center">Bật SEO</th>
              <th className="p-4 font-semibold text-right rounded-tr-xl">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center p-8 text-gray-500">Đang tải...</td></tr>
            ) : locations.length === 0 ? (
              <tr><td colSpan={6} className="text-center p-8 text-gray-500">Chưa có dữ liệu.</td></tr>
            ) : (
              locations.map((loc) => (
                <tr key={loc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td data-label="ID" className="p-4 text-sm text-gray-500 max-w-[120px] truncate">{loc.id}</td>
                  <td data-label="Tên vị trí" className="p-4 text-sm font-semibold text-gray-800">{loc.name}</td>
                  <td data-label="Loại" className="p-4 text-sm">
                    <span className={`px-2 py-1 text-xs font-medium rounded-md ${loc.type === 'CITY' ? 'bg-blue-100 text-blue-700' : loc.type === 'DISTRICT' ? 'bg-purple-100 text-purple-700' : loc.type === 'OLD_WARD' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                      {loc.type === 'CITY' ? 'Tỉnh/Thành' : loc.type === 'DISTRICT' ? 'Quận/Huyện' : loc.type === 'OLD_WARD' ? 'Phường/Xã cũ' : 'Phường/Xã mới'}
                    </span>
                  </td>
                  <td data-label="Slug" className="p-4 text-sm text-gray-600">{loc.slug}</td>
                  <td data-label="Nổi bật (Trang chủ)" className="p-4 text-center">
                    {loc.isFeatured ? <Star className="text-yellow-400 mx-auto fill-yellow-400" size={18} /> : <span className="text-gray-300">-</span>}
                  </td>
                  <td data-label="Bật SEO" className="p-4 text-center">
                    {loc.isSeoEnabled ? <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-md">Bật</span> : <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-md">Tắt</span>}
                  </td>
                  <td data-label="Thao tác" className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => openModal(loc)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(loc.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors">
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
              <h3 className="font-bold text-gray-800">{currentLocation ? 'Sửa vị trí' : 'Thêm vị trí mới'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên vị trí</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input required type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại vị trí</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                  <option value="CITY">Tỉnh/Thành phố</option>
                  <option value="DISTRICT">Quận/Huyện</option>
                  <option value="WARD">Phường/Xã mới</option>
                  <option value="OLD_WARD">Phường/Xã cũ</option>
                </select>
              </div>
              {formData.type !== 'CITY' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Tỉnh/Thành phố cha</label>
                  <input type="text" value={formData.parentId} onChange={e => setFormData({...formData, parentId: e.target.value})} placeholder="Nhập ID vị trí cha..." className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
              )}
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isFeatured" checked={formData.isFeatured} onChange={e => setFormData({...formData, isFeatured: e.target.checked})} className="rounded text-primary focus:ring-primary w-4 h-4" />
                <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">Đánh dấu nổi bật (Hiển thị ra trang chủ)</label>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isSeoEnabled" checked={formData.isSeoEnabled} onChange={e => setFormData({...formData, isSeoEnabled: e.target.checked})} className="rounded text-green-600 focus:ring-green-600 w-4 h-4" />
                <label htmlFor="isSeoEnabled" className="text-sm font-medium text-gray-700">Bật SEO (Xuất hiện trên Sitemap & Internal Links)</label>
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
