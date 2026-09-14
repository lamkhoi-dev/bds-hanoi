/**
 * Nhãn trạng thái tin tức cho màn hình quản trị — 4 trạng thái NHÌN THẤY được dù CSDL chỉ
 * có 3 (`DRAFT`/`PUBLISHED`/`HIDDEN`): "Hẹn giờ" là PUBLISHED nhưng `publishedAt` còn ở
 * tương lai — về mặt CSDL đã là "đã đăng", nhưng người dùng thật KHÔNG thấy bài cho tới lúc
 * đó, nên admin cần phân biệt được hai trường hợp này chứ không thấy cùng một chữ "Đã đăng".
 */
export interface NewsStatusBadge {
  label: string;
  className: string;
}

export function newsStatusBadge(status: string, publishedAt?: string | Date | null): NewsStatusBadge {
  if (status === 'DRAFT') return { label: 'Nháp', className: 'bg-gray-100 text-gray-600' };
  if (status === 'HIDDEN') return { label: 'Đã ẩn', className: 'bg-red-100 text-red-600' };

  if (status === 'PUBLISHED') {
    if (publishedAt && new Date(publishedAt).getTime() > Date.now()) {
      return { label: 'Hẹn giờ', className: 'bg-amber-100 text-amber-700' };
    }
    return { label: 'Đã đăng', className: 'bg-emerald-100 text-emerald-700' };
  }

  return { label: status || '—', className: 'bg-gray-100 text-gray-500' };
}
