import { slugify } from '../property/property-utils';

/** Tiền tố đơn vị hành chính, bóc ra trước khi sinh slug. */
export const UNIT_PREFIXES = [
  'Thành phố',
  'Thị trấn',
  'Thị xã',
  'Quận',
  'Huyện',
  'Phường',
  'Xã',
] as const;

/**
 * "Phường Hoàn Kiếm" -> "Hoàn Kiếm", "Ba Vì" -> "Ba Vì".
 *
 * Nguồn dữ liệu không nhất quán tiền tố (79/126 phường xã mới của Hà Nội không có
 * tiền tố nào), nên không được tự chế thêm — chỉ bóc khi thực sự có.
 */
export function stripUnitPrefix(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  for (const prefix of UNIT_PREFIXES) {
    if (trimmed.toLowerCase().startsWith(prefix.toLowerCase() + ' ')) {
      return trimmed.slice(prefix.length).trim();
    }
  }
  return trimmed;
}

/** Slug theo phạm vi cha, suy ra từ tên đã bóc tiền tố. */
export function locationSlug(name: string): string {
  return slugify(stripUnitPrefix(name));
}
