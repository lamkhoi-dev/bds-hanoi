"use client";
import { formatNumberString } from '@/lib/utils';

import { useCallback, useEffect, useState } from 'react';
import { UserCircle, Lock, Unlock, Zap, Search, Edit, Key } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { getAuthToken, isUnauthorizedError } from '@/lib/auth';
import { toast } from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', role: '', bio: '' });
  
  const [confirmModal, setConfirmModal] = useState<{ message: string; action: () => void } | null>(null);
  const [topupModal, setTopupModal] = useState<{ userId: string; amount: string; description: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/admin/users', { params: { search: search || undefined, status: status || undefined, page, limit } });
      setUsers(res.data.data);
      setTotal(res.data.total);
    } catch (e) {
      if (!isUnauthorizedError(e)) console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const handleToggleStatus = (userId: string, currentStatus: string) => {
    setConfirmModal({
      message: 'Bạn có chắc chắn muốn thay đổi trạng thái user này?',
      action: async () => {
        try {
          await api.put(`/admin/users/${userId}/status`, { status: currentStatus === 'BANNED' ? 'ACTIVE' : 'BANNED' });
          fetchUsers();
          toast.success('Đã cập nhật trạng thái user');
        } catch (e) {
          if (!isUnauthorizedError(e)) toast.error('Lỗi khi cập nhật trạng thái');
        }
      }
    });
  };

  const handleWalletTopup = (userId: string) => {
    setTopupModal({ userId, amount: '', description: 'Admin cộng tiền thủ công' });
  };

  const executeWalletTopup = async () => {
    if (!topupModal) return;
    const amount = Number(topupModal.amount);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      toast.error('Số tiền không hợp lệ. Vui lòng nhập số nguyên dương.');
      return;
    }
    try {
      await api.post(`/admin/users/${topupModal.userId}/wallet`, { amount, description: topupModal.description });
      fetchUsers();
      toast.success('Cộng tiền thành công');
      setTopupModal(null);
    } catch {
      toast.error('Không thể cập nhật ví');
    }
  };

  const handleResetPassword = (userId: string) => {
    setConfirmModal({
      message: 'Bạn có chắc chắn muốn cấp lại mật khẩu cho user này?',
      action: async () => {
        try {
          const res = await api.post(`/admin/users/${userId}/reset-password`);
          toast.success(`Mật khẩu mới: ${res.data.newPassword}`, { duration: 10000 });
        } catch (e) {
          if (!isUnauthorizedError(e)) {
            console.error(e);
            toast.error('Cấp lại mật khẩu thất bại');
          }
        }
      }
    });
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setEditForm({
      fullName: user.name || '',
      phone: user.phone || '',
      role: user.role || 'USER',
      bio: user.bio || '',
    });
  };

  const closeEditModal = () => {
    setEditingUser(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await api.put(`/admin/users/${editingUser.id}`, editForm);
      toast.success('Cập nhật thành công');
      setEditingUser(null);
      fetchUsers();
    } catch (e) {
      if (!isUnauthorizedError(e)) {
        console.error(e);
        toast.error('Cập nhật thất bại');
      }
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl font-extrabold text-gray-900">Quản lý Tài khoản (User)</h1>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm SĐT, Tên, Email..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="font-sans border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
          <option className="font-sans" value="">Tất cả Trạng thái</option>
          <option className="font-sans" value="ACTIVE">Đang hoạt động</option>
          <option className="font-sans" value="BANNED">Bị khóa</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-mobile-table w-full md:min-w-[900px] text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Tài khoản</th>
                <th className="px-6 py-4">Liên hệ</th>
                <th className="px-6 py-4 text-center">Số tin đã đăng</th>
                <th className="px-6 py-4 text-center">Số dư (VNĐ)</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-4">Đang tải...</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td data-label="Tài khoản" className="px-6 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-100 to-indigo-100 text-blue-600 rounded-full flex items-center justify-center font-bold overflow-hidden">
                      {user.avatar ? <img src={user.avatar} alt="avatar" /> : user.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{user.name || user.email || 'Người dùng'}</div>
                      <div className="text-gray-500 text-xs mt-0.5">Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN')}</div>
                    </div>
                  </td>
                  <td data-label="Liên hệ" className="px-6 py-4">
                    <div className="font-medium text-gray-700">{user.phone || 'Chưa cập nhật'}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{user.email}</div>
                  </td>
                  <td data-label="Số tin đã đăng" className="px-6 py-4 text-center font-bold text-gray-700">
                    {user._count?.properties || 0} tin
                  </td>
                  <td data-label="Số dư (VNĐ)" className="px-6 py-4 text-center font-bold text-green-600">
                    {formatNumberString((user.balance || 0) * 1000)} đ
                  </td>
                  <td data-label="Trạng thái" className="px-6 py-4">
                    {user.status === 'BANNED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600" /> Bị khóa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-600" /> Hoạt động
                      </span>
                    )}
                  </td>
                  <td data-label="Thao tác" className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleWalletTopup(user.id)} className="inline-flex p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Nạp điểm">
                      <Zap size={18} />
                    </button>
                    <Link href={`/admin/users/${user.id}`} className="inline-flex p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Xem chi tiết User">
                      <UserCircle size={18} />
                    </Link>
                    <button onClick={() => openEditModal(user)} className="inline-flex p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa thông tin">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleResetPassword(user.id)} className="inline-flex p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" title="Cấp lại mật khẩu">
                      <Key size={18} />
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(user.id, user.status)}
                      className={`inline-flex p-2 rounded-lg transition-colors ${user.status === 'BANNED' ? 'text-gray-500 hover:text-green-600 hover:bg-green-50' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'}`}
                      title={user.status === 'BANNED' ? 'Mở khóa' : 'Khóa User'}
                    >
                      {user.status === 'BANNED' ? <Unlock size={18} /> : <Lock size={18} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <span className="text-sm text-gray-500">Hiển thị {users.length} của {total} users</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="px-3 py-1 border border-gray-200 bg-white rounded text-sm disabled:opacity-50">Trước</button>
            {[page, page + 1, page + 2].filter((value) => value <= totalPages).map((value) => (
              <button key={value} onClick={() => setPage(value)} className={`px-3 py-1 border border-gray-200 rounded text-sm ${value === page ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-white'}`}>{value}</button>
            ))}
            <button disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="px-3 py-1 border border-gray-200 bg-white rounded text-sm disabled:opacity-50">Sau</button>
          </div>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">Sửa thông tin User</h3>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Họ tên</label>
                <input required type="text" value={editForm.fullName} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Số điện thoại</label>
                <input type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Quyền</label>
                <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="USER">Người dùng (USER)</option>
                  <option value="MOD">Kiểm duyệt viên (MOD)</option>
                  <option value="ADMIN">Quản trị viên (ADMIN)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Giới thiệu (Bio)</label>
                <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={3}></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeEditModal} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg font-bold">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden p-6">
            <h3 className="font-bold text-lg mb-4 text-gray-800">Xác nhận</h3>
            <p className="text-gray-600 mb-6">{confirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmModal(null)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg font-bold">Hủy</button>
              <button onClick={() => { confirmModal.action(); setConfirmModal(null); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {topupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden p-6">
            <h3 className="font-bold text-lg mb-4 text-gray-800">Cộng tiền vào ví</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Số tiền (VNĐ)</label>
                <input type="number" value={topupModal.amount} onChange={e => setTopupModal({ ...topupModal, amount: e.target.value })} className="w-full px-3 py-2 border rounded-lg" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nội dung ghi chú</label>
                <input type="text" value={topupModal.description} onChange={e => setTopupModal({ ...topupModal, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setTopupModal(null)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg font-bold">Hủy</button>
              <button onClick={executeWalletTopup} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">Cộng tiền</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
