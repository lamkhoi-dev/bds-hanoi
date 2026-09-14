import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Node "ảnh kèm chú thích" tự viết — KHÔNG dùng `@tiptap/extension-image`.
 *
 * Lý do không dùng extension có sẵn: `Image` xuất ra một mình thẻ `<img>`, không có chỗ cho
 * `<figcaption>` (khách yêu cầu 12/9: "chèn ảnh kèm alt và chú thích"). Đăng ký thêm `Image`
 * SONG SONG với node này sẽ có 2 luật parse cùng khớp `<img>`, tranh nhau ai xử lý trước —
 * tránh hẳn bằng cách chỉ có MỘT node hiểu cả `<figure>` lẫn `<img>` trần.
 *
 * `atom: true`: nội dung ảnh không soạn thảo được bên trong (không gõ chữ vào giữa ảnh),
 * chọn/xoá nguyên khối. Sửa alt/chú thích qua `ImageDialog`, không gõ trực tiếp lên node.
 */
export interface FigureOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    figure: {
      insertFigure: (attrs: { src: string; alt?: string; caption?: string; width?: number; height?: number }) => ReturnType;
    };
  }
}

export const Figure = Node.create<FigureOptions>({
  name: 'figure',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      caption: { default: null },
      width: { default: null },
      height: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        // <figure><img>...<figcaption>...</figcaption></figure> — dạng bài đã lưu trước đó.
        tag: 'figure',
        getAttrs: (el) => {
          if (typeof el === 'string') return false;
          const img = el.querySelector('img');
          if (!img) return false;
          const figcaption = el.querySelector('figcaption');
          const width = img.getAttribute('width');
          const height = img.getAttribute('height');
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            caption: figcaption ? figcaption.textContent : null,
            width: width ? Number(width) : null,
            height: height ? Number(height) : null,
          };
        },
      },
      {
        // <img> trần (dán từ nơi khác, hoặc bài rất cũ chưa từng qua figure) — nhận làm
        // figure không chú thích. CHẶN data:/file: ngay ở bước parse, không đợi tới lúc lưu
        // mới lọc — dán một ảnh base64 sẽ không tạo ra node nào cả, thay vì tạo rồi bị xoá.
        tag: 'img[src]',
        getAttrs: (el) => {
          if (typeof el === 'string') return false;
          const src = el.getAttribute('src') || '';
          if (!/^https?:\/\//i.test(src) && !src.startsWith('/')) return false;
          const width = el.getAttribute('width');
          const height = el.getAttribute('height');
          return {
            src,
            alt: el.getAttribute('alt'),
            caption: null,
            width: width ? Number(width) : null,
            height: height ? Number(height) : null,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const { src, alt, caption, width, height } = node.attrs;
    const imgAttrs: Record<string, any> = { src };
    if (alt) imgAttrs.alt = alt;
    if (width) imgAttrs.width = width;
    if (height) imgAttrs.height = height;

    const children: any[] = [['img', imgAttrs]];
    if (caption) children.push(['figcaption', {}, caption]);

    return ['figure', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), ...children];
  },

  addCommands() {
    return {
      insertFigure:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});
