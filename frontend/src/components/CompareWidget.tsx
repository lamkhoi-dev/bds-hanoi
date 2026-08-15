"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { X, ArrowRightLeft, Trash2 } from 'lucide-react';
import { getCompareItems, removeCompareItem, clearCompareItems } from '@/lib/compare';
import { toMediaUrl } from '@/lib/media';
import { formatPrice } from '@/lib/utils';

export default function CompareWidget() {
  const [items, setItems] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const updateItems = useCallback(() => {
    const data = getCompareItems();
    setItems(data);
    if (data.length === 0) setIsOpen(false);
  }, []);

  useEffect(() => {
    updateItems(); // Initial load
    window.addEventListener('compareUpdated', updateItems);
    return () => window.removeEventListener('compareUpdated', updateItems);
  }, [updateItems]);

  if (pathname && pathname.startsWith('/so-sanh')) {
    return null;
  }

  // Removed return null to keep the widget mounted so we can show the minimized bubble

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-auto md:left-6 z-[400] flex flex-col items-end md:items-start">
      <div className={`bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-[calc(100vw-2rem)] sm:w-80 md:w-96 overflow-hidden flex flex-col transition-all duration-300 origin-bottom-right md:origin-bottom-left ${isOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-4 opacity-0 pointer-events-none absolute bottom-0 right-0 md:left-0 md:right-auto'}`}>
        {/* Header */}
        <div className="bg-primary text-white p-3 flex justify-between items-center cursor-pointer w-full" onClick={() => setIsOpen(!isOpen)}>
          <div className="font-bold flex items-center gap-2">
            <ArrowRightLeft size={18} />
            So sánh ({items.length}/3)
          </div>
          <button type="button" aria-label="Đóng" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col gap-3 max-h-60 overflow-y-auto bg-gray-50">
          {items.map(item => (
            <div key={item.id} className="flex gap-3 bg-white p-2 rounded-lg border border-gray-100 shadow-sm relative group">
              <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden relative">
                {(item.images && item.images.length > 0) || (item.imageObjects && item.imageObjects.length > 0) ? (
                  <Image 
                    unoptimized 
                    fill 
                    src={toMediaUrl(item.imageObjects && item.imageObjects.length > 0 ? item.imageObjects[0].url : item.images[0])} 
                    alt={item.title} 
                    className="object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Img</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight">{item.title}</h4>
                <p className="text-primary font-bold text-sm">{item.price ? formatPrice(item.price) : 'Thỏa thuận'}</p>
              </div>
              <button 
                type="button"
                aria-label="Xóa mục"
                onClick={() => removeCompareItem(item.id)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 bg-white rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1 shadow-sm border"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-gray-100 flex gap-2 bg-white">
          <button 
            onClick={clearCompareItems}
            className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1 transition-colors"
          >
            <Trash2 size={16} /> Xóa
          </button>
          
          <Link 
            href="/so-sanh"
            onClick={() => setIsOpen(false)}
            className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 rounded-lg font-bold text-white transition-colors ${items.length >= 2 ? 'bg-primary hover:bg-primary-dark shadow-md shadow-primary/20' : 'bg-gray-300 pointer-events-none'}`}
          >
            <ArrowRightLeft size={16} />
            {items.length >= 2 ? 'So sánh ngay' : 'Thêm ít nhất 2 tin'}
          </Link>
        </div>
      </div>
      
      {/* Minimized Bubble */}
      {!isOpen && items.length > 0 && (
        <button 
          onClick={() => setIsOpen(true)}
          className="absolute bottom-0 right-0 md:left-0 md:right-auto bg-primary text-white p-3 md:p-4 rounded-full shadow-xl hover:scale-105 transition-transform flex items-center justify-center animate-bounce-slow"
        >
          <ArrowRightLeft className="w-5 h-5 md:w-6 md:h-6" />
          <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-red-500 text-white text-[10px] md:text-xs w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full font-bold border-2 border-white">
            {items.length}
          </span>
        </button>
      )}
    </div>
  );
}
