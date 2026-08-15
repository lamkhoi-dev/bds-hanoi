"use client";
import { formatNumberString } from '@/lib/utils';

import { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle, AlertTriangle, TrendingUp, ShieldAlert, Clock, XCircle } from 'lucide-react';
import api from '@/lib/axios';
import { getAuthToken, isUnauthorizedError } from '@/lib/auth';

import { useAuth } from '@/contexts/AuthContext';
import OnlineStats from '@/components/OnlineStats';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOnlineStats, setShowOnlineStats] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShowOnlineStats(localStorage.getItem('adminShowOnlineStats') !== 'false');
    }
  }, []);

  useEffect(() => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }

    api.get('/admin/stats')
      .then(res => setStats(res.data))
      .catch((error) => {
        if (!isUnauthorizedError(error)) console.error(error);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;
  if (!stats) return <div className="p-8 text-center text-red-500">Lỗi tải dữ liệu</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-gray-900">Tổng quan hệ thống</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {showOnlineStats && <OnlineStats alwaysShow={true} />}
            <button 
              onClick={() => {
                const newVal = !showOnlineStats;
                setShowOnlineStats(newVal);
                localStorage.setItem('adminShowOnlineStats', String(newVal));
              }} 
              className="text-gray-400 hover:text-gray-600 p-1"
              title={showOnlineStats ? "Ẩn thống kê online" : "Hiện thống kê online"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showOnlineStats ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z"} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={!showOnlineStats ? "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" : ""} /></svg>
            </button>
          </div>
          <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
            Cập nhật lần cuối: {new Date().toLocaleTimeString('vi-VN')}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Tổng số User</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumberString(stats.users)}</p>
            <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> +{stats.newUsersToday} hôm nay
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Tổng bài đăng</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumberString(stats.properties)}</p>
            <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> +{stats.newPostsToday} hôm nay
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-orange-600 font-medium mb-1">Bài chờ duyệt</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingProperties}</p>
            <p className="text-xs text-orange-500 font-medium mt-1 flex items-center gap-1">
              Cần xử lý ngay
            </p>
          </div>
        </div>

        {user?.role !== 'MOD' && (
          <>
            <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500 flex-shrink-0">
                <ShieldAlert size={24} />
              </div>
              <div>
                <p className="text-sm text-red-600 font-medium mb-1">Report / Spam</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingReports}</p>
                <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                  Vi phạm nội quy
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
                <XCircle size={24} />
              </div>
              <div>
                <p className="text-sm text-red-600 font-medium mb-1">GD lỗi</p>
                <p className="text-2xl font-bold text-gray-900">{stats.failedTransactions}</p>
                <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                  Cần kiểm tra
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detailed Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Posts */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-gray-800">Bài đăng chờ duyệt mới nhất</h3>
            <button className="text-sm text-primary hover:underline font-medium">Xem tất cả</button>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentPendingPosts.length > 0 ? stats.recentPendingPosts.map((item: any) => (
              <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-1 line-clamp-1">{item.title}</h4>
                  <p className="text-xs text-gray-500">{item.user?.name || 'Ẩn danh'} • {item.ward} • {new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Duyệt">
                    <CheckCircle size={18} />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Từ chối">
                    <AlertTriangle size={18} />
                  </button>
                </div>
              </div>
            )) : <div className="p-4 text-center text-gray-500">Không có bài chờ duyệt</div>}
          </div>
        </div>

        {/* Traffic & VIP */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">Trạng thái Tin VIP & UP</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Đang ghim VIP</span>
                <span className="font-bold text-amber-500 bg-amber-50 px-3 py-1 rounded-lg">{stats.activeVip} tin</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Đang đẩy UP</span>
                <span className="font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-lg">{stats.activeUp} tin</span>
              </div>
              {user?.role !== 'MOD' && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Doanh thu nạp thẻ hôm nay</span>
                  <span className="font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">+ {formatNumberString(stats.todayRevenue)} đ</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
