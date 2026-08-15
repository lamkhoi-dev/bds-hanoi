"use client";

import { useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import SidebarFilter from './SidebarFilter';
import { SlidersHorizontal, X, Trash2 } from 'lucide-react';

import { useLocations } from '@/hooks/useLocations';
import { generateSlug } from '@/lib/utils';

export default function SearchControls() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { locations } = useLocations();

  const handleClearFilters = () => {
    // Keep 'q' if exists, clear others
    const q = searchParams.get('q');
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    router.push(`${window.location.pathname}?${params.toString()}`);
    setIsFilterOpen(false);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
      {/* Mobile filter button */}
      <div className="w-full sm:w-auto lg:hidden">
        <button
          onClick={() => setIsFilterOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors shadow-sm"
        >
          <SlidersHorizontal className="w-5 h-5" />
          Lọc để tìm kiếm nhanh và chính xác hơn
        </button>
      </div>

      {/* Sort & Location Bar */}
      <div className="w-full sm:w-auto flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3 ml-auto">
        <label className="text-sm text-gray-500 font-medium whitespace-nowrap hidden sm:block">Khu vực:</label>
        <select
          value={searchParams.get('district') || ''}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams.toString());
            const district = e.target.value;
            
            if (district) {
              params.set('district', district);
            } else {
              params.delete('district');
            }

            const currentPath = window.location.pathname;
            
            // If we are on /search, just update params
            if (currentPath === '/search' || currentPath.startsWith('/search?')) {
              router.push(`/search?${params.toString()}`);
              return;
            }

            // If we are on an SEO route, let's see if we should reconstruct the SEO URL
            const nonSeoKeys = ['priceRangeKey', 'areaRangeKey', 'direction', 'oldWard', 'q', 'page'];
            const hasNonSeoFilters = nonSeoKeys.some(key => params.has(key));

            if (!hasNonSeoFilters) {
              // Reconstruct the SEO URL. 
              // We need to parse the current slug to keep the category/transaction type.
              const parts = currentPath.split('/').filter(Boolean);
              
              let loaiBdsPart = '';
              const CATEGORIES = ['dat-nen', 'nha-rieng', 'chung-cu', 'du-an', 'mat-bang-kho-xuong', 'bds-khac', 'tat-ca'];

              let i = 0;
              
              if (i < parts.length && CATEGORIES.includes(parts[i])) {
                loaiBdsPart = parts[i];
                i++;
              }

              let newParts = [];
              
              if (loaiBdsPart) newParts.push(loaiBdsPart);

              // Add the new district if selected
              if (district) {
                const slugify = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").replace(/([^0-9a-z-\s])/g, '').replace(/(\s+)/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
                newParts.push(slugify(district));
              }

              if (newParts.length > 0) {
                params.delete('district');
                const queryString = params.toString();
                router.push(`/${newParts.join('/')}${queryString ? '?' + queryString : ''}`);
                return;
              }
            }

            router.push(`${currentPath}?${params.toString()}`);
          }}
          className="font-sans w-full sm:w-auto px-4 py-2 border border-gray-200 bg-white rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer shadow-sm text-gray-700"
        >
          <option value="">Tất cả khu vực</option>
          {locations.map((loc: any) => (
            <option key={loc.id} value={loc.name}>{loc.name}</option>
          ))}
        </select>

        <label className="text-sm text-gray-500 font-medium whitespace-nowrap hidden sm:block">Sắp xếp:</label>
        <select
          value={searchParams.get('sort') || 'newest'}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('sort', e.target.value);
            router.push(`${window.location.pathname}?${params.toString()}`);
          }}
          className="font-sans w-full sm:w-auto px-4 py-2 border border-gray-200 bg-white rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer shadow-sm text-gray-700"
        >
          <option value="newest">Mới nhất</option>
          <option value="price_asc">Giá thấp ➔ cao</option>
          <option value="price_desc">Giá cao ➔ thấp</option>
          <option value="area_asc">Diện tích tăng dần</option>
          <option value="area_desc">Diện tích giảm dần</option>
          <option value="price_per_m2_asc">Giá/m2 tăng dần</option>
          <option value="price_per_m2_desc">Giá/m2 giảm dần</option>
        </select>
      </div>

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
              <h2 className="text-lg font-bold">Bộ lọc tìm kiếm</h2>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 relative">
              {/* Reuse SidebarFilter but remove its own styling context if needed. 
                  SidebarFilter has a form that works fine. */}
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
              {/* SidebarFilter has its own submit button, but just in case we need a dismiss action */}
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
