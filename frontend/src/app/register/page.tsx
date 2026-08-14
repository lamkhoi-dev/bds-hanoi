"use client";
import { useState, useEffect } from 'react';
import { siteConfig } from '@/lib/site-config';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({ lastName: '', firstName: '', phone: '', email: '', password: '', purpose: 'FIND_BDS' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const phoneRegex = /^(0|\+84)[35789][0-9]{8}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const fieldErrors = {
    lastName: !formData.lastName ? 'Họ và tên đệm không được để trống' : '',
    firstName: !formData.firstName ? 'Tên không được để trống' : '',
    phone: !formData.phone ? 'Số điện thoại không được để trống' : !phoneRegex.test(formData.phone) ? 'Số điện thoại không hợp lệ (vd: 0912345678)' : '',
    email: !formData.email ? 'Email không được để trống' : !emailRegex.test(formData.email) ? 'Email không hợp lệ (vd: name@example.com)' : '',
    password: !formData.password ? 'Mật khẩu không được để trống' : !passwordRegex.test(formData.password) ? 'Mật khẩu ít nhất 8 ký tự, gồm chữ hoa, thường, số, ký tự đặc biệt' : '',
    confirmPassword: !confirmPassword ? 'Vui lòng xác nhận mật khẩu' : formData.password !== confirmPassword ? 'Mật khẩu xác nhận không khớp' : '',
  };

  const isFormValid = Object.values(fieldErrors).every(err => err === '') && agreeTerms;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setTouched({ lastName: true, firstName: true, phone: true, email: true, password: true, confirmPassword: true });
      return;
    }
    setError('');
    setLoading(true);
    try {
      const submitData = {
        ...formData,
        name: `${formData.lastName.trim()} ${formData.firstName.trim()}`
      };
      await api.post('/auth/register', submitData);
      setIsOtpStep(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký');
    } finally {
      setLoading(false);
    }
  };

  const { login: setAuthUser } = useAuth();
  
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length !== 6) {
      setError('Mã OTP phải có 6 chữ số.');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await api.post('/auth/verify-activation-otp', { email: formData.email, otp });
      // Token is now set automatically via HttpOnly cookie
      toast.success('Đăng ký thành công!');
      if (res.data.user) setAuthUser(res.data.user);
      if (res.data.user?.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/user/my-listings');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    try {
      await api.post('/auth/resend-activation-otp', { email: formData.email });
      toast.success('Mã OTP mới đã được gửi tới email của bạn.');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi lại mã OTP.');
    }
  };

  return (
    <div className="min-h-[90vh] flex items-stretch bg-gradient-to-br from-[#0a1628] via-primary to-[#1a1a4e] relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute top-[-100px] right-[-80px] w-[400px] h-[400px] bg-accent/20 rounded-full blur-[100px] animate-blob" />
      <div className="absolute bottom-[-120px] left-[-60px] w-[350px] h-[350px] bg-blue-400/15 rounded-full blur-[100px] animate-blob animation-delay-2000" />
      <div className="absolute top-1/3 right-1/3 w-[250px] h-[250px] bg-purple-500/10 rounded-full blur-[80px] animate-blob animation-delay-4000" />

      {/* Left Panel - Illustration / Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center px-12 relative z-10">
        {/* Decorative floating elements */}
        <div className="absolute top-24 right-20 w-16 h-16 border-2 border-white/10 rounded-xl -rotate-12 animate-float" />
        <div className="absolute bottom-28 left-16 w-10 h-10 border-2 border-accent/20 rounded-full animate-float animation-delay-2000" />
        <div className="absolute top-1/4 left-20 w-6 h-6 bg-accent/30 rounded-md rotate-45 animate-float animation-delay-4000" />

        {/* Main illustration area */}
        <div className="text-center max-w-md">
          {/* Key/Shield Icon SVG */}
          <div className="mb-8 flex justify-center">
            <div className="w-28 h-28 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 flex items-center justify-center shadow-2xl p-4">
              <Image src="/logo/logo-icon.svg" alt="Logo" width={80} height={80} className="w-full h-full object-contain" priority />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            Tạo tài khoản mới
          </h1>
          <p className="text-lg text-blue-200/70 leading-relaxed mb-8">
            Tham gia cộng đồng bất động sản lớn nhất {siteConfig.province.name}. Đăng tin, tìm kiếm và kết nối dễ dàng.
          </p>
          {/* Benefits */}
          <div className="space-y-4 text-left">
            {[
              { icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z', text: 'Đăng tin miễn phí không giới hạn' },
              { icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z', text: 'Tìm kiếm BĐS thông minh với AI' },
              { icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z', text: 'Nhận thông báo bất động sản phù hợp' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <svg className="w-5 h-5 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span className="text-blue-200/60 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Glassmorphism Card */}
          <div className="bg-white/[0.95] backdrop-blur-xl rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.3)] p-8 sm:p-10 border border-white/50 relative overflow-hidden">
            {/* Subtle gradient overlay on card */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-accent/5 to-transparent rounded-br-full pointer-events-none" />

            {/* Mobile logo */}
            <div className="lg:hidden flex justify-center mb-6">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg p-2 border border-gray-100">
                <Image src="/logo/logo-icon.svg" alt="Logo" width={40} height={40} className="w-full h-full object-contain" priority />
              </div>
            </div>

            {/* Step Indicator Visual */}
            <div className="flex items-center justify-center gap-2 mb-6 relative z-10">
              {['Thông tin', 'Xác nhận', 'Hoàn tất'].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    (i === 0 && !isOtpStep) || (i === 1 && isOtpStep)
                      ? 'bg-gradient-to-r from-accent to-orange-400 text-white shadow-md shadow-accent/30'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:inline ${((i === 0 && !isOtpStep) || (i === 1 && isOtpStep)) ? 'text-accent' : 'text-gray-300'}`}>{step}</span>
                  {i < 2 && <div className={`w-6 h-0.5 ${((i === 0 && !isOtpStep) || (i === 1 && isOtpStep)) ? 'bg-accent/40' : 'bg-gray-100'}`} />}
                </div>
              ))}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary text-center mb-2 relative z-10">
              {isOtpStep ? 'Xác Thực Tài Khoản' : 'Đăng Ký Tài Khoản'}
            </h2>
            <p className="text-sm text-gray-400 text-center mb-7 relative z-10">
              {isOtpStep ? `Vui lòng nhập mã OTP đã gửi đến email ${formData.email}` : 'Điền thông tin để tạo tài khoản mới'}
            </p>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-5 animate-shake relative z-10">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {!isOtpStep ? (
              <form className="space-y-4 relative z-10" onSubmit={handleSubmit}>
                {/* Name Fields */}
                <div className="flex gap-4">
                  <div className="group flex-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Họ và tên đệm</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className={`w-5 h-5 transition-colors duration-300 ${touched.lastName && fieldErrors.lastName ? 'text-red-400' : 'text-gray-400 group-focus-within:text-primary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={e => {
                          setFormData({...formData, lastName: e.target.value});
                          setTouched({...touched, lastName: true});
                        }}
                        onBlur={() => setTouched({...touched, lastName: true})}
                        className={`w-full pl-12 pr-4 py-3.5 bg-gray-50/80 border-2 rounded-xl outline-none transition-all duration-300 text-textMain placeholder:text-gray-300 ${
                          touched.lastName && fieldErrors.lastName
                            ? 'border-red-400 focus:border-red-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(248,113,113,0.1)]'
                            : 'border-gray-100 focus:border-primary/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,52,96,0.08)]'
                        }`}
                        placeholder="Nguyễn Văn"
                      />
                    </div>
                    {touched.lastName && fieldErrors.lastName && (
                      <p className="text-red-500 text-xs mt-1.5 font-medium">{fieldErrors.lastName}</p>
                    )}
                  </div>

                  <div className="group flex-[0.6]">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tên</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={e => {
                          setFormData({...formData, firstName: e.target.value});
                          setTouched({...touched, firstName: true});
                        }}
                        onBlur={() => setTouched({...touched, firstName: true})}
                        className={`w-full px-4 py-3.5 bg-gray-50/80 border-2 rounded-xl outline-none transition-all duration-300 text-textMain placeholder:text-gray-300 ${
                          touched.firstName && fieldErrors.firstName
                            ? 'border-red-400 focus:border-red-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(248,113,113,0.1)]'
                            : 'border-gray-100 focus:border-primary/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,52,96,0.08)]'
                        }`}
                        placeholder="An"
                      />
                    </div>
                    {touched.firstName && fieldErrors.firstName && (
                      <p className="text-red-500 text-xs mt-1.5 font-medium">{fieldErrors.firstName}</p>
                    )}
                  </div>
                </div>

                {/* Phone Field */}
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Số điện thoại</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className={`w-5 h-5 transition-colors duration-300 ${touched.phone && fieldErrors.phone ? 'text-red-400' : 'text-gray-400 group-focus-within:text-primary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                    </div>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={e => {
                        setFormData({...formData, phone: e.target.value});
                        setTouched({...touched, phone: true});
                      }}
                      onBlur={() => setTouched({...touched, phone: true})}
                      className={`w-full pl-12 pr-4 py-3.5 bg-gray-50/80 border-2 rounded-xl outline-none transition-all duration-300 text-textMain placeholder:text-gray-300 ${
                        touched.phone && fieldErrors.phone
                          ? 'border-red-400 focus:border-red-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(248,113,113,0.1)]'
                          : 'border-gray-100 focus:border-primary/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,52,96,0.08)]'
                      }`}
                      placeholder="0912 345 678"
                    />
                  </div>
                  {touched.phone && fieldErrors.phone && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">{fieldErrors.phone}</p>
                  )}
                </div>

                {/* Email Field */}
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className={`w-5 h-5 transition-colors duration-300 ${touched.email && fieldErrors.email ? 'text-red-400' : 'text-gray-400 group-focus-within:text-primary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.email}
                      onChange={e => {
                        setFormData({...formData, email: e.target.value});
                        setTouched({...touched, email: true});
                      }}
                      onBlur={() => setTouched({...touched, email: true})}
                      className={`w-full pl-12 pr-4 py-3.5 bg-gray-50/80 border-2 rounded-xl outline-none transition-all duration-300 text-textMain placeholder:text-gray-300 ${
                        touched.email && fieldErrors.email
                          ? 'border-red-400 focus:border-red-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(248,113,113,0.1)]'
                          : 'border-gray-100 focus:border-primary/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,52,96,0.08)]'
                      }`}
                      placeholder="name@example.com"
                    />
                  </div>
                  {touched.email && fieldErrors.email && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mật khẩu</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className={`w-5 h-5 transition-colors duration-300 ${touched.password && fieldErrors.password ? 'text-red-400' : 'text-gray-400 group-focus-within:text-primary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={e => {
                        setFormData({...formData, password: e.target.value});
                        setTouched({...touched, password: true});
                      }}
                      onBlur={() => setTouched({...touched, password: true})}
                      className={`w-full pl-12 pr-4 py-3.5 bg-gray-50/80 border-2 rounded-xl outline-none transition-all duration-300 text-textMain placeholder:text-gray-300 ${
                        touched.password && fieldErrors.password
                          ? 'border-red-400 focus:border-red-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(248,113,113,0.1)]'
                          : 'border-gray-100 focus:border-primary/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,52,96,0.08)]'
                      }`}
                      placeholder="Ít nhất 8 ký tự, hoa, thường, số, đặc biệt"
                    />
                  </div>
                  {touched.password && fieldErrors.password && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className={`w-5 h-5 transition-colors duration-300 ${touched.confirmPassword && fieldErrors.confirmPassword ? 'text-red-400' : 'text-gray-400 group-focus-within:text-primary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => {
                        setConfirmPassword(e.target.value);
                        setTouched({...touched, confirmPassword: true});
                      }}
                      onBlur={() => setTouched({...touched, confirmPassword: true})}
                      className={`w-full pl-12 pr-4 py-3.5 bg-gray-50/80 border-2 rounded-xl outline-none transition-all duration-300 text-textMain placeholder:text-gray-300 ${
                        touched.confirmPassword && fieldErrors.confirmPassword
                          ? 'border-red-400 focus:border-red-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(248,113,113,0.1)]'
                          : 'border-gray-100 focus:border-primary/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,52,96,0.08)]'
                      }`}
                      placeholder="Nhập lại mật khẩu"
                    />
                  </div>
                  {touched.confirmPassword && fieldErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">{fieldErrors.confirmPassword}</p>
                  )}
                </div>

                {/* Purpose Field */}
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mục đích tham gia</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 transition-colors duration-300 text-gray-400 group-focus-within:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                      </svg>
                    </div>
                    <select
                      value={formData.purpose}
                      onChange={e => {
                        setFormData({...formData, purpose: e.target.value});
                        setTouched({...touched, purpose: true});
                      }}
                      onBlur={() => setTouched({...touched, purpose: true})}
                      className="w-full pl-12 pr-10 py-3.5 bg-gray-50/80 border-2 rounded-xl outline-none transition-all duration-300 text-textMain appearance-none border-gray-100 focus:border-primary/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,52,96,0.08)]"
                    >
                      <option value="FIND_BDS">Tìm kiếm Bất động sản</option>
                      <option value="SELL_BDS">Đăng bán/Cho thuê Bất động sản</option>
                      <option value="BOTH">Cả hai mục đích trên</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                {/* Terms & Conditions */}
                <div className="flex items-start gap-3 pt-1">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={e => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded-md border-2 border-gray-200 text-accent focus:ring-accent/30 transition flex-shrink-0 cursor-pointer"
                  />
                  <span className="text-xs text-gray-500 leading-relaxed select-none">
                    Tôi đồng ý với{' '}
                    <Link href="/support/terms" className="text-primary font-semibold hover:text-primary/80 underline underline-offset-2 transition-colors">Điều khoản dịch vụ</Link>
                    {' '}và{' '}
                    <Link href="/support/privacy" className="text-primary font-semibold hover:text-primary/80 underline underline-offset-2 transition-colors">Chính sách bảo mật</Link>
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  disabled={loading || !isFormValid}
                  type="submit"
                  className="w-full relative overflow-hidden bg-gradient-to-r from-accent via-orange-400 to-accent text-white font-bold py-4 rounded-xl hover:shadow-[0_8px_30px_rgba(244,162,97,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group/btn mt-2 active:scale-[0.98]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 text-sm tracking-wide">
                    {loading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        ĐANG ĐĂNG KÝ...
                      </>
                    ) : 'ĐĂNG KÝ TÀI KHOẢN'}
                  </span>
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </button>
              </form>
            ) : (
              <form className="space-y-4 relative z-10" onSubmit={handleVerifyOtp}>
                {/* OTP Field */}
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mã OTP (6 chữ số)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.599-3.75A11.952 11.952 0 0112 5.714z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-12 pr-12 py-3.5 bg-gray-50/80 border-2 border-gray-100 rounded-xl outline-none focus:border-primary/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,52,96,0.08)] transition-all duration-300 text-textMain placeholder:text-gray-300 text-center text-2xl font-bold tracking-widest"
                      placeholder="000000"
                    />
                  </div>
                </div>

                {/* Submit OTP Button */}
                <button
                  disabled={otpLoading}
                  type="submit"
                  className="w-full relative overflow-hidden bg-gradient-to-r from-accent via-orange-400 to-accent text-white font-bold py-4 rounded-xl hover:shadow-[0_8px_30px_rgba(244,162,97,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group/btn mt-2 active:scale-[0.98]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 text-sm tracking-wide">
                    {otpLoading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        ĐANG XÁC THỰC...
                      </>
                    ) : 'XÁC THỰC KÍCH HOẠT'}
                  </span>
                </button>

                {/* Resend OTP */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0}
                    className="text-xs text-primary font-semibold hover:underline disabled:text-gray-400 disabled:no-underline"
                  >
                    {resendCooldown > 0 ? `Vui lòng đợi ${resendCooldown}s` : 'Gửi lại mã OTP'}
                  </button>
                </div>
              </form>
            )}

            {/* Login Link */}
            <div className="mt-7 text-center text-sm text-gray-400 relative z-10">
              Đã có tài khoản?{' '}
              <Link href="/login" className="text-primary font-bold hover:text-primary/80 transition-colors duration-200">
                Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

