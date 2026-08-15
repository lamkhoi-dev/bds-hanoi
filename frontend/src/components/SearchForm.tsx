"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';

export default function SearchForm({ 
  initialQ = '', 
  initialCategory = '', 
  initialProvince = '', 
  initialDistrict = '', 
  initialArea = '' 
}: { 
  initialQ?: string; 
  initialCategory?: string;
  initialProvince?: string;
  initialDistrict?: string;
  initialArea?: string;
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get('q') as string;
    const category = formData.get('category') as string;
    const district = formData.get('district') as string;
    const areaRangeKey = formData.get('areaRangeKey') as string;

    const hasNonSeoFilters = q || district || areaRangeKey;

    if (!hasNonSeoFilters && category) {
      const mapEnumToCategory = (enumValue: string) => {
        const map: any = { 'DAT_NEN': 'dat-nen', 'CHUNG_CU': 'chung-cu', 'NHA_RIENG': 'nha-rieng', 'MAT_BANG': 'mat-bang-kho-xuong', 'DU_AN': 'du-an', 'BIET_THU': 'biet-thu', 'BDS_KHAC': 'bds-khac' };
        return map[enumValue] || '';
      };
      const catSlug = mapEnumToCategory(category);
      if (catSlug) {
        router.push(`/${catSlug}`);
        return;
      }
    }

    const params = new URLSearchParams(window.location.search);
    if (q) { params.set('q', q); } else { params.delete('q'); }
    if (category) { params.set('category', category); } else { params.delete('category'); }
    if (district) { params.set('district', district); } else { params.delete('district'); }
    if (areaRangeKey) { params.set('areaRangeKey', areaRangeKey); } else { params.delete('areaRangeKey'); }
    
    // Always reset to page 1 when searching anew
    params.delete('page');
    if (category) params.set('category', category);
    if (district) params.set('district', district);
    if (areaRangeKey) params.set('areaRangeKey', areaRangeKey);

    const queryString = params.toString();
    router.push(`/search${queryString ? '?' + queryString : ''}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-2 shadow-sm border border-gray-200 flex flex-col md:flex-row gap-2 relative z-20">
        
        {/* Main Search Input */}
        <div className="flex-grow relative flex items-center bg-gray-50 rounded-lg border border-gray-100 min-w-0">
          <Search className="absolute left-4 w-5 h-5 text-gray-400 shrink-0" />
          <input 
            name="q"
            type="text" 
            defaultValue={initialQ}
            placeholder="Nhập từ khóa (vd: nhà cấp 4, chung cư mini)..." 
            className="w-full pl-12 pr-4 py-3 outline-none text-base rounded-lg bg-transparent text-gray-800 placeholder:text-gray-400 min-w-0"
          />
        </div>
        
        <div className="hidden md:block w-px bg-gray-200 my-2" />

        {/* Mobile Toggle Button */}
        <button 
          type="button"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="md:hidden flex items-center justify-between w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-700 font-medium border border-gray-200"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" /> Lọc tìm kiếm
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Filters (Desktop Always visible, Mobile Collapsible) */}
        <div className={`${isFilterOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-2 mt-2 md:mt-0 animate-fade-in`}>
          <select name="category" defaultValue={initialCategory === "Tất cả danh mục" ? "" : initialCategory} className="font-sans px-4 py-3 outline-none bg-gray-50 text-gray-700 rounded-lg cursor-pointer font-medium text-sm min-w-[140px] border border-gray-200 focus:border-primary focus:bg-white">
            <option value="">Tất cả danh mục</option>
            <option value="DAT_NEN">Đất nền</option>
            <option value="NHA_RIENG">Nhà riêng</option>
            <option value="CHUNG_CU">Chung cư</option>
            <option value="MAT_BANG">Mặt bằng KD</option>
            <option value="DU_AN">Dự án</option>
            <option value="BIET_THU">Biệt thự</option>
            <option value="BDS_KHAC">BĐS khác</option>
          </select>

          <select name="district" defaultValue={initialDistrict} className="font-sans px-4 py-3 outline-none bg-gray-50 text-gray-700 rounded-lg cursor-pointer font-medium text-sm min-w-[140px] border border-gray-200 focus:border-primary focus:bg-white">
            <option value="">Khu vực</option>
            <option value="Thành phố Vinh">TP Vinh</option>
            <option value="Thị xã Cửa Lò">Cửa Lò</option>
            <option value="Thị xã Hoàng Mai">Hoàng Mai</option>
            <option value="Thị xã Thái Hòa">Thái Hòa</option>
            <option value="Huyện Diễn Châu">Diễn Châu</option>
            <option value="Huyện Đô Lương">Đô Lương</option>
            <option value="Huyện Hưng Nguyên">Hưng Nguyên</option>
            <option value="Huyện Nghi Lộc">Nghi Lộc</option>
            <option value="Thành phố Hà Tĩnh">TP Hà Tĩnh</option>
            <option value="Thị xã Hồng Lĩnh">Hồng Lĩnh</option>
            <option value="Thị xã Kỳ Anh">Thị xã Kỳ Anh</option>
          </select>

          <select name="areaRangeKey" defaultValue={initialArea} className="font-sans px-4 py-3 outline-none bg-gray-50 text-gray-700 rounded-lg cursor-pointer font-medium text-sm min-w-[140px] border border-gray-200 focus:border-primary focus:bg-white">
            <option value="">Diện tích</option>
            <option value="LT_30">Dưới 30 m²</option>
            <option value="30_50">30 - 50 m²</option>
            <option value="50_80">50 - 80 m²</option>
            <option value="80_100">80 - 100 m²</option>
            <option value="100_150">100 - 150 m²</option>
            <option value="GT_500">Trên 500 m²</option>
          </select>
          
          <button type="submit" className="w-full md:w-auto bg-accent hover:bg-accent-light text-white px-8 py-3 rounded-lg font-bold transition-all shadow-glow-accent flex justify-center items-center gap-2">
            <Search className="w-4 h-4 md:hidden" /> Tìm kiếm
          </button>
        </div>
      </form>

      {/* Mobile Background Overlay for Filters */}
      {isFilterOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/40 z-10 backdrop-blur-sm"
          onClick={() => setIsFilterOpen(false)}
        />
      )}
    </div>
  );
}
