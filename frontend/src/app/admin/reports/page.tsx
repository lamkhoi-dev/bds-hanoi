"use client";
import { formatNumberString } from '@/lib/utils';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { getAuthToken, isUnauthorizedError } from '@/lib/auth';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingReport, setViewingReport] = useState<any>(null);

  useEffect(() => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }

    api.get('/admin/reports')
      .then((res) => setReports(Array.isArray(res.data) ? res.data : res.data?.data || []))
      .catch((error) => {
        if (!isUnauthorizedError(error)) console.error(error);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Báo cáo vi phạm</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý các báo cáo từ người dùng.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-mobile-table md:min-w-[760px] w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Người gửi</th>
                <th className="px-4 py-3">Tin đăng</th>
                <th className="px-4 py-3">Lý do</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Đang tải...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Chưa có báo cáo</td></tr>
              ) : reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td data-label="Người gửi" className="px-4 py-3">{report.user?.name || report.user?.email || 'Ẩn danh'}</td>
                  <td data-label="Tin đăng" className="px-4 py-3 max-w-xs truncate">{report.property?.title || report.propertyId || '-'}</td>
                  <td data-label="Lý do" className="px-4 py-3 max-w-sm truncate">{report.reason || '-'}</td>
                  <td data-label="Trạng thái" className="px-4 py-3 font-semibold">{report.status || '-'}</td>
                  <td data-label="Ngày tạo" className="px-4 py-3 text-gray-500">{report.createdAt ? new Date(report.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                  <td data-label="Hành động" className="px-4 py-3 text-right">
                    <button
                      onClick={() => setViewingReport(report)}
                      className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                    >
                      Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">Chi tiết Khiếu nại</h3>
              <button onClick={() => setViewingReport(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mã khiếu nại</label>
                  <p className="font-medium text-gray-900">{viewingReport.id}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Người gửi</label>
                  <p className="font-medium text-gray-900">{viewingReport.user?.name || viewingReport.user?.email || 'Ẩn danh'}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tin đăng bị khiếu nại</label>
                  <p className="font-medium text-gray-900">{viewingReport.property?.title || viewingReport.propertyId}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Trạng thái</label>
                  <p className="font-medium text-gray-900">{viewingReport.status || 'Chờ xử lý'}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Ngày tạo</label>
                  <p className="font-medium text-gray-900">{new Date(viewingReport.createdAt).toLocaleString('vi-VN')}</p>
                </div>
              </div>
              <div className="mt-4 border-t pt-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lý do / Nội dung chi tiết</label>
                <div className="bg-gray-50 rounded-lg p-3 text-gray-700 text-sm border border-gray-100 whitespace-pre-wrap">
                  {viewingReport.reason || 'Không có nội dung'}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button onClick={() => setViewingReport(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
