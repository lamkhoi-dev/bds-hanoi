"use client";

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function LinkDialog({
  open,
  initialUrl = '',
  hasExistingLink = false,
  onCancel,
  onConfirm,
  onRemove,
}: {
  open: boolean;
  initialUrl?: string;
  hasExistingLink?: boolean;
  onCancel: () => void;
  onConfirm: (url: string) => void;
  onRemove: () => void;
}) {
  const [url, setUrl] = useState(initialUrl);

  useEffect(() => {
    if (open) setUrl(initialUrl);
  }, [open, initialUrl]);

  if (!open) return null;

  const submit = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    // Không bắt gõ đủ https:// — tự thêm nếu thiếu, để admin gõ tắt vẫn ra link dùng được.
    onConfirm(/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/') ? trimmed : `https://${trimmed}`);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-sm">Chèn liên kết</h3>
          <button onClick={onCancel} className="p-1 rounded-full text-gray-400 hover:bg-gray-100" aria-label="Đóng">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Đường dẫn</label>
          <input
            autoFocus
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="https://... hoặc /tin/..."
          />
        </div>
        <div className="flex justify-between items-center gap-2 px-5 py-3 border-t border-gray-100">
          {hasExistingLink ? (
            <button onClick={onRemove} className="px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50">
              Bỏ liên kết
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">
              Huỷ
            </button>
            <button onClick={submit} className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary-dark">
              Chèn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
