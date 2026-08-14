import React from 'react';
import Link from 'next/link';
import { listingPath } from '@/lib/seo/canonical';
import { PROPERTY_TYPES, propertyTypeByEnum } from '@/lib/seo/taxonomy';
import { serverApiUrl } from '@/lib/server-api';

interface ExploreMoreContextualProps {
  currentCategory?: string;
  transactionType?: string;
  district?: string;
  ward?: string;
  limit?: number;
}

/**
 * Bảng danh mục cũ ở đây tự khai `path: 'biet-thu-lien-ke'` — slug KHÔNG tồn tại trong
 * taxonomy nên link biệt thự dẫn vào 404. Lấy thẳng từ taxonomy, bỏ đúng `DU_AN` và
 * `BDS_KHAC` cho gọn khối gợi ý.
 */
const SUGGESTED_TYPES = PROPERTY_TYPES.filter(
  (t) => !['DU_AN', 'BDS_KHAC'].includes(t.enum),
);

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
  const transaction = isRent ? 'cho-thue' : 'ban';
  const prefix = isRent ? 'Cho thuê' : 'Bán';
  const resolvedCategory = currentCategory || 'DAT_NEN';
  const currentCatObj = propertyTypeByEnum(resolvedCategory) ?? SUGGESTED_TYPES[0];

  // Đoạn URL phải là `urlSegment` thật từ cây khu vực (API trả dưới tên `slug`).
  // generateSlug(tên) cho ra 'phuong-yen-hoa' trong khi urlSegment là 'yen-hoa' —
  // cách cũ khiến mọi link gợi ý dẫn vào trang không tồn tại. Không có slug thì bỏ
  // hẳn đoạn khu vực chứ không đoán.
  // 1. Same category, different wards in the same district
  selectedWards.forEach(w => {
    if (w.name !== ward && w.slug) {
      const labelName = w.name.replace('Phường ', '').replace('Xã ', '');
      links.push({
        label: `${prefix} ${currentCatObj.label.toLowerCase()} tại ${labelName}`,
        href: listingPath({ transaction, propertyTypeSlug: currentCatObj.slug, locationSlug: w.slug }),
      });
    }
  });

  // 2. Different categories in the SAME district/ward
  const locationNode =
    (ward ? relevantWards.find((w: any) => w?.name === ward) : null) ?? currentDistrictObj ?? null;
  const locationName = locationNode?.name || '';
  const locationSlug: string | undefined = locationNode?.slug || undefined;
  const cleanLocName = locationName.replace('Phường ', '').replace('Xã ', '').replace('Thành phố ', '');

  if (locationSlug) {
    SUGGESTED_TYPES.forEach(cat => {
      if (cat.enum !== resolvedCategory) {
        links.push({
          label: `${prefix} ${cat.label.toLowerCase()} tại ${cleanLocName}`,
          href: listingPath({ transaction, propertyTypeSlug: cat.slug, locationSlug }),
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
