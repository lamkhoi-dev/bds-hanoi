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
  /** Nhãn nhóm menu ngang ("Trung tâm"…). undefined/null = tỉnh không phân nhóm. */
  group?: string | null;
  groupOrder?: number;
  children?: LocationNode[];
}

/**
 * Gom quận/huyện theo nhãn `group`, giữ đúng thứ tự `groupOrder` rồi tới thứ tự trả về.
 * Trả mảng RỖNG khi không khu vực nào có nhóm — nơi gọi tự lùi về danh sách phẳng.
 */
export function groupLocations(
  locations: LocationNode[],
): { label: string; items: LocationNode[] }[] {
  const byLabel = new Map<string, { order: number; items: LocationNode[] }>();
  for (const loc of locations) {
    if (!loc.group) continue;
    const entry = byLabel.get(loc.group);
    if (entry) entry.items.push(loc);
    else byLabel.set(loc.group, { order: loc.groupOrder ?? 0, items: [loc] });
  }
  return [...byLabel.entries()]
    .sort((a, b) => a[1].order - b[1].order)
    .map(([label, v]) => ({ label, items: v.items }));
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
