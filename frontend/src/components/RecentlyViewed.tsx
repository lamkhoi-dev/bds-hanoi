"use client";

import { useEffect, useState } from 'react';
import { listingDetailPath } from '@/lib/seo/canonical';
import Link from 'next/link';
import Image from 'next/image';
import { generateSlug } from '@/lib/utils';
import { Star } from 'lucide-react';
import { formatPrice } from '@/lib/utils';


export default function RecentlyViewed() {
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    setProperties(recent);
  }, []);

  if (properties.length === 0) return null;

  return (
    <section className="container mx-auto px-4 mb-16 animate-slide-up">
      <h2 className="text-2xl font-extrabold text-textMain flex items-center gap-2 mb-6">
        <span className="w-1.5 h-6 bg-primary rounded-full inline-block"></span>
        Các tin bạn mới xem
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {properties.map((item: any) => (
          <Link 
            key={item.id} 
            href={listingDetailPath(generateSlug(item.title), item.shortCode, item.id)}
            className="flex-shrink-0 w-72 bg-white rounded-2xl overflow-hidden border border-borderLight/50 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="h-36 bg-gray-100 relative">
              {item.images && item.images.length > 0 ? (
                <Image fill src={item.images[0]} alt={item.title} className="object-cover" sizes="(max-width: 768px) 100vw, 288px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-gray-400 text-xs">No image</span>
                </div>
              )}
              {item.tier === 'VIP' && (
                <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-[10px] px-2 py-1 rounded font-bold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> VIP
                </div>
              )}
              {item.tier === 'UP' && (
                <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white text-[10px] px-2 py-1 rounded font-bold flex items-center gap-1">
                  UP
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-sm text-textMain group-hover:text-primary line-clamp-2 mb-2">{item.title}</h3>
              <p className="text-primary font-bold text-base mb-1">{formatPrice(item.price)}</p>
              <p className="text-xs text-textSecondary truncate">{item.district ? `${item.district}, ${item.city}` : 'Đang cập nhật'}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
