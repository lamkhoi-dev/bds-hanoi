export function generateSlug(title: string): string {
  if (!title) return 'tin-bds';
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^a-z0-9\s])/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const formatPrice = (price: number | null) => {
  if (!price) return '';
  if (price >= 1e12) return 'Thỏa thuận';
  if (price >= 1e9) return parseFloat((price / 1e9).toFixed(2)).toString().replace('.', ',') + ' tỷ';
  if (price >= 1e6) return parseFloat((price / 1e6).toFixed(2)).toString().replace('.', ',') + ' triệu';
  return formatNumberString(price) + ' đ';
};

export const formatArea = (area: number | null | undefined): string => {
  if (!area) return '---';
  return `${formatNumberString(area)} m²`;
};

export function formatNumberString(num: number): string {
  if (num === null || num === undefined) return '0';
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return parts.join(',');
}

export function formatDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${min} ${dd}/${mm}/${yyyy}`;
}
