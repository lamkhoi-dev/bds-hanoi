import React from 'react';
import Link from 'next/link';
import { generateSlug } from '@/lib/utils';
import { serverApiUrl } from '@/lib/server-api';

interface ExploreMoreContextualProps {
  currentCategory?: string;
  transactionType?: string;
  district?: string;
  ward?: string;
  limit?: number;
}

const CATEGORIES = [
  { key: 'DAT_NEN', label: 'Đất nền', path: 'dat-nen' },
  { key: 'CHUNG_CU', label: 'Chung cư', path: 'chung-cu' },
  { key: 'NHA_RIENG', label: 'Nhà riêng', path: 'nha-rieng' },
  { key: 'MAT_BANG', label: 'Mặt bằng', path: 'mat-bang-kho-xuong' },
  { key: 'BIET_THU', label: 'Biệt thự', path: 'biet-thu-lien-ke' }
];

async function getLocations() {
  try {
    const res = await fetch(serverApiUrl('/locations'), { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function ExploreMoreContextual({
  currentCategory,
  transactionType,
  district,
  ward,
  limit = 8
}: ExploreMoreContextualProps) {
  const locations = await getLocations();
  
  // Find wards in the current district
  let relevantWards: any[] = [];
  let currentDistrictObj: any = null;
  
  if (district || ward) {
    // If ward is provided but no district, try to find the district
    for (const city of locations) {
      for (const dist of (city.children || [])) {
        if (district && dist.name === district) {
          currentDistrictObj = dist;
          break;
        }
        if (ward && !district) {
          const foundWard = (dist.children || []).find((w: any) => w.name === ward);
          if (foundWard) {
            currentDistrictObj = dist;
            break;
          }
        }
      }
      if (currentDistrictObj) break;
    }
  }

  if (currentDistrictObj) {
    relevantWards = currentDistrictObj.children || [];
  } else {
    // Fallback: pick all wards
    relevantWards = locations.flatMap((c: any) => c.children || []).flatMap((d: any) => d.children || []);
  }

  // Shuffle wards
  const shuffledWards = [...relevantWards].filter(w => w && w.name).sort(() => 0.5 - Math.random());
  const selectedWards = shuffledWards.slice(0, 4);

  const links: { label: string, href: string }[] = [];

  const isRent = transactionType === 'CHO_THUE' || transactionType === 'cho_thue';
  const prefix = isRent ? 'Cho thuê' : 'Bán';
  const resolvedCategory = currentCategory || 'DAT_NEN';
  const currentCatObj = CATEGORIES.find(c => c.key === resolvedCategory) || CATEGORIES[0];

  // 1. Same category, different wards in the same district
  selectedWards.forEach(w => {
    if (w.name !== ward) {
      const href = isRent 
        ? `/search?transactionType=CHO_THUE&khuVuc=${w.slug || generateSlug(w.name)}`
        : `/${currentCatObj.path}/${w.slug || generateSlug(w.name)}`;
      
      const labelName = w.name.replace('Phường ', '').replace('Xã ', '');
      links.push({
        label: `${prefix} ${currentCatObj.label.toLowerCase()} tại ${labelName}`,
        href
      });
    }
  });

  // 2. Different categories in the SAME district/ward
  const locationName = ward || district || (currentDistrictObj ? currentDistrictObj.name : '');
  const locationSlug = locationName ? generateSlug(locationName) : '';
  const cleanLocName = locationName.replace('Phường ', '').replace('Xã ', '').replace('Thành phố ', '');

  if (locationName) {
    CATEGORIES.forEach(cat => {
      if (cat.key !== resolvedCategory) {
        const href = isRent 
          ? `/search?transactionType=CHO_THUE&khuVuc=${locationSlug}`
          : `/${cat.path}/${locationSlug}`;
        
        links.push({
          label: `${prefix} ${cat.label.toLowerCase()} tại ${cleanLocName}`,
          href
        });
      }
    });
  }

  // Shuffle combined links and take `limit`
  const finalLinks = [...links].sort(() => 0.5 - Math.random()).slice(0, limit);

  if (finalLinks.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h3 className="font-bold text-lg mb-4 text-gray-800">Khám phá thêm bất động sản</h3>
      <div className="flex flex-wrap gap-2">
        {finalLinks.map((link, idx) => (
          <Link 
            key={idx} 
            href={link.href} 
            className="px-4 py-2 bg-white border hover:border-primary hover:text-primary rounded-lg text-sm text-gray-600 transition-colors shadow-sm"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
