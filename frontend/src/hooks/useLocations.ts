import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export interface LocationNode {
  id: string;
  name: string;
  shortName?: string;
  type?: string;
  slug?: string;
  parentId?: string | null;
  isSeoEnabled?: boolean;
  children?: LocationNode[];
}

/**
 * Cache theo phiên: trước đây SidebarFilter, form đăng tin và MobileMenu mỗi nơi
 * tự gọi `/locations` một lần. Giữ chung một promise nên cả phiên chỉ gọi một lần.
 */
let cachedPromise: Promise<LocationNode[]> | null = null;

async function fetchLocations(): Promise<LocationNode[]> {
  // Dùng axios chung thay vì `fetch` thô: hook cũ tự ghép URL và fallback dev là
  // 'http://localhost:4000' — THIẾU '/api/v1' so với lib/axios, nên chỉ chạy được
  // khi có rewrite proxy đứng trước.
  const res = await api.get('/locations');
  return Array.isArray(res.data) ? res.data : [];
}

export function useLocations() {
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!cachedPromise) {
      cachedPromise = fetchLocations().catch((error) => {
        // Không giữ promise lỗi lại, để lần mount sau còn thử lại được.
        cachedPromise = null;
        console.error('Không tải được danh sách khu vực', error);
        return [];
      });
    }
    cachedPromise.then((data) => {
      if (!alive) return;
      setLocations(data);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  return { locations, loading };
}
