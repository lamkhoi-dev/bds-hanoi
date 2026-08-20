import { PropertyService } from './property.service';

/**
 * `buildDynamicLocationBlock` là lõi của cơ chế "tab động" trang chủ (PHẦN II) — chọn
 * đúng N khu vực có tin mới nhất trong một danh sách ứng viên, khu vực 0 tin phải tự
 * động biến mất chứ không hiện tab rỗng.
 */

function makeService() {
  const prisma: any = {
    location: { findMany: jest.fn() },
    property: { groupBy: jest.fn() },
  };
  const noop: any = {};
  const cacheManager: any = { get: jest.fn(), del: jest.fn() };
  const queue: any = {};

  const service = new PropertyService(prisma, noop, noop, noop, noop, queue, cacheManager);
  return { service, prisma };
}

const getItems = jest.fn().mockResolvedValue([{ id: 'listing' }]);

describe('buildDynamicLocationBlock', () => {
  beforeEach(() => getItems.mockClear());

  it('không có khu vực ứng viên nào thì trả về mảng rỗng, không gọi groupBy', async () => {
    const { service, prisma } = makeService();
    prisma.location.findMany.mockResolvedValue([]);

    const result = await (service as any).buildDynamicLocationBlock(
      { type: 'DISTRICT', groupField: 'districtId', requireFeatured: false },
      9,
      getItems,
    );

    expect(result).toEqual([]);
    expect(prisma.property.groupBy).not.toHaveBeenCalled();
  });

  it('ứng viên có nhưng không khu vực nào có tin đăng thì trả về mảng rỗng', async () => {
    const { service, prisma } = makeService();
    prisma.location.findMany.mockResolvedValue([
      { id: 'd1', type: 'DISTRICT', urlSegment: 'quan-1', name: 'Quận 1' },
      { id: 'd2', type: 'DISTRICT', urlSegment: 'quan-2', name: 'Quận 2' },
    ]);
    // Prisma groupBy chỉ trả nhóm có ≥1 dòng khớp where — ứng viên 0 tin không xuất
    // hiện trong kết quả, mô phỏng đúng hành vi thật của Prisma.
    prisma.property.groupBy.mockResolvedValue([]);

    const result = await (service as any).buildDynamicLocationBlock(
      { type: 'DISTRICT', groupField: 'districtId', requireFeatured: false },
      9,
      getItems,
    );

    expect(result).toEqual([]);
    expect(getItems).not.toHaveBeenCalled();
  });

  it('xếp hạng theo SỐ TIN nhiều nhất, không theo thứ tự findMany trả về', async () => {
    const { service, prisma } = makeService();
    prisma.location.findMany.mockResolvedValue([
      { id: 'd1', type: 'DISTRICT', urlSegment: 'quan-1', name: 'Quận 1', path: 'nghe-an/quan-1' },
      { id: 'd2', type: 'DISTRICT', urlSegment: 'quan-2', name: 'Quận 2', path: 'nghe-an/quan-2' },
      { id: 'd3', type: 'DISTRICT', urlSegment: 'quan-3', name: 'Quận 3', path: 'nghe-an/quan-3' },
    ]);
    // d1 NHIỀU tin nhưng tin cũ; d3 ÍT tin nhưng tin mới nhất; d2 không có tin (0 dòng
    // khớp) -> phải bị loại. Số tin thắng, nên d1 đứng trước d3.
    prisma.property.groupBy.mockResolvedValue([
      { districtId: 'd1', _max: { publishedAt: new Date('2026-01-01') }, _count: { _all: 9 } },
      { districtId: 'd3', _max: { publishedAt: new Date('2026-06-01') }, _count: { _all: 1 } },
    ]);

    const result = await (service as any).buildDynamicLocationBlock(
      { type: 'DISTRICT', groupField: 'districtId', requireFeatured: false },
      9,
      getItems,
    );

    expect(result.map((block: any) => block.key)).toEqual(['quan-1', 'quan-3']);
  });

  it('bằng số tin thì mới xét tới tin mới nhất', async () => {
    const { service, prisma } = makeService();
    prisma.location.findMany.mockResolvedValue([
      { id: 'd1', type: 'DISTRICT', urlSegment: 'quan-1', name: 'Quận 1', path: 'nghe-an/quan-1' },
      { id: 'd2', type: 'DISTRICT', urlSegment: 'quan-2', name: 'Quận 2', path: 'nghe-an/quan-2' },
    ]);
    prisma.property.groupBy.mockResolvedValue([
      { districtId: 'd1', _max: { publishedAt: new Date('2026-01-01') }, _count: { _all: 5 } },
      { districtId: 'd2', _max: { publishedAt: new Date('2026-06-01') }, _count: { _all: 5 } },
    ]);

    const result = await (service as any).buildDynamicLocationBlock(
      { type: 'DISTRICT', groupField: 'districtId', requireFeatured: false },
      9,
      getItems,
    );

    expect(result.map((block: any) => block.key)).toEqual(['quan-2', 'quan-1']);
  });

  it('khu vực thuộc TỈNH CHÍNH đứng trước, dù ít tin hơn tỉnh phụ', async () => {
    const original = process.env.ACTIVE_PROVINCE_SLUG;
    process.env.ACTIVE_PROVINCE_SLUG = 'nghe-an,ha-tinh';
    try {
      const { service, prisma } = makeService();
      prisma.location.findMany.mockResolvedValue([
        // Nghi Xuân thuộc Hà Tĩnh (tỉnh phụ) nhưng nhiều tin hơn.
        { id: 'nx', type: 'DISTRICT', urlSegment: 'huyen-nghi-xuan', name: 'Huyện Nghi Xuân', path: 'ha-tinh/huyen-nghi-xuan' },
        { id: 'nl', type: 'DISTRICT', urlSegment: 'huyen-nghi-loc', name: 'Huyện Nghi Lộc', path: 'nghe-an/huyen-nghi-loc' },
      ]);
      prisma.property.groupBy.mockResolvedValue([
        { districtId: 'nx', _max: { publishedAt: new Date('2026-06-01') }, _count: { _all: 50 } },
        { districtId: 'nl', _max: { publishedAt: new Date('2026-01-01') }, _count: { _all: 4 } },
      ]);

      const result = await (service as any).buildDynamicLocationBlock(
        { type: 'DISTRICT', groupField: 'districtId', requireFeatured: false },
        9,
        getItems,
      );

      expect(result.map((block: any) => block.key)).toEqual(['huyen-nghi-loc', 'huyen-nghi-xuan']);
    } finally {
      process.env.ACTIVE_PROVINCE_SLUG = original;
    }
  });

  it('giới hạn đúng theo limit khi số khu vực có tin vượt quá', async () => {
    const { service, prisma } = makeService();
    const candidates = Array.from({ length: 5 }, (_, i) => ({
      id: `d${i}`,
      type: 'DISTRICT',
      urlSegment: `quan-${i}`,
      name: `Quận ${i}`,
      path: `nghe-an/quan-${i}`,
    }));
    prisma.location.findMany.mockResolvedValue(candidates);
    prisma.property.groupBy.mockResolvedValue(
      candidates.map((c, i) => ({
        districtId: c.id,
        _max: { publishedAt: new Date(2026, 0, i + 1) },
        _count: { _all: i + 1 },
      })),
    );

    const result = await (service as any).buildDynamicLocationBlock(
      { type: 'DISTRICT', groupField: 'districtId', requireFeatured: false },
      2,
      getItems,
    );

    expect(result).toHaveLength(2);
    // Nhiều tin nhất là d4 (5 tin), rồi d3 (4 tin) — limit cắt còn 2 tab.
    expect(result.map((block: any) => block.key)).toEqual(['quan-4', 'quan-3']);
  });

  it('khối OLD_WARD gọi getItems bằng oldWardId, KHÔNG phải wardId (bug đã sửa)', async () => {
    const { service, prisma } = makeService();
    prisma.location.findMany.mockResolvedValue([
      { id: 'ow1', type: 'OLD_WARD', urlSegment: 'xa-cu-1', name: 'Xã Cũ 1' },
    ]);
    prisma.property.groupBy.mockResolvedValue([
      { oldWardId: 'ow1', _max: { publishedAt: new Date('2026-01-01') } },
    ]);

    await (service as any).buildDynamicLocationBlock(
      { type: 'OLD_WARD', groupField: 'oldWardId', requireFeatured: true },
      9,
      getItems,
    );

    expect(prisma.property.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ by: ['oldWardId'] }),
    );
    expect(getItems).toHaveBeenCalledWith({ oldWardId: 'ow1' });
  });
});
