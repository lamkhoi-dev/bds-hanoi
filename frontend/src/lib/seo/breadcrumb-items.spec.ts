import { listingBreadcrumb, landingBreadcrumb } from './breadcrumb-items';

/**
 * Breadcrumb là nơi lỗi URL dễ lọt nhất: nó vừa render ra `<nav>` vừa vào JSON-LD
 * `BreadcrumbList`, mà cả hai đều không hiện lỗi khi build.
 *
 * Hai lỗi những test này canh giữ:
 *  1. Hàm dựng đường dẫn từng trả `/tat-ca` khi không có loại BĐS — đúng URL mà khách
 *     báo trong `fix seo` III.2, và P5 đã 301 nó sang `/ban`.
 *  2. Đoạn khu vực phải là `urlSegment` (unique toàn cục) chứ không phải `slug`
 *     (chỉ unique trong phạm vi cha) — dữ liệu Hà Nội có 125 nhóm tên trùng.
 */

const originalMode = process.env.NEXT_PUBLIC_SEO_MODE;
afterEach(() => {
  if (originalMode === undefined) delete process.env.NEXT_PUBLIC_SEO_MODE;
  else process.env.NEXT_PUBLIC_SEO_MODE = originalMode;
});

const property = {
  title: 'Bán đất nền Yên Hòa 80m2',
  transactionType: 'BAN',
  propertyType: 'DAT_NEN',
  districtLocation: { name: 'Cầu Giấy', slug: 'cau-giay', urlSegment: 'cau-giay' },
  // slug theo phạm vi cha là 'yen-hoa', nhưng giả sử một quận khác cũng có 'yen-hoa'
  // thì urlSegment mới là đoạn URL thật.
  wardLocation: { name: 'Phường Yên Hòa', slug: 'yen-hoa', urlSegment: 'yen-hoa-cau-giay' },
};

describe('breadcrumb trang chi tiết tin', () => {
  it('không còn mắt xích nào trỏ /tat-ca', () => {
    process.env.NEXT_PUBLIC_SEO_MODE = 'enforce';
    const urls = listingBreadcrumb(property).map((i) => i.url);
    expect(urls).not.toContain('/tat-ca');
    expect(urls.some((u) => u?.includes('tat-ca'))).toBe(false);
  });

  it('dựng đủ 5 cấp theo dạng URL mới', () => {
    process.env.NEXT_PUBLIC_SEO_MODE = 'enforce';
    expect(listingBreadcrumb(property)).toEqual([
      { name: 'Bán', url: '/ban' },
      { name: 'Đất nền', url: '/ban/dat-nen' },
      { name: 'Cầu Giấy', url: '/ban/dat-nen/cau-giay' },
      { name: 'Phường Yên Hòa', url: '/ban/dat-nen/yen-hoa-cau-giay' },
      { name: 'Bán đất nền Yên Hòa 80m2' },
    ]);
  });

  it('dùng urlSegment chứ không phải slug cho đoạn khu vực', () => {
    process.env.NEXT_PUBLIC_SEO_MODE = 'enforce';
    const ward = listingBreadcrumb(property).find((i) => i.name === 'Phường Yên Hòa');
    expect(ward?.url).toBe('/ban/dat-nen/yen-hoa-cau-giay');
    expect(ward?.url).not.toBe('/ban/dat-nen/yen-hoa');
  });

  it('dữ liệu cũ chưa có urlSegment thì lùi về slug', () => {
    process.env.NEXT_PUBLIC_SEO_MODE = 'enforce';
    const legacy = { ...property, wardLocation: { name: 'Phường Yên Hòa', slug: 'yen-hoa' } };
    const ward = listingBreadcrumb(legacy).find((i) => i.name === 'Phường Yên Hòa');
    expect(ward?.url).toBe('/ban/dat-nen/yen-hoa');
  });

  it('phần tử cuối không có url để render thành text thuần', () => {
    const last = listingBreadcrumb(property).at(-1);
    expect(last).toEqual({ name: property.title });
  });

  it('lược bỏ cấp thiếu dữ liệu thay vì để trống', () => {
    process.env.NEXT_PUBLIC_SEO_MODE = 'enforce';
    const noWard = { ...property, wardLocation: null };
    expect(listingBreadcrumb(noWard).map((i) => i.name)).toEqual([
      'Bán',
      'Đất nền',
      'Cầu Giấy',
      property.title,
    ]);
  });

  it('tin cho thuê dùng đoạn giao dịch cho-thue', () => {
    process.env.NEXT_PUBLIC_SEO_MODE = 'enforce';
    const rent = { ...property, transactionType: 'CHO_THUE' };
    expect(listingBreadcrumb(rent)[0]).toEqual({ name: 'Cho thuê', url: '/cho-thue' });
  });

  it('chế độ report giữ dạng URL đang phục vụ, vẫn không có /tat-ca', () => {
    process.env.NEXT_PUBLIC_SEO_MODE = 'report';
    const urls = listingBreadcrumb(property).map((i) => i.url);
    expect(urls[0]).toBe('/ban');
    expect(urls[1]).toBe('/dat-nen');
    expect(urls).not.toContain('/tat-ca');
  });

  // Tin thuộc Dự án: breadcrumb riêng theo Dự án, KHÔNG theo huyện/xã — tài liệu khách
  // "Đối với Dự án sẽ hơi khác tý (không có khu vực)".
  it('tin thuộc Dự án dùng breadcrumb Trang chủ / Dự án / tên dự án / tiêu đề', () => {
    const propertyInProject = {
      ...property,
      project: { id: 'p1', name: 'Eco Central Park', slug: 'eco-central-park', shortCode: '6wqpk' },
    };
    expect(listingBreadcrumb(propertyInProject)).toEqual([
      { name: 'Dự án', url: '/du-an' },
      { name: 'Eco Central Park', url: '/du-an/eco-central-park-6wqpk' },
      { name: property.title },
    ]);
  });

  it('tin thuộc Dự án KHÔNG dùng breadcrumb theo huyện/xã dù có đủ dữ liệu địa điểm', () => {
    const propertyInProject = {
      ...property,
      project: { id: 'p1', name: 'Eco Central Park', slug: 'eco-central-park', shortCode: '6wqpk' },
    };
    const names = listingBreadcrumb(propertyInProject).map((i) => i.name);
    expect(names).not.toContain('Cầu Giấy');
    expect(names).not.toContain('Phường Yên Hòa');
  });
});

describe('breadcrumb trang danh mục', () => {
  it('trang hiện tại bỏ url ở phần tử cuối', () => {
    const items = landingBreadcrumb({
      transactionSlug: 'ban',
      propertyTypeSlug: 'dat-nen',
      locationName: 'Cầu Giấy',
      isCurrentPage: true,
    });
    expect(items.at(-1)).toEqual({ name: 'Cầu Giấy' });
  });

  it('không sinh /tat-ca khi chỉ có đoạn giao dịch', () => {
    process.env.NEXT_PUBLIC_SEO_MODE = 'enforce';
    expect(landingBreadcrumb({ transactionSlug: 'ban' })).toEqual([{ name: 'Bán', url: '/ban' }]);
  });
});
