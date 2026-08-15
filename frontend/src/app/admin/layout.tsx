"use client";

import { useState, useEffect } from 'react';
import { siteConfig } from '@/lib/site-config';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, Users, CreditCard, Settings, LogOut, ClipboardList, Database, Shield, Menu, X, Home, User, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!['ADMIN', 'SUPER_ADMIN', 'MOD'].includes(user.role)) {
        router.push('/');
      }
    }
  }, [mounted, isLoading, user, router]);

  if (!mounted || isLoading || !user || !['ADMIN', 'SUPER_ADMIN', 'MOD'].includes(user.role)) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const allNavItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/admin', roles: ['ADMIN', 'SUPER_ADMIN', 'MOD'] },
    { label: 'Quản lý Tin đăng', icon: <FileText size={20} />, href: '/admin/posts', roles: ['ADMIN', 'SUPER_ADMIN', 'MOD'] },
    { label: 'Quản lý Tin tức', icon: <FileText size={20} />, href: '/admin/news', roles: ['ADMIN', 'SUPER_ADMIN', 'MOD'] },
    { label: 'Quản lý Dự án', icon: <Building2 size={20} />, href: '/admin/projects', roles: ['ADMIN', 'SUPER_ADMIN', 'MOD'] },
    { label: 'Quản lý Nhu cầu', icon: <ClipboardList size={20} />, href: '/admin/requirements', roles: ['ADMIN', 'SUPER_ADMIN', 'MOD'] },
    { label: 'Quản lý User', icon: <Users size={20} />, href: '/admin/users', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { label: 'Giao dịch & Nạp tiền', icon: <CreditCard size={20} />, href: '/admin/transactions', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { label: 'Quản lý Danh mục', icon: <FileText size={20} />, href: '/admin/categories', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { label: 'Quản lý Vị trí', icon: <ClipboardList size={20} />, href: '/admin/locations', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { label: 'Sao lưu & Khôi phục', icon: <Database size={20} />, href: '/admin/backup', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { label: 'Báo cáo', icon: <FileText size={20} />, href: '/admin/reports', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { label: 'Khiếu nại', icon: <FileText size={20} />, href: '/admin/complaints', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { label: 'Xóa Dữ Liệu', icon: <Database size={20} />, href: '/admin/data-deletion', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { label: 'Nhật ký Hoạt động', icon: <Shield size={20} />, href: '/admin/audit-logs', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { label: 'Cài đặt hệ thống', icon: <Settings size={20} />, href: '/admin/settings', roles: ['ADMIN', 'SUPER_ADMIN'] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(user?.role || 'ADMIN'));

  return (
    <div className="fixed inset-0 bg-gray-50 flex overflow-hidden z-[100]">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-primary-dark text-white flex-shrink-0 flex flex-col shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 lg:p-6 border-b border-white/10 flex-shrink-0 flex items-center justify-between relative">
          <Link href="/" className="flex flex-col items-center gap-2 lg:gap-3 text-white hover:opacity-80 transition-opacity w-full">
            <div className="flex items-center justify-center gap-2 w-full">
              <img width={223} height={145} src="/logo/logo-icon.svg" alt="Logo" className="w-6 h-6 lg:w-8 lg:h-8 object-contain" />
              <span className="font-extrabold text-base lg:text-xl tracking-tight text-white">ADMIN PANEL</span>
            </div>
            <span className="block text-center text-xs sm:text-sm font-bold uppercase tracking-wide text-white/80">{siteConfig.name}</span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden absolute top-3 right-2 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 py-4 lg:py-6 overflow-y-auto custom-scrollbar">
          <ul className="flex flex-col gap-1 px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin');
              return (
                <li key={item.label}>
                  <Link 
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-accent text-white font-bold shadow-glow-accent' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                  >
                    {item.icon}
                    <span className="whitespace-nowrap">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10 flex-shrink-0 flex flex-col gap-2">
          <Link 
            href="/"
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-white/70 hover:bg-white/10 hover:text-white rounded-xl transition-all"
          >
            <Home size={20} />
            <span className="font-semibold">Về trang chủ</span>
          </Link>
          <Link 
            href="/user/wallet"
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-white/70 hover:bg-white/10 hover:text-white rounded-xl transition-all"
          >
            <User size={20} />
            <span className="font-semibold">Về trang User</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-white/70 hover:bg-red-500 hover:text-white hover:shadow-lg rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span className="font-semibold">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 max-w-full h-full overflow-hidden">
        {/* Header */}
        <header className="bg-white min-h-16 border-b border-gray-200 flex items-center justify-between gap-2 px-4 lg:px-8 py-3 flex-shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <h2 className="font-bold text-gray-800 text-base lg:text-lg hidden xs:block">Quản trị Bất Động Sản</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600 hidden sm:inline-block">Xin chào, <strong>{user?.name || 'Admin'}</strong></span>
            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'AD'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8 flex-1 overflow-y-auto max-w-full custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
