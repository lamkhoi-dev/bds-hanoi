import { listingDetailPath, parseListingRef, listingPath } from './canonical';

/**
 * URL tin đăng là thứ duy nhất trong đợt này ĐANG ĐƯỢC GOOGLE INDEX mà bị dời chỗ.
 * Khách chốt điều kiện: "nếu đổi phải giữ ID cố định và chuyển hướng 301".
 *
 * Các test dưới đây canh giữ hai tính chất:
 *  1. URL cũ `{slug}--{uuid}` vẫn nhận diện được -> trang còn 301 được, không 404.
 *  2. URL mới ngắn hơn thật, và cùng công thức với sitemap phía backend.
 */

const UUID = 'f35dd809-352b-4caf-9cc4-14092195f5bd';

describe('parseListingRef — nhận cả hai dạng URL', () => {
  it('dạng CŨ: lấy uuid sau dấu --', () => {
    expect(parseListingRef(`ban-dat-nen-cau-giay--${UUID}`)).toEqual({
      ref: UUID,
      isLegacy: true,
    });
  });

  it('dạng MỚI: lấy đoạn sau dấu - cuối cùng', () => {
    expect(parseListingRef('ban-dat-nen-cau-giay-19xk3')).toEqual({
      ref: '19xk3',
      isLegacy: false,
    });
  });

  it('tiêu đề chứa số vẫn tách đúng vì mã luôn ở cuối', () => {
    expect(parseListingRef('ban-nha-3-tang-80m2-1a2b3').ref).toBe('1a2b3');
  });

  it('chuỗi rỗng không ném lỗi', () => {
    expect(parseListingRef('')).toEqual({ ref: '', isLegacy: false });
  });

  it('không có dấu nối thì lấy nguyên chuỗi', () => {
    expect(parseListingRef('19xk3').ref).toBe('19xk3');
  });
});

describe('listingDetailPath', () => {
  it('dùng mã ngắn khi có', () => {
    expect(listingDetailPath('ban-dat-nen-cau-giay', '19xk3', UUID)).toBe(
      '/tin/ban-dat-nen-cau-giay-19xk3',
    );
  });

  it('URL mới ngắn hơn URL cũ ít nhất 30 ký tự', () => {
    const moi = listingDetailPath('ban-dat-nen-cau-giay', '19xk3', UUID);
    const cu = `/tin/ban-dat-nen-cau-giay--${UUID}`;
    expect(cu.length - moi.length).toBeGreaterThanOrEqual(30);
  });

  it('chưa có mã (dữ liệu cũ chưa backfill) thì lùi về dạng uuid, không phát URL hỏng', () => {
    expect(listingDetailPath('ban-dat-nen', null, UUID)).toBe(`/tin/ban-dat-nen--${UUID}`);
    expect(listingDetailPath('ban-dat-nen', undefined, UUID)).toBe(`/tin/ban-dat-nen--${UUID}`);
  });

  it('URL cũ đưa qua parse rồi dựng lại ra đúng URL mới — nền tảng của 301', () => {
    const { ref, isLegacy } = parseListingRef(`ban-dat-nen--${UUID}`);
    expect(isLegacy).toBe(true);
    expect(ref).toBe(UUID);
    // Backend tra được bản ghi bằng uuid rồi trả shortCode; trang dựng lại đường dẫn đích.
    expect(listingDetailPath('ban-dat-nen', '19xk3', ref)).toBe('/tin/ban-dat-nen-19xk3');
  });
});

describe('chế độ report giữ nguyên dạng URL danh mục của site Nghệ An', () => {
  const original = process.env.NEXT_PUBLIC_SEO_MODE;
  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_SEO_MODE;
    else process.env.NEXT_PUBLIC_SEO_MODE = original;
  });

  it('report: KHÔNG thêm tiền tố /ban — nhadatxunghe.vn không phải dời URL landing nào', () => {
    process.env.NEXT_PUBLIC_SEO_MODE = 'report';
    expect(listingPath({ propertyTypeSlug: 'dat-nen' })).toBe('/dat-nen');
    expect(listingPath({ propertyTypeSlug: 'dat-nen', locationSlug: 'truong-vinh' })).toBe(
      '/dat-nen/truong-vinh',
    );
    expect(listingPath({ locationSlug: 'truong-vinh' })).toBe('/truong-vinh');
  });

  it('report: cho-thue vẫn là đoạn dẫn đầu vì URL đó đã hợp lệ ở dạng cũ', () => {
    process.env.NEXT_PUBLIC_SEO_MODE = 'report';
    expect(listingPath({ transaction: 'cho-thue', propertyTypeSlug: 'chung-cu' })).toBe(
      '/cho-thue/chung-cu',
    );
  });

  it('enforce: site Hà Nội dùng dạng đầy đủ', () => {
    process.env.NEXT_PUBLIC_SEO_MODE = 'enforce';
    expect(listingPath({ propertyTypeSlug: 'dat-nen', locationSlug: 'cau-giay' })).toBe(
      '/ban/dat-nen/cau-giay',
    );
  });
});
