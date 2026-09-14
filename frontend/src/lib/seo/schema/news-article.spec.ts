import { buildNewsArticle } from './news-article';

const OPTS = { url: 'https://sanbdshanoi.vn/news/bai-viet', description: 'Mô tả bài viết' };

describe('buildNewsArticle', () => {
  it('có tác giả (authorName) -> author là Person', () => {
    const result = buildNewsArticle(
      { title: 'Tiêu đề', authorName: 'Nguyễn Văn A', publishedAt: '2026-09-14T10:00:00Z' },
      OPTS,
    );
    expect(result.author).toEqual({ '@type': 'Person', name: 'Nguyễn Văn A' });
  });

  it('không có tác giả -> author rơi về Organization (tham chiếu @id)', () => {
    const result = buildNewsArticle({ title: 'Tiêu đề', publishedAt: '2026-09-14T10:00:00Z' }, OPTS);
    expect(result.author).toEqual({ '@id': expect.stringContaining('#organization') });
  });

  it('có contentUpdatedAt -> dateModified lấy giá trị đó, không phải publishedAt', () => {
    const result = buildNewsArticle(
      { title: 'Tiêu đề', publishedAt: '2026-09-14T10:00:00Z', contentUpdatedAt: '2026-09-15T08:00:00Z' },
      OPTS,
    );
    expect(result.datePublished).toBe('2026-09-14T10:00:00Z');
    expect(result.dateModified).toBe('2026-09-15T08:00:00Z');
  });

  it('không có contentUpdatedAt -> dateModified rơi về publishedAt (không để trống)', () => {
    const result = buildNewsArticle({ title: 'Tiêu đề', publishedAt: '2026-09-14T10:00:00Z' }, OPTS);
    expect(result.dateModified).toBe('2026-09-14T10:00:00Z');
  });

  it('không có publishedAt (bài nháp xem trước) -> không sinh ngày, không lỗi', () => {
    const result = buildNewsArticle({ title: 'Tiêu đề' }, OPTS);
    expect(result.datePublished).toBeUndefined();
    expect(result.dateModified).toBeUndefined();
  });

  it('có chuyên mục -> articleSection = tên chuyên mục', () => {
    const result = buildNewsArticle(
      { title: 'Tiêu đề', publishedAt: '2026-09-14T10:00:00Z', category: { name: 'Thị trường' } },
      OPTS,
    );
    expect(result.articleSection).toBe('Thị trường');
  });

  it('tiêu đề dài hơn 110 ký tự -> cắt bớt cho headline (khuyến nghị Google)', () => {
    const longTitle = 'a'.repeat(150);
    const result = buildNewsArticle({ title: longTitle, publishedAt: '2026-09-14T10:00:00Z' }, OPTS);
    expect((result.headline as string).length).toBe(110);
  });

  it('publisher luôn là Organization dù có/không có tác giả', () => {
    const result = buildNewsArticle({ title: 'Tiêu đề', authorName: 'A', publishedAt: '2026-09-14T10:00:00Z' }, OPTS);
    expect(result.publisher).toEqual({ '@id': expect.stringContaining('#organization') });
  });
});
