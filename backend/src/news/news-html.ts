import sanitizeHtml from 'sanitize-html';

/**
 * `sanitize-html` GHIM ĐÚNG "2.17.0" trong package.json (không dùng `^`). Từ 2.17.1 trở đi
 * gói này nâng `htmlparser2` lên v12 — v12 là ESM THUẦN (`"type": "module"`, không có `main`
 * CJS) — nên `require('sanitize-html')` (jest chạy CommonJS) vỡ ngay: "Cannot use import
 * statement outside a module". Bản 2.17.0 vẫn dùng `htmlparser2@^8` (CJS bình thường).
 * Muốn nâng lên bản mới hơn thì phải cấu hình jest transform ESM trước, không phải chỉ đổi
 * số trong package.json.
 */

/**
 * Làm sạch HTML của trình soạn thảo tin tức (TipTap) trước khi lưu — CHỈ nơi này quyết
 * định thẻ/thuộc tính nào được giữ. Không sanitize ở nơi lưu là để `dangerouslySetInnerHTML`
 * render nguyên văn bất kỳ thứ gì một tài khoản ADMIN từng gõ vào, kể cả `<script>`.
 *
 * Danh sách thẻ khớp ĐÚNG những gì `NewsEditor` (TipTap: StarterKit + TextAlign + TextStyle/
 * Color + Table + figure tự viết) thật sự xuất ra — không rộng hơn, không hẹp hơn. Rộng hơn
 * là lỗ hổng; hẹp hơn là mất định dạng người dùng vừa gõ.
 */
const ALLOWED_TAGS = [
  'p', 'h2', 'h3', 'strong', 'em', 'u', 's', 'a',
  'ul', 'ol', 'li', 'blockquote',
  'figure', 'img', 'figcaption',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'br', 'hr', 'span',
];

const HEX_OR_RGB_COLOR = /^(#[0-9a-f]{3}|#[0-9a-f]{6}|#[0-9a-f]{4}|#[0-9a-f]{8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*[\d.]+\s*)?\))$/i;
const TEXT_ALIGN_VALUE = /^(left|right|center|justify)$/;

function isOwnMediaUrl(src: string, mediaBaseUrls: string[]): string | null {
  for (const base of mediaBaseUrls) {
    if (base && src.startsWith(base)) {
      const rest = src.slice(base.length);
      return rest.startsWith('/') ? rest : `/${rest}`;
    }
  }
  return null;
}

export interface SanitizeNewsHtmlOptions {
  /** Origin của chính site (vd `https://nhadatxunghe.vn`, có thể nhiều — phân tách sẵn). Link trỏ tới đây không gắn `rel=nofollow`. */
  internalHosts?: string[];
  /** Base URL nơi ảnh tải lên đang phục vụ (vd `PUBLIC_UPLOAD_BASE_URL`) — ảnh của chính site được rút gọn về đường dẫn tương đối, để đổi domain (Nghệ An/Hà Nội dùng chung mã) không làm gãy ảnh cũ. */
  mediaBaseUrls?: string[];
}

export function sanitizeNewsHtml(html: string, options: SanitizeNewsHtmlOptions = {}): string {
  if (!html) return '';
  const internalHosts = options.internalHosts ?? [];
  const mediaBaseUrls = options.mediaBaseUrls ?? [];

  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
      span: ['style'],
      p: ['style'],
      h2: ['style'],
      h3: ['style'],
    },
    allowedStyles: {
      span: { color: [HEX_OR_RGB_COLOR] },
      p: { 'text-align': [TEXT_ALIGN_VALUE] },
      h2: { 'text-align': [TEXT_ALIGN_VALUE] },
      h3: { 'text-align': [TEXT_ALIGN_VALUE] },
    },
    // Chỉ http/https cho ảnh — chặn `data:`/`file:` ngay ở tầng sơ đồ scheme, không chỉ dựa
    // vào việc trình soạn thảo có gửi lên hay không (phòng thủ ở lưu, không chỉ ở gõ).
    allowedSchemesByTag: { img: ['http', 'https'], a: ['http', 'https', 'mailto', 'tel'] },
    allowProtocolRelative: false,
    nonTextTags: ['style', 'script', 'iframe', 'noscript'],

    transformTags: {
      // execCommand cũ (SimpleEditor) sinh <b>/<i>; H1 cạnh tranh với H1 thật của trang;
      // H4-H6 không có trong thang 2 cấp (H2/H3) khách yêu cầu.
      b: 'strong',
      i: 'em',
      strike: 's',
      del: 's',
      h1: 'h2',
      h4: 'h3',
      h5: 'h3',
      h6: 'h3',
      // <div align> / <div style="text-align">: bản dán từ execCommand cũ hoặc Word.
      div: (tagName, attribs) => {
        const align = (attribs.align || '').toLowerCase();
        const newAttribs: Record<string, string> = {};
        if (TEXT_ALIGN_VALUE.test(align)) newAttribs.style = `text-align:${align}`;
        return { tagName: 'p', attribs: newAttribs };
      },
      // <font color="..."> (execCommand cũ) -> <span style="color:...">.
      font: (tagName, attribs) => {
        const color = (attribs.color || '').trim();
        const newAttribs: Record<string, string> = {};
        if (color) newAttribs.style = `color:${color}`;
        return { tagName: 'span', attribs: newAttribs };
      },
      // Link nội bộ không gắn nofollow; link ngoài luôn noopener/noreferrer bất kể trình
      // soạn thảo có gửi target/rel hay không — không tin dữ liệu client tự gắn rel.
      a: (tagName, attribs) => {
        const href = attribs.href || '';
        const isInternal = !href || href.startsWith('/') || internalHosts.some((h) => h && href.startsWith(h));
        const base: Record<string, string> = attribs.title ? { href, title: attribs.title } : { href };
        return {
          tagName: 'a',
          attribs: isInternal ? base : { ...base, target: '_blank', rel: 'noopener noreferrer' },
        };
      },
      img: (tagName, attribs) => {
        const relative = isOwnMediaUrl(attribs.src || '', mediaBaseUrls);
        return { tagName: 'img', attribs: relative ? { ...attribs, src: relative } : attribs };
      },
    },

    // `img` không có `src` sau khi lọc scheme (vd từng là data:/file:) là một thẻ rỗng vô
    // nghĩa — bỏ hẳn, không để lại icon-ảnh-vỡ trong bài đã xuất bản.
    exclusiveFilter: (frame) => frame.tag === 'img' && !frame.attribs.src,
  });
}

/** Bài viết còn ảnh nhúng base64/máy cục bộ — chặn LƯU, không chỉ lặng lẽ lọc bỏ lúc sanitize. */
export function hasEmbeddedImages(html: string): boolean {
  if (!html) return false;
  return /<img\b[^>]*\ssrc\s*=\s*["'](data:|file:)/i.test(html);
}

/** Chữ thuần từ HTML — dùng cho mô tả SEO tự động và đối chiếu "không mất chữ" khi làm sạch. */
export function newsPlainText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
