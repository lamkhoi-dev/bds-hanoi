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

/** Suy `provinceId/districtId/wardId/oldWardId` từ tên đã chọn — dùng khi gửi payload
 *  lên backend. */
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div>
        <label className="block text-sm font-medium mb-2 text-textMain">Tỉnh / Thành phố</label>
        <select
          value={value.city}
          disabled={disabled}
          onChange={(e) => onChange({ city: e.target.value, district: '', ward: '', oldWard: '' })}
          className={selectClass}
        >
          <option className="font-sans" value={PROVINCE_NAME}>{PROVINCE_NAME}</option>
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
          {locations.map((d: any) => (
            <option className="font-sans" key={d.id} value={d.name}>{formatLocationName(d.name)}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-textMain">Phường/Xã mới {requireWard && <span className="text-danger">*</span>}</label>
        <select
          value={value.ward}
          disabled={disabled || !value.district}
          onChange={(e) => onChange({ ...value, ward: e.target.value })}
          className={`${selectClass} mb-3`}
        >
          <option className="font-sans" value="">Chọn Phường/Xã mới</option>
          {currentWards.map((w: any) => (
            <option className="font-sans" key={w.id} value={w.name}>{formatLocationName(w.name)}</option>
          ))}
        </select>
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
