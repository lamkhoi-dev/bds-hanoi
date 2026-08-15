"use client";
import { formatNumberString } from '@/lib/utils';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { getAuthToken, isUnauthorizedError } from '@/lib/auth';
import { toast } from 'react-hot-toast';

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [viewingTransaction, setViewingTransaction] = useState<any>(null);

  useEffect(() => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }

    api.get('/admin/transactions')
      .then((res) => {
        setTransactions(res.data?.data || []);
        setTotal(res.data?.total || 0);
      })
      .catch((error) => {
        if (!isUnauthorizedError(error)) console.error(error);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRefund = async (id: string) => {
    const note = window.prompt('Nhập ghi chú hoàn tiền (VD: Chuyển khoản nhầm):');
    if (!note) return;
    try {
      await api.post(`/payment/admin/refund/${id}`, { adminNote: note });
      toast.success('Hoàn tiền thành công');
      setTransactions(transactions.map(t => t.id === id ? { ...t, status: 'REFUNDED', adminNote: note } : t));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi hoàn tiền');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Giao dịch và nạp tiền</h1>
        <p className="text-sm text-gray-500 mt-1">Theo dõi lịch sử giao dịch trên hệ thống.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-mobile-table md:min-w-[860px] w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Người dùng</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3 text-right">Số tiền</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Mô tả</th>
                <th className="px-4 py-3">Ghi chú Admin</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Đang tải...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Chưa có giao dịch</td></tr>
              ) : transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td data-label="Người dùng" className="px-4 py-3">{transaction.user?.name || transaction.user?.email || transaction.userId || '-'}</td>
                  <td data-label="Loại" className="px-4 py-3 font-semibold">{transaction.type}</td>
                  <td data-label="Số tiền" className={`px-4 py-3 text-right font-bold ${['DEPOSIT', 'ADMIN_ADJUST', 'REFUND'].includes(transaction.type) ? 'text-green-600' : 'text-red-600'}`}>{['DEPOSIT', 'ADMIN_ADJUST', 'REFUND'].includes(transaction.type) ? '+' : '-'}{(formatNumberString(Number(transaction.amount || 0) * 1000))} đ</td>
                  <td data-label="Trạng thái" className="px-4 py-3">{transaction.status}</td>
                  <td data-label="Mô tả" className="px-4 py-3 max-w-sm truncate">{transaction.description || '-'}</td>
                  <td data-label="Ghi chú Admin" className="px-4 py-3 max-w-sm truncate">{transaction.adminNote || '-'}</td>
                  <td data-label="Ngày tạo" className="px-4 py-3 text-gray-500">{transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                  <td data-label="Hành động" className="px-4 py-3 text-right">
                      <button
                        onClick={() => setViewingTransaction(transaction)}
                        className="text-blue-600 hover:text-blue-900 font-medium text-sm mr-3"
                      >
                        Xem
                      </button>
                    {transaction.status !== 'REFUNDED' && (
                      <button
                        onClick={() => handleRefund(transaction.id)}
                        className="text-red-600 hover:text-red-900 font-medium text-sm"
                      >
                        Hoàn tiền
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
          Hiển thị {transactions.length} / {total} giao dịch
        </div>
      </div>

      {/* View Modal */}
      {viewingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">Chi tiết Giao dịch</h3>
              <button onClick={() => setViewingTransaction(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mã giao dịch</label>
                  <p className="font-medium text-gray-900">{viewingTransaction.id}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Người dùng</label>
                  <p className="font-medium text-gray-900">{viewingTransaction.user?.name || viewingTransaction.user?.email || viewingTransaction.userId}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Loại giao dịch</label>
                  <p className="font-medium text-gray-900">{viewingTransaction.type}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Số tiền</label>
                  <p className={`font-bold ${['DEPOSIT', 'ADMIN_ADJUST', 'REFUND'].includes(viewingTransaction.type) ? 'text-green-600' : 'text-red-600'}`}>{['DEPOSIT', 'ADMIN_ADJUST', 'REFUND'].includes(viewingTransaction.type) ? '+' : '-'}{(formatNumberString(Number(viewingTransaction.amount || 0) * 1000))} đ</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Trạng thái</label>
                  <p className="font-medium text-gray-900">{viewingTransaction.status}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Ngày tạo</label>
                  <p className="font-medium text-gray-900">{new Date(viewingTransaction.createdAt).toLocaleString('vi-VN')}</p>
                </div>
              </div>
              <div className="mt-4 border-t pt-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mô tả</label>
                <div className="bg-gray-50 rounded-lg p-3 text-gray-700 text-sm border border-gray-100">
                  {viewingTransaction.description || 'Không có mô tả'}
                </div>
              </div>
              {viewingTransaction.adminNote && (
                <div className="mt-4 border-t pt-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-red-600">Ghi chú Admin (Hoàn tiền)</label>
                  <div className="bg-red-50 rounded-lg p-3 text-red-800 text-sm border border-red-100">
                    {viewingTransaction.adminNote}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button onClick={() => setViewingTransaction(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
