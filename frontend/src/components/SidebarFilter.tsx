"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { PRICE_RANGES_SELL, PRICE_RANGES_RENT, AREA_RANGES } from '@/constants/ranges';
import { useLocations } from '@/hooks/useLocations';
import api from '@/lib/axios';
import { generateSlug } from '@/lib/utils';

export default function SidebarFilter() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();

  const [filters, setFilters] = useState({
    transactionType: '',
    propertyType: '',
    city: '',
    district: '',
    ward: '',
    oldWard: '',
    priceRangeKey: '',
    areaRangeKey: '',
    direction: ''
  });

  const { locations } = useLocations();
  const [haTinhLocations, setHaTinhLocations] = useState<any[]>([]);

  // Sync state from URL
  useEffect(() => {
    let parsedTx = '';
    let parsedCat = '';
    let parsedLoc = '';

    const slug = params?.slug;
    if (Array.isArray(slug)) {
      const CATEGORIES = ['dat-nen', 'chung-cu', 'nha-rieng', 'nha-mat-pho', 'mat-bang', 'mat-bang-kho-xuong', 'du-an', 'biet-thu', 'bds-khac', 'tat-ca'];
      
      let i = 0;
      parsedTx = 'BAN';
      
      if (i < slug.length && CATEGORIES.includes(slug[i].toLowerCase())) {
        parsedCat = slug[i].toLowerCase();
        i++;
      }

      if (i < slug.length) {
        try {
          parsedLoc = decodeURIComponent(slug.slice(i).join('/')).toLowerCase();
        } catch(e) {
          parsedLoc = slug.slice(i).join('/').toLowerCase();
        }
      }
    }

    const mapCategoryToEnum = (cat: string) => {
      if (!cat) return '';
      const map: any = { 'dat-nen': 'DAT_NEN', 'chung-cu': 'CHUNG_CU', 'nha-rieng': 'NHA_RIENG', 'nha-mat-pho': 'NHA_RIENG', 'mat-bang': 'MAT_BANG', 'mat-bang-kho-xuong': 'MAT_BANG', 'du-an': 'DU_AN', 'biet-thu': 'BIET_THU', 'bds-khac': 'BDS_KHAC' };
      return map[cat] || cat;
    };

    let matchedCity = searchParams.get('city') || '';
    let matchedDistrict = searchParams.get('district') || '';
    let matchedWard = searchParams.get('ward') || searchParams.get('location') || '';

    // Map slugLocation to correct city, district, and ward
    if (parsedLoc && parsedLoc !== 'toan-quoc' && !matchedCity && !matchedDistrict && !matchedWard) {
      if (parsedLoc === 'nghe-an') {
        matchedCity = 'Nghệ An';
      } else if (parsedLoc === 'ha-tinh') {
        matchedCity = 'Hà Tĩnh';
      } else {
        let found = false;
        
        // Search Nghệ An
        for (const dist of locations) {
          if (generateSlug(dist.name) === parsedLoc) {
            matchedCity = 'Nghệ An';
            matchedDistrict = dist.name;
            found = true; break;
          }
          if (dist.children) {
            for (const w of dist.children) {
              if (generateSlug(w.name) === parsedLoc) {
                matchedCity = 'Nghệ An';
                matchedDistrict = dist.name;
                matchedWard = w.name;
                found = true; break;
              }
            }
          }
          if (found) break;
        }

        // Search Hà Tĩnh
        if (!found) {
          for (const dist of haTinhLocations) {
            if (generateSlug(dist.name) === parsedLoc) {
              matchedCity = 'Hà Tĩnh';
              matchedDistrict = dist.name;
              found = true; break;
            }
            if (dist.children) {
              for (const w of dist.children) {
                if (generateSlug(w.name) === parsedLoc) {
                  matchedCity = 'Hà Tĩnh';
                  matchedDistrict = dist.name;
                  matchedWard = w.name;
                  found = true; break;
                }
              }
            }
            if (found) break;
          }
        }
      }
    }

    setFilters({
      transactionType: searchParams.get('transactionType') || parsedTx || '',
      propertyType: searchParams.get('propertyType') || mapCategoryToEnum(searchParams.get('category') || parsedCat) || '',
      city: matchedCity,
      district: matchedDistrict,
      ward: matchedWard,
      oldWard: searchParams.get('oldWard') || '',
      priceRangeKey: searchParams.get('priceRangeKey') || '',
      areaRangeKey: searchParams.get('areaRangeKey') || '',
      direction: searchParams.get('direction') || ''
    });
  }, [searchParams, params, locations, haTinhLocations]);

  // Fetch Hà Tĩnh locations when needed
  useEffect(() => {
    if ((filters.city === 'Hà Tĩnh' || filters.city === '') && haTinhLocations.length === 0) {
      api.get('/locations?city=Hà Tĩnh').then(res => {
        setHaTinhLocations(res.data);
      }).catch(console.error);
    }
  }, [filters.city]);

  const handleChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const buildUrlAndNavigate = (currentFilters: any) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Set all filter keys to search parameters
    Object.entries(currentFilters).forEach(([k, v]) => {
      if (v) {
        params.set(k, v as string);
      } else {
        params.delete(k); // If filter is empty, remove it from query
      }
    });

    // Check if we can use an SEO URL
    // These keys indicate we MUST use /search
    const nonSeoKeys = ['priceRangeKey', 'areaRangeKey', 'direction', 'oldWard', 'q'];
    const hasNonSeoFilters = nonSeoKeys.some(key => params.has(key));

    if (!hasNonSeoFilters) {
      let slugParts = [];
      const transactionType = params.get('transactionType');
      const propertyType = params.get('propertyType');

      if (transactionType === 'CHO_THUE') {
        // CHO_THUE never uses SEO URLs
        const queryString = params.toString();
        router.push(`/search${queryString ? '?' + queryString : ''}`);
        return;
      }

      const mapEnumToCategory = (enumValue: string) => {
        const map: any = { 'DAT_NEN': 'dat-nen', 'CHUNG_CU': 'chung-cu', 'NHA_RIENG': 'nha-rieng', 'MAT_BANG': 'mat-bang-kho-xuong', 'DU_AN': 'du-an', 'BIET_THU': 'biet-thu', 'BDS_KHAC': 'bds-khac' };
        return map[enumValue] || '';
      };

      if (propertyType) {
        const catSlug = mapEnumToCategory(propertyType);
        if (catSlug) slugParts.push(catSlug);
      }

      const ward = params.get('ward');
      const district = params.get('district');
      const city = params.get('city');

      let locSlug = '';
      if (ward) locSlug = generateSlug(ward);
      else if (district) locSlug = generateSlug(district);
      else if (city === 'Nghệ An') locSlug = 'nghe-an';
      else if (city === 'Hà Tĩnh') locSlug = 'ha-tinh';

      if (locSlug) slugParts.push(locSlug);

      if (slugParts.length > 0) {
        // Redirect to SEO URL
        params.delete('transactionType');
        params.delete('propertyType');
        params.delete('ward');
        params.delete('district');
        params.delete('city');
        
        const queryString = params.toString();
        router.push(`/${slugParts.join('/')}${queryString ? '?' + queryString : ''}`);
        return;
      }
    }
    
    const queryString = params.toString();
    router.push(`/search${queryString ? '?' + queryString : ''}`);
  };

  const removeFilter = (key: string) => {
    const newFilters = { ...filters, [key]: '' };
    setFilters(newFilters);
    buildUrlAndNavigate(newFilters);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    buildUrlAndNavigate(filters);
  };

  const priceRanges = filters.transactionType === 'CHO_THUE' ? PRICE_RANGES_RENT : PRICE_RANGES_SELL;

  const isHaTinh = filters.city === 'Hà Tĩnh';

  // Compute active locations based on city selection
  const activeLocations = (() => {
    if (filters.city === 'Nghệ An') return locations;
    if (filters.city === 'Hà Tĩnh') return haTinhLocations;
    // 'Tất cả' - combine both
    return [...locations, ...haTinhLocations];
  })();

  const activeChips = Object.entries(filters).filter(([k, v]) => v !== '').map(([key, value]) => {
    let label = value;
    if (key === 'transactionType') label = value === 'BAN' ? 'Bán BĐS' : 'Cho thuê';
    if (key === 'propertyType') {
      const catMap: any = { DAT_NEN: 'Đất nền', NHA_RIENG: 'Nhà riêng / Mặt phố', CHUNG_CU: 'Chung cư / Căn hộ', DU_AN: 'Dự án', MAT_BANG: 'Mặt bằng kinh doanh', BIET_THU: 'Biệt thự', BDS_KHAC: 'Bất động sản khác' };
      label = catMap[value] || value;
    }
    if (key === 'priceRangeKey') label = priceRanges.find(r => r.key === value)?.label || value;
    if (key === 'areaRangeKey') label = AREA_RANGES.find(r => r.key === value)?.label || value;
    if (key === 'city') label = `Tỉnh/TP: ${value}`;
    if (key === 'district') label = `Quận/Huyện: ${value}`;
    if (key === 'ward') label = `Phường/Xã: ${value}`;
    if (key === 'oldWard') label = `Phường/Xã cũ: ${value}`;
    if (key === 'location') return null; // fallback
    return { key, label };
  }).filter(chip => chip !== null) as { key: string, label: string }[];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-card border border-borderLight/50 sticky top-24 mb-8 lg:mb-0">
      <h3 className="font-extrabold text-lg mb-5 text-textMain flex items-center gap-2">
        <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
        Bộ lọc tìm kiếm
      </h3>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {activeChips.map(chip => (
            <span key={chip.key} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20">
              {chip.label}
              <button onClick={() => removeFilter(chip.key)} className="hover:text-red-500 transition-colors ml-1 focus:outline-none">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </span>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-textMain mb-2">Loại giao dịch</label>
          <select 
            value={filters.transactionType}
            onChange={(e) => handleChange('transactionType', e.target.value)}
            className="font-sans w-full px-3 py-2.5 border border-borderLight bg-gray-50/50 rounded-xl text-sm outline-none focus:border-primary focus:bg-white transition-colors cursor-pointer"
          >
            <option className="font-sans" value="">Tất cả</option>
            <option className="font-sans" value="BAN">Bán BĐS</option>
            <option className="font-sans" value="CHO_THUE">Cho thuê BĐS</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-textMain mb-2">Loại BĐS</label>
          <select 
            value={filters.propertyType}
            onChange={(e) => handleChange('propertyType', e.target.value)}
            className="font-sans w-full px-3 py-2.5 border border-borderLight bg-gray-50/50 rounded-xl text-sm outline-none focus:border-primary focus:bg-white transition-colors cursor-pointer"
          >
            <option className="font-sans" value="">Tất cả</option>
            <option className="font-sans" value="DAT_NEN">Đất nền</option>
            <option className="font-sans" value="NHA_RIENG">Nhà riêng / Mặt phố</option>
            <option className="font-sans" value="CHUNG_CU">Chung cư / Căn hộ</option>
            <option className="font-sans" value="DU_AN">Dự án</option>
            <option className="font-sans" value="MAT_BANG">Mặt bằng kinh doanh</option>
            <option className="font-sans" value="BIET_THU">Biệt thự</option>
            <option className="font-sans" value="BDS_KHAC">Bất động sản khác</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-textMain mb-2">Tỉnh/Thành phố</label>
          <select 
            value={filters.city}
            onChange={(e) => {
              handleChange('city', e.target.value);
              handleChange('district', '');
              handleChange('ward', '');
              handleChange('oldWard', '');
            }}
            className="font-sans w-full px-3 py-2.5 border border-borderLight bg-gray-50/50 rounded-xl text-sm outline-none focus:border-primary focus:bg-white transition-colors cursor-pointer"
          >
            <option className="font-sans" value="">Tất cả</option>
            <option className="font-sans" value="Nghệ An">Nghệ An</option>
            <option className="font-sans" value="Hà Tĩnh">Hà Tĩnh</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-textMain mb-2">Quận/Huyện</label>
          <select 
            value={filters.district}
            onChange={(e) => {
              handleChange('district', e.target.value);
              handleChange('ward', '');
              handleChange('oldWard', '');
            }}
            className="font-sans w-full px-3 py-2.5 border border-borderLight bg-gray-50/50 rounded-xl text-sm outline-none focus:border-primary focus:bg-white transition-colors cursor-pointer"
          >
            <option className="font-sans" value="">Tất cả Quận/Huyện</option>
            {activeLocations.map((district, index) => (
              <option className="font-sans" key={`${district.id || district.name}-${index}`} value={district.name}>{district.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-textMain mb-2">Phường/Xã</label>
          {isHaTinh ? (
            <div className="w-full px-3 py-2.5 border border-borderLight bg-gray-100 rounded-xl text-sm text-gray-400 cursor-not-allowed">
              Không áp dụng cho Hà Tĩnh
            </div>
          ) : (
            <select 
              value={filters.ward}
              onChange={(e) => handleChange('ward', e.target.value)}
              disabled={!filters.district}
              className="font-sans w-full px-3 py-2.5 border border-borderLight bg-gray-50/50 rounded-xl text-sm outline-none focus:border-primary focus:bg-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <option className="font-sans" value="">Tất cả Phường/Xã</option>
              {activeLocations.find(d => d.name === filters.district)?.children?.filter((w: any) => w.type !== 'OLD_WARD').map((ward: any) => (
                <option className="font-sans" key={ward.id || ward.name} value={ward.name}>{ward.name}</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block text-sm font-bold text-textMain mb-2">Phường/Xã cũ</label>
          {isHaTinh ? (
            <div className="w-full px-3 py-2.5 border border-borderLight bg-gray-100 rounded-xl text-sm text-gray-400 cursor-not-allowed">
              Không áp dụng cho Hà Tĩnh
            </div>
          ) : (
            <select 
              value={filters.oldWard}
              onChange={(e) => handleChange('oldWard', e.target.value)}
              disabled={!filters.district}
              className="font-sans w-full px-3 py-2.5 border border-borderLight bg-gray-50/50 rounded-xl text-sm outline-none focus:border-primary focus:bg-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <option className="font-sans" value="">Tất cả Phường/Xã cũ</option>
              {activeLocations.find(d => d.name === filters.district)?.children?.filter((w: any) => w.type === 'OLD_WARD').map((ward: any) => (
                <option className="font-sans" key={ward.id || ward.name} value={ward.name}>{ward.name}</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block text-sm font-bold text-textMain mb-2">Khoảng giá</label>
          <select 
            value={filters.priceRangeKey}
            onChange={(e) => handleChange('priceRangeKey', e.target.value)}
            className="font-sans w-full px-3 py-2.5 border border-borderLight bg-gray-50/50 rounded-xl text-sm outline-none focus:border-primary focus:bg-white transition-colors cursor-pointer"
          >
            <option className="font-sans" value="">Tất cả mức giá</option>
            {priceRanges.map(range => (
              <option className="font-sans" key={range.key} value={range.key}>{range.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-textMain mb-2">Diện tích</label>
          <select 
            value={filters.areaRangeKey}
            onChange={(e) => handleChange('areaRangeKey', e.target.value)}
            className="font-sans w-full px-3 py-2.5 border border-borderLight bg-gray-50/50 rounded-xl text-sm outline-none focus:border-primary focus:bg-white transition-colors cursor-pointer"
          >
            <option className="font-sans" value="">Tất cả diện tích</option>
            {AREA_RANGES.map(range => (
              <option className="font-sans" key={range.key} value={range.key}>{range.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-textMain mb-2">Hướng nhà</label>
          <select 
            value={filters.direction}
            onChange={(e) => handleChange('direction', e.target.value)}
            className="font-sans w-full px-3 py-2.5 border border-borderLight bg-gray-50/50 rounded-xl text-sm outline-none focus:border-primary focus:bg-white transition-colors cursor-pointer"
          >
            <option className="font-sans" value="">Tất cả hướng</option>
            <option className="font-sans" value="Đông">Đông</option>
            <option className="font-sans" value="Tây">Tây</option>
            <option className="font-sans" value="Nam">Nam</option>
            <option className="font-sans" value="Bắc">Bắc</option>
            <option className="font-sans" value="Đông Nam">Đông Nam</option>
            <option className="font-sans" value="Đông Bắc">Đông Bắc</option>
            <option className="font-sans" value="Tây Nam">Tây Nam</option>
            <option className="font-sans" value="Tây Bắc">Tây Bắc</option>
          </select>
        </div>
        
        <button type="submit" className="w-full mt-2 btn-shimmer bg-gradient-to-r from-primary to-primary-light text-white font-bold py-3.5 rounded-xl hover:shadow-glow transition-all flex items-center justify-center gap-2">
          Áp dụng bộ lọc
        </button>
      </form>
    </div>
  );
}
