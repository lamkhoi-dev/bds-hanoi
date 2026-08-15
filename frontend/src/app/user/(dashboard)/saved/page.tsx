"use client";
import { useEffect, useState } from 'react';
import { generateSlug, formatPrice, formatArea } from '@/lib/utils';
import { toMediaUrl } from '@/lib/media';
import api from '@/lib/axios';
import Link from 'next/link';
import { getAuthToken, isUnauthorizedError } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import { confirmAction } from '@/lib/toast-helpers';

export default function SavedProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/users/saved');
      setProperties(res.data);
    } catch (error) {
      if (!isUnauthorizedError(error)) console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (id: string) => {
    const confirmed = await confirmAction('Bạn có chắc muốn bỏ lưu tin này?');
    if (!confirmed) return;
    try {
      await api.delete(`/users/saved/${id}`);
      setProperties(properties.filter((p: any) => p.id !== id));
      toast.success('Đã bỏ lưu tin');
    } catch {
      toast.error('Lỗi khi bỏ lưu');
    }
  };

  if (loading) return <div className="text-center py-10">Đang tải dữ liệu...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tin đã lưu ({properties.length})</h1>
      
      {properties.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center border border-borderLight/50">
          <p className="text-textSecondary mb-4">Bạn chưa lưu tin bất động sản nào.</p>
          <Link href="/" className="text-primary font-bold hover:underline">Về trang chủ tìm kiếm</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((item: any) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-borderLight/50 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <Link href={`/tin/${generateSlug(item.title)}--${item.id}`} className="block relative h-48 bg-gray-200">
                {item.images && item.images.length > 0 ? (
                  <img loading="lazy" src={toMediaUrl(item.images[0])} className="w-full h-full object-cover" alt={item.title} />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary/50 font-medium">Không có ảnh</div>
                )}
                {item.tier === 'VIP' && (
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">VIP</div>
                )}
                {item.tier === 'UP' && (
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-400 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">UP</div>
                )}
              </Link>
              <div className="p-4 flex flex-col flex-1">
                <Link href={`/tin/${generateSlug(item.title)}--${item.id}`} className="font-bold text-lg text-textMain line-clamp-2 hover:text-primary transition-colors">{item.title}</Link>
                <p className="text-primary font-extrabold mt-2">{item.price ? formatPrice(item.price) : 'Thỏa thuận'}</p>
                <div className="flex gap-4 mt-3 text-sm text-textSecondary border-b border-borderLight/50 pb-3">
                  <span>{formatArea(item.area)}</span>
                  <span className="truncate">{item.district}, {item.city}</span>
                </div>
                <div className="mt-4 mt-auto">
                  <button onClick={() => handleUnsave(item.id)} className="w-full py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-colors text-sm flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    Bỏ lưu
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
