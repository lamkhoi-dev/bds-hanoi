import { PropertyService } from './property.service';

/**
 * Khách báo 15/9: "tin UP hiện tất cả, hết hạn vẫn nằm trên". Hai hành vi khoá lại ở đây:
 *  - `searchDatabase` giới hạn tin UP còn hiệu lực: 3 mới nhất + 2 ngẫu nhiên (tối đa 5),
 *    cùng khuôn với `vips` đã có sẵn — không còn trả `ups: []` cố định.
 *  - Cron hạ cấp tier hết hạn xoá luôn `pushedAt`, để tin rơi về đúng vị trí theo
 *    `publishedAt` thay vì tiếp tục ghim đầu danh sách nhờ mốc UP cũ.
 */
function makeService() {
  const property: any = {
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
  };
  const prisma: any = { property };
  const searchService: any = {};
  const notificationService: any = { createNotification: jest.fn().mockResolvedValue({}) };
  const adminActionLogService: any = {};
  const interactionService: any = {};
  const propertyUpQueue: any = {};
  const cacheManager: any = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

  const service = new PropertyService(
    prisma,
    searchService,
    notificationService,
    adminActionLogService,
    interactionService,
    propertyUpQueue,
    cacheManager,
  );
  return { service, prisma, property };
}

describe('searchDatabase — khối tin UP', () => {
  it('lấy tối đa 50 ứng viên tier UP còn hiệu lực (APPROVED), sắp theo pushedAt', async () => {
    const { service, property } = makeService();
    await service.searchDatabase({ page: 1, limit: 20 } as any);

    const upCall = property.findMany.mock.calls.find((c: any) => c[0]?.where?.tier === 'UP');
    expect(upCall).toBeDefined();
    expect(upCall[0].where.status).toBe('APPROVED');
    expect(upCall[0].take).toBe(50);
  });

  it('3 tin UP mới nhất + 2 ngẫu nhiên trong số còn lại -> tối đa 5 tin trả về', async () => {
    const { service, property } = makeService();
    const allUps = Array.from({ length: 10 }, (_, i) => ({ id: `up${i}` }));
    property.findMany.mockImplementation((args: any) => {
      if (args?.where?.tier === 'UP') return Promise.resolve(allUps);
      return Promise.resolve([]); // normals
    });

    const result = await service.searchDatabase({ page: 1, limit: 20 } as any);
    expect(result.ups).toHaveLength(5);
    // 3 tin đầu (mới nhất) luôn có mặt, không bị cuốn vào phần random.
    expect(result.ups.slice(0, 3).map((u: any) => u.id)).toEqual(['up0', 'up1', 'up2']);
  });

  it('lọc theo tier=VIP -> KHÔNG tính khối ups (cùng quy ước với khối vips đang có: tier khác thì bỏ qua khối tóm tắt của mình)', async () => {
    const { service, property } = makeService();
    await service.searchDatabase({ page: 1, limit: 20, tier: 'VIP' } as any);

    const upCall = property.findMany.mock.calls.find((c: any) => c[0]?.where?.tier === 'UP');
    expect(upCall).toBeUndefined();
  });
});

describe('handleCronJobs — hạ cấp tier hết hạn', () => {
  it('xoá pushedAt khi hạ VIP/UP hết hạn về NORMAL — không để tin ghim đầu danh sách sau khi hết hạn', async () => {
    const { service, property } = makeService();
    property.findMany.mockResolvedValueOnce([{ id: 'p1' }]).mockResolvedValue([]);

    await service.handleCronJobs();

    expect(property.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['p1'] } },
      data: { tier: 'NORMAL', pushedAt: null },
    });
  });

  it('không có tin VIP/UP nào hết hạn -> không có lệnh updateMany nào đổi tier', async () => {
    const { service, property } = makeService();
    property.findMany.mockResolvedValue([]);

    await service.handleCronJobs();

    // Cron còn một bước RIÊNG (tự động EXPIRED tin quá 1 năm) luôn chạy `updateMany` —
    // chỉ cần khẳng định không có lệnh nào đụng tới `tier`/`pushedAt` là đủ cho việc đang
    // khoá ở đây.
    const tierCalls = property.updateMany.mock.calls.filter((c: any) => 'tier' in (c[0]?.data ?? {}));
    expect(tierCalls).toHaveLength(0);
  });
});
