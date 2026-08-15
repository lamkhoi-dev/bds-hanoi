"use client";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import React from "react";

export interface BreadcrumbItem {
  name: string;
  url?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Trang chủ",
        "item": "https://website-bds.com/"
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 2,
        "name": item.name,
        ...(item.url ? { "item": `https://website-bds.com${item.url}` } : {})
      }))
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="flex text-sm text-gray-500 mb-4 whitespace-nowrap overflow-x-auto pb-1" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/" className="inline-flex items-center hover:text-primary transition-colors">
              <Home className="w-4 h-4 mr-1.5" />
              Trang chủ
            </Link>
          </li>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={index} aria-current={isLast ? "page" : undefined}>
                <div className="flex items-center">
                  <ChevronRight className="w-4 h-4 text-primary mx-1" />
                  {isLast || !item.url ? (
                    <span className="text-gray-700 font-medium">{item.name}</span>
                  ) : (
                    <Link href={item.url} className="hover:text-primary transition-colors">
                      {item.name}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
