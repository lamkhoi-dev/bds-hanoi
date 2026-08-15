"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { generateSlug } from '@/lib/utils';

const CATEGORIES = [
  { key: 'DAT_NEN', label: 'Đất nền', path: 'dat-nen' },
  { key: 'CHUNG_CU', label: 'Chung cư', path: 'chung-cu' },
  { key: 'NHA_RIENG', label: 'Nhà riêng', path: 'nha-rieng' },
  { key: 'MAT_BANG', label: 'Mặt bằng', path: 'mat-bang-kho-xuong' },
  { key: 'BIET_THU', label: 'Biệt thự', path: 'biet-thu-lien-ke' },
  { key: 'CHO_THUE', label: 'Cho thuê', path: 'search?transactionType=CHO_THUE' }
];

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

      recent.forEach((item: any) => {
        if (item.transactionType === 'CHO_THUE') {
          categoryCounts['CHO_THUE'] = (categoryCounts['CHO_THUE'] || 0) + 1;
        } else if (item.category) {
          categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
        }

        if (item.district) {
          districtCounts[item.district] = (districtCounts[item.district] || 0) + 1;
        }
      });

      const topCategories = Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a]).slice(0, 2);
      const topDistricts = Object.keys(districtCounts).sort((a, b) => districtCounts[b] - districtCounts[a]).slice(0, 2);

      // Generate cross links
      topCategories.forEach(catKey => {
        const catObj = CATEGORIES.find(c => c.key === catKey);
        if (catObj) {
          topDistricts.forEach(dist => {
            const cleanDist = dist.replace('Thành phố ', '').replace('Huyện ', '').replace('Thị xã ', '');
            const distSlug = generateSlug(dist);
            
            if (catKey === 'CHO_THUE') {
              generatedLinks.push({
                label: `Cho thuê bất động sản tại ${cleanDist}`,
                href: `/search?transactionType=CHO_THUE&khuVuc=${distSlug}`
              });
            } else {
              generatedLinks.push({
                label: `Bán ${catObj.label.toLowerCase()} tại ${cleanDist}`,
                href: `/${catObj.path}/${distSlug}`
              });
            }
          });
        }
      });
    }

    // Fallback if not enough links
    if (generatedLinks.length < 4) {
      const fallbackLinks = [
        { label: 'Đất nền Thành phố Vinh', href: '/dat-nen/thanh-pho-vinh' },
        { label: 'Nhà riêng Thành phố Vinh', href: '/nha-rieng/thanh-pho-vinh' },
        { label: 'Cho thuê nhà Thành phố Vinh', href: '/search?transactionType=CHO_THUE&khuVuc=thanh-pho-vinh' },
        { label: 'Mặt bằng kinh doanh Thành phố Vinh', href: '/mat-bang-kho-xuong/thanh-pho-vinh' }
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
