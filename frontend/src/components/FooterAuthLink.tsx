"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function FooterAuthLink() {
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <li>
        <span className="text-white/50 text-sm flex items-center gap-2">
          <ChevronRight className="w-3.5 h-3.5 text-accent/60" />
          ...
        </span>
      </li>
    );
  }

  if (user) {
    return (
      <li>
        <Link href="/user/my-listings" className="text-white/70 hover:text-white hover:translate-x-1 transition-all duration-200 text-sm flex items-center gap-2">
          <ChevronRight className="w-3.5 h-3.5 text-accent/60" />
          Quản lý tài khoản
        </Link>
      </li>
    );
  }

  return (
    <li>
      <Link href="/login" className="text-white/70 hover:text-white hover:translate-x-1 transition-all duration-200 text-sm flex items-center gap-2">
        <ChevronRight className="w-3.5 h-3.5 text-accent/60" />
        Đăng nhập
      </Link>
    </li>
  );
}
