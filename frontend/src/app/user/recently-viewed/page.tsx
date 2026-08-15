"use client";

import { useEffect, useState } from 'react';
import PropertyCard from '@/components/PropertyCard';
import api from '@/lib/axios';
import { getAuthToken } from '@/lib/auth';

function readLocalRecentlyViewed() {
  try {
    const items = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export default function RecentlyViewedPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (!getAuthToken()) {
      setProperties(readLocalRecentlyViewed());
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    api.get('/users/me/recently-viewed')
      .then((res) => {
        if (!mounted) return;
        const data = Array.isArray(res.data) ? res.data : res.data?.data;
        setProperties(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (mounted) setProperties(readLocalRecentlyViewed());
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="container mx-auto">
        <h1 className="text-2xl font-extrabold text-textMain mb-6">Tin đã xem</h1>

        {loading ? (
          <div className="py-16 text-center text-textSecondary">Đang tải...</div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {properties.map((item) => (
              <PropertyCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-textSecondary">Bạn chưa xem tin nào.</div>
        )}
      </div>
    </main>
  );
}
