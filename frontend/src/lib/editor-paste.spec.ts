import { stripEmbeddedImages } from './editor-paste';

/**
 * Khách báo 12/9: "không đăng được tin tức trên PC" — gốc là dán ảnh chụp/nội dung Word
 * nhúng thẳng `<img src="data:...">` vào bài, vượt giới hạn thân request.
 */
describe('stripEmbeddedImages', () => {
  it('bỏ ảnh nhúng base64 (data:)', () => {
    const { html, removed } = stripEmbeddedImages('<p>Xin chào</p><img src="data:image/png;base64,iVBORw0KGgo=">');
    expect(html).toBe('<p>Xin chào</p>');
    expect(removed).toBe(1);
  });

  it('bỏ ảnh trỏ vào ổ đĩa máy người dán (file:) — người khác mở bài không thấy được', () => {
    const { html, removed } = stripEmbeddedImages('<img src="file:///C:/Users/a/Pictures/anh.png">');
    expect(html).toBe('');
    expect(removed).toBe(1);
  });

  it('GIỮ ảnh đã tải lên máy chủ (http/https) — chỉ bỏ đúng loại nhúng thẳng', () => {
    const html = '<img src="https://cdn.example.com/bds-uploads/anh.webp" alt="Ảnh">';
    const result = stripEmbeddedImages(html);
    expect(result.html).toBe(html);
    expect(result.removed).toBe(0);
  });

  it('bỏ được nhiều ảnh nhúng cùng lúc, đếm đúng số lượng', () => {
    const html = '<img src="data:image/png;base64,aaa"><p>giữa</p><img src="data:image/jpeg;base64,bbb">';
    const { html: cleaned, removed } = stripEmbeddedImages(html);
    expect(cleaned).toBe('<p>giữa</p>');
    expect(removed).toBe(2);
  });

  it('không có ảnh nhúng thì giữ nguyên HTML, không đổi gì', () => {
    const html = '<p>Đoạn văn <strong>in đậm</strong> bình thường.</p>';
    expect(stripEmbeddedImages(html)).toEqual({ html, removed: 0 });
  });

  it('chuỗi rỗng không ném lỗi', () => {
    expect(stripEmbeddedImages('')).toEqual({ html: '', removed: 0 });
  });

  it('nhận diện src viết hoa/thường và có khoảng trắng quanh dấu =', () => {
    const { removed } = stripEmbeddedImages('<img SRC = "DATA:image/png;base64,xxx">');
    expect(removed).toBe(1);
  });
});
