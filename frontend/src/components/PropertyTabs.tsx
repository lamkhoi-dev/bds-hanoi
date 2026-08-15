"use client";

import React, { useState } from 'react';
import PropertyCard from '@/components/PropertyCard';
import Link from 'next/link';

export default function PropertyTabs({ 
  title, 
  tabs, 
}: { 
  title: string, 
  tabs: { id: string, label: string, items: any[], href: string }[], 
}) {
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id);

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
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          {tabs.map(tab => {
            if (tab.id === 'khu-vuc-khac') {
              // Custom link for Khu vuc khac tab to navigate directly
              return (
                <Link
                  key={tab.id}
                  href={tab.href || '/khu-vuc'}
                  className={`whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-full transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200 block`}
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
      </div>
      
      {displayItems.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-4 md:gap-6">
          {displayItems.slice(0, 10).map((item, index) => (
            <div key={item.id} className={`h-full ${index > 4 ? 'hidden lg:block' : (index > 3 ? 'hidden md:block' : '')}`}>
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
