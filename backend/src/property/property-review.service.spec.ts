import { PropertyReviewService } from './property-review.service';

/**
 * Quy trình duyệt tin 2 chiều. Phần dễ sai nhất là BẢNG SO SÁNH thay đổi: nếu nó báo
 * nhầm, người đăng nhận thông báo "admin đã sửa Giá" trong khi giá không hề đổi — mất
 * tin tưởng ngay. Prisma trả `Decimal` cho giá, nên so sánh thẳng bằng `!==` là luôn
 * báo khác dù giá trị giống hệt.
 */

function makeService() {
  const property = {
    id: 'p1',
    userId: 'u1',
    title: 'Bán đất Vinh',
    price: { toString: () => '2900000000' }, // giả lập Decimal của Prisma
    area: 100,
    district: 'Thành phố Vinh',
    bedrooms: null,
    publishedAt: null,
    status: 'PENDING',
  };

  const prisma: any = {
    property: {
      findUnique: jest.fn().mockResolvedValue(property),
      update: jest.fn().mockImplementation(({ data }: any) => ({ ...property, ...data })),
    },
    propertyHistory: { create: jest.fn().mockResolvedValue({}), findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn().mockImplementation(async (fn: any) =>
      fn({
        property: { update: jest.fn().mockImplementation(({ data }: any) => ({ ...property, ...data })) },
        propertyHistory: { create: jest.fn().mockResolvedValue({}) },
      }),
    ),
  };
  const notification: any = { createNotification: jest.fn().mockResolvedValue({}) };
  const seo: any = { invalidate: jest.fn().mockResolvedValue(undefined) };
  const propertyService: any = { invalidateHomepageCache: jest.fn().mockResolvedValue(undefined) };

  return {
    service: new PropertyReviewService(prisma, notification, seo, propertyService),
    prisma,
    notification,
    propertyService,
    property,
  };
}

describe('so sánh thay đổi khi admin kiểm duyệt', () => {
  it('không báo thay đổi khi admin duyệt luôn mà không sửa gì', async () => {
    const { service, notification } = makeService();
    const res = await service.review('admin1', 'p1', {}, false);

    expect(res.changes).toEqual([]);
    const content = notification.createNotification.mock.calls[0][2];
    expect(content).not.toContain('đã chỉnh sửa');
    expect(content).toContain('đã được duyệt');
  });

  it('Decimal của Prisma bằng số thường thì KHÔNG bị coi là thay đổi', async () => {
    const { service } = makeService();
    // Giá không đổi, chỉ gửi lại đúng giá trị cũ dưới dạng number.
    const res = await service.review('admin1', 'p1', { price: 2900000000 }, false);
    expect(res.changes.find((c) => c.field === 'price')).toBeUndefined();
  });

  it('nêu đích danh trường đã sửa kèm giá trị trước/sau', async () => {
    const { service, notification } = makeService();
    const res = await service.review('admin1', 'p1', { title: 'Bán đất TP Vinh, sổ đỏ' }, true);

    expect(res.changes).toHaveLength(1);
    expect(res.changes[0]).toMatchObject({
      field: 'title',
      label: 'Tiêu đề',
      before: 'Bán đất Vinh',
      after: 'Bán đất TP Vinh, sổ đỏ',
    });

    const content = notification.createNotification.mock.calls[0][2];
    expect(content).toContain('Tiêu đề');
    expect(content).toContain('Bán đất Vinh');
    expect(content).toContain('Gửi duyệt lại');
  });

  it('trả về người đăng thì đặt trạng thái AWAITING_AUTHOR', async () => {
    const { service } = makeService();
    const res = await service.review('admin1', 'p1', { title: 'x' }, true);
    expect(res.property.status).toBe('AWAITING_AUTHOR');
  });

  it('duyệt luôn thì đặt trạng thái APPROVED', async () => {
    const { service } = makeService();
    const res = await service.review('admin1', 'p1', { title: 'x' }, false);
    expect(res.property.status).toBe('APPROVED');
  });

  it('duyệt luôn (APPROVED) thì phải làm mới cache trang chủ đúng 1 lần', async () => {
    const { service, propertyService } = makeService();
    await service.review('admin1', 'p1', { title: 'x' }, false);
    expect(propertyService.invalidateHomepageCache).toHaveBeenCalledTimes(1);
  });

  it('trả về người đăng (AWAITING_AUTHOR) thì KHÔNG làm mới cache trang chủ', async () => {
    const { service, propertyService } = makeService();
    await service.review('admin1', 'p1', { title: 'x' }, true);
    expect(propertyService.invalidateHomepageCache).not.toHaveBeenCalled();
  });

  it('bỏ qua trường không nằm trong danh sách được sửa', async () => {
    const { service } = makeService();
    // userId và status không được phép sửa qua đường kiểm duyệt.
    const res = await service.review('admin1', 'p1', { userId: 'ke-gian', status: 'DELETED' } as any, false);
    expect(res.changes.find((c) => c.field === 'userId')).toBeUndefined();
    expect(res.property.userId).toBe('u1');
    expect(res.property.status).toBe('APPROVED');
  });

  it('giá trị rỗng hiển thị là "(trống)" chứ không phải null', async () => {
    const { service } = makeService();
    const res = await service.review('admin1', 'p1', { bedrooms: 3 }, true);
    expect(res.changes[0]).toMatchObject({ label: 'Số phòng ngủ', before: '(trống)', after: '3' });
  });
});

describe('người đăng gửi duyệt lại', () => {
  it('chỉ chủ tin mới gửi lại được', async () => {
    const { service } = makeService();
    await expect(service.resubmit('nguoi-khac', 'p1')).rejects.toThrow('không phải người đăng');
  });

  it('tin không ở trạng thái chờ kiểm tra thì từ chối', async () => {
    const { service } = makeService(); // property.status = 'PENDING'
    await expect(service.resubmit('u1', 'p1')).rejects.toThrow('không ở trạng thái');
  });
});
