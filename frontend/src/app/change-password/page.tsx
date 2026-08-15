"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/change-password', { oldPassword, newPassword });
      toast.success('Đổi mật khẩu thành công! Chào mừng bạn đến hệ thống.');
      router.push('/admin'); // Assuming forced change is mainly for admins
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">Đổi Mật Khẩu Bắt Buộc</h1>
        <p className="text-gray-500 text-sm text-center mb-6">
          Đây là lần đăng nhập đầu tiên hoặc tài khoản của bạn vừa được cấp lại. Vui lòng đổi mật khẩu để tiếp tục sử dụng hệ thống.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu cũ / Mật khẩu ngẫu nhiên</label>
            <input 
              type="password" 
              required
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-gray-50"
              placeholder="Nhập mật khẩu hiện tại"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu mới</label>
            <input 
              type="password" 
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-gray-50"
              placeholder="Ít nhất 6 ký tự"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
            <input 
              type="password" 
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-gray-50"
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-70 mt-2"
          >
            {loading ? 'Đang xử lý...' : 'Đổi Mật Khẩu & Tiếp Tục'}
          </button>
        </form>
      </div>
    </div>
  );
}
