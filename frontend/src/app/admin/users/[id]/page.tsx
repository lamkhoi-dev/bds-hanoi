"use client";
import { formatNumberString } from '@/lib/utils';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Phone, Mail, Calendar, Shield, Activity, MapPin } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { getAuthToken, isUnauthorizedError } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import { formatPrice, formatArea } from '@/lib/utils';

export default function AdminUserDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!getAuthToken()) {
        router.push('/login');
        return;
      }
      try {
        const [userRes, propsRes] = await Promise.all([
          api.get(`/admin/users/${resolvedParams.id}`),
          api.get(`/admin/properties`, { params: { userId: resolvedParams.id, limit: 100 } })
        ]);
        setUser(userRes.data);
        setProperties(propsRes.data.data);
      } catch (err) {
        if (!isUnauthorizedError(err)) {
          console.error(err);
          toast.error('Không thể tải thông tin người dùng.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [resolvedParams.id, router]);

  if (loading) {
    return <div className="p-6">Đang tải thông tin...</div>;
  }

  if (!user) {
    return (
      <div className="p-6 space-y-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft size={20} /> Quay lại
        </button>
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">Không tìm thấy người dùng</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-semibold">
          <ArrowLeft size={20} /> Quay lại danh sách
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="w-24 h-24 bg-gradient-to-tr from-blue-100 to-indigo-100 text-blue-600 rounded-full flex items-center justify-center font-bold overflow-hidden mx-auto mb-4 border-4 border-white shadow-sm">
              {user.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-3xl">{user.name?.charAt(0) || 'U'}</span>}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{user.name || 'Người dùng'}</h2>
            <p className="text-sm text-gray-500 mt-1">{user.role}</p>

            <div className="mt-6 space-y-3 text-left">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500 font-medium">Email</div>
                  <div className="text-sm font-semibold text-gray-900">{user.email || 'Chưa cập nhật'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500 font-medium">Số điện thoại</div>
                  <div className="text-sm font-semibold text-gray-900">{user.phone || 'Chưa cập nhật'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500 font-medium">Trạng thái</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {user.status === 'BANNED' ? <span className="text-red-600">Bị khóa</span> : <span className="text-green-600">Hoạt động</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500 font-medium">Ngày tham gia</div>
                  <div className="text-sm font-semibold text-gray-900">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <Activity className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-xs text-blue-600 font-medium">Số dư ví</div>
                  <div className="text-sm font-bold text-blue-700">{formatNumberString((user.balance || 0) * 1000)} đ</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: User Posts */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Tin đăng của người dùng ({properties.length})</h3>
            </div>
            
            <div className="divide-y divide-gray-100">
              {properties.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Người dùng này chưa có tin đăng nào.</div>
              ) : (
                properties.map(post => (
                  <div key={post.id} className="p-6 flex flex-col sm:flex-row gap-4 hover:bg-gray-50/50 transition-colors">
                    <div className="w-full sm:w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <img 
                        src={post.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=300'} 
                        alt={post.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/tin/${post.slug || post.id}`} target="_blank" className="font-bold text-base text-gray-900 hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </Link>
                        {post.status === 'APPROVED' ? (
                          <span className="shrink-0 inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-green-50 text-green-600">Đã duyệt</span>
                        ) : post.status === 'PENDING' ? (
                          <span className="shrink-0 inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-orange-50 text-orange-600">Chờ duyệt</span>
                        ) : (
                          <span className="shrink-0 inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-gray-100 text-gray-600">{post.status}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin size={14} /> {post.ward ? `${post.ward}, ` : ''}{post.district ? `${post.district}, ` : ''}{post.city}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm font-semibold">
                        <span className="text-red-600">{formatPrice(post.price || 0)}</span>
                        <span className="text-gray-500">{formatArea(post.area)}</span>
                        <span className="text-gray-400 font-normal ml-auto text-xs">{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
