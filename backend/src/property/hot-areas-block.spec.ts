import { PropertyService } from './property.service';

/**
 * Khối "Khu vực hot" (Bảng 4, chỉ bố cục `grouped`).
 *
 * Điều khách yêu cầu gắt nhất là PHẠM VI KHỚP: "trong tin có chứa cụm từ giống hệt với tên
 * khu vực hot, không lấy mở rộng, không lấy tin chỉ trùng 1 hoặc nhiều từ khóa mà bắt buộc
 * đúng 100%". Nên test ở đây soi thẳng vào mệnh đề `where` được gửi xuống Prisma, chứ không
 * chỉ soi kết quả trả về — kết quả thì mock nào cũng cho qua.
 */

function makeService() {
  const findMany = jest.fn().mockResolvedValue([]);
  const prisma: any = {
    hotArea: { findMany: jest.fn() },
    property: { findMany },
  };
  const noop: any = {};
  const cacheManager: any = { get: jest.fn(), del: jest.fn() };
  const service = new PropertyService(prisma, noop, noop, noop, noop, {} as any, cacheManager);
  return { service, prisma, findMany };
}

const AREAS = [
  { name: 'Vinhomes Smart City', slug: 'vinhomes-smart-city' },
  { name: 'Hồ Tây', slug: 'ho-tay' },
];

describe('buildHotAreasBlock', () => {
  it('chưa nhập khu vực hot nào thì trả null, không đụng tới bảng Property', async () => {
    const { service, prisma, findMany } = makeService();
    prisma.hotArea.findMany.mockResolvedValue([]);

    expect(await (service as any).buildHotAreasBlock(9)).toBeNull();
    expect(findMany).not.toHaveBeenCalled();
  });

  it('khớp ĐÚNG cụm từ trong tiêu đề hoặc mô tả — không tách từ, không khớp mờ', async () => {
    const { service, prisma, findMany } = makeService();
    prisma.hotArea.findMany.mockResolvedValue(AREAS);
    findMany.mockResolvedValue([{ id: 'tin-1' }]);

    await (service as any).buildHotAreasBlock(9);

    const wheres = findMany.mock.calls.map(([args]) => args.where);
    expect(wheres).toHaveLength(2);
    // Cả cụm từ đi nguyên vào `contains` — nếu ai đó đổi sang tách từ hay `search` thì đỏ.
    expect(wheres[0].OR).toEqual([
      { title: { contains: 'Vinhomes Smart City', mode: 'insensitive' } },
      { description: { contains: 'Vinhomes Smart City', mode: 'insensitive' } },
    ]);
    // Vẫn phải là tin công khai, chưa xoá, hạng thường — giống mọi khối khác trên trang chủ.
    expect(wheres[0].deletedAt).toBeNull();
    expect(wheres[0].tier).toBe('NORMAL');
  });

  it('bỏ tab không có tin nào — tab rỗng bấm vào ra trang trắng', async () => {
    const { service, prisma, findMany } = makeService();
    prisma.hotArea.findMany.mockResolvedValue(AREAS);
    findMany
      .mockResolvedValueOnce([{ id: 'tin-1' }]) // Vinhomes Smart City: có tin
      .mockResolvedValueOnce([]); // Hồ Tây: không tin

    const block = await (service as any).buildHotAreasBlock(9);

    expect(block.id).toBe('hot-areas');
    expect(block.kind).toBe('tabs');
    expect(block.tabs.map((t: any) => t.title)).toEqual(['Vinhomes Smart City']);
  });

  it('mọi tab đều rỗng thì bỏ hẳn khối, không hiện tiêu đề trơ', async () => {
    const { service, prisma, findMany } = makeService();
    prisma.hotArea.findMany.mockResolvedValue(AREAS);
    findMany.mockResolvedValue([]);

    expect(await (service as any).buildHotAreasBlock(9)).toBeNull();
  });

  it('lấy đúng số khu vực theo limit và theo sortOrder khách đánh số', async () => {
    const { service, prisma } = makeService();
    prisma.hotArea.findMany.mockResolvedValue([]);

    await (service as any).buildHotAreasBlock(5);

    const args = prisma.hotArea.findMany.mock.calls[0][0];
    expect(args.take).toBe(5);
    expect(args.where).toEqual({ isActive: true });
    expect(args.orderBy).toEqual([{ sortOrder: 'asc' }, { name: 'asc' }]);
  });

  it('href trỏ tới trang đích khu vực hot (khớp đúng cụm từ), KHÔNG về /search mờ', async () => {
    const { service, prisma, findMany } = makeService();
    prisma.hotArea.findMany.mockResolvedValue([AREAS[1]]);
    findMany.mockResolvedValue([{ id: 'tin-1' }]);

    const block = await (service as any).buildHotAreasBlock(9);
    expect(block.tabs[0].href).toBe('/khu-vuc-hot/ho-tay');
  });
});

describe('getHotAreaListings', () => {
  function setup() {
    const findMany = jest.fn().mockResolvedValue([{ id: 'tin-1' }]);
    const count = jest.fn().mockResolvedValue(1);
    const prisma: any = {
      hotArea: { findFirst: jest.fn() },
      property: { findMany, count },
    };
    const noop: any = {};
    const service = new PropertyService(prisma, noop, noop, noop, noop, {} as any, { get: jest.fn(), del: jest.fn() } as any);
    return { service, prisma, findMany, count };
  }

  it('khu vực không tồn tại hoặc đã tắt thì 404, không truy vấn tin', async () => {
    const { service, prisma, findMany } = setup();
    prisma.hotArea.findFirst.mockResolvedValue(null);

    await expect(service.getHotAreaListings('khong-co')).rejects.toThrow('Không tìm thấy khu vực hot');
    expect(findMany).not.toHaveBeenCalled();
  });

  it('dùng ĐÚNG mệnh đề khớp cụm từ như tab trang chủ, và lấy mọi hạng tin', async () => {
    const { service, prisma, findMany, count } = setup();
    prisma.hotArea.findFirst.mockResolvedValue({ name: 'Hồ Tây', slug: 'ho-tay' });

    const res = await service.getHotAreaListings('ho-tay', 2, 10);

    const where = findMany.mock.calls[0][0].where;
    expect(where.OR).toEqual([
      { title: { contains: 'Hồ Tây', mode: 'insensitive' } },
      { description: { contains: 'Hồ Tây', mode: 'insensitive' } },
    ]);
    // Trang đích khác tab: KHÔNG giới hạn tier=NORMAL.
    expect(where.tier).toBeUndefined();
    expect(where.deletedAt).toBeNull();
    expect(count.mock.calls[0][0].where).toEqual(where);
    expect(findMany.mock.calls[0][0].skip).toBe(10);
    expect(findMany.mock.calls[0][0].take).toBe(10);
    expect(res).toMatchObject({ total: 1, page: 2, limit: 10, area: { name: 'Hồ Tây' } });
  });

  it('kẹp page/limit về khoảng hợp lệ', async () => {
    const { service, prisma, findMany } = setup();
    prisma.hotArea.findFirst.mockResolvedValue({ name: 'Hồ Tây', slug: 'ho-tay' });

    await service.getHotAreaListings('ho-tay', -5, 9999);

    expect(findMany.mock.calls[0][0].skip).toBe(0);
    expect(findMany.mock.calls[0][0].take).toBe(50);
  });
});

describe('attachPosters', () => {
  it('chỉ gắn người đăng cho tin thiếu `user`, một truy vấn gộp, và không lộ trường nhạy cảm', async () => {
    const findMany = jest.fn().mockResolvedValue([{ id: 'u1', name: 'An', slug: 'an', shortCode: 'a1', avatar: null }]);
    const prisma: any = { user: { findMany } };
    const noop: any = {};
    const service = new PropertyService(prisma, noop, noop, noop, noop, {} as any, { get: jest.fn(), del: jest.fn() } as any);

    const has = { id: 'p1', userId: 'u2', user: { id: 'u2', name: 'Sẵn' } };
    const items = [{ id: 'p0', userId: 'u1' }, { id: 'p2', userId: 'u1' }, has, { id: 'p3' }];
    const out = await service.attachPosters(items as any[]);

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany.mock.calls[0][0].where).toEqual({ id: { in: ['u1'] } });
    expect(findMany.mock.calls[0][0].select).toEqual({ id: true, slug: true, shortCode: true, name: true, avatar: true });
    expect(out[0].user).toMatchObject({ name: 'An' });
    expect(out[1].user).toMatchObject({ name: 'An' });
    expect(out[2]).toBe(has);
    expect(out[3]).toEqual({ id: 'p3' });
  });

  it('không tin nào thiếu người đăng thì không truy vấn', async () => {
    const findMany = jest.fn();
    const prisma: any = { user: { findMany } };
    const noop: any = {};
    const service = new PropertyService(prisma, noop, noop, noop, noop, {} as any, { get: jest.fn(), del: jest.fn() } as any);

    await service.attachPosters([{ id: 'p1', userId: 'u1', user: { id: 'u1' } }] as any[]);
    expect(findMany).not.toHaveBeenCalled();
  });
});
