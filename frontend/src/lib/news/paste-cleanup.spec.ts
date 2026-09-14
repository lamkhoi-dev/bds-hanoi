import { cleanPastedHtml } from './paste-cleanup';

describe('cleanPastedHtml', () => {
  it('bỏ khối điều kiện Word <!--[if ...]>...<![endif]-->', () => {
    const html = '<!--[if !supportLists]--><span>1.</span><!--[endif]--><p>Nội dung</p>';
    const out = cleanPastedHtml(html);
    expect(out).not.toContain('supportLists');
    expect(out).not.toContain('endif');
    expect(out).toContain('<p>Nội dung</p>');
  });

  it('bỏ style/script/meta/xml', () => {
    const out = cleanPastedHtml('<style>.a{color:red}</style><meta charset="utf-8"><p>x</p>');
    expect(out).not.toContain('<style');
    expect(out).not.toContain('<meta');
    expect(out).toContain('<p>x</p>');
  });

  it('bỏ thẻ riêng của Word (o:p, w:sdt) nhưng giữ chữ bên trong', () => {
    const out = cleanPastedHtml('<p>Xin chào<o:p></o:p></p>');
    expect(out).not.toContain('o:p');
    expect(out).toContain('Xin chào');
  });

  it('bỏ class chứa Mso', () => {
    const out = cleanPastedHtml('<p class="MsoNormal">Đoạn văn</p>');
    expect(out).not.toContain('Mso');
    expect(out).toContain('Đoạn văn');
    expect(out).toContain('Đoạn văn</p>');
  });

  it('bỏ style chứa mso-', () => {
    const out = cleanPastedHtml('<span style="mso-spacerun:yes">x</span>');
    expect(out).not.toContain('mso-');
  });

  it('HTML thường (không phải từ Word) giữ nguyên gần như không đổi', () => {
    const html = '<p><strong>Đậm</strong> và <em>nghiêng</em> bình thường.</p>';
    expect(cleanPastedHtml(html)).toBe(html);
  });

  it('chuỗi rỗng không ném lỗi', () => {
    expect(cleanPastedHtml('')).toBe('');
  });
});
