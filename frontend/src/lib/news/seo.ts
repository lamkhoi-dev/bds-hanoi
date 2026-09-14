/**
 * Tiêu đề/mô tả/canonical hiển thị công khai của một bài tin — LUÔN có dự phòng, không bao
 * giờ để trống. Dùng ở CẢ HAI nơi: `generateMetadata` (trang công khai) và ô xem trước SERP
 * trong form quản trị — một nguồn, để admin thấy ĐÚNG cái Google sẽ thấy.
 */

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Cắt tại ranh giới TỪ, không cắt giữa chừng một từ tiếng Việt có dấu. */
function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}

export function newsTitle(news: { seoTitle?: string | null; title: string }): string {
  return news.seoTitle?.trim() || news.title;
}

export function newsDescription(news: { metaDescription?: string | null; sapo?: string | null; content?: string | null }): string {
  const raw = news.metaDescription?.trim() || news.sapo?.trim() || (news.content ? stripHtml(news.content) : '');
  return truncateAtWord(raw, 160);
}

/**
 * `canonicalUrl` chấp nhận CẢ đường dẫn tương đối (`/news/khac-slug`) lẫn URL tuyệt đối
 * (đăng lại từ nguồn khác). `isSelfCanonical` cho form biết có nên cảnh báo "bài này sẽ
 * KHÔNG vào sitemap vì canonical trỏ nơi khác" hay không.
 */
export function newsCanonicalPath(news: { canonicalUrl?: string | null; slug: string }): string {
  return news.canonicalUrl?.trim() || `/news/${news.slug}`;
}

export function isSelfCanonical(news: { canonicalUrl?: string | null; slug: string }): boolean {
  const c = news.canonicalUrl?.trim();
  if (!c) return true;
  return c === `/news/${news.slug}` || c.endsWith(`/news/${news.slug}`);
}
