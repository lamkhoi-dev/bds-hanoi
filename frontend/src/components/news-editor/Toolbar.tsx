"use client";

import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Quote,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Image as ImageIcon, Table as TableIcon, Minus,
  Undo, Redo, Trash2, Rows3, Columns3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import LinkDialog from './LinkDialog';
import ImageDialog from './ImageDialog';
import { uploadImageWithMeta } from '@/lib/upload';

/** Bảng màu cố định, gọn — không dùng bộ chọn màu tự do để tránh sinh ra hàng nghìn giá trị hex khác nhau chỉ để nói "đỏ", "xanh". */
const COLORS = [
  { label: 'Mặc định', value: null },
  { label: 'Đỏ', value: '#dc2626' },
  { label: 'Cam', value: '#ea580c' },
  { label: 'Xanh lá', value: '#16a34a' },
  { label: 'Xanh dương', value: '#2563eb' },
  { label: 'Tím', value: '#9333ea' },
  { label: 'Xám', value: '#6b7280' },
];

function Btn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${active ? 'bg-primary/10 text-primary' : 'hover:bg-gray-200 text-gray-700'}`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-6 bg-gray-300 mx-1 self-center" />;
}

export default function Toolbar({ editor }: { editor: Editor | null }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // `isActive()`/`getAttributes()` KHÔNG tự kích hoạt re-render trong React — phải qua
  // `useEditorState` mới thấy nút bấm sáng/tắt theo đúng vị trí con trỏ đang đứng.
  const state = useEditorState({
    editor,
    selector: (ctx) => {
      const e = ctx.editor;
      if (!e) return null;
      return {
        bold: e.isActive('bold'),
        italic: e.isActive('italic'),
        underline: e.isActive('underline'),
        strike: e.isActive('strike'),
        h2: e.isActive('heading', { level: 2 }),
        h3: e.isActive('heading', { level: 3 }),
        bulletList: e.isActive('bulletList'),
        orderedList: e.isActive('orderedList'),
        blockquote: e.isActive('blockquote'),
        alignLeft: e.isActive({ textAlign: 'left' }),
        alignCenter: e.isActive({ textAlign: 'center' }),
        alignRight: e.isActive({ textAlign: 'right' }),
        alignJustify: e.isActive({ textAlign: 'justify' }),
        link: e.isActive('link'),
        linkHref: e.getAttributes('link').href as string | undefined,
        color: (e.getAttributes('textStyle').color as string | undefined) ?? null,
        inTable: e.isActive('table'),
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
        figureSelected: e.isActive('figure'),
        figureAlt: (e.getAttributes('figure').alt as string | undefined) ?? '',
        figureCaption: (e.getAttributes('figure').caption as string | undefined) ?? '',
      };
    },
  });

  // `editor` là `null` ở lần render đầu (immediatelyRender: false) — toolbar vẫn hiện,
  // các nút chỉ bị vô hiệu, không được crash hay biến mất (người dùng thấy giao diện giật).
  if (!editor || !state) {
    return <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-300 h-[52px]" />;
  }

  const insertImageFile = async (file: File) => {
    setUploading(true);
    try {
      const { url, width, height } = await uploadImageWithMeta(file);
      editor.chain().focus().insertFigure({ src: url, width, height }).run();
      // Mở ngay dialog để gõ alt/chú thích — chèn ảnh không kèm mô tả thì admin quên mất,
      // SEO ảnh coi như bỏ trống.
      setImageOpen(true);
    } catch {
      toast.error('Không tải được ảnh, vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-300">
        <Btn title="In đậm" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></Btn>
        <Btn title="In nghiêng" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16} /></Btn>
        <Btn title="Gạch chân" active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={16} /></Btn>
        <Btn title="Gạch ngang" active={state.strike} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={16} /></Btn>
        <Sep />
        <Btn title="Tiêu đề H2" active={state.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <span className="text-xs font-bold w-4 inline-block">H2</span>
        </Btn>
        <Btn title="Tiêu đề H3" active={state.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <span className="text-xs font-bold w-4 inline-block">H3</span>
        </Btn>
        <Sep />
        <Btn title="Căn trái" active={state.alignLeft} onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft size={16} /></Btn>
        <Btn title="Căn giữa" active={state.alignCenter} onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter size={16} /></Btn>
        <Btn title="Căn phải" active={state.alignRight} onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight size={16} /></Btn>
        <Btn title="Căn đều" active={state.alignJustify} onClick={() => editor.chain().focus().setTextAlign('justify').run()}><AlignJustify size={16} /></Btn>
        <Sep />
        {/* Màu chữ — bảng cố định, bấm là áp luôn, không cần dialog riêng. */}
        <div className="flex items-center gap-1 px-1">
          {COLORS.map((c) => (
            <button
              key={c.label}
              type="button"
              title={c.label}
              onClick={() => {
                if (c.value) editor.chain().focus().setColor(c.value).run();
                else editor.chain().focus().unsetColor().run();
              }}
              className={`w-5 h-5 rounded-full border-2 ${state.color === c.value ? 'border-primary' : 'border-white'} ${!c.value ? 'bg-white ring-1 ring-gray-300' : ''}`}
              style={c.value ? { backgroundColor: c.value } : undefined}
            />
          ))}
        </div>
        <Sep />
        <Btn title="Danh sách chấm" active={state.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={16} /></Btn>
        <Btn title="Danh sách số" active={state.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></Btn>
        <Btn title="Trích dẫn" active={state.blockquote} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={16} /></Btn>
        <Btn title="Đường kẻ ngang" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={16} /></Btn>
        <Sep />
        <Btn
          title={state.link ? 'Sửa liên kết' : 'Chèn liên kết'}
          active={state.link}
          onClick={() => {
            // Chưa bôi đen chữ nào mà bấm chèn link thì không có gì để gắn mark vào —
            // nhắc thay vì mở dialog rồi không làm được gì.
            if (!state.link && editor.state.selection.empty) {
              toast('Bôi đen đoạn chữ muốn chèn liên kết trước đã nhé.');
              return;
            }
            setLinkOpen(true);
          }}
        >
          <LinkIcon size={16} />
        </Btn>
        <label className="p-2 rounded hover:bg-gray-200 text-gray-700 cursor-pointer" title="Chèn ảnh">
          <ImageIcon size={16} />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) insertImageFile(file);
            }}
          />
        </label>
        {state.figureSelected && (
          <Btn title="Sửa mô tả ảnh" onClick={() => setImageOpen(true)}>
            <span className="text-xs font-semibold px-0.5">Alt</span>
          </Btn>
        )}
        <Btn title="Chèn bảng 3×3" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          <TableIcon size={16} />
        </Btn>
        {state.inTable && (
          <>
            <Btn title="Thêm dòng" onClick={() => editor.chain().focus().addRowAfter().run()}><Rows3 size={16} /></Btn>
            <Btn title="Thêm cột" onClick={() => editor.chain().focus().addColumnAfter().run()}><Columns3 size={16} /></Btn>
            <Btn title="Xoá bảng" onClick={() => editor.chain().focus().deleteTable().run()}><Trash2 size={16} /></Btn>
          </>
        )}
        <Sep />
        <Btn title="Hoàn tác" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}><Undo size={16} /></Btn>
        <Btn title="Làm lại" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}><Redo size={16} /></Btn>
      </div>

      <LinkDialog
        open={linkOpen}
        initialUrl={state.linkHref || ''}
        hasExistingLink={state.link}
        onCancel={() => setLinkOpen(false)}
        onConfirm={(url) => {
          editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
          setLinkOpen(false);
        }}
        onRemove={() => {
          editor.chain().focus().extendMarkRange('link').unsetLink().run();
          setLinkOpen(false);
        }}
      />

      <ImageDialog
        open={imageOpen}
        initialAlt={state.figureAlt}
        initialCaption={state.figureCaption}
        onCancel={() => setImageOpen(false)}
        onConfirm={({ alt, caption }) => {
          editor.chain().focus().updateAttributes('figure', { alt: alt || null, caption: caption || null }).run();
          setImageOpen(false);
        }}
      />
    </>
  );
}
