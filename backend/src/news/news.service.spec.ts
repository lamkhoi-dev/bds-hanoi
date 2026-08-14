import { NewsService } from './news.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Slug tin tức từng bị sinh sai: hàm cũ không chuẩn hoá NFD nên mọi ký tự có dấu
 * bị xoá, "Thông qua hồ sơ điều chỉnh" ra "th-ng-qua-h-s-i-u-ch-nh".
 */
describe('NewsService – sinh slug', () => {
  let prisma: any;
  let service: NewsService;

  beforeEach(() => {
    prisma = {
      news: {
        create: jest.fn(({ data }: any) => Promise.resolve({ id: 'n1', ...data })),
        findUnique: jest.fn(() => Promise.resolve(null)),
        findFirst: jest.fn(() => Promise.resolve(null)),
        update: jest.fn(({ data }: any) => Promise.resolve({ id: 'n1', ...data })),
      },
    };
    service = new NewsService(prisma as unknown as PrismaService);
  });

  it('bỏ dấu tiếng Việt thay vì xoá ký tự', async () => {
    const created: any = await service.create({
      title: 'Thông qua hồ sơ điều chỉnh',
      content: '<p>x</p>',
    });
    expect(created.slug).toBe('thong-qua-ho-so-dieu-chinh');
  });

  it('xử lý đúng chữ đ hoa và thường', async () => {
    const created: any = await service.create({ title: 'Đất nền Đông Anh', content: '' });
    expect(created.slug).toBe('dat-nen-dong-anh');
  });

  it('gắn hậu tố khi slug đã tồn tại', async () => {
    prisma.news.findUnique.mockResolvedValueOnce({ id: 'khac', slug: 'tin-moi' });
    const created: any = await service.create({ title: 'Tin mới', content: '' });
    expect(created.slug).toMatch(/^tin-moi-[a-z0-9]{6}$/);
  });

  it('đổi tiêu đề thì sinh lại slug và giữ slug cũ để 301', async () => {
    prisma.news.findUnique
      .mockResolvedValueOnce({ id: 'n1', slug: 'tieu-de-cu', previousSlugs: [] }) // đọc bản ghi hiện tại
      .mockResolvedValueOnce(null); // kiểm tra slug mới còn trống

    const updated: any = await service.update('n1', { title: 'Tiêu đề mới' });
    expect(updated.slug).toBe('tieu-de-moi');
    expect(updated.previousSlugs).toEqual(['tieu-de-cu']);
  });

  it('không đổi slug khi tiêu đề giữ nguyên', async () => {
    prisma.news.findUnique.mockResolvedValueOnce({
      id: 'n1',
      slug: 'tieu-de-cu',
      previousSlugs: [],
    });

    const updated: any = await service.update('n1', { content: 'nội dung mới' });
    expect(updated.slug).toBeUndefined();
    expect(updated.previousSlugs).toBeUndefined();
  });
});
