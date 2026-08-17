import { PropertyService } from './property.service';

/**
 * `rankedProjectIds` / `buildProjectGrid` / `buildProjectTabsBlock` — cùng thuật toán
 * "N dự án có tin mới nhất" mà `ProjectService.findLatestForHomepage()` đã dùng, viết
 * lại tại `PropertyService` để tránh vòng phụ thuộc module. Test này bảo vệ đúng hành vi
 * đó: dự án 0 tin bị loại, xếp hạng theo tin mới nhất chứ không theo thứ tự findMany.
 */

function makeService() {
  const prisma: any = {
    property: { groupBy: jest.fn() },
    project: { findMany: jest.fn() },
  };
  const noop: any = {};
  const cacheManager: any = { get: jest.fn(), del: jest.fn() };
  const queue: any = {};
  const service = new PropertyService(prisma, noop, noop, noop, noop, queue, cacheManager);
  return { service, prisma };
}

const getItems = jest.fn().mockResolvedValue([{ id: 'listing' }]);

describe('rankedProjectIds / buildProjectGrid / buildProjectTabsBlock', () => {
  beforeEach(() => getItems.mockClear());

  it('0 dự án có tin thì cả grid lẫn tabs đều rỗng, không gọi project.findMany', async () => {
    const { service, prisma } = makeService();
    prisma.property.groupBy.mockResolvedValue([]);

    const grid = await (service as any).buildProjectGrid(4);
    const tabs = await (service as any).buildProjectTabsBlock(5, getItems);

    expect(grid).toEqual([]);
    expect(tabs).toEqual([]);
    expect(prisma.project.findMany).not.toHaveBeenCalled();
  });

  it('xếp hạng theo tin mới nhất, không theo thứ tự groupBy trả về', async () => {
    const { service, prisma } = makeService();
    prisma.property.groupBy.mockResolvedValue([
      { projectId: 'p1', _max: { publishedAt: new Date('2026-01-01') } },
      { projectId: 'p2', _max: { publishedAt: new Date('2026-06-01') } },
    ]);
    prisma.project.findMany.mockResolvedValue([
      { id: 'p1', name: 'Dự án cũ', slug: 'du-an-cu', shortCode: 'aaa', thumbnail: null },
      { id: 'p2', name: 'Dự án mới', slug: 'du-an-moi', shortCode: 'bbb', thumbnail: null },
    ]);

    const grid = await (service as any).buildProjectGrid(4);
    expect(grid.map((p: any) => p.id)).toEqual(['p2', 'p1']);

    const tabs = await (service as any).buildProjectTabsBlock(5, getItems);
    expect(tabs.map((t: any) => t.key)).toEqual(['bbb', 'aaa']);
    expect(tabs[0].href).toBe('/du-an/du-an-moi-bbb');
  });

  it('giới hạn đúng theo limit khi có nhiều dự án hơn', async () => {
    const { service, prisma } = makeService();
    const groups = Array.from({ length: 6 }, (_, i) => ({
      projectId: `p${i}`,
      _max: { publishedAt: new Date(2026, 0, i + 1) },
    }));
    prisma.property.groupBy.mockResolvedValue(groups);
    prisma.project.findMany.mockResolvedValue(
      groups.map((g) => ({ id: g.projectId, name: g.projectId, slug: g.projectId, shortCode: g.projectId, thumbnail: null })),
    );

    const grid = await (service as any).buildProjectGrid(4);
    expect(grid).toHaveLength(4);
    // Mới nhất là p5 (index 5), rồi p4, p3, p2 — limit cắt còn 4.
    expect(grid.map((p: any) => p.id)).toEqual(['p5', 'p4', 'p3', 'p2']);
  });

  it('dự án không VISIBLE hoặc tin đã xoá không được groupBy đưa vào (đã lọc ở where)', async () => {
    const { service, prisma } = makeService();
    prisma.property.groupBy.mockResolvedValue([]);
    await (service as any).rankedProjectIds(4);
    expect(prisma.property.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          projectId: { not: null },
          deletedAt: null,
          project: { status: 'VISIBLE' },
        }),
      }),
    );
  });
});
