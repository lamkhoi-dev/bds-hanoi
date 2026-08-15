"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toMediaUrl } from '@/lib/media';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { confirmAction } from '@/lib/toast-helpers';


declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar: '',
    isPhoneVisible: true,
    isNotificationEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  
  // Phone State
  const [phoneData, setPhoneData] = useState({ currentPhone: '', newPhone: '', otp: '' });
  const [stepPhone, setStepPhone] = useState<'IDLE' | 'OTP_SENT'>('IDLE');
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [phoneMsg, setPhoneMsg] = useState({ type: '', text: '' });

  // Password State
  const [passData, setPassData] = useState({ oldPassword: '', newPassword: '' });
  const [passSaving, setPassSaving] = useState(false);
  const [showPassForm, setShowPassForm] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });

  // Email State
  const [emailData, setEmailData] = useState({ currentEmail: '', isVerified: false, newEmail: '', otp: '' });
  const [stepEmail, setStepEmail] = useState<'IDLE' | 'OTP_SENT'>('IDLE');
  const [emailAction, setEmailAction] = useState<'CHANGE' | 'VERIFY_CURRENT'>('CHANGE');
  const [emailSaving, setEmailSaving] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailMsg, setEmailMsg] = useState({ type: '', text: '' });

  

  const fieldErrors = {
    name: !formData.name ? 'Họ và tên không được để trống' : '',
  };

  const isFormValid = Object.values(fieldErrors).every(err => err === '');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        if (res.data) {
          setFormData({
            name: res.data.name || '',
            bio: res.data.bio || '',
            avatar: res.data.avatar || '',
            isPhoneVisible: res.data.isPhoneVisible ?? true,
            isNotificationEnabled: res.data.isNotificationEnabled ?? true,
          });
          setPhoneData(prev => ({ ...prev, currentPhone: res.data.phone || '' }));
          setEmailData(prev => ({
            ...prev,
            currentEmail: res.data.email || '',
            currentPhone: res.data.phone || '',
            isVerified: res.data.emailVerified || false,
          }));
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  
  const handleRequestPhoneChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneSaving(true);
    setPhoneMsg({ type: '', text: '' });
    
    if (!/^(\+84|0)[3|5|7|8|9][0-9]{8}$/.test(phoneData.newPhone)) {
      setPhoneMsg({ type: 'error', text: 'Số điện thoại không hợp lệ (VD: 0912345678).' });
      setPhoneSaving(false);
      return;
    }

    try {
      let formattedPhone = phoneData.newPhone;
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+84' + formattedPhone.slice(1);
      }

      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
      }

      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;

      setPhoneMsg({ type: 'success', text: 'Mã xác thực đã được gửi đến số điện thoại mới.' });
      setStepPhone('OTP_SENT');
    } catch (err: any) {
      console.error(err);
      setPhoneMsg({ type: 'error', text: 'Lỗi gửi mã OTP. Vui lòng thử lại.' });
    } finally {
      setPhoneSaving(false);
    }
  };

  const handleVerifyPhoneChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneSaving(true);
    setPhoneMsg({ type: '', text: '' });
    try {
      if (!window.confirmationResult) throw new Error('Không tìm thấy phiên xác thực.');
      const result = await window.confirmationResult.confirm(phoneData.otp);
      const idToken = await result.user.getIdToken();

      const res = await api.post('/auth/update-phone-firebase', { idToken });
      
      setPhoneMsg({ type: 'success', text: 'Cập nhật số điện thoại thành công.' });
      setPhoneData({ ...phoneData, currentPhone: res.data?.phone || phoneData.newPhone, newPhone: '', otp: '' });
      setStepPhone('IDLE');
    } catch (err: any) {
      console.error(err);
      setPhoneMsg({ type: 'error', text: err.response?.data?.message || 'Mã xác thực không hợp lệ.' });
    } finally {
      setPhoneSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassSaving(true);
    setPassMsg({ type: '', text: '' });
    try {
      await api.post('/auth/change-password', passData);
      setPassMsg({ type: 'success', text: 'Đổi mật khẩu thành công.' });
      setPassData({ oldPassword: '', newPassword: '' });
    } catch (err: any) {
      setPassMsg({ type: 'error', text: err.response?.data?.message || 'Có lỗi xảy ra.' });
    } finally {
      setPassSaving(false);
    }
  };

  const handleRequestVerification = async () => {
    setEmailSaving(true);
    setEmailMsg({ type: '', text: '' });
    try {
      await api.post('/auth/request-verification-email');
      setEmailMsg({ type: 'success', text: 'Mã xác thực đã được gửi đến email của bạn.' });
      setEmailAction('VERIFY_CURRENT');
      setStepEmail('OTP_SENT');
    } catch (err: any) {
      setEmailMsg({ type: 'error', text: err.response?.data?.message || 'Có lỗi xảy ra.' });
    } finally {
      setEmailSaving(false);
    }
  };

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSaving(true);
    setEmailMsg({ type: '', text: '' });
    try {
      await api.post('/auth/request-email-change', { newEmail: emailData.newEmail });
      setEmailMsg({ type: 'success', text: 'Mã xác thực đã được gửi đến email mới của bạn.' });
      setEmailAction('CHANGE');
      setStepEmail('OTP_SENT');
    } catch (err: any) {
      setEmailMsg({ type: 'error', text: err.response?.data?.message || 'Có lỗi xảy ra.' });
    } finally {
      setEmailSaving(false);
    }
  };

  const handleVerifyEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSaving(true);
    setEmailMsg({ type: '', text: '' });
    try {
      if (emailAction === 'VERIFY_CURRENT') {
        await api.post('/auth/verify-activation-otp', { email: emailData.currentEmail, otp: emailData.otp });
        setEmailMsg({ type: 'success', text: 'Xác thực email thành công.' });
        setEmailData({ ...emailData, isVerified: true, otp: '' });
      } else {
        await api.post('/auth/verify-email-change', { otp: emailData.otp });
        setEmailMsg({ type: 'success', text: 'Cập nhật và xác thực email thành công.' });
        setEmailData({ ...emailData, currentEmail: emailData.newEmail, isVerified: true, newEmail: '', otp: '' });
      }
      setStepEmail('IDLE');
    } catch (err: any) {
      setEmailMsg({ type: 'error', text: err.response?.data?.message || 'Mã xác thực không hợp lệ.' });
    } finally {
      setEmailSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setTouched({ name: true });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await api.post('/users/profile', formData);
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Đang tải thông tin...</div>;
  }

  return (
    <div className="max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Cập nhật tài khoản</h1>
        <p className="text-gray-500">Quản lý thông tin cá nhân của bạn</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Field */}
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20 bg-gray-100 flex-shrink-0">
            {formData.avatar ? (
              <img src={toMediaUrl(formData.avatar)} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-2xl">
                {formData.name ? formData.name.charAt(0) : 'U'}
              </div>
            )}
            {avatarUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh đại diện</label>
            <input 
              type="file" 
              accept="image/*" 
              disabled={avatarUploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) {
                  toast.error('Ảnh quá lớn. Vui lòng chọn ảnh < 5MB.');
                  return;
                }
                setAvatarUploading(true);
                try {
                  const data = new FormData();
                  data.append('file', file);
                  const res = await api.post('/properties/upload', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                  });
                  setFormData(prev => ({ ...prev, avatar: res.data.url }));
                } catch (e) {
                  console.error(e);
                  toast.error('Lỗi khi tải ảnh lên. Vui lòng thử lại.');
                } finally {
                  setAvatarUploading(false);
                }
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
            />
            <p className="text-xs text-gray-400 mt-2">Định dạng JPG, PNG, GIF. Kích thước tối đa 5MB.</p>
          </div>
        </div>

        {/* Name Field */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={e => {
              setFormData({ ...formData, name: e.target.value });
              setTouched({ ...touched, name: true });
            }}
            className={`w-full px-4 py-3 bg-gray-50/50 border rounded-xl outline-none transition-colors ${
              touched.name && fieldErrors.name
                ? 'border-red-400 focus:border-red-500 focus:bg-white'
                : 'border-gray-200 focus:border-primary focus:bg-white'
            }`}
            placeholder="Nhập họ và tên"
          />
          {touched.name && fieldErrors.name && (
            <p className="text-red-500 text-xs mt-1.5 font-medium">{fieldErrors.name}</p>
          )}
        </div>

        {/* Bio Field */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Giới thiệu bản thân (Tùy chọn)</label>
          <textarea
            value={formData.bio}
            onChange={e => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none transition-colors focus:border-primary focus:bg-white resize-none"
            placeholder="Giới thiệu đôi nét về bạn..."
          />
        </div>

        {/* Privacy & Notification Settings */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h3 className="font-semibold text-gray-800">Cài đặt Quyền riêng tư & Thông báo</h3>
          
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPhoneVisible"
              checked={formData.isPhoneVisible}
              onChange={e => setFormData({ ...formData, isPhoneVisible: e.target.checked })}
              className="w-5 h-5 rounded text-primary focus:ring-primary border-gray-300"
            />
            <label htmlFor="isPhoneVisible" className="text-sm text-gray-700 font-medium">Hiển thị số điện thoại của tôi trên tin đăng</label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isNotificationEnabled"
              checked={formData.isNotificationEnabled}
              onChange={e => setFormData({ ...formData, isNotificationEnabled: e.target.checked })}
              className="w-5 h-5 rounded text-primary focus:ring-primary border-gray-300"
            />
            <label htmlFor="isNotificationEnabled" className="text-sm text-gray-700 font-medium">Nhận thông báo qua Email khi có tin nhắn/duyệt tin</label>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !isFormValid}
          className="w-full sm:w-auto px-8 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
        </button>
      </form>

      <hr className="my-10 border-gray-100" />

      {/* Phone Management Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Quản lý Số điện thoại</h2>
        <p className="text-gray-500">Cập nhật và xác thực số điện thoại của bạn (Không bắt buộc)</p>
      </div>

      {phoneMsg.text && (
        <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${phoneMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <span className="font-medium">{phoneMsg.text}</span>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại hiện tại</label>
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <span className={`font-medium ${phoneData.currentPhone ? 'text-gray-900' : 'text-gray-400'}`}>
                {phoneData.currentPhone || 'Chưa cập nhật'}
              </span>
              {phoneData.currentPhone ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full whitespace-nowrap flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Đã xác thực
                </span>
              ) : (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full whitespace-nowrap flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  Chưa có SĐT
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowPhoneForm(!showPhoneForm)}
              className="text-sm text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              {showPhoneForm ? 'Đóng' : (phoneData.currentPhone ? 'Thay đổi' : 'Thêm mới')}
            </button>
          </div>
        </div>

        {showPhoneForm && (
          <div className="pt-4 border-t border-gray-100 mt-4 animate-in fade-in slide-in-from-top-2">
            {stepPhone === 'IDLE' ? (
              <form onSubmit={handleRequestPhoneChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {phoneData.currentPhone ? 'Đổi Số điện thoại' : 'Thêm Số điện thoại'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneData.newPhone}
                    onChange={e => setPhoneData({ ...phoneData, newPhone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:border-primary focus:bg-white"
                    placeholder="Nhập số điện thoại (VD: 0912345678)"
                  />
                </div>
                <button
                  type="submit"
                  id="send-otp-btn-phone"
                  disabled={phoneSaving || !phoneData.newPhone}
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {phoneSaving ? 'ĐANG GỬI MÃ...' : (phoneData.currentPhone ? 'CẬP NHẬT SỐ ĐIỆN THOẠI' : 'THÊM SỐ ĐIỆN THOẠI')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneChange} className="space-y-4 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-2">Mã xác thực (OTP)</label>
                  <p className="text-xs text-blue-700 mb-3">Vui lòng kiểm tra tin nhắn SMS gửi đến số <strong>{phoneData.newPhone}</strong> để lấy mã xác thực gồm 6 số.</p>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={phoneData.otp}
                    onChange={e => setPhoneData({ ...phoneData, otp: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl outline-none focus:border-blue-500 text-center tracking-[0.5em] text-lg font-bold"
                    placeholder="------"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={phoneSaving || phoneData.otp.length < 6}
                    className="flex-1 px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {phoneSaving ? 'ĐANG XÁC THỰC...' : 'XÁC THỰC'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStepPhone('IDLE')}
                    className="px-6 py-3.5 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
      <div id="recaptcha-container"></div>

      <hr className="my-10 border-gray-100" />

      {/* Email Management Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Quản lý Email</h2>
        <p className="text-gray-500">Cập nhật và xác thực địa chỉ email của bạn</p>
      </div>

      {emailMsg.text && (
        <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${emailMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <span className="font-medium">{emailMsg.text}</span>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email hiện tại</label>
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <span className={`font-medium ${emailData.currentEmail ? 'text-gray-900' : 'text-gray-400'}`}>
                {emailData.currentEmail || 'Chưa cập nhật'}
              </span>
              {emailData.isVerified ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full whitespace-nowrap flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Đã xác thực
                </span>
              ) : (
                <div className="flex flex-col items-start gap-1">
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full whitespace-nowrap flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Chưa xác thực
                  </span>
                  <button
                    type="button"
                    onClick={handleRequestVerification}
                    disabled={emailSaving}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold underline disabled:opacity-50 ml-1"
                  >
                    Xác thực ngay
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowEmailForm(!showEmailForm)}
              className="text-sm text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              {showEmailForm ? 'Đóng' : (emailData.currentEmail ? 'Thay đổi' : 'Thêm mới')}
            </button>
          </div>
        </div>

        {showEmailForm && (
          <div className="pt-4 border-t border-gray-100 mt-4 animate-in fade-in slide-in-from-top-2">
            {stepEmail === 'IDLE' ? (
              <form onSubmit={handleRequestEmailChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {emailData.currentEmail ? 'Đổi Email mới' : 'Thêm Email'}
                  </label>
                  <input
                    type="email"
                    required
                    value={emailData.newEmail}
                    onChange={e => setEmailData({ ...emailData, newEmail: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:border-primary focus:bg-white"
                    placeholder="Nhập địa chỉ email mới"
                  />
                </div>
                <button
                  type="submit"
                  disabled={emailSaving || !emailData.newEmail}
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {emailSaving ? 'ĐANG XỬ LÝ...' : (emailData.currentEmail ? 'CẬP NHẬT EMAIL' : 'THÊM EMAIL')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailChange} className="space-y-4 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-2">Mã xác thực (OTP)</label>
                  <p className="text-xs text-blue-700 mb-3">Vui lòng kiểm tra hộp thư email <strong>{emailAction === 'VERIFY_CURRENT' ? emailData.currentEmail : emailData.newEmail}</strong> để lấy mã xác thực gồm 6 số.</p>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={emailData.otp}
                    onChange={e => setEmailData({ ...emailData, otp: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl outline-none focus:border-blue-500 text-center tracking-[0.5em] text-lg font-bold"
                    placeholder="------"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={emailSaving || emailData.otp.length < 6}
                    className="flex-1 px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {emailSaving ? 'ĐANG XÁC THỰC...' : 'XÁC THỰC'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStepEmail('IDLE')}
                    className="px-6 py-3.5 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      <hr className="my-10 border-gray-100" />

      {/* Change Password Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Thay đổi mật khẩu</h2>
        <p className="text-gray-500">Đảm bảo tài khoản của bạn đang sử dụng mật khẩu mạnh</p>
      </div>

      {passMsg.text && (
        <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${passMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <span className="font-medium">{passMsg.text}</span>
        </div>
      )}

      <div className="space-y-4">
        {!showPassForm ? (
          <button
            type="button"
            onClick={() => setShowPassForm(true)}
            className="px-6 py-3 border-2 border-accent text-accent font-bold rounded-xl hover:bg-accent/5 transition-colors"
          >
            Thay đổi mật khẩu
          </button>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-6 animate-in fade-in slide-in-from-top-2 border border-gray-100 p-6 rounded-2xl bg-gray-50/50">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu hiện tại</label>
              <input
                type="password"
                value={passData.oldPassword}
                onChange={e => setPassData({ ...passData, oldPassword: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-primary"
                placeholder="Để trống nếu bạn đăng nhập bằng Google/Facebook"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu mới</label>
              <input
                type="password"
                required
                value={passData.newPassword}
                onChange={e => setPassData({ ...passData, newPassword: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-primary"
                placeholder="Nhập mật khẩu mới"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={passSaving || !passData.newPassword}
                className="w-full sm:w-auto px-8 py-3.5 bg-accent text-white font-bold rounded-xl hover:bg-accent-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {passSaving ? 'ĐANG LƯU...' : 'LƯU MẬT KHẨU MỚI'}
              </button>
              <button
                type="button"
                onClick={() => setShowPassForm(false)}
                className="px-6 py-3.5 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
            </div>
          </form>
        )}
      </div>
      <hr className="my-10 border-gray-100" />
      <div className="mb-8">
        <h2 className="text-xl font-bold text-red-600 mb-2">Xóa tài khoản</h2>
        <p className="text-gray-500 mb-4">Gửi yêu cầu xóa toàn bộ dữ liệu cá nhân của bạn khỏi hệ thống.</p>
        <button 
          onClick={async () => {
            const confirmed = await confirmAction('Bạn có chắc chắn muốn xóa tài khoản?');
            if (confirmed) {
              try {
                await api.post('/users/data-deletion-request', { reason: 'Tôi muốn xóa tài khoản' });
                toast.success('Yêu cầu đã được gửi!');
              } catch (e) {
                toast.error('Có lỗi xảy ra');
              }
            }
          }}
          className="px-6 py-2 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 transition-colors"
        >
          Yêu cầu Xóa Dữ liệu
        </button>
      </div>
    </div>
  );
}

