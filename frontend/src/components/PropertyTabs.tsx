"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropertyCard from '@/components/PropertyCard';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PropertyTabs({
  title,
  tabs,
}: {
  title: string,
  tabs: { id: string, label: string, items: any[], href: string, asLink?: boolean }[],
}) {
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id);

  // Nút mũi tên trượt dải tab — khách yêu cầu 19-8 (mục 10): "trên PC chỗ các chuyên mục
  // là Tab không có mũi tên để trượt sang 2 bên (trên mobile không cần vì có thể vuốt)".
  // Vì vậy 2 nút chỉ hiện từ `sm` trở lên, và tự ẩn khi dải tab đã ở sát đầu/cuối.
  const stripRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const syncArrows = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    syncArrows();
    // Dải tab đổi bề rộng khi cửa sổ đổi kích thước hoặc khi font/ảnh tải xong.
    window.addEventListener('resize', syncArrows);
    return () => window.removeEventListener('resize', syncArrows);
  }, [syncArrows, tabs.length]);

  const scrollStrip = (direction: -1 | 1) => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(160, el.clientWidth * 0.6), behavior: 'smooth' });
  };

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const displayItems = activeTab?.items || [];

  if (!tabs || tabs.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 gap-4">
        <h2 className="text-xl md:text-2xl font-extrabold text-textMain">
          {activeTab?.href ? (
            <Link href={activeTab.href} className="hover:text-primary transition-colors">
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>
        <div className="flex items-center gap-1 min-w-0">
          <button
            type="button"
            onClick={() => scrollStrip(-1)}
            aria-label="Xem các mục trước"
            className={`hidden sm:flex shrink-0 items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-opacity hover:bg-gray-50 ${
              canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={stripRef}
            onScroll={syncArrows}
            className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide"
          >
            {tabs.map(tab => {
              // Tab cuối kiểu "xem tất cả" (khu vực khác / xem toàn bộ dự án) là LINK điều
              // hướng thẳng, không phải tab chọn nội dung. `asLink` là cờ tường minh backend
              // gắn cho khối mới (vd project-tabs); giữ nguyên nhánh id cũ làm dây bảo hiểm
              // cho trường hợp frontend mới chạy cùng backend cũ chưa gắn `asLink`.
              if (tab.asLink || tab.id === 'khu-vuc-khac') {
                return (
                  <Link
                    key={tab.id}
                    href={tab.href || '/khu-vuc'}
                    className="whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-full transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200 block"
                  >
                    {tab.label}
                  </Link>
                );
              }
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                    activeTabId === tab.id
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => scrollStrip(1)}
            aria-label="Xem các mục sau"
            className={`hidden sm:flex shrink-0 items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-opacity hover:bg-gray-50 ${
              canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {displayItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {/* Xem giải thích ngưỡng `xl` ở PropertyBlock.tsx — cùng lý do (mục 13). */}
          {displayItems.slice(0, 10).map((item, index) => (
            <div key={item.id} className={`h-full ${index >= 3 ? 'hidden xl:block' : ''}`}>
              <PropertyCard item={item} />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-500">Chưa có bất động sản nào trong khu vực này.</p>
        </div>
      )}
      
      {activeTab && (
        <div className="mt-4 text-center">
          <Link href={activeTab.href} className="inline-block px-6 py-2 border border-primary text-primary font-semibold rounded-full hover:bg-primary/5 transition-colors text-sm">
            Xem tất cả {activeTab.label}
          </Link>
        </div>
      )}
    </div>
  );
}
