"use client";

import { useState, useEffect } from 'react';
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
  const routeParams = useParams();
  
  const [activeDistrict, setActiveDistrict] = useState('');
  const [activeWard, setActiveWard] = useState('');

  useEffect(() => {
    let matchedDistrict = searchParams.get('district') || '';
    let matchedWard = searchParams.get('ward') || '';
    
    const slug = routeParams?.slug;
    if (Array.isArray(slug) && locations.length > 0) {
      const CATEGORIES = ['dat-nen', 'nha-rieng', 'nha-mat-pho', 'biet-thu', 'chung-cu', 'du-an', 'mat-bang-kho-xuong', 'bds-khac', 'tat-ca'];
      let i = 0;
      if (i < slug.length && CATEGORIES.includes(slug[i].toLowerCase())) {
        i++;
      }
      let parsedLoc = '';
      if (i < slug.length) {
        try {
          parsedLoc = decodeURIComponent(slug.slice(i).join('/')).toLowerCase();
        } catch(e) {
          parsedLoc = slug.slice(i).join('/').toLowerCase();
        }
      }

      if (parsedLoc && parsedLoc !== 'toan-quoc' && !matchedDistrict && !matchedWard) {
        let found = false;
        for (const dist of locations) {
          if (generateSlug(dist.name) === parsedLoc) {
            matchedDistrict = dist.name;
            found = true;
            break;
          }
          if (dist.children) {
            for (const w of dist.children) {
              if (generateSlug(w.name) === parsedLoc) {
                matchedDistrict = dist.name;
                matchedWard = w.name;
                found = true;
                break;
              }
            }
          }
          if (found) break;
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
