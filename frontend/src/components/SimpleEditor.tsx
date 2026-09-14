"use client";

import { useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { uploadImage } from '@/lib/upload';
import { stripEmbeddedImages } from '@/lib/editor-paste';

interface SimpleEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function SimpleEditor({ value, onChange, className = '' }: SimpleEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
    isInternalChange.current = false;
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    handleInput();
    editorRef.current?.focus();
  };

  /** Chèn ảnh ĐÃ TẢI LÊN MÁY CHỦ (URL thật) tại vị trí con trỏ — không bao giờ chèn base64. */
  const insertImageAtCursor = (url: string) => {
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, `<img src="${url}" style="max-width:100%" />`);
    handleInput();
  };

  const uploadAndInsert = async (file: File) => {
    try {
      const url = await uploadImage(file);
      insertImageAtCursor(url);
    } catch {
      toast.error('Không tải được ảnh, vui lòng thử lại.');
    }
  };

  /**
   * Chặn gốc lỗi "không đăng được tin tức trên PC" (khách báo 12/9): trình duyệt mặc định
   * dán ảnh chụp màn hình / ảnh copy từ Word thành `<img src="data:...">` NHÚNG THẲNG vào
   * nội dung — vượt xa giới hạn thân request chỉ với một ảnh chụp bình thường.
   *
   * Ảnh dán trực tiếp (Ctrl+V một ảnh, không đi kèm HTML) → tải lên máy chủ, chèn URL thật.
   * HTML dán vào có `<img>` nhúng base64/file (dán từ Word/trang web) → bỏ những ảnh đó,
   * còn lại chữ và định dạng vẫn giữ nguyên — báo cho người dùng biết để tự chèn lại bằng
   * nút "Chèn ảnh" nếu cần.
   */
  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const imageFiles = Array.from(e.clipboardData?.files || []).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      e.preventDefault();
      for (const file of imageFiles) await uploadAndInsert(file);
      return;
    }

    const html = e.clipboardData?.getData('text/html');
    if (html) {
      const { html: cleaned, removed } = stripEmbeddedImages(html);
      if (removed > 0) {
        e.preventDefault();
        document.execCommand('insertHTML', false, cleaned);
        handleInput();
        toast(`Đã bỏ ${removed} ảnh dán trực tiếp không tải lên được. Dùng nút "Chèn ảnh" để thêm lại.`);
      }
      // removed === 0: để trình duyệt tự dán HTML như bình thường.
    }
    // Không có HTML (dán văn bản thường): để trình duyệt tự xử lý.
  };

  /** Kéo-thả ảnh trực tiếp từ máy — cùng nguyên tắc với dán: luôn tải lên trước khi chèn. */
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    const imageFiles = Array.from(e.dataTransfer?.files || []).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    e.preventDefault();
    for (const file of imageFiles) await uploadAndInsert(file);
  };

  return (
    <div className={`flex flex-col border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-300">
        <button type="button" onClick={() => execCommand('bold')} className="p-2 hover:bg-gray-200 rounded font-bold" title="In đậm">B</button>
        <button type="button" onClick={() => execCommand('italic')} className="p-2 hover:bg-gray-200 rounded italic" title="In nghiêng">I</button>
        <button type="button" onClick={() => execCommand('underline')} className="p-2 hover:bg-gray-200 rounded underline" title="Gạch chân">U</button>
        <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
        <button type="button" onClick={() => execCommand('insertOrderedList')} className="p-2 hover:bg-gray-200 rounded" title="Danh sách số">1.</button>
        <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-gray-200 rounded" title="Danh sách chấm">•</button>
        <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
        <button type="button" onClick={() => execCommand('justifyLeft')} className="p-2 hover:bg-gray-200 rounded" title="Căn trái">Trái</button>
        <button type="button" onClick={() => execCommand('justifyCenter')} className="p-2 hover:bg-gray-200 rounded" title="Căn giữa">Giữa</button>
        <button type="button" onClick={() => execCommand('justifyRight')} className="p-2 hover:bg-gray-200 rounded" title="Căn phải">Phải</button>
        <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-200 rounded text-sm font-semibold" title="Chèn ảnh">
          🖼️ Chèn ảnh
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) await uploadAndInsert(file);
          }}
        />
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        onPaste={handlePaste}
        onDrop={handleDrop}
        className="p-4 flex-1 outline-none min-h-[300px] overflow-y-auto prose max-w-none"
      />
    </div>
  );
}
