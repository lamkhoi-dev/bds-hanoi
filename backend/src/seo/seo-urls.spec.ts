import { listingDetailPath, listingPath, renderUrlSet, renderSitemapIndex } from './seo-urls';
import { generateSlug } from './slug';

describe('listingPath (backend) khớp với listingPath của frontend', () => {
  const original = process.env.SEO_MODE;
  afterEach(() => {
    if (original === undefined) delete process.env.SEO_MODE;
    else process.env.SEO_MODE = original;
  });

  it('chế độ report giữ dạng URL đang phục vụ', () => {
    process.env.SEO_MODE = 'report';
    expect(listingPath({})).toBe('/ban');
    expect(listingPath({ propertyTypeSlug: 'dat-nen' })).toBe('/dat-nen');
    expect(listingPath({ propertyTypeSlug: 'dat-nen', locationSlug: 'cau-giay' })).toBe('/dat-nen/cau-giay');
    expect(listingPath({ locationSlug: 'cau-giay' })).toBe('/cau-giay');
    expect(listingPath({ transaction: 'cho-thue', propertyTypeSlug: 'chung-cu' })).toBe('/cho-thue/chung-cu');
  });

  it('chế độ enforce thêm đoạn giao dịch', () => {
    process.env.SEO_MODE = 'enforce';
    expect(listingPath({ propertyTypeSlug: 'dat-nen', locationSlug: 'cau-giay' })).toBe('/ban/dat-nen/cau-giay');
    expect(listingPath({})).toBe('/ban');
  });
});

describe('generateSlug — phải khớp bản frontend vì nó nằm trong URL canonical', () => {
  it('bỏ dấu tiếng Việt', () => {
    expect(generateSlug('Bán đất nền Cầu Giấy')).toBe('ban-dat-nen-cau-giay');
  });

  it('xử lý đ hoa/thường', () => {
    expect(generateSlug('Đất Đông Anh')).toBe('dat-dong-anh');
  });

  it('gộp ký tự đặc biệt thành một gạch nối', () => {
    expect(generateSlug('Nhà 3 tầng — khối Đại Nghĩa!!!')).toBe('nha-3-tang-khoi-dai-nghia');
  });

  it('tiêu đề rỗng có giá trị dự phòng', () => {
    expect(generateSlug('')).toBe('tin-bds');
    expect(generateSlug(null)).toBe('tin-bds');
  });
});

describe('Tuần tự hoá XML', () => {
  it('escape ký tự đặc biệt trong loc', () => {
    const xml = renderUrlSet([{ loc: 'https://x.vn/a?b=1&c=2' }]);
    expect(xml).toContain('https://x.vn/a?b=1&amp;c=2');
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset');
  });

  it('bỏ lastmod khi không có giá trị hợp lệ', () => {
    expect(renderUrlSet([{ loc: 'https://x.vn/a', lastmod: null }])).not.toContain('<lastmod>');
    expect(renderUrlSet([{ loc: 'https://x.vn/a', lastmod: 'khong-phai-ngay' }])).not.toContain('<lastmod>');
  });

  it('phát lastmod dạng ISO', () => {
    const xml = renderUrlSet([{ loc: 'https://x.vn/a', lastmod: new Date('2026-08-01T00:00:00Z') }]);
    expect(xml).toContain('<lastmod>2026-08-01T00:00:00.000Z</lastmod>');
  });

  it('sitemap index có đúng thẻ bao', () => {
    const xml = renderSitemapIndex([{ loc: 'https://x.vn/sitemaps/static.xml' }]);
    expect(xml).toContain('<sitemapindex');
    expect(xml).toContain('<sitemap>');
  });
});

describe('listingDetailPath phải khớp bản frontend', () => {
  const UUID = 'f35dd809-352b-4caf-9cc4-14092195f5bd';

  it('dùng mã ngắn khi có', () => {
    expect(listingDetailPath('ban-dat-nen-cau-giay', '19xk3', UUID)).toBe(
      '/tin/ban-dat-nen-cau-giay-19xk3',
    );
  });

  it('chưa backfill thì lùi về dạng uuid — sitemap không phát URL hỏng', () => {
    expect(listingDetailPath('ban-dat-nen', null, UUID)).toBe(`/tin/ban-dat-nen--${UUID}`);
  });

  it('không có id lẫn mã cũng không ném lỗi', () => {
    expect(listingDetailPath('ban-dat-nen')).toBe('/tin/ban-dat-nen--');
  });
});
