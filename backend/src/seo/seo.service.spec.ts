import { SeoService } from './seo.service';

/**
 * Yêu cầu I.15: "Tin đã bán, hết hạn hoặc bị xóa … loại khỏi sitemap."
 *
 * Test này canh giữ ranh giới giữa hai tập trạng thái, vì chúng rất dễ bị gộp lại:
 *  - sitemap tin đăng chỉ nhận `APPROVED`
 *  - roll-up trang danh mục vẫn đếm `SOLD`, để khớp với `total` mà frontend đọc từ
 *    `/properties/seo` — nếu lệch thì trang có tin lại bị coi là rỗng và mất index.
 */

function makeService() {
  const groupBy = jest.fn().mockResolvedValue([]);
  const findMany = jest.fn().mockResolvedValue([]);
  const prisma: any = {
    property: { groupBy, findMany },
    news: { findMany: jest.fn().mockResolvedValue([]) },
    project: { findMany: jest.fn().mockResolvedValue([]) },
  };
  const locationService: any = {
    getSeoLocations: jest.fn().mockResolvedValue([]),
    // Map rỗng mặc định; test nào cần tra đoạn URL thì tự nạp.
    getSegmentById: jest.fn().mockResolvedValue(new Map<string, string>()),
    getTree: jest.fn().mockResolvedValue(null),
  };
  // Cache luôn miss để mỗi lần gọi đều chạm truy vấn thật. set/del phải trả Promise vì
  // service gọi `.catch()` trên chúng.
  const cache: any = {
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };
  return { service: new SeoService(prisma, locationService, cache), groupBy, findMany, prisma, locationService };
}

describe('phạm vi trạng thái của sitemap', () => {
  it('sitemap tin đăng loại tin đã bán và đã cho thuê', async () => {
    const { service, findMany } = makeService();
    await service.getListingUrls();

    const status = findMany.mock.calls[0][0].where.status.in;
    expect(status).toEqual(['APPROVED']);
    expect(status).not.toContain('SOLD');
    expect(status).not.toContain('RENTED');
  });

  it('sitemap tin đăng bỏ qua tin đã xoá mềm', async () => {
    const { service, findMany } = makeService();
    await service.getListingUrls();
    expect(findMany.mock.calls[0][0].where.deletedAt).toBeNull();
  });

  it('roll-up trang danh mục VẪN đếm tin đã bán', async () => {
    const { service, groupBy } = makeService();
    await service.getLandingUrls();

    // Trang phường có tin đã bán vẫn là trang có nội dung thật. Nếu bỏ SOLD ở đây thì
    // sitemap nói "không có" trong khi trang vẫn hiển thị tin -> hai bên mâu thuẫn.
    expect(groupBy.mock.calls[0][0].where.status.in).toEqual(['APPROVED', 'SOLD']);
  });
});

describe('sitemap trang Dự án', () => {
  it('loại dự án chưa có tin đang hiển thị nào khỏi sitemap', async () => {
    const { service, prisma } = makeService();
    prisma.project.findMany.mockResolvedValue([
      { id: 'p1', slug: 'du-an-a', shortCode: 'aaa11', contentUpdatedAt: null, updatedAt: new Date(), createdAt: new Date() },
      { id: 'p2', slug: 'du-an-b', shortCode: 'bbb22', contentUpdatedAt: null, updatedAt: new Date(), createdAt: new Date() },
    ]);
    prisma.property.groupBy.mockResolvedValue([{ projectId: 'p1', _count: { id: 3 } }]);

    const urls = await service.getProjectUrls();
    expect(urls).toHaveLength(1);
    expect(urls[0].loc).toContain('du-an-a-aaa11');
  });

  // "Có nội dung" phải khớp CÙNG định nghĩa với roll-up trang danh mục (APPROVED +
  // SOLD) — trang /du-an/{slug} tự quyết định noindex bằng cùng tập trạng thái, lệch
  // nhau thì trang nói "có tin" còn sitemap nói "rỗng".
  it('đếm tin theo dự án dùng cùng tập trạng thái APPROVED + SOLD', async () => {
    const { service, prisma } = makeService();
    await service.getProjectUrls();
    expect(prisma.property.groupBy.mock.calls[0][0].where.status.in).toEqual(['APPROVED', 'SOLD']);
  });
});

/**
 * Ba lỗi sitemap khách nêu trong "Sitemap 21-8-2026". Cả ba đều đã kiểm chứng trên
 * nhadatxunghe.vn trước khi sửa, nên test dưới đây khoá đúng hành vi đã đo được.
 */
describe('sitemap trang danh mục — 3 điểm khách nêu 21/08', () => {
  const groupsOf = (rows: any[]) => rows;

  it('KHÔNG sinh /du-an/{khu-vuc}: 5 URL kiểu này đều đang 308 về /du-an', async () => {
    const { service, groupBy, locationService } = makeService();
    locationService.getSegmentById.mockResolvedValue(
      new Map([
        ['w1', 'phuong-vinh-phu'],
        ['d1', 'thanh-pho-vinh'],
        ['p1', 'nghe-an'],
      ]),
    );
    groupBy.mockResolvedValue(
      groupsOf([
        {
          transactionType: 'BAN',
          propertyType: 'DU_AN',
          wardId: 'w1',
          districtId: 'd1',
          provinceId: 'p1',
          _count: { id: 3 },
          _max: { publishedAt: new Date() },
        },
      ]),
    );

    const urls = (await service.getLandingUrls()).map((u) => u.loc);

    // Không một URL nào bắt đầu bằng /du-an — kể cả /du-an trần.
    expect(urls.filter((u) => u.includes('/du-an'))).toEqual([]);
    // Nhưng tin loại "Dự án" vẫn phải đóng góp cho trang khu vực của nó.
    expect(urls.some((u) => u.endsWith('/nghe-an'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/thanh-pho-vinh'))).toBe(true);
  });

  it('KHÔNG lặp /ban và /cho-thue với static.xml', async () => {
    const { service, groupBy, locationService } = makeService();
    locationService.getSegmentById.mockResolvedValue(new Map([['p1', 'nghe-an']]));
    groupBy.mockResolvedValue(
      groupsOf([
        {
          transactionType: 'BAN',
          propertyType: 'DAT_NEN',
          wardId: null,
          districtId: null,
          provinceId: 'p1',
          _count: { id: 5 },
          _max: { publishedAt: new Date() },
        },
        {
          transactionType: 'CHO_THUE',
          propertyType: 'NHA_RIENG',
          wardId: null,
          districtId: null,
          provinceId: 'p1',
          _count: { id: 2 },
          _max: { publishedAt: new Date() },
        },
      ]),
    );

    const paths = (await service.getLandingUrls()).map((u) => new URL(u.loc).pathname);

    expect(paths).not.toContain('/ban');
    expect(paths).not.toContain('/cho-thue');
    // Tổ hợp có khu vực thì vẫn phải còn — cổng chặn không được ăn lan.
    expect(paths).toContain('/dat-nen/nghe-an');
    expect(paths).toContain('/cho-thue/nha-rieng/nghe-an');
  });

  it('KHÔNG bỏ sót tỉnh phụ: khu vực Hà Tĩnh phải vào được sitemap', async () => {
    const { service, groupBy, locationService } = makeService();
    // Đây là điểm mấu chốt: bản đồ nay đến từ getSegmentById (mọi tỉnh) chứ không phải
    // getTree (chỉ tỉnh chính). getTree vẫn trả null để chắc chắn không ai dùng lại nó.
    locationService.getSegmentById.mockResolvedValue(
      new Map([
        ['ht-d', 'thanh-pho-ha-tinh'],
        ['ht-p', 'ha-tinh'],
      ]),
    );
    groupBy.mockResolvedValue(
      groupsOf([
        {
          transactionType: 'BAN',
          propertyType: 'DAT_NEN',
          wardId: null,
          districtId: 'ht-d',
          provinceId: 'ht-p',
          _count: { id: 4 },
          _max: { publishedAt: new Date() },
        },
      ]),
    );

    const paths = (await service.getLandingUrls()).map((u) => new URL(u.loc).pathname);

    expect(paths).toContain('/dat-nen/thanh-pho-ha-tinh');
    expect(paths).toContain('/thanh-pho-ha-tinh');
    expect(paths).toContain('/ha-tinh');
    expect(locationService.getTree).not.toHaveBeenCalled();
  });
});
