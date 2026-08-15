"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tag } from 'lucide-react';

export default function FavoriteTags() {
  const [tags, setTags] = useState<{ type: string, value: string }[]>([]);

  useEffect(() => {
    // Extract tags from recently viewed properties
    const recent = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    if (!recent || recent.length === 0) return;

    const tagSet = new Set<string>();
    const newTags: { type: string, value: string }[] = [];

    recent.forEach((item: any) => {
      // Add category tag
      if (item.category && !tagSet.has(item.category)) {
        tagSet.add(item.category);
        newTags.push({ type: 'category', value: item.category });
      }
      // Add district tag
      if (item.district && !tagSet.has(item.district)) {
        tagSet.add(item.district);
        newTags.push({ type: 'location', value: item.district });
      }
    });

    setTags(newTags.slice(0, 8)); // Max 8 tags
  }, []);

  if (tags.length === 0) return null;

  return (
    <section className="container mx-auto px-4 mb-8 animate-fade-in">
      <h2 className="text-xl font-bold text-textMain flex items-center gap-2 mb-4">
        <Tag className="w-5 h-5 text-primary" />
        Khu vực / Loại BĐS bạn quan tâm
      </h2>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, idx) => (
          <Link 
            key={idx}
            href={
              tag.value.toLowerCase() === 'cho thuê'
                ? '/search?transactionType=CHO_THUE'
                : `/${tag.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").replace(/([^0-9a-z-\s])/g, '').replace(/(\s+)/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '')}`
            }
            className="px-4 py-2 bg-white shadow-sm border border-borderLight text-textSecondary rounded-full text-sm font-medium hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 cursor-pointer"
          >
            {tag.value}
          </Link>
        ))}
      </div>
    </section>
  );
}
