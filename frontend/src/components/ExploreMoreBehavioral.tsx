"use client";

import React, { useEffect, useState } from 'react';
import { listingPath } from '@/lib/seo/canonical';
import Link from 'next/link';
import { propertyTypeByEnum, propertyTypesByEnum } from '@/lib/seo/taxonomy';

/**
 * Bảng danh mục cũ ở đây tự khai `path: 'biet-thu-lien-ke'` — slug KHÔNG tồn tại trong
 * taxonomy, nên link biệt thự dẫn vào 404 dưới routing chặt của P4. `CHO_THUE` thì trỏ
 * vào `/search` (noindex). Nay slug và nhãn đều lấy từ taxonomy.
 */
const RENT_KEY = 'CHO_THUE';

export default function ExploreMoreBehavioral() {
  const [links, setLinks] = useState<{ label: string, href: string }[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const recent = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    
    let generatedLinks: { label: string, href: string }[] = [];

    if (recent && recent.length > 0) {
      // Extract popular categories and districts
      const categoryCounts: Record<string, number> = {};
      const districtCounts: Record<string, number> = {};

      // Đoạn URL của quận phải là `urlSegment` thật lấy từ quan hệ khu vực của tin.
      // Cách cũ dùng generateSlug(tên) cho ra 'huyen-gia-lam' trong khi urlSegment là
      // 'gia-lam', nên mọi link chéo dẫn vào trang không tồn tại.
      const districtSegment: Record<string, string> = {};

      recent.forEach((item: any) => {
        const type = item.transactionType === 'CHO_THUE' ? RENT_KEY : (item.propertyType || item.category);
        if (type) categoryCounts[type] = (categoryCounts[type] || 0) + 1;

        const seg = item.districtLocation?.urlSegment;
        const name = item.districtLocation?.name || item.district;
        if (seg && name) {
          districtCounts[name] = (districtCounts[name] || 0) + 1;
          districtSegment[name] = seg;
        }
      });

      const topCategories = Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a]).slice(0, 2);
      const topDistricts = Object.keys(districtCounts).sort((a, b) => districtCounts[b] - districtCounts[a]).slice(0, 2);

      // Generate cross links
      topCategories.forEach(catKey => {
        const isRent = catKey === RENT_KEY;
        const typeDef = isRent ? undefined : propertyTypeByEnum(catKey);
        if (!isRent && !typeDef) return;

        topDistricts.forEach(dist => {
          const cleanDist = dist.replace('Thành phố ', '').replace('Huyện ', '').replace('Thị xã ', '');
          const locationSlug = districtSegment[dist];

          generatedLinks.push({
            label: isRent
              ? `Cho thuê bất động sản tại ${cleanDist}`
              : `Bán ${typeDef!.label.toLowerCase()} tại ${cleanDist}`,
            href: listingPath({
              transaction: isRent ? 'cho-thue' : 'ban',
              propertyTypeSlug: typeDef?.slug ?? null,
              locationSlug,
            }),
          });
        });
      });
    }

    // Fallback không còn gắn địa danh Nghệ An; chỉ dùng danh mục theo loại BĐS,
    // đúng với mọi tỉnh.
    if (generatedLinks.length < 4) {
      const fallbackLinks = [
        ...propertyTypesByEnum(['DAT_NEN', 'NHA_RIENG', 'CHUNG_CU']).map((t) => ({
          label: t.label,
          href: listingPath({ propertyTypeSlug: t.slug }),
        })),
        { label: 'Cho thuê', href: listingPath({ transaction: 'cho-thue' }) }
      ];

      const missing = 4 - generatedLinks.length;
      generatedLinks = [...generatedLinks, ...fallbackLinks.slice(0, missing)];
    }

    // Deduplicate
    const uniqueLinks = Array.from(new Map(generatedLinks.map(item => [item.href, item])).values());
    
    setLinks(uniqueLinks);
  }, []);

  if (!mounted || links.length === 0) return null;

  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <h3 className="font-bold text-lg mb-4 text-gray-800">Dành riêng cho bạn</h3>
      <div className="flex flex-wrap gap-2">
        {links.map((link, idx) => (
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
