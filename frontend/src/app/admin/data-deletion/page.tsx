"use client";
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { confirmAction } from '@/lib/toast-helpers';

export default function AdminDataDeletionPage() {
  const [reqs, setReqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchRequests();
  }, [page]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/data-deletion-requests?page=${page}&limit=10`);
      setReqs(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  
  const updateStatus = async (id: string, status: string) => {
    if (status === 'COMPLETED') {
      const confirmed = await confirmAction('CẢNH BÁO: Hành động này sẽ ẩn danh toàn bộ dữ liệu người dùng (email, phone, tên). Bạn có chắc chắn?');
      if (!confirmed) return;
    }

    try {
      await api.put(`/admin/data-deletion-requests/${id}/status`, { status });
      setReqs(reqs.map(r => r.id === id ? { ...r, status } : r));
      toast.success('Cập nhật trạng thái thành công');
    } catch (e) {
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Yêu cầu Xóa Dữ liệu</h1>
      
      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="admin-mobile-table w-full text-left bg-white rounded shadow p-4 md:min-w-[800px]">
              <thead><tr className="border-b"><th className="p-2">ID</th><th className="p-2">User ID</th><th className="p-2">Lý do</th><th className="p-2">Trạng thái</th><th className="p-2">Thao tác</th></tr></thead>
              <tbody>
                {reqs.map(r => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td data-label="ID" className="p-2 text-sm">{r.id.substring(0,6)}</td>
                    <td data-label="User ID" className="p-2 text-sm font-mono">{r.userId?.substring(0,8)}...</td>
                    <td data-label="Lý do" className="p-2 text-sm max-w-sm truncate" title={r.reason}>{r.reason}</td>
                    <td data-label="Trạng thái" className="p-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${r.status === 'COMPLETED' ? 'bg-red-100 text-red-800 font-bold' : r.status === 'REJECTED' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td data-label="Thao tác" className="p-2">
                      <select className="border rounded p-1 text-sm outline-none" value={r.status} onChange={e => updateStatus(r.id, e.target.value)}>
                        <option value="PENDING">PENDING</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {reqs.length === 0 && (
                  <tr><td colSpan={5} className="p-4 text-center text-gray-500">Chưa có yêu cầu nào</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Trước</button>
              <span className="text-sm">Trang {page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Sau</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
