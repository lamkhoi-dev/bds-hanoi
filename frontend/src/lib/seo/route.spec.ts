import { parseListingPath } from './route';

describe('parseListingPath — chặn URL rác', () => {
  // Search Console đã thu thập thật những URL này trên site cũ.
  const garbage = [
    ['nha-rieng', '$'],
    ['chung-cu', '&'],
    ['du-an', '&'],
    ['dat-nen', '%24'],
    ['dat-nen', '..'],
    ['dat-nen', 'a--b'],
    ['dat-nen', '-abc'],
    ['dat-nen', 'abc-'],
    ['a', 'b', 'c', 'd', 'e'],
  ];

  it.each(garbage)('từ chối /%s/%s', (...segments) => {
    const parsed = parseListingPath(segments.filter(Boolean) as string[]);
    expect(parsed.kind).toBe('reject');
  });

  it('từ chối đoạn đầu là route dành riêng', () => {
    for (const reserved of ['sitemap', 'api', 'tin', 'news', 'search', 'admin', 'user']) {
      expect(parseListingPath([reserved]).kind).toBe('reject');
    }
  });

  it('từ chối đoạn quá dài', () => {
    expect(parseListingPath(['dat-nen', 'a'.repeat(65)]).kind).toBe('reject');
  });

  it('chuyển hướng chữ hoa về chữ thường', () => {
    const parsed = parseListingPath(['Dat-Nen']);
    expect(parsed).toMatchObject({ kind: 'redirect', to: '/dat-nen' });
  });
});

describe('parseListingPath — dạng URL mới', () => {
  it('/ban = mọi loại BĐS, toàn tỉnh', () => {
    const parsed = parseListingPath(['ban']);
    expect(parsed).toMatchObject({
      kind: 'listing',
      route: { transaction: 'ban', propertyTypeSlug: null, locationSlug: null, isLegacyShape: false },
    });
  });

  it('/cho-thue nhận đúng loại giao dịch (trước đây bị coi là danh mục)', () => {
    const parsed = parseListingPath(['cho-thue', 'chung-cu']);
    expect(parsed).toMatchObject({
      kind: 'listing',
      route: { transaction: 'cho-thue', propertyTypeSlug: 'chung-cu' },
    });
  });

  it('/ban/{khu-vực} phân biệt được với /ban/{loại}', () => {
    expect(parseListingPath(['ban', 'cau-giay'])).toMatchObject({
      kind: 'listing',
      route: { propertyTypeSlug: null, locationSlug: 'cau-giay' },
    });
    expect(parseListingPath(['ban', 'dat-nen'])).toMatchObject({
      kind: 'listing',
      route: { propertyTypeSlug: 'dat-nen', locationSlug: null },
    });
  });

  it('/ban/dat-nen/cau-giay đủ 3 cấp', () => {
    expect(parseListingPath(['ban', 'dat-nen', 'cau-giay'])).toMatchObject({
      kind: 'listing',
      route: { transaction: 'ban', propertyTypeSlug: 'dat-nen', locationSlug: 'cau-giay' },
    });
  });

  it('3 đoạn mà giữa không phải loại BĐS thì từ chối', () => {
    expect(parseListingPath(['ban', 'cau-giay', 'yen-hoa']).kind).toBe('reject');
  });

  it('gộp alias nha-mat-pho về nha-rieng bằng 301', () => {
    expect(parseListingPath(['ban', 'nha-mat-pho', 'cau-giay'])).toMatchObject({
      kind: 'redirect',
      to: '/ban/nha-rieng/cau-giay',
    });
  });
});

describe('parseListingPath — dạng URL cũ vẫn phục vụ được', () => {
  it('/dat-nen', () => {
    expect(parseListingPath(['dat-nen'])).toMatchObject({
      kind: 'listing',
      route: { transaction: 'ban', propertyTypeSlug: 'dat-nen', isLegacyShape: true, canonicalPath: '/ban/dat-nen' },
    });
  });

  it('/dat-nen/cau-giay', () => {
    expect(parseListingPath(['dat-nen', 'cau-giay'])).toMatchObject({
      kind: 'listing',
      route: { propertyTypeSlug: 'dat-nen', locationSlug: 'cau-giay', isLegacyShape: true },
    });
  });

  it('/{khu-vực} một đoạn', () => {
    expect(parseListingPath(['cau-giay'])).toMatchObject({
      kind: 'listing',
      route: { propertyTypeSlug: null, locationSlug: 'cau-giay', isLegacyShape: true },
    });
  });

  it('/tat-ca = mọi loại', () => {
    expect(parseListingPath(['tat-ca'])).toMatchObject({
      kind: 'listing',
      route: { propertyTypeSlug: null, locationSlug: null },
    });
  });

  it('biet-thu được nhận (danh sách cũ ở backend bỏ sót loại này)', () => {
    expect(parseListingPath(['biet-thu'])).toMatchObject({
      kind: 'listing',
      route: { propertyTypeSlug: 'biet-thu' },
    });
  });
});
