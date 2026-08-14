"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import SidebarFilter from './SidebarFilter';
import { SlidersHorizontal, X, Trash2 } from 'lucide-react';

import { useLocations } from '@/hooks/useLocations';
import { parseListingPath } from '@/lib/seo/route';

export default function SearchControls() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { locations } = useLocations();
  const routeParams = useParams();
  
  const [activeDistrict, setActiveDistrict] = useState('');
  const [activeWard, setActiveWard] = useState('');

  useEffect(() => {
    let matchedDistrict = searchParams.get('district') || '';
    let matchedWard = searchParams.get('ward') || '';
    
    // Dùng chung bộ phân tích URL với generateMetadata và sitemap. Bản tự chế trước đây
    // giả định đoạn đầu là loại BĐS, nên với URL mới `/ban/dat-nen/cau-giay` nó coi cả
    // chuỗi "ban/dat-nen/cau-giay" là khu vực và bộ lọc hiện trống trên mọi trang.
    const slug = routeParams?.slug;
    const route = Array.isArray(slug) ? parseListingPath(slug) : null;
    const parsedLoc = route?.kind === 'listing' ? route.route.locationSlug : null;

    if (parsedLoc && locations.length > 0 && !matchedDistrict && !matchedWard) {
      // So khớp theo `slug` backend trả về (= urlSegment), KHÔNG suy từ tên:
      // generateSlug('Phường Yên Hòa') ra 'phuong-yen-hoa' còn urlSegment là 'yen-hoa'.
      matchLoop: for (const dist of locations) {
        if (dist.slug === parsedLoc) {
          matchedDistrict = dist.name;
          break;
        }
        for (const w of dist.children ?? []) {
          if (w.slug === parsedLoc) {
            matchedDistrict = dist.name;
            matchedWard = w.name;
            break matchLoop;
          }
        }
      }
    }
    
    setActiveDistrict(matchedDistrict);
    setActiveWard(matchedWard);
  }, [searchParams, routeParams, locations]);

  const activeDistrictData = locations.find((d: any) => d.name === activeDistrict);
  const wards = activeDistrictData?.children || [];

  const handleClearFilters = () => {
    // Keep 'q' if exists, clear others
    const q = searchParams.get('q');
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    router.push(`${window.location.pathname}?${params.toString()}`);
    setIsFilterOpen(false);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full sm:w-auto">
      {/* Sort & Location Bar */}
      <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 ml-auto">

        <label className="text-sm text-gray-500 font-medium whitespace-nowrap">Sắp xếp theo:</label>
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
    </div>
  );
}
