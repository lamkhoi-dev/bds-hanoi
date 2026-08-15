"use client";

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api from '@/lib/axios';

interface FieldChange {
  field: string;
  label: string;
  before: string;
  after: string;
}
interface HistoryEntry {
  id: string;
  createdAt: string;
  by: string;
  note: string | null;
  returnedToAuthor: boolean;
  changes: FieldChange[];
}

/**
 * Lịch sử chỉnh sửa của một tin — người đăng xem admin đã sửa đúng những gì trước khi
 * bấm gửi duyệt lại.
 *
 * Khách yêu cầu "hiển thị rõ nội dung admin đã sửa", nên hộp này liệt kê từng trường
 * kèm giá trị TRƯỚC và SAU, không chỉ báo chung chung là tin đã bị chỉnh sửa.
 */
export default function EditHistoryModal({
  propertyId,
  title,
  onClose,
}: {
  propertyId: string;
  title?: string;
  onClose: () => void;
}) {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api
      .get(`/properties/${propertyId}/history`)
      .then((res) => alive && setEntries(Array.isArray(res.data) ? res.data : []))
      .catch(() => alive && setError('Không tải được lịch sử chỉnh sửa.'));
    return () => {
      alive = false;
    };
  }, [propertyId]);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl my-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-800">Lịch sử chỉnh sửa</h2>
            {title && <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{title}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100" aria-label="Đóng">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!error && entries === null && <p className="text-sm text-gray-500">Đang tải…</p>}
          {!error && entries?.length === 0 && (
            <p className="text-sm text-gray-500">Tin này chưa có lần chỉnh sửa nào.</p>
          )}

          {entries?.map((e) => (
            <div key={e.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700">{e.by}</span>
                <span className="text-xs text-gray-400" suppressHydrationWarning>
                  {new Date(e.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>

              {e.note && (
                <p className="text-sm text-gray-700 mb-2 italic">Ghi chú: {e.note}</p>
              )}

              {e.changes.length === 0 ? (
                <p className="text-sm text-gray-500">Không thay đổi nội dung.</p>
              ) : (
                <ul className="space-y-2">
                  {e.changes.map((c, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-semibold text-gray-800">{c.label}</span>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 line-through break-all">
                          {c.before}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 break-all">
                          {c.after}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {e.returnedToAuthor && (
                <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                  Đã trả về cho bạn kiểm tra lại
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
