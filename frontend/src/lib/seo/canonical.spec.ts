import { parseListingQuery, buildListingUrl, listingPath, totalPages } from './canonical';

describe('parseListingQuery', () => {
  it('page mặc định là 1 và không đánh dấu bất thường', () => {
    expect(parseListingQuery({})).toMatchObject({ page: 1, hasNonCanonicalQuery: false, hasFilters: false });
  });

  it('?page=1 là không chuẩn (trùng URL gốc)', () => {
    expect(parseListingQuery({ page: '1' }).hasNonCanonicalQuery).toBe(true);
  });

  it('page sai định dạng thì giữ page=1 và đánh dấu bất thường', () => {
    for (const bad of ['abc', '0', '-3', '1.5', '01', '']) {
      const parsed = parseListingQuery({ page: bad });
      expect(parsed.page).toBe(1);
      if (bad !== '') expect(parsed.hasNonCanonicalQuery).toBe(true);
    }
  });

  it('nhận các tham số lọc trong danh sách trắng', () => {
    const parsed = parseListingQuery({ priceRangeKey: '2B_3B', direction: 'dong-nam' });
    expect(parsed.hasFilters).toBe(true);
    expect(parsed.hasNonCanonicalQuery).toBe(false);
    expect(parsed.filters).toEqual({ priceRangeKey: '2B_3B', direction: 'dong-nam' });
  });

  it('tham số ngoài danh sách trắng bị coi là không chuẩn', () => {
    expect(parseListingQuery({ limit: '50' }).hasNonCanonicalQuery).toBe(true);
    expect(parseListingQuery({ utm_source: 'fb' }).hasNonCanonicalQuery).toBe(true);
  });
});

describe('buildListingUrl', () => {
  it('chỉ phát tham số trong danh sách trắng', () => {
    expect(buildListingUrl('/dat-nen', 1, { priceRangeKey: '2B_3B' })).toBe('/dat-nen?priceRangeKey=2B_3B');
  });

  it('page 1 không xuất hiện trên URL', () => {
    expect(buildListingUrl('/dat-nen', 1, {})).toBe('/dat-nen');
    expect(buildListingUrl('/dat-nen', 3, {})).toBe('/dat-nen?page=3');
  });
});

describe('listingPath', () => {
  const original = process.env.NEXT_PUBLIC_SEO_MODE;
  afterEach(() => {
    process.env.NEXT_PUBLIC_SEO_MODE = original;
  });

  it('chế độ report giữ nguyên dạng URL đang được index', () => {
    process.env.NEXT_PUBLIC_SEO_MODE = 'report';
    expect(listingPath({})).toBe('/ban');
    expect(listingPath({ propertyTypeSlug: 'dat-nen' })).toBe('/dat-nen');
    expect(listingPath({ propertyTypeSlug: 'dat-nen', locationSlug: 'cau-giay' })).toBe('/dat-nen/cau-giay');
    expect(listingPath({ locationSlug: 'cau-giay' })).toBe('/cau-giay');
  });

  it('cho-thue luôn là đoạn dẫn đầu ở cả hai chế độ', () => {
    process.env.NEXT_PUBLIC_SEO_MODE = 'report';
    expect(listingPath({ transaction: 'cho-thue' })).toBe('/cho-thue');
    expect(listingPath({ transaction: 'cho-thue', propertyTypeSlug: 'chung-cu' })).toBe('/cho-thue/chung-cu');
  });

  it('chế độ enforce thêm đoạn giao dịch', () => {
    process.env.NEXT_PUBLIC_SEO_MODE = 'enforce';
    expect(listingPath({ propertyTypeSlug: 'dat-nen' })).toBe('/ban/dat-nen');
    expect(listingPath({ propertyTypeSlug: 'dat-nen', locationSlug: 'cau-giay' })).toBe('/ban/dat-nen/cau-giay');
    expect(listingPath({ locationSlug: 'cau-giay' })).toBe('/ban/cau-giay');
    expect(listingPath({})).toBe('/ban');
  });
});

describe('totalPages', () => {
  it('tính đúng và không âm', () => {
    expect(totalPages(0)).toBe(0);
    expect(totalPages(1)).toBe(1);
    expect(totalPages(20)).toBe(1);
    expect(totalPages(21)).toBe(2);
    expect(totalPages(-5)).toBe(0);
  });
});
