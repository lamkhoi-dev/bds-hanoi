import { PropertyService } from './property.service';

/**
 * Bất biến: MỌI khối trang chủ lọc theo `propertyType` đều phải lọc kèm
 * `transactionType`.
 *
 * Vì sao cần test riêng: 6 khối theo loại BĐS của bố cục `classic` (4 khối `cat-*` +
 * 2 tab "Bất động sản khác") trước đây chỉ lọc `propertyType`, nên khối "Chung cư" trên
 * trang chủ Nghệ An hiện lẫn tin CHO THUÊ — mà tiêu đề khối lại link sang trang bán
 * (`/chung-cu`, gửi `transactionType=BAN`), tức bấm vào thì không thấy tin vừa xem.
 *
 * Test không khoá danh sách khối (danh sách đó thuộc HOMEPAGE_LAYOUTS và còn đổi theo
 * yêu cầu khách) mà khoá đúng bất biến trên — khối mới thêm sau này quên lọc giao dịch
 * cũng bị bắt.
 */

function makeService(layout: 'classic' | 'grouped') {
  process.env.SITE_LAYOUT = layout;

  const findMany = jest.fn().mockResolvedValue([]);
  const prisma: any = {
    property: {
      findMany,
      groupBy: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    location: { findMany: jest.fn().mockResolvedValue([]) },
    project: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
    user: { count: jest.fn().mockResolvedValue(0) },
  };
  const noop: any = {};
  const cacheManager: any = {
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };
  const service = new PropertyService(prisma, noop, noop, noop, noop, {} as any, cacheManager);
  return { service, findMany };
}

/** Các lần gọi findMany có lọc loại BĐS nhưng KHÔNG lọc loại giao dịch. */
function typeOnlyCalls(findMany: jest.Mock) {
  return findMany.mock.calls
    .map(([args]) => args?.where ?? {})
    .filter((where: any) => where.propertyType && !where.transactionType);
}

describe('Khối trang chủ theo loại BĐS luôn lọc kèm loại giao dịch', () => {
  const savedLayout = process.env.SITE_LAYOUT;
  afterAll(() => {
    if (savedLayout === undefined) delete process.env.SITE_LAYOUT;
    else process.env.SITE_LAYOUT = savedLayout;
  });

  it('bố cục classic (Nghệ An): không khối nào lọc loại BĐS mà bỏ giao dịch', async () => {
    const { service, findMany } = makeService('classic');
    await service.getHomepageProperties();

    // Có thật sự chạy tới các khối theo loại, không phải rỗng do mock chặn sớm.
    const typed = findMany.mock.calls
      .map(([args]) => args?.where ?? {})
      .filter((w: any) => w.propertyType);
    expect(typed.length).toBeGreaterThanOrEqual(6);

    expect(typeOnlyCalls(findMany)).toEqual([]);
  });

  it('6 khối classic lọc đúng BAN, khối cho thuê lọc CHO_THUE', async () => {
    const { service, findMany } = makeService('classic');
    await service.getHomepageProperties();

    const byTx = (tx: string) =>
      findMany.mock.calls
        .map(([args]) => args?.where ?? {})
        .filter((w: any) => w.propertyType && w.transactionType === tx)
        .map((w: any) => w.propertyType)
        .sort();

    expect(byTx('BAN')).toEqual(
      ['BDS_KHAC', 'CHUNG_CU', 'DAT_NEN', 'DU_AN', 'MAT_BANG', 'NHA_RIENG'].sort(),
    );
    // 5 tab "Cho thuê" — không được lẫn sang nhóm BAN.
    expect(byTx('CHO_THUE')).toHaveLength(5);
  });

  it('bố cục grouped (Hà Nội): vốn đã đúng, vẫn phải giữ', async () => {
    const { service, findMany } = makeService('grouped');
    await service.getHomepageProperties();

    expect(typeOnlyCalls(findMany)).toEqual([]);
  });
});
