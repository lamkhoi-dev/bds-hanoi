"use client";

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data?.message || 'Nếu email tồn tại, mã OTP sẽ được gửi đến hộp thư của bạn.');
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi yêu cầu khôi phục mật khẩu lúc này.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', { email, otp, newPassword });
      setMessage(response.data?.message || 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.');
      setStep(1);
      setEmail('');
      setOtp('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-card p-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Quên mật khẩu</h1>
        <p className="text-sm text-gray-500 mb-6">
          Nhập email tài khoản để nhận mã OTP đặt lại mật khẩu.
        </p>
        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full p-3 border rounded-lg" required />
            <button type="submit" disabled={loading} className="w-full bg-primary text-white p-3 rounded-lg">{loading ? 'Đang gửi...' : 'Gửi mã OTP'}</button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Mã OTP" className="w-full p-3 border rounded-lg" required />
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mật khẩu mới" className="w-full p-3 border rounded-lg" required />
            <button type="submit" disabled={loading} className="w-full bg-primary text-white p-3 rounded-lg">{loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}</button>
          </form>
        )}
        {message && <p className="mt-4 text-green-600 text-sm">{message}</p>}
        {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}
        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="text-primary font-medium hover:underline">
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
