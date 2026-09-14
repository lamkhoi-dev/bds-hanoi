import { sanitizeNewsHtml, hasEmbeddedImages, newsPlainText } from './news-html';

/**
 * Làm sạch HTML tin tức — CHỖ DUY NHẤT quyết định thẻ/thuộc tính nào được lưu. Trang công
 * khai render `content` bằng `dangerouslySetInnerHTML` nguyên văn, không sanitize lần hai.
 */
describe('sanitizeNewsHtml — thẻ cơ bản', () => {
  it('giữ các thẻ trình soạn thảo thật sự xuất ra', () => {
    const html = '<h2>Tiêu đề</h2><p><strong>đậm</strong> <em>nghiêng</em> <u>gạch chân</u> <s>gạch ngang</s></p><ul><li>1</li></ul><ol><li>2</li></ol><blockquote>trích</blockquote><hr><br>';
    // sanitize-html tự đóng thẻ rỗng theo kiểu XHTML (<hr />, <br />) — cùng nghĩa, trình
    // duyệt render giống hệt <hr>/<br>, nên so sánh sau khi bỏ khoảng trắng trước "/>".
    expect(sanitizeNewsHtml(html).replace(/\s+\/>/g, '>')).toBe(html);
  });

  it('bỏ thẻ nguy hiểm nhưng giữ lại chữ bên trong (script/style bỏ luôn cả nội dung)', () => {
    const out = sanitizeNewsHtml('<p>an toàn</p><script>alert(1)</script><iframe src="//evil.com"></iframe>');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('<iframe');
    expect(out).not.toContain('alert(1)');
    expect(out).toContain('an toàn');
  });

  it('bỏ on* handler và javascript: — không phải qua allowedTags mà qua thuộc tính', () => {
    const out = sanitizeNewsHtml('<p onclick="alert(1)">x</p><a href="javascript:alert(1)">bấm</a>');
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('javascript:');
  });
});

describe('sanitizeNewsHtml — ảnh nhúng thẳng (data:/file:) — gốc lỗi 12-9', () => {
  it('bỏ hẳn thẻ img nếu src là data: — không để lại icon ảnh vỡ', () => {
    const out = sanitizeNewsHtml('<p>a</p><img src="data:image/png;base64,aaaa" alt="x"><p>b</p>');
    expect(out).not.toContain('<img');
    expect(out).not.toContain('data:');
    expect(out).toContain('<p>a</p>');
    expect(out).toContain('<p>b</p>');
  });

  it('bỏ hẳn thẻ img nếu src là file: (ảnh dán từ Word, trỏ vào máy người dán)', () => {
    expect(sanitizeNewsHtml('<img src="file:///C:/a.png">')).not.toContain('<img');
  });

  it('giữ ảnh http/https bình thường', () => {
    const out = sanitizeNewsHtml('<img src="https://cdn.example.com/a.webp" alt="mô tả">');
    expect(out).toContain('src="https://cdn.example.com/a.webp"');
    expect(out).toContain('alt="mô tả"');
  });
});

describe('hasEmbeddedImages', () => {
  it('phát hiện data:/file: để CHẶN LƯU — khác với sanitize (lặng lẽ lọc bỏ)', () => {
    expect(hasEmbeddedImages('<img src="data:image/png;base64,x">')).toBe(true);
    expect(hasEmbeddedImages('<img src="file:///a.png">')).toBe(true);
    expect(hasEmbeddedImages('<img src="https://cdn.example.com/a.webp">')).toBe(false);
    expect(hasEmbeddedImages('<p>không có ảnh</p>')).toBe(false);
    expect(hasEmbeddedImages('')).toBe(false);
  });
});

describe('sanitizeNewsHtml — span màu chữ', () => {
  it('giữ màu hex', () => {
    const out = sanitizeNewsHtml('<span style="color:#ff0000">đỏ</span>');
    expect(out).toContain('color:#ff0000');
  });

  it('giữ màu rgb/rgba', () => {
    const out = sanitizeNewsHtml('<span style="color:rgb(255, 0, 0)">đỏ</span>');
    expect(out).toContain('color:rgb(255, 0, 0)');
  });

  it('bỏ font-size/background — chỉ color được phép trên span', () => {
    const out = sanitizeNewsHtml('<span style="color:#ff0000;font-size:40px;background:yellow">x</span>');
    expect(out).toContain('color:#ff0000');
    expect(out).not.toContain('font-size');
    expect(out).not.toContain('background');
  });
});

describe('sanitizeNewsHtml — căn lề', () => {
  it('giữ text-align hợp lệ trên p/h2/h3', () => {
    expect(sanitizeNewsHtml('<p style="text-align:center">x</p>')).toContain('text-align:center');
    expect(sanitizeNewsHtml('<h2 style="text-align:right">x</h2>')).toContain('text-align:right');
  });

  it('giá trị text-align lạ bị bỏ', () => {
    const out = sanitizeNewsHtml('<p style="text-align:inherit">x</p>');
    expect(out).not.toContain('text-align');
  });
});

describe('sanitizeNewsHtml — chuyển đổi thẻ cũ (execCommand/Word)', () => {
  it('b/i -> strong/em, strike/del -> s', () => {
    expect(sanitizeNewsHtml('<b>x</b>')).toBe('<strong>x</strong>');
    expect(sanitizeNewsHtml('<i>x</i>')).toBe('<em>x</em>');
    expect(sanitizeNewsHtml('<strike>x</strike>')).toBe('<s>x</s>');
    expect(sanitizeNewsHtml('<del>x</del>')).toBe('<s>x</s>');
  });

  it('h1 -> h2 (không cạnh tranh với H1 thật của trang), h4-h6 -> h3', () => {
    expect(sanitizeNewsHtml('<h1>x</h1>')).toBe('<h2>x</h2>');
    expect(sanitizeNewsHtml('<h4>x</h4>')).toBe('<h3>x</h3>');
    expect(sanitizeNewsHtml('<h6>x</h6>')).toBe('<h3>x</h3>');
  });

  it('div -> p, giữ text-align nếu div có align/text-align', () => {
    expect(sanitizeNewsHtml('<div>x</div>')).toBe('<p>x</p>');
    expect(sanitizeNewsHtml('<div align="center">x</div>')).toContain('text-align:center');
  });

  it('font color -> span style color', () => {
    const out = sanitizeNewsHtml('<font color="#00ff00">x</font>');
    expect(out).toContain('<span');
    expect(out).toContain('color:#00ff00');
    expect(out).not.toContain('<font');
  });

  it('div lồng nhau không tạo <p><p>...</p></p> vô nghĩa khi chỉ có 1 lớp', () => {
    expect(sanitizeNewsHtml('<div>chỉ chữ</div>')).toBe('<p>chỉ chữ</p>');
  });
});

describe('sanitizeNewsHtml — liên kết', () => {
  it('link nội bộ (đường dẫn tương đối) không gắn rel/target', () => {
    const out = sanitizeNewsHtml('<a href="/tin/abc-123">xem</a>');
    expect(out).not.toContain('rel=');
    expect(out).not.toContain('target=');
  });

  it('link tới chính site (internalHosts) không gắn nofollow', () => {
    const out = sanitizeNewsHtml('<a href="https://nhadatxunghe.vn/tin/abc">xem</a>', {
      internalHosts: ['https://nhadatxunghe.vn'],
    });
    expect(out).not.toContain('rel=');
  });

  it('link ngoài LUÔN noopener noreferrer, bất kể client tự gắn rel/target gì', () => {
    const out = sanitizeNewsHtml('<a href="https://baokhac.vn/bai" rel="dofollow" target="_self">nguồn</a>');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('target="_blank"');
  });
});

describe('sanitizeNewsHtml — bảng', () => {
  it('giữ cấu trúc bảng và colspan/rowspan', () => {
    const html = '<table><thead><tr><th colspan="2">Tiêu đề</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>';
    const out = sanitizeNewsHtml(html);
    expect(out).toContain('<table>');
    expect(out).toContain('<thead>');
    expect(out).toContain('colspan="2"');
    expect(out).toContain('<td>1</td>');
  });

  it('bỏ colgroup/col và style trên table — TipTap tự dựng lại khi tải lên', () => {
    const html = '<table style="min-width:100px"><colgroup><col style="width:50px"></colgroup><tbody><tr><td>1</td></tr></tbody></table>';
    const out = sanitizeNewsHtml(html);
    expect(out).not.toContain('colgroup');
    expect(out).not.toContain('<col');
    expect(out).not.toContain('min-width');
  });

  it('ô có <p> bên trong vẫn giữ nguyên (CSS trang công khai xử lý margin)', () => {
    const out = sanitizeNewsHtml('<table><tbody><tr><td><p>chữ trong ô</p></td></tr></tbody></table>');
    expect(out).toContain('<td><p>chữ trong ô</p></td>');
  });
});

describe('sanitizeNewsHtml — figure/ảnh có chú thích', () => {
  it('giữ figure + img + figcaption nguyên vẹn', () => {
    const html = '<figure><img src="https://cdn.example.com/a.webp" alt="Nhà đẹp" width="800" height="450"><figcaption>Chú thích ảnh</figcaption></figure>';
    const out = sanitizeNewsHtml(html);
    expect(out).toContain('<figure>');
    expect(out).toContain('<figcaption>Chú thích ảnh</figcaption>');
    expect(out).toContain('alt="Nhà đẹp"');
    expect(out).toContain('width="800"');
  });
});

describe('sanitizeNewsHtml — ảnh của chính site rút gọn về đường dẫn tương đối', () => {
  it('URL tuyệt đối trùng mediaBaseUrls -> tương đối, để đổi domain không gãy ảnh', () => {
    const out = sanitizeNewsHtml('<img src="https://nhadatxunghe.vn/bds-uploads/a.webp">', {
      mediaBaseUrls: ['https://nhadatxunghe.vn/bds-uploads'],
    });
    expect(out).toContain('src="/a.webp"');
  });

  it('ảnh không thuộc site (host khác) giữ nguyên URL tuyệt đối', () => {
    const out = sanitizeNewsHtml('<img src="https://baokhac.vn/anh.jpg">', {
      mediaBaseUrls: ['https://nhadatxunghe.vn/bds-uploads'],
    });
    expect(out).toContain('src="https://baokhac.vn/anh.jpg"');
  });
});

describe('sanitizeNewsHtml — không mất chữ (an toàn cho bài execCommand cũ)', () => {
  it('idempotent — sanitize lần 2 không đổi gì thêm', () => {
    const html = '<h2>Tiêu đề</h2><p>Đoạn <strong>đậm</strong> có <a href="https://x.vn">link</a>.</p><table><tbody><tr><td>1</td></tr></tbody></table>';
    const once = sanitizeNewsHtml(html);
    const twice = sanitizeNewsHtml(once);
    expect(twice).toBe(once);
  });

  it('không mất chữ khi chuyển thẻ cũ execCommand', () => {
    const legacy = '<div align="center"><b>Tiêu đề</b></div><div>Đoạn văn <font color="red">màu</font> bình thường.</div>';
    const out = sanitizeNewsHtml(legacy);
    expect(newsPlainText(out)).toBe(newsPlainText(legacy));
  });
});

describe('newsPlainText', () => {
  it('bỏ thẻ, giải mã thực thể HTML cơ bản', () => {
    expect(newsPlainText('<p>Giá &amp; diện tích &gt; 100m&#39;</p>')).toBe("Giá & diện tích > 100m'");
  });

  it('gộp khoảng trắng thừa từ nhiều thẻ liền nhau', () => {
    expect(newsPlainText('<p>A</p><p>B</p>')).toBe('A B');
  });

  it('chuỗi rỗng -> rỗng', () => {
    expect(newsPlainText('')).toBe('');
  });
});
