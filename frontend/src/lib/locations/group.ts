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
 * Trả mảng RỖNG khi không khu vực nào có nhóm — nơi gọi (menu mobile, menu desktop) tự
 * lùi về danh sách phẳng. Hàm THUẦN (không I/O) để dùng được cả ở client component
 * (`MobileMenu`) lẫn server component (`layout.tsx` cho menu desktop 3 dropdown).
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
