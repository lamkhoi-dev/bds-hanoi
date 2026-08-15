import { toast } from 'react-hot-toast';

export const getCompareItems = () => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('compareItems') || '[]');
  } catch {
    return [];
  }
};

export const addCompareItem = (property: any) => {
  const items = getCompareItems();
  if (items.length >= 3) {
    toast.error('Chỉ có thể so sánh tối đa 3 bất động sản cùng lúc.');
    return;
  }
  if (items.some((item: any) => item.id === property.id)) {
    return;
  }
  items.push(property);
  localStorage.setItem('compareItems', JSON.stringify(items));
  window.dispatchEvent(new Event('compareUpdated'));
  toast.success('Đã thêm vào danh sách so sánh!');
};

export const removeCompareItem = (id: string) => {
  let items = getCompareItems();
  items = items.filter((item: any) => item.id !== id);
  localStorage.setItem('compareItems', JSON.stringify(items));
  window.dispatchEvent(new Event('compareUpdated'));
};

export const clearCompareItems = () => {
  localStorage.removeItem('compareItems');
  window.dispatchEvent(new Event('compareUpdated'));
};
