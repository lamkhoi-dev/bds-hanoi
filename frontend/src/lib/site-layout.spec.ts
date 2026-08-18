import { siteLayout } from './site-layout';

describe('siteLayout', () => {
  const original = process.env.SITE_LAYOUT;
  afterEach(() => {
    process.env.SITE_LAYOUT = original;
  });

  it('mặc định (thiếu biến / rỗng / sai chính tả) luôn là classic — chiều an toàn', () => {
    delete process.env.SITE_LAYOUT;
    expect(siteLayout()).toBe('classic');

    process.env.SITE_LAYOUT = '';
    expect(siteLayout()).toBe('classic');

    process.env.SITE_LAYOUT = 'GROUPED';
    expect(siteLayout()).toBe('classic');
  });

  it("chỉ đúng chuỗi 'grouped' mới bật bố cục Hà Nội", () => {
    process.env.SITE_LAYOUT = 'grouped';
    expect(siteLayout()).toBe('grouped');
  });
});
