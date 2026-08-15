"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toMediaUrl } from '@/lib/media';

export default function HeaderAuth() {
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-400">
        <User className="w-4 h-4 animate-pulse" aria-hidden="true" />
        Đang tải...
      </div>
    );
  }

  if (user) {
    const dashboardLink = '/user/my-listings';
    return (
      <Link
        href={dashboardLink}
        aria-label={`Tài khoản của ${user.name}`}
        className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-4 py-1.5 sm:py-2.5 text-[13px] sm:text-sm font-semibold text-primary hover:bg-primary/5 rounded-xl transition-all duration-200 whitespace-nowrap"
      >
        {user.avatar ? (
          <img src={toMediaUrl(user.avatar)} alt="Ảnh đại diện" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover shrink-0" />
        ) : (
          <User className="w-4 h-4 shrink-0" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">{user.name}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      aria-label="Đăng nhập hoặc quản lý tài khoản"
      className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-4 py-1.5 sm:py-2.5 text-[13px] sm:text-sm font-semibold text-primary hover:bg-primary/5 rounded-xl transition-all duration-200 whitespace-nowrap"
    >
      <User className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" aria-hidden="true" />
      <span className="hidden sm:inline">Đăng nhập</span>
    </Link>
  );
}
