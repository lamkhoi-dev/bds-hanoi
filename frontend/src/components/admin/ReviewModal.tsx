"use client";

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { PROPERTY_TYPES } from '@/lib/seo/taxonomy';
import { PRICE_RANGES_SELL, PRICE_RANGES_RENT, AREA_RANGES } from '@/constants/ranges';
import LocationPicker, { resolveLocationIds, LocationValue } from '@/components/LocationPicker';

/**
 * Hộp kiểm duyệt tin cho admin — lựa chọn thứ hai và thứ ba trong quy trình khách yêu cầu:
 *
 *   1. Duyệt luôn không sửa       -> nút "Duyệt đăng" ở bảng, không mở hộp này
 *   2. Sửa rồi duyệt luôn         -> "Lưu & duyệt đăng"
 *   3. Sửa rồi trả về người đăng  -> "Lưu & trả người đăng kiểm tra"
 *
 * Chỉ gửi lên những trường THỰC SỰ đổi. Backend so sánh lần nữa rồi mới ghi lịch sử và
 * gửi thông báo, nên người đăng luôn thấy đúng danh sách trường đã sửa kèm giá trị
 * trước/sau — không phải một câu chung chung "tin của bạn đã bị chỉnh sửa".
 */
export default function ReviewModal({
  post,
  onClose,
  onDone,
}: {
  post: any;
  onClose: () => void;
  onDone: () => void;
}) {
  // Khách liệt kê đủ 9 nhóm field admin cần sửa được (19-8, mục 22). 3 field bổ sung ở
  // đợt này: transactionType (loại giao dịch), priceRangeKey (khoảng giá), areaRangeKey
  // (khoảng diện tích) — cả 3 đã có trong EDITABLE_FIELDS của backend
  // (property-review.service.ts) nên không cần sửa API.
  const [form, setForm] = useState({
    title: post.title ?? '',
    description: post.description ?? '',
    transactionType: post.transactionType ?? '',
    propertyType: post.propertyType ?? '',
    price: post.price ?? '',
    priceRangeKey: post.priceRangeKey ?? '',
    area: post.area ?? '',
    areaRangeKey: post.areaRangeKey ?? '',
  });
  const [location, setLocation] = useState<LocationValue>({
    city: post.city ?? '',
    district: post.district ?? '',
    ward: post.ward ?? '',
    oldWard: post.oldWard ?? '',
  });
  const [locations, setLocations] = useState<any[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Danh sách khu vực cho LocationPicker — cùng nguồn /locations dùng ở form đăng tin.
  useEffect(() => {
    api.get('/locations').then((res) => setLocations(res.data)).catch(() => undefined);
  }, []);

  const changedFields = () => {
    const out: Record<string, any> = {};
    if (form.title !== (post.title ?? '')) out.title = form.title;
    if (form.description !== (post.description ?? '')) out.description = form.description;
    if (form.transactionType !== (post.transactionType ?? '')) out.transactionType = form.transactionType;
    if (form.propertyType !== (post.propertyType ?? '')) out.propertyType = form.propertyType;
    if (String(form.price) !== String(post.price ?? '')) out.price = form.price === '' ? null : Number(form.price);
    if (form.priceRangeKey !== (post.priceRangeKey ?? '')) out.priceRangeKey = form.priceRangeKey || null;
    if (String(form.area) !== String(post.area ?? '')) out.area = form.area === '' ? null : Number(form.area);
    if (form.areaRangeKey !== (post.areaRangeKey ?? '')) out.areaRangeKey = form.areaRangeKey || null;

    // Địa điểm: đổi bất kỳ trong 4 field thì gửi cả 4 field TÊN lẫn 3 FK id (tính lại
    // từ locations qua resolveLocationIds) — tránh lệch nhau giữa text hiển thị và
    // wardId dùng cho breadcrumb/bộ lọc.
    const locationChanged =
      location.city !== (post.city ?? '') ||
      location.district !== (post.district ?? '') ||
      location.ward !== (post.ward ?? '') ||
      location.oldWard !== (post.oldWard ?? '');
    if (locationChanged) {
      const ids = resolveLocationIds(locations, location);
      Object.assign(out, location, ids);
    }
    return out;
  };

  const submit = async (returnToAuthor: boolean) => {
    setSaving(true);
    try {
      const changes = changedFields();
      const res = await api.post(`/properties/${post.id}/review`, {
        changes,
        returnToAuthor,
        note: note.trim() || undefined,
      });
      const n = res.data?.changes?.length ?? 0;
      toast.success(
        returnToAuthor
          ? `Đã trả về người đăng${n ? ` (${n} thay đổi)` : ''}`
          : `Đã duyệt đăng${n ? ` (${n} thay đổi)` : ''}`,
      );
      onDone();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không lưu được, vui lòng thử lại');
    } finally {
      setSaving(false);
    }
  };

  const field = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary';

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl my-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Kiểm duyệt tin</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100" aria-label="Đóng">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Tiêu đề</label>
            <input className={field} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Loại giao dịch</label>
              <select className={field} value={form.transactionType} onChange={(e) => setForm({ ...form, transactionType: e.target.value })}>
                <option value="">—</option>
                <option value="BAN">Bán</option>
                <option value="CHO_THUE">Cho thuê</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Loại BĐS</label>
              <select className={field} value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })}>
                <option value="">—</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.enum} value={t.enum}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Giá cụ thể (VNĐ)</label>
              <input className={field} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Khoảng giá</label>
              {/* Danh sách khoảng đổi theo loại giao dịch — dùng chung constants/ranges.ts
                  với form đăng tin và bộ lọc, không tự khai lại danh sách ở đây. */}
              <select className={field} value={form.priceRangeKey} onChange={(e) => setForm({ ...form, priceRangeKey: e.target.value })}>
                <option value="">—</option>
                {(form.transactionType === 'CHO_THUE' ? PRICE_RANGES_RENT : PRICE_RANGES_SELL).map((r) => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Diện tích cụ thể (m²)</label>
              <input className={field} type="number" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Khoảng diện tích</label>
              <select className={field} value={form.areaRangeKey} onChange={(e) => setForm({ ...form, areaRangeKey: e.target.value })}>
                <option value="">—</option>
                {AREA_RANGES.map((r) => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Địa điểm</label>
            <LocationPicker locations={locations} value={location} onChange={setLocation} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Mô tả</label>
            <textarea className={`${field} h-28`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Ghi chú gửi người đăng <span className="font-normal text-gray-400">(không bắt buộc)</span>
            </label>
            <input className={field} value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Giá nhập nhầm đơn vị, đã sửa lại giúp bạn" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 px-5 py-4 border-t border-gray-100">
          <button
            disabled={saving}
            onClick={() => submit(true)}
            className="flex-1 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm disabled:opacity-60"
          >
            Lưu &amp; trả người đăng kiểm tra
          </button>
          <button
            disabled={saving}
            onClick={() => submit(false)}
            className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-sm disabled:opacity-60"
          >
            Lưu &amp; duyệt đăng
          </button>
        </div>
      </div>
    </div>
  );
}
