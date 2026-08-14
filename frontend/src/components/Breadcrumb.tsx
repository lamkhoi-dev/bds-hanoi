// Server component: chỉ hiển thị, không có tương tác.
//
// Phần JSON-LD trước đây nằm ngay trong component này (và hard-code domain
// https://website-bds.com). Giờ tách ra `buildBreadcrumbList` để trang gộp node
// BreadcrumbList vào chung một khối @graph với các node khác — tránh mỗi trang có
// nhiều thẻ ld+json rời rạc không tham chiếu được nhau.
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import React from "react";
import type { BreadcrumbItem } from "@/lib/seo/schema";

export type { BreadcrumbItem };

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      className="flex text-sm text-gray-500 mb-4 whitespace-nowrap overflow-x-auto pb-1"
      aria-label="Breadcrumb"
    >
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
            <li key={`${item.name}-${index}`} aria-current={isLast ? "page" : undefined}>
              <div className="flex items-center">
                <ChevronRight className="w-4 h-4 text-primary mx-1" />
                {isLast || !item.url ? (
                  // Phần tử cuối là tiêu đề tin, có thể rất dài. Khách yêu cầu "dài quá
                  // thì ngắt bằng dấu …" và chỉ ngắt phần HIỂN THỊ — dùng CSS truncate
                  // nên text đầy đủ vẫn nằm trong DOM cho máy tìm kiếm và trình đọc màn hình.
                  <span
                    className={`text-gray-700 font-medium${isLast ? ' truncate max-w-[45vw] md:max-w-md' : ''}`}
                    title={isLast ? item.name : undefined}
                  >
                    {item.name}
                  </span>
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
  );
}
