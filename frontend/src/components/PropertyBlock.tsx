import React from 'react';
import Link from 'next/link';
import PropertyCard from '@/components/PropertyCard';

export default function PropertyBlock({ 
  title, 
  items, 
  moreLink 
}: { 
  title: string, 
  items: any[], 
  moreLink: string 
}) {
  const displayItems = items?.slice(0, 10) || [];
  
  return (
    <div className="mb-10">
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-xl md:text-2xl font-extrabold text-textMain flex items-center gap-2">
          {moreLink && displayItems.length > 0 ? (
            <Link href={moreLink} className="hover:text-primary transition-colors">
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>
        {moreLink && displayItems.length > 0 && (
          <Link href={moreLink} className="text-primary font-medium hover:underline text-sm whitespace-nowrap">
            Xem thêm &gt;
          </Link>
        )}
      </div>
      
      {displayItems.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-4 md:gap-6">
          {displayItems.map((item, idx) => (
            <div key={item.id} className={`h-full ${idx > 4 ? 'hidden lg:block' : (idx > 3 ? 'hidden md:block' : '')}`}>
              <PropertyCard item={item} />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-500">Chưa có bất động sản nào trong danh mục này.</p>
        </div>
      )}
    </div>
  );
}
