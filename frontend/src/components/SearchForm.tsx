"use client";

import { useEffect, useRef, useState } from 'react';
import { PROPERTY_TYPES } from '@/lib/seo/taxonomy';
import { useRouter } from 'next/navigation';
import { listingPath } from '@/lib/seo/canonical';
import { useLocations } from '@/hooks/useLocations';
import { createPortal } from 'react-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';

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
  const { locations: districts } = useLocations();
  // Khách yêu cầu: bấm vào ô tìm kiếm là POPUP hiện lên luôn, kèm bàn phím để gõ.
  // Cùng một popup dùng cho trang chủ lẫn trang chuyên mục, nên hai nơi giống hệt nhau.
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  // Tự lấy tiêu điểm để bàn phím điện thoại bật lên ngay, không phải chạm lần hai.
  useEffect(() => {
    if (!isPopupOpen) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setPopupOpen(false);
    window.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [isPopupOpen]);

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
        setPopupOpen(false);
        router.push(listingPath({ propertyTypeSlug: catSlug }));
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

    setPopupOpen(false);
    const queryString = params.toString();
    router.push(`/search${queryString ? '?' + queryString : ''}`);
  };

  // Các ô lọc dùng chung cho popup — giữ đúng danh sách cũ, chỉ đổi nơi hiển thị.
  const filterFields = (
    <>
      <select name="category" defaultValue={initialCategory === "Tất cả danh mục" ? "" : initialCategory} className="font-sans px-4 py-3 outline-none bg-gray-50 text-gray-700 rounded-lg cursor-pointer font-medium text-sm border border-gray-200 focus:border-primary focus:bg-white">
        {/* Nhãn lấy từ taxonomy — một nguồn duy nhất cho cả site. */}
        <option value="">Tất cả danh mục</option>
        {PROPERTY_TYPES.map((t) => (
          <option key={t.enum} value={t.enum}>{t.label}</option>
        ))}
      </select>

      <select name="district" defaultValue={initialDistrict} className="font-sans px-4 py-3 outline-none bg-gray-50 text-gray-700 rounded-lg cursor-pointer font-medium text-sm border border-gray-200 focus:border-primary focus:bg-white">
        <option value="">Khu vực</option>
        {districts.map((d: any) => (
          <option key={d.id ?? d.name} value={d.name}>{d.shortName || d.name}</option>
        ))}
      </select>

      <select name="areaRangeKey" defaultValue={initialArea} className="font-sans px-4 py-3 outline-none bg-gray-50 text-gray-700 rounded-lg cursor-pointer font-medium text-sm border border-gray-200 focus:border-primary focus:bg-white">
        <option value="">Diện tích</option>
        <option value="LT_30">Dưới 30 m²</option>
        <option value="30_50">30 - 50 m²</option>
        <option value="50_80">50 - 80 m²</option>
        <option value="80_100">80 - 100 m²</option>
        <option value="100_150">100 - 150 m²</option>
        <option value="GT_500">Trên 500 m²</option>
      </select>
    </>
  );

  const popup = !mounted || !isPopupOpen ? null : createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm" onClick={() => setPopupOpen(false)}>
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl mt-4 sm:mt-16 overflow-hidden animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="font-bold text-gray-800">Tìm kiếm bất động sản</span>
          <button type="button" onClick={() => setPopupOpen(false)} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Đóng">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Enter trên bàn phím hoặc nút vàng đều tìm được — đúng yêu cầu khách. */}
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
          <div className="relative flex items-center bg-gray-50 rounded-lg border border-gray-200">
            <Search className="absolute left-4 w-5 h-5 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              name="q"
              type="text"
              defaultValue={initialQ}
              enterKeyHint="search"
              placeholder="Nhập từ khóa (vd: nhà cấp 4, chung cư mini)..."
              className="w-full pl-12 pr-4 py-3 outline-none text-base rounded-lg bg-transparent text-gray-800 placeholder:text-gray-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">{filterFields}</div>

          <button type="submit" className="w-full bg-accent hover:bg-accent-light text-white px-8 py-3 rounded-lg font-bold transition-all shadow-glow-accent flex justify-center items-center gap-2">
            <Search className="w-4 h-4" /> Tìm kiếm
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Ô tìm kiếm ngoài trang chỉ là NÚT MỞ popup. Dùng readOnly để chạm vào là popup
          bật lên ngay thay vì bàn phím bật cho ô này rồi lại phải chạm tiếp. */}
      <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-2">
        <div
          className="flex-grow relative flex items-center bg-gray-50 rounded-lg border border-gray-100 min-w-0 cursor-text"
          onClick={() => setPopupOpen(true)}
        >
          <Search className="absolute left-4 w-5 h-5 text-gray-400 shrink-0" />
          <input
            type="text"
            readOnly
            value={initialQ}
            onFocus={() => setPopupOpen(true)}
            placeholder="Nhập từ khóa (vd: nhà cấp 4, chung cư mini)..."
            className="w-full pl-12 pr-4 py-3 outline-none text-base rounded-lg bg-transparent text-gray-800 placeholder:text-gray-400 min-w-0 cursor-text"
            aria-label="Mở ô tìm kiếm"
          />
        </div>

        {/* Khách yêu cầu BỎ chữ "Lọc tìm kiếm" — nút chỉ còn biểu tượng. */}
        <button
          type="button"
          onClick={() => setPopupOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 rounded-lg text-gray-600 border border-gray-200 hover:bg-gray-100 sm:w-auto"
          aria-label="Bộ lọc"
          title="Bộ lọc"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setPopupOpen(true)}
          className="bg-accent hover:bg-accent-light text-white px-8 py-3 rounded-lg font-bold transition-all shadow-glow-accent flex justify-center items-center gap-2"
        >
          <Search className="w-4 h-4 sm:hidden" /> Tìm kiếm
        </button>
      </div>

      {popup}
    </div>
  );
}
