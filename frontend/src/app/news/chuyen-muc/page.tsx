import { permanentRedirect } from 'next/navigation';

/** Không có trang liệt kê CHUYÊN MỤC riêng — chỉ `/news/chuyen-muc/{slug}` tồn tại. */
export default function NewsCategoryIndexRedirect() {
  permanentRedirect('/news');
}
