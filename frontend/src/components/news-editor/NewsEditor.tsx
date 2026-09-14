"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyleKit } from '@tiptap/extension-text-style';
import { TableKit } from '@tiptap/extension-table';
import { FileHandler } from '@tiptap/extension-file-handler';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Figure } from './figure-extension';
import Toolbar from './Toolbar';
import { uploadImageWithMeta } from '@/lib/upload';
import { cleanPastedHtml } from '@/lib/news/paste-cleanup';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Trình soạn thảo tin tức — TipTap v3. Thay `SimpleEditor` (execCommand tự viết, không có
 * bảng/ảnh chú thích/màu chữ) — chỉ dùng cho News, KHÔNG đổi editor của Dự án (đang ổn,
 * không phải trọng tâm SEO khách yêu cầu 12/9).
 *
 * `immediatelyRender: false`: bắt buộc trong Next.js App Router — SSR không dựng editor,
 * tránh lệch hydrate. `editor` là `null` ở lần render đầu, `Toolbar` phải tự chịu được điều
 * này (xem `Toolbar.tsx`).
 */
export default function NewsEditor({
  value,
  onChange,
  className = '',
}: {
  value: string;
  onChange: (html: string) => void;
  className?: string;
}) {
  // Nội dung ban đầu chỉ nạp vào editor MỘT LẦN lúc dựng — tránh đúng cái bẫy
  // `isInternalChange` mà `SimpleEditor` đã né: gõ 1 ký tự -> onChange -> cha cập nhật
  // state -> state chảy ngược vào prop `value` -> nếu effect bên dưới đồng bộ VÔ ĐIỀU KIỆN
  // thì `setContent` chạy lại trên MỖI ký tự, đưa con trỏ về đầu văn bản liên tục.
  const initialValue = useRef(value);
  const isInternalChange = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    content: initialValue.current,
    editorProps: {
      attributes: { class: 'news-content' },
      // Dán từ Word/Google Docs: dọn rác (<!--[if]-->, class Mso, style mso-*) TRƯỚC khi
      // TipTap parse thành node — làm sau thì rác đã lẫn vào cấu trúc tài liệu rồi.
      transformPastedHTML: (html) => cleanPastedHtml(html),
    },
    extensions: [
      StarterKit.configure({
        // Không dùng CodeBlock cho bài tin tức thường; Link đã có sẵn trong StarterKit v3.
        codeBlock: false,
        code: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
          // KHÔNG tự gắn rel/target ở đây — `sanitizeNewsHtml` (backend) quyết định dựa
          // trên link nội bộ hay bên ngoài lúc lưu, tự gắn ở đây chỉ để lộ nofollow sai.
          HTMLAttributes: {},
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      // Chỉ bật MÀU CHỮ — tắt các phần khác của bộ TextStyleKit (cỡ chữ, phông, nền, giãn
      // dòng). Khách chỉ yêu cầu "màu sắc"; bật thêm là mở rộng mặt cho phép mà
      // `sanitizeNewsHtml` không lọc theo, sẽ bị chính sanitize xoá sạch lúc lưu, gây khó
      // hiểu ("sao chọn được mà lưu xong mất").
      TextStyleKit.configure({ fontFamily: false, fontSize: false, lineHeight: false, backgroundColor: false }),
      TableKit.configure({ table: { resizable: false } }),
      Figure,
      FileHandler.configure({
        allowedMimeTypes: ALLOWED_IMAGE_TYPES,
        onDrop: async (currentEditor, files, pos) => {
          for (const file of files) {
            try {
              const { url, width, height } = await uploadImageWithMeta(file);
              currentEditor.chain().focus().insertContentAt(pos, { type: 'figure', attrs: { src: url, width, height } }).run();
            } catch {
              toast.error('Không tải được ảnh vừa kéo vào, vui lòng thử lại.');
            }
          }
        },
        onPaste: async (currentEditor, files, htmlContent) => {
          // Word/Excel đôi khi dán kèm CẢ ảnh chụp màn hình vùng chọn LẪN html thật — ưu
          // tiên html (đã có chữ), bỏ qua files trong ca đó để không chèn nhầm ảnh chụp.
          if (htmlContent) return;
          for (const file of files) {
            try {
              const { url, width, height } = await uploadImageWithMeta(file);
              currentEditor.chain().focus().insertContent({ type: 'figure', attrs: { src: url, width, height } }).run();
            } catch {
              toast.error('Không tải được ảnh vừa dán, vui lòng thử lại.');
            }
          }
        },
      }),
    ],
    onUpdate: ({ editor: e }) => {
      isInternalChange.current = true;
      onChange(e.getHTML());
    },
  });

  // `value` đổi từ BÊN NGOÀI (vd tải xong dữ liệu bài đang sửa, sau khi editor đã mount với
  // chuỗi rỗng) — nạp vào editor. Đổi vì CHÍNH editor vừa emit (gõ chữ) thì bỏ qua, không
  // nạp lại — xem giải thích ở khai báo `isInternalChange` phía trên.
  useEffect(() => {
    if (!editor) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <div className={`flex flex-col border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      <Toolbar editor={editor} />
      <div className="flex-1 overflow-y-auto p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
