"use client";
import { formatNumberString } from '@/lib/utils';
import { toMediaUrl } from '@/lib/media';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/axios';
import { getAuthToken, loginUrl, clearAuthState } from '@/lib/auth';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  const fetchProfile = useCallback(async () => {
    if (!getAuthToken()) {
      router.replace(loginUrl(pathname));
      return;
    }

    try {
      const res = await api.get('/users/profile');
      setUser(res.data);
    } catch {
      router.replace(loginUrl(pathname));
    }
  }, [pathname, router]);

  useEffect(() => {
    fetchProfile();
  }, [pathname, fetchProfile]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-gradient-to-b from-primary-dark via-primary to-primary-light text-white flex-shrink-0">
        {/* Profile Section */}
        <div className="p-6 text-center border-b border-white/10">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-4 overflow-hidden ring-4 ring-accent/30 shadow-glow bg-white/10 flex items-center justify-center">
            {user?.avatar ? (
              <img src={toMediaUrl(user.avatar)} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-10 h-10 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <h3 className="font-bold text-lg text-white">{user?.name || 'Đang tải...'}</h3>
          <p className="text-sm text-white/60 mt-1 flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            {user ? `${(formatNumberString(user.balance ? user.balance * 1000 : 0))} VND` : '...'}
          </p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5">
          {[
            {
              href: '/user/my-listings',
              label: 'Quản lý tin đăng',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              ),
              active: pathname === '/user/my-listings',
            },
            {
              href: '/user/requirements',
              label: 'Nhu cầu của tôi',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
              active: pathname === '/user/requirements',
            },
            {
              href: '/user/wallet',
              label: 'Ví điện tử',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              ),
              active: pathname === '/user/wallet',
            },
            {
              href: '/user/packages',
              label: 'Gói dịch vụ',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              active: pathname === '/user/packages',
            },
            {
              href: '/user/saved',
              label: 'Tin đã lưu',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              ),
              active: pathname === '/user/saved',
            },
            {
              href: '/user/settings',
              label: 'Cập nhật tài khoản',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
              active: pathname === '/user/settings',
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                item.active ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Admin Link */}
        {['ADMIN', 'SUPER_ADMIN', 'MOD'].includes(user?.role) && (
          <div className="px-4 mt-2 mb-2">
            <Link 
              href="/admin"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-rose-500/80 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {user?.role === 'MOD' ? 'Truy cập trang Moderator' : 'Truy cập trang Admin'}
            </Link>
          </div>
        )}

        {/* Logout */}
        <div className="p-4 mt-auto border-t border-white/10">
          <button 
            onClick={async () => {
              try {
                await api.post('/auth/logout');
              } catch (e) {
                console.error(e);
              }
              clearAuthState();
              window.location.href = '/login';
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/50 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10">
        {children}
      </main>
    </div>
  );
}
