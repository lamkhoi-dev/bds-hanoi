"use client";
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { getAuthToken, clearAuthState } from '@/lib/auth';
import api from '@/lib/axios';

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  username?: string;
  slug?: string;
  bio?: string;
  provider?: string;
  avatar?: string;
  role: string;
  balance?: number;
  status?: string;
  isNotificationEnabled?: boolean;
  isPhoneVisible?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      if (getAuthToken()) {
        const res = await api.get('/users/profile');
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback((userData: User) => {
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API failed:', error);
    }
    clearAuthState();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    await fetchUser();
  }, [fetchUser]);

  const value = useMemo(() => ({
    user,
    isLoading,
    login,
    logout,
    refreshUser
  }), [user, isLoading, login, logout, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
