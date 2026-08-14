"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { PRICE_RANGES_SELL, PRICE_RANGES_RENT, AREA_RANGES } from '@/constants/ranges';
import { useLocations } from '@/hooks/useLocations';
import { generateSlug } from '@/lib/utils';
import { siteConfig } from '@/lib/site-config';
import { listingPath } from '@/lib/seo/canonical';
import { parseListingPath } from '@/lib/seo/route';
import { PROPERTY_TYPES, propertyTypeBySlug, propertyTypeByEnum } from '@/lib/seo/taxonomy';

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

  // `locations` giờ đã được backend giới hạn trong tỉnh đang cấu hình. Trước đây
  // `/locations` gọi không tham số trả về MỌI quận/huyện toàn quốc, rồi component
  // còn nối thêm danh sách Hà Tĩnh fetch riêng — nên "Tất cả" hiện mỗi huyện Hà Tĩnh
  // hai lần và "Nghệ An" lại liệt kê cả huyện Hà Tĩnh.
  const { locations } = useLocations();

  // Sync state from URL
  useEffect(() => {
    let parsedTx = '';
    let parsedCat = '';
    let parsedLoc = '';

    // Dùng chung bộ phân tích URL với generateMetadata và sitemap. Bản tự chế trước đây
    // giả định đoạn đầu là loại BĐS nên với URL mới `/ban/dat-nen/cau-giay` nó không
    // nhận ra loại BĐS và coi cả chuỗi là khu vực — bộ lọc hiện trống ở mọi trang.
    const slug = params?.slug;
    const route = Array.isArray(slug) ? parseListingPath(slug) : null;
    if (route?.kind === 'listing') {
      parsedTx = route.route.transaction === 'cho-thue' ? 'CHO_THUE' : 'BAN';
      parsedCat = route.route.propertyTypeSlug ?? '';
      parsedLoc = route.route.locationSlug ?? '';
    }

    // Alias (`nha-mat-pho`, `mat-bang`, `can-ho`…) đã được taxonomy quy về loại chuẩn.
    const mapCategoryToEnum = (cat: string) => propertyTypeBySlug(cat)?.enum ?? '';

    let matchedCity = searchParams.get('city') || '';
    let matchedDistrict = searchParams.get('district') || '';
    let matchedWard = searchParams.get('ward') || searchParams.get('location') || '';

    // Map slugLocation to correct city, district, and ward
    if (parsedLoc && parsedLoc !== 'toan-quoc' && !matchedCity && !matchedDistrict && !matchedWard) {
      if (parsedLoc === siteConfig.province.slug) {
        matchedCity = siteConfig.province.name;
      } else {
        // So khớp theo `slug` (= urlSegment) backend trả về, KHÔNG suy từ tên nữa:
        // generateSlug('Phường Yên Hòa') ra 'phuong-yen-hoa' trong khi urlSegment thật
        // là 'yen-hoa', nên cách cũ không khớp được phường nào có tiền tố.
        matchLoop: for (const dist of locations) {
          if (dist.slug === parsedLoc) {
            matchedCity = siteConfig.province.name;
            matchedDistrict = dist.name;
            break;
          }
          for (const w of dist.children ?? []) {
            if (w.slug === parsedLoc) {
              matchedCity = siteConfig.province.name;
              matchedDistrict = dist.name;
              matchedWard = w.name;
              break matchLoop;
            }
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
  }, [searchParams, params, locations]);

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
      const transactionType = params.get('transactionType');
      const propertyType = params.get('propertyType');

      // `cho-thue` giờ là một đoạn URL hợp lệ nên tin cho thuê cũng có trang SEO riêng,
      // không phải đẩy hết về /search như trước.
      const transaction: 'ban' | 'cho-thue' = transactionType === 'CHO_THUE' ? 'cho-thue' : 'ban';

      const mapEnumToCategory = (enumValue: string) => {
        const map: any = { 'DAT_NEN': 'dat-nen', 'CHUNG_CU': 'chung-cu', 'NHA_RIENG': 'nha-rieng', 'MAT_BANG': 'mat-bang-kho-xuong', 'DU_AN': 'du-an', 'BIET_THU': 'biet-thu', 'BDS_KHAC': 'bds-khac' };
        return map[enumValue] || '';
      };

      const propertyTypeSlug = propertyType ? mapEnumToCategory(propertyType) || null : null;

      const ward = params.get('ward');
      const district = params.get('district');
      const city = params.get('city');

      // Lấy urlSegment thật từ cây khu vực. generateSlug(tên) cho ra slug khác với
      // urlSegment trong DB khi tên có tiền tố đơn vị ("Phường Yên Hòa" -> "yen-hoa"),
      // nên dựng URL bằng cách slug hoá tên sẽ trỏ vào trang không tồn tại.
      let locSlug = '';
      if (ward) {
        for (const dist of locations) {
          const hit = (dist.children ?? []).find((w: any) => w.name === ward);
          if (hit?.slug) { locSlug = hit.slug; break; }
        }
      } else if (district) {
        locSlug = locations.find((d) => d.name === district)?.slug ?? '';
      } else if (city) {
        locSlug = siteConfig.province.slug;
      }

      if (propertyTypeSlug || locSlug) {
        // Chuyển sang URL SEO — các tham số đã nằm trong đường dẫn thì bỏ khỏi query.
        params.delete('transactionType');
        params.delete('propertyType');
        params.delete('ward');
        params.delete('district');
        params.delete('city');

        const queryString = params.toString();
        const path = listingPath({ transaction, propertyTypeSlug, locationSlug: locSlug || null });
        router.push(`${path}${queryString ? '?' + queryString : ''}`);
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

  // Site chỉ phục vụ một tỉnh nên không còn nhánh riêng cho tỉnh thứ hai, và cũng
  // không còn chuyện nối hai danh sách gây lặp quận/huyện.
  const activeLocations = locations;

  const activeChips = Object.entries(filters).filter(([k, v]) => v !== '').map(([key, value]) => {
    let label = value;
    if (key === 'transactionType') label = value === 'BAN' ? 'Bán BĐS' : 'Cho thuê';
    if (key === 'propertyType') {
      label = propertyTypeByEnum(value)?.label || value;
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
            {/* Nhãn lấy từ taxonomy — trước đây 8 nơi tự viết chuỗi, riêng MAT_BANG có
                tới 5 biến thể ("Mặt bằng KD", "Mặt bằng / kho xưởng"…). */}
            <option className="font-sans" value="">Tất cả</option>
            {PROPERTY_TYPES.map((t) => (
              <option className="font-sans" key={t.enum} value={t.enum}>{t.label}</option>
            ))}
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
            {/* Site phục vụ một tỉnh; danh sách cứng Nghệ An/Hà Tĩnh đã bỏ. */}
            <option className="font-sans" value={siteConfig.province.name}>
              {siteConfig.province.name}
            </option>
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
          {/* Ràng buộc "chọn quận/huyện rồi mới chọn được xã" nằm ở disabled bên dưới. */}
          <select
            value={filters.ward}
            onChange={(e) => handleChange('ward', e.target.value)}
            disabled={!filters.district}
            className="font-sans w-full px-3 py-2.5 border border-borderLight bg-gray-50/50 rounded-xl text-sm outline-none focus:border-primary focus:bg-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <option className="font-sans" value="">Tất cả Phường/Xã</option>
            {activeLocations.find(d => d.name === filters.district)?.children?.filter((w: any) => w.type === 'WARD').map((ward: any) => (
              <option className="font-sans" key={ward.id || ward.name} value={ward.name}>{ward.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-textMain mb-2">Phường/Xã cũ</label>
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
