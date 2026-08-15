"use client";

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Eye, EyeOff, Trash2, Filter } from 'lucide-react';
import Link from 'next/link';
import { generateSlug } from '@/lib/utils';
import api from '@/lib/axios';
import { getAuthToken, isUnauthorizedError } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import { confirmAction } from '@/lib/toast-helpers';

export default function AdminPosts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [tier, setTier] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPosts = useCallback(async () => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/admin/properties', {
        params: {
          status: status || undefined,
          propertyType: propertyType || undefined,
          tier: tier || undefined,
          search: debouncedSearch || undefined,
          page,
          limit,
        }
      });
      setPosts(res.data.data);
      setTotal(res.data.total);
    } catch (e) {
      if (!isUnauthorizedError(e)) console.error(e);
    } finally {
      setLoading(false);
    }
  }, [status, propertyType, tier, debouncedSearch, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    setPage(1);
  }, [status, propertyType, tier, debouncedSearch]);

  const handleUpdateStatus = async (id: string, status: string) => {
    const confirmed = await confirmAction(`Bạn có chắc chắn muốn chuyển trạng thái thành ${status}?`);
    if (!confirmed) return;
    try {
      await api.put(`/admin/properties/${id}/status`, { status });
      fetchPosts();
      toast.success(`Đã chuyển trạng thái thành ${status}`);
    } catch (e) {
      if (!isUnauthorizedError(e)) console.error(e);
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-gray-900">Quản lý Bài đăng</h1>
        <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
          <Filter size={16} /> Lọc & Sắp xếp
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4">
        <input 
          type="text" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Tìm kiếm theo tiêu đề..." 
          className="font-sans border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary w-full md:w-auto min-w-[200px]"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="font-sans border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
          <option className="font-sans" value="">Tất cả Trạng thái</option>
          <option className="font-sans" value="PENDING">Chờ duyệt</option>
          <option className="font-sans" value="APPROVED">Đã duyệt</option>
          <option className="font-sans" value="REJECTED">Từ chối</option>
        </select>
        <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="font-sans border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
          <option className="font-sans" value="">Loại BĐS</option>
          <option className="font-sans" value="CHUNG_CU">Chung cư</option>
          <option className="font-sans" value="NHA_RIENG">Nhà riêng</option>
          <option className="font-sans" value="NHA_MAT_PHO">Nhà mặt phố</option>
          <option className="font-sans" value="NHA_BIET_THU">Biệt thự</option>
          <option className="font-sans" value="DAT_NEN">Đất nền</option>
          <option className="font-sans" value="DAT_THO_CU">Đất thổ cư</option>
          <option className="font-sans" value="DAT_NONG_NGHIEP">Đất nông nghiệp</option>
          <option className="font-sans" value="DU_AN">Dự án</option>
          <option className="font-sans" value="KHO_XUONG">Kho xưởng</option>
          <option className="font-sans" value="KHACH_SAN">Khách sạn</option>
          <option className="font-sans" value="VAN_PHONG">Văn phòng</option>
          <option className="font-sans" value="MAT_BANG">Mặt bằng kinh doanh</option>
          <option className="font-sans" value="PHONG_TRO">Phòng trọ</option>
          <option className="font-sans" value="BDS_KHAC">Khác</option>
        </select>
        <select value={tier} onChange={(e) => setTier(e.target.value)} className="font-sans border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
          <option className="font-sans" value="">Tất cả VIP / UP</option>
          <option className="font-sans" value="VIP">Đang VIP</option>
          <option className="font-sans" value="UP">Đang đẩy UP</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-mobile-table w-full md:min-w-[900px] text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Tiêu đề tin</th>
                <th className="px-6 py-4">Người đăng</th>
                <th className="px-6 py-4">Loại BĐS & Khu vực</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-center">Gói VIP</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-4">Đang tải...</td></tr>
              ) : posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                  <td data-label="Tiêu đề tin" className="px-6 py-4">
                    <div className="font-bold text-gray-900 max-w-xs truncate" title={post.title}>
                      {post.title}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">ID: #{post.id.substring(0, 8)} • {new Date(post.createdAt).toLocaleDateString('vi-VN')}</div>
                  </td>
                  <td data-label="Người đăng" className="px-6 py-4">
                    <div className="font-medium">{post.user?.name || post.user?.email || 'Ẩn danh'}</div>
                    <div className="text-gray-500 text-xs mt-1">{post.user?.phone || ''}</div>
                  </td>
                  <td data-label="Loại BĐS & Khu vực" className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-semibold">
                      {{
                        CHUNG_CU: 'Chung cư',
                        NHA_RIENG: 'Nhà riêng',
                        NHA_MAT_PHO: 'Nhà mặt phố',
                        NHA_BIET_THU: 'Biệt thự',
                        DAT_NEN: 'Đất nền',
                        DAT_THO_CU: 'Đất thổ cư',
                        DAT_NONG_NGHIEP: 'Đất nông nghiệp',
                        DU_AN: 'Dự án',
                        KHO_XUONG: 'Kho xưởng',
                        KHACH_SAN: 'Khách sạn',
                        VAN_PHONG: 'Văn phòng',
                        MAT_BANG: 'Mặt bằng KD',
                        PHONG_TRO: 'Phòng trọ',
                        BDS_KHAC: 'Khác'
                      }[post.propertyType as string] || post.propertyType}
                    </span>
                    <div className="text-gray-500 text-xs mt-1">{post.ward || post.district || ''}</div>
                  </td>
                  <td data-label="Trạng thái" className="px-6 py-4">
                    {post.status === 'PENDING' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-600" /> Chờ duyệt
                      </span>
                    ) : post.status === 'APPROVED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-600" /> Đã duyệt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-600 border border-gray-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600" /> {post.status}
                      </span>
                    )}
                  </td>
                  <td data-label="Gói VIP" className="px-6 py-4 text-center">
                    {post.tier === 'VIP' && <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-2 py-1 rounded font-bold text-[10px]">VIP</span>}
                    {post.tier === 'UP' && <span className="bg-gradient-to-r from-blue-400 to-blue-500 text-white px-2 py-1 rounded font-bold text-[10px]">UP</span>}
                    {post.tier === 'NORMAL' && <span className="text-gray-300">-</span>}
                  </td>
                  <td data-label="Thao tác" className="px-6 py-4 text-right space-x-2">
                    <Link href={`/tin/${generateSlug(post.title)}--${post.id}`} target="_blank" className="inline-flex p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Xem chi tiết (Tab mới)">
                      <Eye size={18} />
                    </Link>
                    {post.status === 'PENDING' && (
                      <>
                        <button onClick={() => handleUpdateStatus(post.id, 'APPROVED')} className="inline-flex p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Duyệt bài">
                          <CheckCircle size={18} />
                        </button>
                        <button onClick={() => handleUpdateStatus(post.id, 'REJECTED')} className="inline-flex p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Từ chối">
                          <AlertTriangle size={18} />
                        </button>
                      </>
                    )}
                    {post.status === 'APPROVED' && (
                      <button onClick={() => handleUpdateStatus(post.id, 'HIDDEN')} className="inline-flex p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Ẩn bài">
                        <EyeOff size={18} />
                      </button>
                    )}
                    <button onClick={() => handleUpdateStatus(post.id, 'DELETED')} className="inline-flex p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa mềm">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <span className="text-sm text-gray-500">Hiển thị {posts.length} của {total} tin đăng</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="px-3 py-1 border border-gray-200 bg-white rounded text-sm disabled:opacity-50">Trước</button>
            {[page, page + 1, page + 2].filter((value) => value <= totalPages).map((value) => (
              <button key={value} onClick={() => setPage(value)} className={`px-3 py-1 border border-gray-200 rounded text-sm ${value === page ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-white'}`}>{value}</button>
            ))}
            <button disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="px-3 py-1 border border-gray-200 bg-white rounded text-sm disabled:opacity-50">Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
}
