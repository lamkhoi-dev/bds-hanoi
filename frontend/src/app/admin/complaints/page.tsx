"use client";
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  useEffect(() => {
    fetchComplaints();
  }, [page]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/complaints?page=${page}&limit=10`);
      setComplaints(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  
  const updateStatus = async (id: string, status: string) => {
    let resolution = '';
    if (status === 'RESOLVED' || status === 'REJECTED') {
      const input = prompt('Nhập ghi chú / cách giải quyết cho khiếu nại này:');
      if (input === null) return; // User cancelled
      resolution = input;
    }
    
    try {
      await api.put(`/admin/complaints/${id}/status`, { status, resolution });
      setComplaints(complaints.map(c => c.id === id ? { ...c, status, resolution } : c));
      toast.success('Cập nhật trạng thái thành công');
    } catch (e) {
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Quản lý Khiếu nại</h1>
      
      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="admin-mobile-table w-full text-left bg-white rounded shadow p-4 md:min-w-[800px]">
              <thead><tr className="border-b"><th className="p-2">ID</th><th className="p-2">User</th><th className="p-2">Property</th><th className="p-2">Subject</th><th className="p-2">Content</th><th className="p-2">Status</th><th className="p-2">Action</th></tr></thead>
              <tbody>
                {complaints.map(c => (
                  <tr key={c.id} className="border-b">
                    <td data-label="ID" className="p-2">{c.id.substring(0,6)}</td>
                    <td data-label="User" className="p-2">{c.userId?.substring(0,6)}</td>
                    <td data-label="Property" className="p-2">{c.propertyId?.substring(0,6)}</td>
                    <td data-label="Subject" className="p-2 font-semibold">{c.subject}</td>
                    <td data-label="Content" className="p-2">
                      <div className="max-w-xs truncate" title={c.content}>{c.content}</div>
                      {c.resolution && <div className="text-xs text-gray-500 mt-1">Ghi chú: {c.resolution}</div>}
                    </td>
                    <td data-label="Status" className="p-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${c.status === 'RESOLVED' ? 'bg-green-100 text-green-800' : c.status === 'REJECTED' ? 'bg-red-100 text-red-800' : c.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td data-label="Action" className="p-2">
                      <select className="border rounded p-1 text-sm outline-none" value={c.status} onChange={e => updateStatus(c.id, e.target.value)}>
                        <option value="PENDING">PENDING</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </td>
                  </tr>
                ))}
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
