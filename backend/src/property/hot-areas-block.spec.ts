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

  it('href trỏ tới trang tìm kiếm cùng từ khoá — bấm vào không được ra tập khác', async () => {
    const { service, prisma, findMany } = makeService();
    prisma.hotArea.findMany.mockResolvedValue([AREAS[1]]);
    findMany.mockResolvedValue([{ id: 'tin-1' }]);

    const block = await (service as any).buildHotAreasBlock(9);
    expect(block.tabs[0].href).toBe(`/search?q=${encodeURIComponent('Hồ Tây')}`);
  });
});
