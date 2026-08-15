export const PRICE_RANGES_SELL = [
  { key: 'THOA_THUAN', label: 'Giá thương lượng', min: null, max: null, canCalculate: false },
  { key: 'LT_500M', label: 'Dưới 500 triệu', min: null, max: 500_000_000, canCalculate: false },
  { key: '500M_1B', label: '500 triệu - 1 tỷ', min: 500_000_000, max: 1_000_000_000, canCalculate: true },
  { key: '1B_2B', label: '1 - 2 tỷ', min: 1_000_000_000, max: 2_000_000_000, canCalculate: true },
  { key: '2B_3B', label: '2 - 3 tỷ', min: 2_000_000_000, max: 3_000_000_000, canCalculate: true },
  { key: '3B_5B', label: '3 - 5 tỷ', min: 3_000_000_000, max: 5_000_000_000, canCalculate: true },
  { key: '5B_7B', label: '5 - 7 tỷ', min: 5_000_000_000, max: 7_000_000_000, canCalculate: true },
  { key: '7B_10B', label: '7 - 10 tỷ', min: 7_000_000_000, max: 10_000_000_000, canCalculate: true },
  { key: '10B_20B', label: '10 - 20 tỷ', min: 10_000_000_000, max: 20_000_000_000, canCalculate: true },
  { key: 'GT_20B', label: 'Trên 20 tỷ', min: 20_000_000_000, max: null, canCalculate: false }
];

export const PRICE_RANGES_RENT = [
  { key: 'THOA_THUAN', label: 'Giá thương lượng', min: null, max: null, canCalculate: false },
  { key: 'LT_1M', label: 'Dưới 1 triệu', min: null, max: 1_000_000, canCalculate: false },
  { key: '1M_3M', label: '1 - 3 triệu', min: 1_000_000, max: 3_000_000, canCalculate: true },
  { key: '3M_5M', label: '3 - 5 triệu', min: 3_000_000, max: 5_000_000, canCalculate: true },
  { key: '5M_10M', label: '5 - 10 triệu', min: 5_000_000, max: 10_000_000, canCalculate: true },
  { key: '10M_40M', label: '10 - 40 triệu', min: 10_000_000, max: 40_000_000, canCalculate: true },
  { key: 'GT_40M', label: 'Trên 40 triệu', min: 40_000_000, max: null, canCalculate: false }
];

export const AREA_RANGES = [
  { key: 'LT_30', label: 'Dưới 30 m²', min: null, max: 30, canCalculate: false },
  { key: '30_50', label: '30 - 50 m²', min: 30, max: 50, canCalculate: true },
  { key: '50_80', label: '50 - 80 m²', min: 50, max: 80, canCalculate: true },
  { key: '80_100', label: '80 - 100 m²', min: 80, max: 100, canCalculate: true },
  { key: '100_150', label: '100 - 150 m²', min: 100, max: 150, canCalculate: true },
  { key: '150_200', label: '150 - 200 m²', min: 150, max: 200, canCalculate: true },
  { key: '200_250', label: '200 - 250 m²', min: 200, max: 250, canCalculate: true },
  { key: '250_300', label: '250 - 300 m²', min: 250, max: 300, canCalculate: true },
  { key: '300_500', label: '300 - 500 m²', min: 300, max: 500, canCalculate: true },
  { key: 'GT_500', label: 'Trên 500 m²', min: 500, max: null, canCalculate: false }
];

export function getPriceLabel(key: string, type: 'CHO_THUE' | 'BAN' | string = 'BAN') {
  if (!key) return null;
  const ranges = type === 'CHO_THUE' ? PRICE_RANGES_RENT : PRICE_RANGES_SELL;
  const match = ranges.find(r => r.key === key);
  return match ? match.label : null;
}

export function getAreaLabel(key: string) {
  if (!key) return null;
  const match = AREA_RANGES.find(r => r.key === key);
  return match ? match.label : null;
}
