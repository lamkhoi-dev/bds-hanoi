"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { getSmsProvider } from '@/services/sms';
import { toast } from 'react-hot-toast';

export default function Login() {
  const router = useRouter();
  const { login: setAuthUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // New states for SMS Login
  const [loginMethod, setLoginMethod] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [phone, setPhone] = useState('');
  const [smsOtp, setSmsOtp] = useState('');
  const [smsStep, setSmsStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [recentPhones, setRecentPhones] = useState<string[]>([]);


  // New states for OTP Activation fallback
  const [needsActivation, setNeedsActivation] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('recentPhones');
        if (stored) {
          setRecentPhones(JSON.parse(stored));
        }
      } catch (e) {}
    }
  }, []);

  const saveRecentPhone = (phoneNumber: string) => {
    if (!phoneNumber) return;
    let stored = [...recentPhones];
    stored = stored.filter(p => p !== phoneNumber);
    stored.unshift(phoneNumber);
    if (stored.length > 3) stored.pop(); // keep last 3
    setRecentPhones(stored);
    if (typeof window !== 'undefined') {
      localStorage.setItem('recentPhones', JSON.stringify(stored));
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const loggedIn = params.get('loggedIn');
      const errorParam = params.get('error');
      const token = params.get('token');
      const refreshToken = params.get('refreshToken');

      if (errorParam) {
        setError(decodeURIComponent(errorParam));
        toast.error('Đăng nhập thất bại: ' + decodeURIComponent(errorParam));
        window.history.replaceState({}, '', '/login');
      } else if (loggedIn === '1') {
        document.cookie = `isLoggedIn=1; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
        window.history.replaceState({}, '', '/login');
        toast.success('Đăng nhập mạng xã hội thành công!');
        router.push('/user/my-listings');
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      
      if (res.data.requirePasswordChange) {
        toast.error(res.data.message || 'Bạn phải đổi mật khẩu ở lần đăng nhập đầu tiên.');
        router.push('/change-password');
      } else {
        toast.success('Đăng nhập thành công!');
        if (res.data.user) setAuthUser(res.data.user);
        
        if (res.data.user?.role === 'ADMIN') {
          router.push('/admin');
        } else {
          const returnUrl = new URLSearchParams(window.location.search).get('returnUrl') || '/user/my-listings';
          router.push(returnUrl);
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Sai email hoặc mật khẩu';
      setError(msg);
      if (msg.includes('chưa được kích hoạt')) {
        setNeedsActivation(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length !== 6) {
      setError('Mã OTP phải có 6 chữ số.');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await api.post('/auth/verify-activation-otp', { email, otp });
      toast.success('Kích hoạt tài khoản và đăng nhập thành công!');
      if (res.data.user) setAuthUser(res.data.user);
      if (res.data.user?.role === 'ADMIN') {
        router.push('/admin');
      } else {
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl') || '/user/my-listings';
        router.push(returnUrl);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setOtpLoading(false);
    }
  };

  
  const handleSendSmsOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone || phone.length < 9) {
      setError('Vui lòng nhập số điện thoại hợp lệ.');
      return;
    }
    setLoading(true);
    try {
      const provider = await getSmsProvider();
      const verifier = provider.setupRecaptcha ? await provider.setupRecaptcha('recaptcha-container') : undefined;
      const result = await provider.sendOtp(phone, verifier);
      setConfirmationResult(result);
      setSmsStep('OTP');
      toast.success('Mã OTP đã được gửi đến điện thoại của bạn.');
    } catch (err: any) {
      setError(err.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySmsOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!smsOtp || smsOtp.length !== 6) {
      setError('Mã OTP phải có 6 chữ số.');
      return;
    }
    setLoading(true);
    try {
      const provider = await getSmsProvider();
      const { idToken } = await provider.verifyOtp(confirmationResult, smsOtp);
      
      const res = await api.post('/auth/verify-phone-firebase', { idToken });
      
      toast.success('Đăng nhập thành công!');
      saveRecentPhone(phone);
      if (res.data.user) setAuthUser(res.data.user);
      
      if (res.data.user?.role === 'ADMIN') {
        router.push('/admin');
      } else {
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl') || '/user/my-listings';
        router.push(returnUrl);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    try {
      if (needsActivation) {
        await api.post('/auth/resend-activation-otp', { email });
      } else {
        await api.post('/auth/forgot-password', { email });
      }
      toast.success('Mã OTP mới đã được gửi tới email của bạn.');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi lại mã OTP.');
    }
  };



  return (
    <div className="min-h-[calc(100vh-80px)] sm:min-h-[90vh] flex items-stretch bg-gradient-to-br from-[#0a1628] via-primary to-[#1a1a4e] relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute top-[-120px] left-[-80px] w-[400px] h-[400px] bg-accent/20 rounded-full blur-[100px] animate-blob" />
      <div className="absolute bottom-[-100px] right-[-60px] w-[350px] h-[350px] bg-blue-400/15 rounded-full blur-[100px] animate-blob animation-delay-2000" />
      <div className="absolute top-1/2 left-1/3 w-[250px] h-[250px] bg-purple-500/10 rounded-full blur-[80px] animate-blob animation-delay-4000" />

      {/* Left Panel - Illustration / Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center px-12 relative z-10">
        {/* Decorative floating elements */}
        <div className="absolute top-20 left-16 w-16 h-16 border-2 border-white/10 rounded-xl rotate-12 animate-float" />
        <div className="absolute bottom-32 right-20 w-10 h-10 border-2 border-accent/20 rounded-full animate-float animation-delay-2000" />
        <div className="absolute top-1/3 right-16 w-6 h-6 bg-accent/30 rounded-md rotate-45 animate-float animation-delay-4000" />
        
        {/* Main illustration area */}
        <div className="text-center max-w-md">
          {/* House Icon SVG */}
          <div className="mb-8 flex justify-center">
            <div className="w-28 h-28 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 flex items-center justify-center shadow-2xl p-4">
              <Image src="/logo/logo-icon.svg" alt="Logo" width={80} height={80} className="w-full h-full object-contain" priority />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            Chào mừng trở lại!
          </h1>
          <p className="text-lg text-blue-200/70 leading-relaxed mb-8">
            Đăng nhập để khám phá hàng nghìn bất động sản cao cấp và tìm ngôi nhà mơ ước của bạn.
          </p>
          {/* Stats */}
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">10K+</div>
              <div className="text-xs text-blue-200/50 mt-1">Bất động sản</div>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">5K+</div>
              <div className="text-xs text-blue-200/50 mt-1">Khách hàng</div>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">99%</div>
              <div className="text-xs text-blue-200/50 mt-1">Hài lòng</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-4 sm:px-6 sm:py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Glassmorphism Card */}
          <div className="bg-white/[0.95] backdrop-blur-xl rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.3)] p-6 sm:p-10 border border-white/50 relative overflow-hidden">
            {/* Subtle gradient overlay on card */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-accent/5 to-transparent rounded-bl-full pointer-events-none" />
            
            {/* Mobile logo */}
            {/* Logo removed on mobile to save vertical space */}

            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary text-center mb-1 relative z-10">Đăng Nhập</h2>
            <p className="text-sm text-gray-400 text-center mb-4 sm:mb-5 relative z-10">Nhập thông tin tài khoản của bạn</p>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 animate-shake relative z-10">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            
            {/* Method Toggle */}
            {!needsActivation && (
              <div className="flex justify-center mb-4 sm:mb-6 relative z-10">
                <div className="bg-gray-100 p-1 rounded-xl inline-flex w-full max-w-[300px]">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('EMAIL')}
                    className={`flex-1 py-1.5 sm:py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${loginMethod === 'EMAIL' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('SMS')}
                    className={`flex-1 py-1.5 sm:py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${loginMethod === 'SMS' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Số điện thoại
                  </button>
                </div>
              </div>
            )}

            {!needsActivation ? (
              loginMethod === 'EMAIL' ? (

              <form className="space-y-4 sm:space-y-5 relative z-10" onSubmit={handleSubmit}>
                {/* Email Field */}
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 sm:py-3.5 bg-gray-50/80 border-2 border-gray-100 rounded-xl outline-none focus:border-primary/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,52,96,0.08)] transition-all duration-300 text-textMain placeholder:text-gray-300"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mật khẩu</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-2.5 sm:py-3.5 bg-gray-50/80 border-2 border-gray-100 rounded-xl outline-none focus:border-primary/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,52,96,0.08)] transition-all duration-300 text-textMain placeholder:text-gray-300"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 cursor-pointer group/check">
                    <input type="checkbox" className="w-4 h-4 rounded-md border-2 border-gray-200 text-primary focus:ring-primary/30 transition" />
                    <span className="text-sm text-gray-500 group-hover/check:text-gray-700 transition">Ghi nhớ đăng nhập</span>
                  </label>
                  <Link href="/forgot-password" className="text-sm text-primary/70 hover:text-primary font-medium transition-colors duration-200">Quên mật khẩu?</Link>
                </div>

                {/* Submit Button */}
                <button
                  disabled={loading}
                  type="submit"
                  className="w-full relative overflow-hidden bg-gradient-to-r from-primary via-[#1a4a7a] to-primary text-white font-bold py-3 sm:py-4 rounded-xl hover:shadow-[0_8px_30px_rgba(15,52,96,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group/btn mt-2 active:scale-[0.98]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 text-sm tracking-wide">
                    {loading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        ĐANG ĐĂNG NHẬP...
                      </>
                    ) : 'ĐĂNG NHẬP'}
                  </span>
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                </button>
              </form>

              ) : (
                <form className="space-y-5 relative z-10" onSubmit={smsStep === 'PHONE' ? handleSendSmsOtp : handleVerifySmsOtp}>
                  {smsStep === 'PHONE' ? (
                    <div className="group">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Số điện thoại</label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-4 py-3.5 bg-gray-50/80 border-2 border-gray-100 rounded-xl outline-none focus:border-primary/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,52,96,0.08)] transition-all duration-300 text-textMain placeholder:text-gray-300"
                          placeholder="0912345678"
                        />
                        {recentPhones.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {recentPhones.map((rp, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setPhone(rp)}
                                className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-medium hover:bg-blue-100 hover:border-blue-200 transition-colors"
                              >
                                {rp}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div id="recaptcha-container" className="mt-4 flex justify-center"></div>
                    </div>
                  ) : (
                    <div className="group">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mã OTP (6 chữ số)</label>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={smsOtp}
                          onChange={e => setSmsOtp(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-4 py-3.5 bg-gray-50/80 border-2 border-gray-100 rounded-xl outline-none focus:border-primary/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,52,96,0.08)] transition-all duration-300 text-textMain placeholder:text-gray-300 text-center text-2xl font-bold tracking-widest"
                          placeholder="000000"
                        />
                      </div>
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setSmsStep('PHONE')}
                          className="text-xs text-primary font-semibold hover:underline"
                        >
                          Đổi số điện thoại
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full relative overflow-hidden bg-gradient-to-r from-accent via-orange-400 to-accent text-white font-bold py-4 rounded-xl hover:shadow-[0_8px_30px_rgba(244,162,97,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group/btn mt-2 active:scale-[0.98]"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2 text-sm tracking-wide">
                      {loading ? 'ĐANG XỬ LÝ...' : (smsStep === 'PHONE' ? 'GỬI MÃ OTP' : 'ĐĂNG NHẬP')}
                    </span>
                  </button>
                </form>
              )
            ) : (
              <form className="space-y-4 relative z-10" onSubmit={handleVerifyOtp}>
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mã OTP (6 chữ số)</label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3.5 bg-gray-50/80 border-2 border-gray-100 rounded-xl outline-none focus:border-primary/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,52,96,0.08)] transition-all duration-300 text-textMain placeholder:text-gray-300 text-center text-2xl font-bold tracking-widest"
                      placeholder="000000"
                    />
                  </div>
                </div>

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
                
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setNeedsActivation(false)}
                    className="text-xs text-gray-500 font-semibold hover:text-gray-700 transition"
                  >
                    Quay lại đăng nhập
                  </button>
                </div>
              </form>
            )}

            {/* Divider */}
            <div className="relative my-4 sm:my-5 z-10">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center text-xs"><span className="px-4 bg-white text-gray-400 uppercase tracking-wider">Hoặc</span></div>
            </div>

            {/* Social Login Buttons */}
            <div className="relative z-10">
              <button onClick={() => window.location.href = '/api/auth/google?v=1'} type="button" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-white border-2 border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-md transition-all duration-200 group/social active:scale-[0.98]">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="text-sm font-medium text-gray-600 group-hover/social:text-gray-800 transition">Đăng nhập bằng Google</span>
              </button>
            </div>

            {/* Register Link */}
            <div className="mt-4 sm:mt-6 text-center text-sm text-gray-400 relative z-10">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="text-accent font-bold hover:text-orange-500 transition-colors duration-200">
                Đăng ký ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
