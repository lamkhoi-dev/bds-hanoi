"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SidebarFilter from './SidebarFilter';
import { SlidersHorizontal, X, Trash2 } from 'lucide-react';

export default function MobileFilterButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleClearFilters = () => {
    // Keep 'q' if exists, clear others
    const q = searchParams.get('q');
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    router.push(`${window.location.pathname}?${params.toString()}`);
    setIsFilterOpen(false);
  };

  return (
    <div className="w-full lg:hidden my-6">
      <button
        onClick={() => setIsFilterOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors shadow-sm"
      >
        <SlidersHorizontal className="w-5 h-5" />
        Lọc để tìm kiếm nhanh và chính xác hơn
      </button>

      {/* Mobile Filter Sheet Overlay */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="relative bg-white w-full rounded-t-2xl shadow-2xl h-[85vh] flex flex-col animate-in slide-in-from-bottom-full duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold">Bộ lọc</h2>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 relative">
              <SidebarFilter />
            </div>
            
            {/* Footer with Clear btn */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0 flex gap-4">
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-500 hover:text-red-500 font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Xóa lọc
              </button>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="flex-1 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
