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

  it('xếp hạng đúng theo tin đăng mới nhất, không theo thứ tự findMany trả về', async () => {
    const { service, prisma } = makeService();
    prisma.location.findMany.mockResolvedValue([
      { id: 'd1', type: 'DISTRICT', urlSegment: 'quan-1', name: 'Quận 1' },
      { id: 'd2', type: 'DISTRICT', urlSegment: 'quan-2', name: 'Quận 2' },
      { id: 'd3', type: 'DISTRICT', urlSegment: 'quan-3', name: 'Quận 3' },
    ]);
    // d1 cũ nhất, d3 mới nhất, d2 không có tin (0 dòng khớp) -> phải bị loại.
    prisma.property.groupBy.mockResolvedValue([
      { districtId: 'd1', _max: { publishedAt: new Date('2026-01-01') } },
      { districtId: 'd3', _max: { publishedAt: new Date('2026-06-01') } },
    ]);

    const result = await (service as any).buildDynamicLocationBlock(
      { type: 'DISTRICT', groupField: 'districtId', requireFeatured: false },
      9,
      getItems,
    );

    expect(result.map((block: any) => block.key)).toEqual(['quan-3', 'quan-1']);
  });

  it('giới hạn đúng theo limit khi số khu vực có tin vượt quá', async () => {
    const { service, prisma } = makeService();
    const candidates = Array.from({ length: 5 }, (_, i) => ({
      id: `d${i}`,
      type: 'DISTRICT',
      urlSegment: `quan-${i}`,
      name: `Quận ${i}`,
    }));
    prisma.location.findMany.mockResolvedValue(candidates);
    prisma.property.groupBy.mockResolvedValue(
      candidates.map((c, i) => ({ districtId: c.id, _max: { publishedAt: new Date(2026, 0, i + 1) } })),
    );

    const result = await (service as any).buildDynamicLocationBlock(
      { type: 'DISTRICT', groupField: 'districtId', requireFeatured: false },
      2,
      getItems,
    );

    expect(result).toHaveLength(2);
    // Mới nhất là d4 (index 4), rồi d3 — limit cắt còn 2 tab.
    expect(result.map((block: any) => block.key)).toEqual(['quan-4', 'quan-3']);
  });
});
