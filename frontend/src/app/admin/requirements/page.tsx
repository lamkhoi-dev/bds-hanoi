"use client";
import { formatNumberString } from '@/lib/utils';
import { propertyTypeByEnum } from '@/lib/seo/taxonomy';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { getAuthToken, isUnauthorizedError } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import { confirmAction } from '@/lib/toast-helpers';

export default function AdminRequirementsPage() {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewingReq, setViewingReq] = useState<any>(null);

  const fetchRequirements = async () => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get('/admin/requirements', {
        params: { status: statusFilter, page, limit: 10 }
      });
      setRequirements(res.data?.data || []);
      setTotal(res.data.total);
    } catch (error) {
      if (!isUnauthorizedError(error)) console.error(error);
      toast.error('Không thể tải danh sách nhu cầu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/admin/requirements/${id}/status`, { status: newStatus });
      fetchRequirements();
      toast.success('Cập nhật trạng thái thành công');
    } catch (error) {
      if (!isUnauthorizedError(error)) console.error(error);
      toast.error('Lỗi cập nhật trạng thái');
    }
  };

  const deleteRequirement = async (id: string) => {
    const confirmed = await confirmAction('Bạn có chắc chắn muốn xóa nhu cầu này?');
    if (!confirmed) return;
    try {
      await api.delete(`/admin/requirements/${id}`);
      fetchRequirements();
      toast.success('Xóa thành công');
    } catch (error) {
      if (!isUnauthorizedError(error)) console.error(error);
      toast.error('Lỗi khi xóa');
    }
  };

  return (
    <div className="max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Nhu cầu Mua / Thuê</h1>
        <div className="flex flex-wrap gap-4">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="font-sans px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option className="font-sans" value="">Tất cả trạng thái</option>
            <option className="font-sans" value="PENDING">Chờ xử lý</option>
            <option className="font-sans" value="APPROVED">Đã duyệt</option>
            <option className="font-sans" value="REJECTED">Từ chối</option>
            <option className="font-sans" value="MATCHED">Đã kết nối</option>
            <option className="font-sans" value="CLOSED">Đã đóng</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-mobile-table w-full md:min-w-[860px] text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                <th className="p-4 font-semibold">Khách hàng</th>
                <th className="p-4 font-semibold">Loại nhu cầu</th>
                <th className="p-4 font-semibold">Nội dung / Yêu cầu</th>
                <th className="p-4 font-semibold">Ngày đăng</th>
                <th className="p-4 font-semibold">Trạng thái</th>
                <th className="p-4 font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">Đang tải dữ liệu...</td>
                </tr>
              ) : requirements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">Không có dữ liệu</td>
                </tr>
              ) : (
                requirements.map(req => (
                  <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td data-label="Khách hàng" className="p-4">
                      <div className="font-bold text-gray-800">{req.name}</div>
                      <div className="text-sm text-gray-500">{req.phone}</div>
                    </td>
                    <td data-label="Loại nhu cầu" className="p-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${req.transactionType === 'CAN_MUA' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {req.transactionType === 'CAN_MUA' ? 'CẦN MUA' : 'CẦN THUÊ'}
                      </span>
                      <div className="text-sm font-medium mt-1">
                        {propertyTypeByEnum(req.propertyType as string)?.label || req.propertyType}
                      </div>
                    </td>
                    <td data-label="Nội dung / Yêu cầu" className="p-4">
                      <div className="text-sm text-gray-700 max-w-xs truncate" title={req.content}>
                        {req.content || 'Không có mô tả'}
                      </div>
                    </td>
                    <td data-label="Ngày đăng" className="p-4 text-sm text-gray-500">
                      {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td data-label="Trạng thái" className="p-4">
                      <select 
                        value={req.status} 
                        onChange={(e) => updateStatus(req.id, e.target.value)}
                        className={`font-sans text-sm font-bold border-0 bg-transparent cursor-pointer outline-none ${
                          req.status === 'PENDING' ? 'text-amber-500' : 
                          req.status === 'APPROVED' ? 'text-emerald-600' :
                          req.status === 'REJECTED' ? 'text-red-500' :
                          req.status === 'MATCHED' ? 'text-green-500' : 'text-gray-500'
                        }`}
                      >
                        <option value="PENDING" className="font-sans text-black">Chờ xử lý</option>
                        <option value="APPROVED" className="font-sans text-black">Đã duyệt</option>
                        <option value="REJECTED" className="font-sans text-black">Từ chối</option>
                        <option value="MATCHED" className="font-sans text-black">Đã kết nối</option>
                        <option value="CLOSED" className="font-sans text-black">Đã đóng</option>
                      </select>
                    </td>
                    <td data-label="Hành động" className="p-4">
                      <button 
                        onClick={() => setViewingReq(req)}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium mr-3"
                      >
                        Xem
                      </button>
                      <button 
                        onClick={() => deleteRequirement(req.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {total > 10 && (
          <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-gray-50">
            <span className="text-sm text-gray-500">
              Hiển thị {((page - 1) * 10) + 1} - {Math.min(page * 10, total)} trong {total} nhu cầu
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-white border rounded text-sm disabled:opacity-50"
              >
                Trước
              </button>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={page * 10 >= total}
                className="px-3 py-1 bg-white border rounded text-sm disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">Chi tiết Nhu cầu</h3>
              <button onClick={() => setViewingReq(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Khách hàng</label>
                  <p className="font-medium text-gray-900">
                    {viewingReq.userId ? (
                      <a href={`/user/${viewingReq.userId}`} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">
                        {(viewingReq.name && viewingReq.name.toLowerCase() !== 'khách hàng' ? viewingReq.name : (viewingReq.user?.name && viewingReq.user?.name?.toLowerCase() !== 'khách hàng' ? viewingReq.user?.name : 'Khách vãng lai'))} (Xem hồ sơ)
                      </a>
                    ) : (
                      (viewingReq.name && viewingReq.name.toLowerCase() !== 'khách hàng' ? viewingReq.name : 'Khách vãng lai')
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Số điện thoại</label>
                  <p className="font-medium text-gray-900">
                    {(viewingReq.phone?.trim() ? viewingReq.phone.trim() : (viewingReq.user?.phone?.trim() ? viewingReq.user.phone.trim() : 'Chưa cung cấp'))}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                  <p className="font-medium text-gray-900">
                    {(viewingReq.email?.trim()) || (viewingReq.user?.email?.trim()) || 'Chưa cung cấp'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Loại nhu cầu</label>
                  <p className="font-medium text-gray-900">
                    {viewingReq.transactionType === 'CAN_MUA' ? 'Cần Mua' : viewingReq.transactionType === 'CAN_THUE' ? 'Cần Thuê' : viewingReq.transactionType} - {viewingReq.propertyType}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Khu vực</label>
                  <p className="font-medium text-gray-900">
                    {(() => {
                      if (!viewingReq.location) return 'Chưa xác định';
                      // Bảng alias 6 phường Vinh viết cứng đã bỏ — tên phường cũ giờ
                      // là dữ liệu thật trong CSDL (loại OLD_WARD).
                      return viewingReq.location.name;
                    })()}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Khoảng Giá</label>
                  <p className="font-medium text-gray-900">
                    {viewingReq.priceMin ? viewingReq.priceMin + ' ' : ''} 
                    {viewingReq.priceMin && viewingReq.priceMax ? '-' : ''} 
                    {viewingReq.priceMax ? ' ' + viewingReq.priceMax : ''}
                    {!viewingReq.priceMin && !viewingReq.priceMax ? 'Thỏa thuận' : ''}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Diện tích (m²)</label>
                  <p className="font-medium text-gray-900">
                    {viewingReq.areaMin ? viewingReq.areaMin + ' ' : ''} 
                    {viewingReq.areaMin && viewingReq.areaMax ? '-' : ''} 
                    {viewingReq.areaMax ? ' ' + viewingReq.areaMax : ''}
                    {!viewingReq.areaMin && !viewingReq.areaMax ? 'Chưa xác định' : ''}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Trạng thái</label>
                  <p className={`font-bold ${viewingReq.status === 'PENDING' ? 'text-amber-500' : viewingReq.status === 'APPROVED' ? 'text-emerald-600' : viewingReq.status === 'REJECTED' ? 'text-red-500' : viewingReq.status === 'MATCHED' ? 'text-green-500' : 'text-gray-500'}`}>
                    {viewingReq.status}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Ngày đăng</label>
                  <p className="font-medium text-gray-900">{new Date(viewingReq.createdAt).toLocaleString('vi-VN')}</p>
                </div>
              </div>
              <div className="mt-4 border-t pt-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nội dung chi tiết / Yêu cầu thêm</label>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap text-sm border border-gray-100">
                  {viewingReq.content || 'Không có mô tả chi tiết'}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button onClick={() => setViewingReq(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
