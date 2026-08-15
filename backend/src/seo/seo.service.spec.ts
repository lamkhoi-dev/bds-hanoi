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
    // null => locationSegmentMap trả map rỗng, đủ cho phạm vi test này.
    getTree: jest.fn().mockResolvedValue(null),
  };
  // Cache luôn miss để mỗi lần gọi đều chạm truy vấn thật. set/del phải trả Promise vì
  // service gọi `.catch()` trên chúng.
  const cache: any = {
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };
  return { service: new SeoService(prisma, locationService, cache), groupBy, findMany, prisma };
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
