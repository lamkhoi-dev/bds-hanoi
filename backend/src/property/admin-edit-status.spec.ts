import { PropertyService } from './property.service';

/**
 * Admin sửa tin của người khác thì KHÔNG được hạ trạng thái tin về PENDING.
 *
 * Khách phản hồi 19-8 (mục 21-23) rằng admin không sửa được tin, nên đã thêm đường
 * /admin/posts → /post?editId=. Nhưng luồng update vốn thiết kế cho NGƯỜI ĐĂNG: đổi
 * field quan trọng (tiêu đề/giá/diện tích/vị trí) thì tin quay về chờ duyệt. Với admin
 * điều đó vô nghĩa — người sửa và người duyệt là một, và tin sẽ biến mất khỏi site cho
 * tới khi admin tự duyệt lại chính nó.
 */

function makeService(opts: { role: string; ownerId: string; currentStatus?: string }) {
  const property = {
    id: 'p1',
    userId: opts.ownerId,
    title: 'Tiêu đề cũ',
    description: 'Mô tả',
    price: 1000,
    area: 50,
    city: 'Nghệ An',
    district: 'Thành phố Vinh',
    ward: 'Phường Vinh Tân',
    status: opts.currentStatus ?? 'APPROVED',
    tier: 'NORMAL',
    tierExpiresAt: null,
    categoryId: null,
    locationId: null,
  };

  let savedStatus: string | undefined;

  const prisma: any = {
    property: {
      findUnique: jest.fn().mockResolvedValue(property),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    // `user.findUnique` quyết định nhánh admin — đây là điểm test.
    user: { findUnique: jest.fn().mockResolvedValue({ id: 'editor', role: opts.role, balance: 0 }) },
    systemSettings: { findUnique: jest.fn().mockResolvedValue({ isPreModerationEnabled: true, forbiddenWords: '' }) },
    $transaction: jest.fn().mockImplementation(async (fn: any) =>
      fn({
        user: { updateMany: jest.fn() },
        transaction: { create: jest.fn() },
        propertyHistory: { create: jest.fn().mockResolvedValue({}) },
        property: {
          update: jest.fn().mockImplementation(({ data }: any) => {
            savedStatus = data.status;
            return { ...property, ...data };
          }),
        },
      }),
    ),
  };

  const searchService: any = { addDocument: jest.fn().mockResolvedValue({}), deleteDocument: jest.fn().mockResolvedValue({}) };
  const noop: any = {};
  const cacheManager: any = { del: jest.fn(), get: jest.fn() };
  const queue: any = {};

  const service = new PropertyService(prisma, searchService, noop, noop, noop, queue, cacheManager);
  // clearPropertyCache dùng cacheManager thật; chặn lại cho gọn.
  (service as any).clearPropertyCache = jest.fn().mockResolvedValue(undefined);
  (service as any).generateUniqueSlug = jest.fn().mockResolvedValue('tieu-de-moi');

  return { service, getSavedStatus: () => savedStatus };
}

describe('PropertyService.update — trạng thái sau khi sửa', () => {
  it('ADMIN sửa tiêu đề tin của người khác thì tin VẪN APPROVED', async () => {
    const { service, getSavedStatus } = makeService({ role: 'ADMIN', ownerId: 'nguoi-dang' });

    await service.update('editor', 'p1', { title: 'Tiêu đề mới' });

    expect(getSavedStatus()).toBe('APPROVED');
  });

  it('NGƯỜI ĐĂNG sửa tiêu đề tin của mình thì tin quay về PENDING (không đổi hành vi cũ)', async () => {
    // Chủ tin tự sửa: userId trùng property.userId nên không vào nhánh admin.
    const { service, getSavedStatus } = makeService({ role: 'USER', ownerId: 'editor' });

    await service.update('editor', 'p1', { title: 'Tiêu đề mới' });

    expect(getSavedStatus()).toBe('PENDING');
  });

  it('ADMIN sửa tin CỦA CHÍNH MÌNH vẫn đi luồng người đăng', async () => {
    const { service, getSavedStatus } = makeService({ role: 'ADMIN', ownerId: 'editor' });

    await service.update('editor', 'p1', { title: 'Tiêu đề mới' });

    expect(getSavedStatus()).toBe('PENDING');
  });

  it('tin AWAITING_AUTHOR do admin sửa vẫn về PENDING — đó là luồng gửi duyệt lại', async () => {
    const { service, getSavedStatus } = makeService({
      role: 'ADMIN',
      ownerId: 'nguoi-dang',
      currentStatus: 'AWAITING_AUTHOR',
    });

    await service.update('editor', 'p1', { title: 'Tiêu đề mới' });

    expect(getSavedStatus()).toBe('PENDING');
  });
});
