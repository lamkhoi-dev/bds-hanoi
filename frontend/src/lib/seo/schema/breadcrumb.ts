import { siteConfig } from '@/lib/site-config';
import type { JsonLdNode } from './types';

export interface BreadcrumbItem {
  name: string;
  /**
   * Bỏ trống ở phần tử CUỐI: đó là trang hiện tại, khách yêu cầu "chỉ text không gắn
   * link". Không có `url` thì cả `<nav>` lẫn JSON-LD đều không sinh link.
   */
  url?: string;
}

/**
 * Dựng BreadcrumbList từ đúng mảng items mà `<Breadcrumb>` render, nên phần hiển thị
 * và phần dữ liệu có cấu trúc không thể lệch nhau.
 *
 * "Trang chủ" được tự động thêm ở đầu — caller chỉ truyền các cấp phía sau.
 */
export function buildBreadcrumbList(items: BreadcrumbItem[], id?: string): JsonLdNode {
  const all: BreadcrumbItem[] = [{ name: 'Trang chủ', url: '/' }, ...items];

  return {
    '@type': 'BreadcrumbList',
    ...(id ? { '@id': id } : {}),
    itemListElement: all.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: siteConfig.absolute(item.url) } : {}),
    })),
  };
}
