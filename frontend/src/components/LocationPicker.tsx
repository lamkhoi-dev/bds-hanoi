"use client";

import { siteConfig } from '@/lib/site-config';

const PROVINCE_NAME = siteConfig.province.name;

export interface LocationValue {
  city: string;
  district: string;
  ward: string;
  oldWard: string;
}

interface LocationPickerProps {
  locations: any[];
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  disabled?: boolean;
  /** Hiện dấu * ở nhãn "Phường/Xã mới". Form nhu cầu (CAN_MUA/CAN_THUE) không bắt buộc. */
  requireWard?: boolean;
}

/*
 * Ba hàm thuần dưới đây sống ở `lib/locations/picker.ts` để jest chạy được (roots: src/lib).
 * Re-export để mọi nơi vẫn `import { districtHasWards } from '@/components/LocationPicker'`
 * như cũ — cùng khuôn với `lib/locations/group.ts`.
 */
export { provincesOf, provinceOfDistrict, districtHasWards } from '@/lib/locations/picker';
import { provincesOf, provinceOfDistrict } from '@/lib/locations/picker';

/** Suy `provinceId/districtId/wardId/oldWardId` từ tên đã chọn — dùng khi gửi payload
 *  lên backend.
 *
 *  `wardId` và `oldWardId` là HAI field ngang hàng, không cái nào thuộc cái nào — khách chốt
 *  ngày 21/08: "chỉ cần nó thuộc quận huyện là được". Đừng thêm ràng buộc xã cũ phải nằm
 *  trong xã mới. */
export function resolveLocationIds(locations: any[], value: LocationValue) {
  const selectedDistrictObj = locations.find((d: any) => d.name === value.district);
  const currentWards = selectedDistrictObj
    ? selectedDistrictObj.children.filter((c: any) => c.type === 'WARD')
    : [];
  const currentOldWards = selectedDistrictObj
    ? selectedDistrictObj.children.filter((c: any) => c.type === 'OLD_WARD')
    : [];
  return {
    provinceId: selectedDistrictObj?.parentId || null,
    districtId: selectedDistrictObj?.id || null,
    wardId: currentWards.find((w: any) => w.name === value.ward)?.id || null,
    oldWardId: currentOldWards.find((w: any) => w.name === value.oldWard)?.id || null,
  };
}

function formatLocationName(name: string) {
  if (!name) return '';
  // Format "Phường ABC - XYZ cũ" thành "Phường ABC (XYZ cũ)" nếu cần
  if (name.includes('cũ') && name.includes('-')) {
    return name.replace(/\s*-\s*(.*cũ.*)/i, ' ($1)');
  }
  return name;
}

const selectClass =
  'font-sans w-full border border-borderLight rounded-xl p-3.5 outline-none input-glow bg-white cursor-pointer text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed';

export default function LocationPicker({ locations, value, onChange, disabled, requireWard = true }: LocationPickerProps) {
  const selectedDistrictObj = locations.find((d: any) => d.name === value.district);
  const currentWards = selectedDistrictObj ? selectedDistrictObj.children.filter((c: any) => c.type === 'WARD') : [];
  const oldWards = selectedDistrictObj ? selectedDistrictObj.children.filter((c: any) => c.type === 'OLD_WARD') : [];

  const provinces = provincesOf(locations);
  /*
   * Tỉnh hiển thị lấy theo CHA của khu vực đang chọn, không theo `value.city`.
   *
   * Lý do: form khởi tạo `city` bằng `PROVINCE_NAME` ("Nghệ An"). Khi MỞ SỬA một tin thuộc
   * Hà Tĩnh, nếu lọc khu vực theo `value.city` thì chính khu vực của tin đó bị lọc mất khỏi
   * danh sách và ô "Khu vực" hiện trống — tin đang tốt tự nhiên thành hỏng.
   *
   * Cố ý KHÔNG tự gọi `onChange` để "sửa" `value.city` cho khớp: nó sẽ bắn một lần thay đổi
   * ngay lúc mở form, làm `changedFields()` của ReviewModal báo `city` đã sửa dù admin chưa
   * chạm vào gì. Chỉ hiển thị đúng; giá trị text `city` giữ nguyên như trước tới khi người
   * dùng thật sự đổi. `provinceId` trong payload vốn suy từ `district.parentId` nên vẫn đúng.
   */
  const effectiveCity = provinceOfDistrict(locations, value.district) ?? value.city ?? PROVINCE_NAME;
  const districtOptions = locations.filter((d: any) => (d?.parent?.name ?? '') === effectiveCity);

  // Hà Tĩnh hiện có 13 huyện nhưng 0 phường/xã. Bắt buộc một ô rỗng = chặn cứng đường đăng tin.
  const hasWards = currentWards.length > 0;
  const wardRequired = requireWard && hasWards;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div>
        <label className="block text-sm font-medium mb-2 text-textMain">Tỉnh / Thành phố</label>
        <select
          value={effectiveCity}
          disabled={disabled}
          onChange={(e) => onChange({ city: e.target.value, district: '', ward: '', oldWard: '' })}
          className={selectClass}
        >
          {/* Lúc `locations` chưa tải xong thì `provinces` rỗng — vẫn phải có đúng một option
              khớp `value` của select, nếu không React cảnh báo và ô hiện trống. */}
          {(provinces.length > 0 ? provinces : [effectiveCity]).map((name) => (
            <option className="font-sans" key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-textMain">Khu vực <span className="text-danger">*</span></label>
        <select
          value={value.district}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, district: e.target.value, ward: '', oldWard: '' })}
          className={selectClass}
        >
          <option className="font-sans" value="">Chọn Khu vực</option>
          {districtOptions.map((d: any) => (
            <option className="font-sans" key={d.id} value={d.name}>{formatLocationName(d.name)}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-textMain">Phường/Xã mới {wardRequired && <span className="text-danger">*</span>}</label>
        <select
          value={value.ward}
          disabled={disabled || !value.district || !hasWards}
          onChange={(e) => onChange({ ...value, ward: e.target.value })}
          className={`${selectClass} ${value.district && !hasWards ? 'mb-1' : 'mb-3'}`}
        >
          <option className="font-sans" value="">Chọn Phường/Xã mới</option>
          {currentWards.map((w: any) => (
            <option className="font-sans" key={w.id} value={w.name}>{formatLocationName(w.name)}</option>
          ))}
        </select>
        {value.district && !hasWards ? (
          <p className="text-xs text-textSecondary mb-3">
            Khu vực này chưa có dữ liệu phường/xã — bỏ qua ô này, vẫn đăng tin được.
          </p>
        ) : null}
        <label className="block text-sm font-medium mb-2 text-textMain">Phường/Xã cũ (tuỳ chọn)</label>
        <select
          value={value.oldWard}
          disabled={disabled || !value.district}
          onChange={(e) => onChange({ ...value, oldWard: e.target.value })}
          className={selectClass}
        >
          <option className="font-sans" value="">Chọn Phường/Xã cũ (nếu có)</option>
          {oldWards.length > 0 && oldWards.map((w: any) => (
            <option className="font-sans" key={w.id} value={w.name}>{formatLocationName(w.name)}</option>
          ))}
          <option className="font-sans" value="Khác">Khác</option>
        </select>
      </div>
    </div>
  );
}
