"use client";

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

/**
 * Nhập alt + chú thích cho một ảnh — hiện SAU KHI ảnh đã tải lên máy chủ (chèn ảnh mới),
 * hoặc khi admin bấm sửa chú thích một ảnh đang có trong bài.
 */
export default function ImageDialog({
  open,
  initialAlt = '',
  initialCaption = '',
  onCancel,
  onConfirm,
}: {
  open: boolean;
  initialAlt?: string;
  initialCaption?: string;
  onCancel: () => void;
  onConfirm: (data: { alt: string; caption: string }) => void;
}) {
  const [alt, setAlt] = useState(initialAlt);
  const [caption, setCaption] = useState(initialCaption);

  useEffect(() => {
    if (open) {
      setAlt(initialAlt);
      setCaption(initialCaption);
    }
  }, [open, initialAlt, initialCaption]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-sm">Mô tả ảnh</h3>
          <button onClick={onCancel} className="p-1 rounded-full text-gray-400 hover:bg-gray-100" aria-label="Đóng">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Mô tả ảnh (alt) <span className="font-normal text-gray-400">— cho SEO và người dùng khiếm thị</span>
            </label>
            <input
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="VD: Căn hộ 2 phòng ngủ tại Vinh"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Chú thích <span className="font-normal text-gray-400">(không bắt buộc, hiện ngay dưới ảnh)</span>
            </label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="VD: Phối cảnh mặt tiền dự án"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">
            Huỷ
          </button>
          <button
            onClick={() => onConfirm({ alt: alt.trim(), caption: caption.trim() })}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary-dark"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
}
