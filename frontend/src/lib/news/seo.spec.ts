import { newsTitle, newsDescription, newsCanonicalPath, isSelfCanonical } from './seo';

describe('newsTitle', () => {
  it('dùng seoTitle khi có', () => {
    expect(newsTitle({ seoTitle: 'Tiêu đề SEO', title: 'Tiêu đề gốc' })).toBe('Tiêu đề SEO');
  });
  it('rơi về title khi seoTitle trống', () => {
    expect(newsTitle({ seoTitle: '', title: 'Tiêu đề gốc' })).toBe('Tiêu đề gốc');
    expect(newsTitle({ title: 'Tiêu đề gốc' })).toBe('Tiêu đề gốc');
  });
});

describe('newsDescription — thứ tự ưu tiên metaDescription > sapo > content', () => {
  it('ưu tiên metaDescription', () => {
    expect(newsDescription({ metaDescription: 'Mô tả SEO', sapo: 'Sapo', content: '<p>Nội dung</p>' })).toBe('Mô tả SEO');
  });

  it('không có metaDescription -> dùng sapo', () => {
    expect(newsDescription({ sapo: 'Đoạn dẫn ngắn', content: '<p>Nội dung dài</p>' })).toBe('Đoạn dẫn ngắn');
  });

  it('không có cả hai -> rút từ content, bỏ thẻ HTML', () => {
    expect(newsDescription({ content: '<p>Nội dung <strong>chính</strong> của bài</p>' })).toBe('Nội dung chính của bài');
  });

  it('cắt tại 160 ký tự, không giữ nguyên toàn bộ văn bản gốc dài hơn', () => {
    const longText = 'a'.repeat(50) + ' ' + 'b'.repeat(200);
    const result = newsDescription({ metaDescription: longText });
    expect(result.length).toBeLessThanOrEqual(161); // 160 + dấu …
    expect(result.endsWith('…')).toBe(true);
    expect(result).not.toBe(longText);
  });

  it('có một khoảng trắng ở gần cuối đoạn cắt -> cắt tại đó, không cắt giữa từ', () => {
    // Từ cuối cùng dài 30 ký tự, nằm sát mốc 160 -> phải lùi về khoảng trắng trước nó
    // (mốc 60%*160=96 < vị trí khoảng trắng ~129), không được cắt đứt giữa chừng từ đó.
    const longText = 'x'.repeat(129) + ' ' + 'y'.repeat(60);
    const result = newsDescription({ metaDescription: longText });
    expect(result).toBe('x'.repeat(129) + '…');
  });

  it('không có gì cả -> chuỗi rỗng, không "undefined"', () => {
    expect(newsDescription({})).toBe('');
  });
});

describe('canonical', () => {
  it('không có canonicalUrl -> mặc định /news/{slug}, isSelfCanonical true', () => {
    expect(newsCanonicalPath({ slug: 'bai-viet' })).toBe('/news/bai-viet');
    expect(isSelfCanonical({ slug: 'bai-viet' })).toBe(true);
  });

  it('canonicalUrl tự trỏ về chính nó (tuyệt đối) -> vẫn isSelfCanonical true', () => {
    expect(isSelfCanonical({ slug: 'bai-viet', canonicalUrl: 'https://nhadatxunghe.vn/news/bai-viet' })).toBe(true);
  });

  it('canonicalUrl trỏ nơi khác -> isSelfCanonical false', () => {
    expect(isSelfCanonical({ slug: 'bai-viet', canonicalUrl: 'https://nguon-goc.vn/khac' })).toBe(false);
  });
});
