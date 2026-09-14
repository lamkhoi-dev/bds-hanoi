import { NewsService } from './news.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Slug tin tức từng bị sinh sai: hàm cũ không chuẩn hoá NFD nên mọi ký tự có dấu
 * bị xoá, "Thông qua hồ sơ điều chỉnh" ra "th-ng-qua-h-s-i-u-ch-nh".
 *
 * PHẦN B (12/9): thêm trạng thái/hẹn giờ, làm sạch HTML, `contentUpdatedAt`. `SeoService`
 * được tiêm vào constructor để gọi `invalidate()` sau mỗi lần ghi (trước đây News không đụng
 * tới sitemap cache — giống lỗ hổng `property-review.service.ts` từng có với Meilisearch).
 */
describe('NewsService', () => {
  let prisma: any;
  let seoService: any;
  let service: NewsService;

  beforeEach(() => {
    prisma = {
      news: {
        create: jest.fn(({ data }: any) => Promise.resolve({ id: 'n1', ...data })),
        findUnique: jest.fn(() => Promise.resolve(null)),
        findFirst: jest.fn(() => Promise.resolve(null)),
        findMany: jest.fn(() => Promise.resolve([])),
        count: jest.fn(() => Promise.resolve(0)),
        update: jest.fn(({ data }: any) => Promise.resolve({ id: 'n1', ...data })),
        delete: jest.fn(() => Promise.resolve({ id: 'n1' })),
      },
    };
    seoService = { invalidate: jest.fn().mockResolvedValue(undefined) };
    service = new NewsService(prisma as unknown as PrismaService, seoService);
  });

  describe('sinh slug', () => {
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
        .mockResolvedValueOnce({ id: 'n1', slug: 'tieu-de-cu', previousSlugs: [], status: 'PUBLISHED', publishedAt: new Date() }) // đọc bản ghi hiện tại
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
        status: 'PUBLISHED',
        publishedAt: new Date(),
      });

      const updated: any = await service.update('n1', { content: 'nội dung mới' });
      expect(updated.slug).toBeUndefined();
      expect(updated.previousSlugs).toBeUndefined();
    });
  });

  describe('trạng thái & hẹn giờ đăng', () => {
    it('tạo bài không gửi status -> PUBLISHED ngay, publishedAt = bây giờ', async () => {
      const before = Date.now();
      const created: any = await service.create({ title: 'Tin A', content: '<p>x</p>' });
      expect(created.status).toBe('PUBLISHED');
      expect(created.publishedAt.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('tạo bài Nháp -> publishedAt để trống, không tự gán giờ', async () => {
      const created: any = await service.create({ title: 'Tin B', content: '<p>x</p>', status: 'DRAFT' });
      expect(created.status).toBe('DRAFT');
      expect(created.publishedAt).toBeUndefined();
    });

    it('hẹn giờ tương lai -> giữ nguyên ngày admin chọn, không ép về bây giờ', async () => {
      const future = new Date(Date.now() + 86_400_000).toISOString();
      const created: any = await service.create({ title: 'Tin C', content: '<p>x</p>', status: 'PUBLISHED', publishedAt: future });
      expect(created.publishedAt.toISOString()).toBe(future);
    });

    it('sửa bài KHÔNG đụng publishedAt -> giữ nguyên ngày đăng cũ, không đẩy lên "bây giờ"', async () => {
      const original = new Date('2026-01-01T00:00:00Z');
      prisma.news.findUnique.mockResolvedValueOnce({
        id: 'n1', slug: 'tin-cu', previousSlugs: [], status: 'PUBLISHED', publishedAt: original,
      });
      const updated: any = await service.update('n1', { title: 'Tiêu đề sửa nhẹ' });
      expect(updated.publishedAt).toBeUndefined(); // không nằm trong patch -> DB giữ giá trị cũ
    });

    it('chuyển Nháp -> Xuất bản LẦN ĐẦU (chưa từng có publishedAt) -> gán bây giờ', async () => {
      prisma.news.findUnique.mockResolvedValueOnce({
        id: 'n1', slug: 'tin-nhap', previousSlugs: [], status: 'DRAFT', publishedAt: null,
      });
      const before = Date.now();
      const updated: any = await service.update('n1', { status: 'PUBLISHED' });
      expect(updated.publishedAt.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('admin gửi tường minh publishedAt mới -> luôn dùng giá trị đó (đổi lịch hẹn giờ)', async () => {
      prisma.news.findUnique.mockResolvedValueOnce({
        id: 'n1', slug: 'tin-cu', previousSlugs: [], status: 'PUBLISHED', publishedAt: new Date('2026-01-01'),
      });
      const newDate = new Date('2026-06-01T10:00:00Z').toISOString();
      const updated: any = await service.update('n1', { publishedAt: newDate });
      expect(updated.publishedAt.toISOString()).toBe(newDate);
    });
  });

  describe('ngày cập nhật công khai (contentUpdatedAt)', () => {
    it('sửa nội dung một bài ĐANG công khai -> nhích contentUpdatedAt', async () => {
      prisma.news.findUnique.mockResolvedValueOnce({
        id: 'n1', slug: 'tin-cu', previousSlugs: [], status: 'PUBLISHED', publishedAt: new Date('2026-01-01'),
      });
      const before = Date.now();
      const updated: any = await service.update('n1', { content: '<p>sửa nội dung</p>' });
      expect(updated.contentUpdatedAt.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('tích "sửa nhỏ" (minorEdit) -> KHÔNG nhích contentUpdatedAt dù có sửa nội dung', async () => {
      prisma.news.findUnique.mockResolvedValueOnce({
        id: 'n1', slug: 'tin-cu', previousSlugs: [], status: 'PUBLISHED', publishedAt: new Date('2026-01-01'),
      });
      const updated: any = await service.update('n1', { content: '<p>sửa chính tả</p>', minorEdit: true });
      expect(updated.contentUpdatedAt).toBeUndefined();
    });

    it('sửa nội dung một bài NHÁP -> không nhích contentUpdatedAt (chưa ai đọc được)', async () => {
      prisma.news.findUnique.mockResolvedValueOnce({
        id: 'n1', slug: 'tin-nhap', previousSlugs: [], status: 'DRAFT', publishedAt: null,
      });
      const updated: any = await service.update('n1', { content: '<p>sửa</p>' });
      expect(updated.contentUpdatedAt).toBeUndefined();
    });

    it('chỉ sửa trường không hiển thị (vd SEO title) -> không nhích contentUpdatedAt', async () => {
      prisma.news.findUnique.mockResolvedValueOnce({
        id: 'n1', slug: 'tin-cu', previousSlugs: [], status: 'PUBLISHED', publishedAt: new Date('2026-01-01'),
      });
      const updated: any = await service.update('n1', { seoTitle: 'Tiêu đề SEO mới' });
      expect(updated.contentUpdatedAt).toBeUndefined();
    });
  });

  describe('làm sạch nội dung & chặn ảnh nhúng thẳng', () => {
    it('nội dung chứa data: -> từ chối lưu, không âm thầm lọc bỏ rồi lưu tiếp', async () => {
      await expect(
        service.create({ title: 'x', content: '<img src="data:image/png;base64,aaa">' }),
      ).rejects.toThrow(/ảnh dán trực tiếp/);
      expect(prisma.news.create).not.toHaveBeenCalled();
    });

    it('nội dung có script -> bị lọc trước khi lưu', async () => {
      const created: any = await service.create({ title: 'x', content: '<p>a</p><script>alert(1)</script>' });
      expect(created.content).not.toContain('<script');
    });

    it('sửa bài với nội dung chứa data: cũng bị chặn', async () => {
      prisma.news.findUnique.mockResolvedValueOnce({ id: 'n1', slug: 'tin', previousSlugs: [], status: 'DRAFT' });
      await expect(
        service.update('n1', { content: '<img src="data:image/png;base64,aaa">' }),
      ).rejects.toThrow(/ảnh dán trực tiếp/);
    });
  });

  describe('chuyên mục rỗng = bỏ chuyên mục', () => {
    it('categoryId chuỗi rỗng -> ghi null, không lưu chuỗi rỗng', async () => {
      const created: any = await service.create({ title: 'x', content: '', categoryId: '' });
      expect(created.categoryId).toBeNull();
    });
  });

  describe('cập nhật sitemap sau mỗi lần ghi', () => {
    it('tạo, sửa, xoá đều gọi invalidate() — trước đây News không đụng tới sitemap cache', async () => {
      await service.create({ title: 'x', content: '' });
      expect(seoService.invalidate).toHaveBeenCalledTimes(1);

      prisma.news.findUnique.mockResolvedValueOnce({ id: 'n1', slug: 'x', previousSlugs: [], status: 'DRAFT' });
      await service.update('n1', { title: 'y' });
      expect(seoService.invalidate).toHaveBeenCalledTimes(2);

      prisma.news.findUnique.mockResolvedValueOnce({ id: 'n1' });
      await service.remove('n1');
      expect(seoService.invalidate).toHaveBeenCalledTimes(3);
    });

    it('invalidate() lỗi không được làm hỏng cả lượt lưu', async () => {
      seoService.invalidate.mockRejectedValue(new Error('cache down'));
      await expect(service.create({ title: 'x', content: '' })).resolves.toBeTruthy();
    });
  });

  describe('hiển thị công khai — chỉ bài PUBLISHED và tới giờ', () => {
    it('findPublicOne dùng where lọc status=PUBLISHED và publishedAt <= now, cả 2 nhánh id/slug lẫn previousSlugs', async () => {
      await service.findPublicOne('mot-slug');
      const firstCallWhere = prisma.news.findFirst.mock.calls[0][0].where;
      expect(firstCallWhere.status).toBe('PUBLISHED');
      expect(firstCallWhere.publishedAt).toHaveProperty('lte');

      // Không tìm thấy ở lần đầu -> thử nhánh previousSlugs, VẪN phải lọc công khai.
      prisma.news.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      await service.findPublicOne('slug-cu');
      const secondCallWhere = prisma.news.findFirst.mock.calls[3][0].where;
      expect(secondCallWhere.status).toBe('PUBLISHED');
    });

    it('findPublicOne kèm category — trang chi tiết/breadcrumb/schema.org cần tên + slug chuyên mục', async () => {
      await service.findPublicOne('mot-slug');
      const include = prisma.news.findFirst.mock.calls[0][0].include;
      expect(include.category.select).toEqual({ id: true, name: true, slug: true });
    });

    it('findPublicList giới hạn tối đa 50/trang, không cho client xin nhiều hơn', async () => {
      await service.findPublicList(1, 10_000);
      expect(prisma.news.findMany.mock.calls[0][0].take).toBe(50);
    });

    it('findPublicList KHÔNG select content — danh sách chỉ cần tóm tắt', async () => {
      await service.findPublicList(1, 20);
      const select = prisma.news.findMany.mock.calls[0][0].select;
      expect(select.content).toBeUndefined();
      expect(select.sapo).toBe(true);
    });

    it('findAdminOne/findAdminList KHÔNG lọc trạng thái — admin phải luôn thấy bài của mình', async () => {
      await service.findAdminList(1, 20);
      expect(prisma.news.findMany.mock.calls[0][0].where).toEqual({});

      await service.findAdminOne('n1');
      expect(prisma.news.findFirst.mock.calls[0][0].where).not.toHaveProperty('status');
    });
  });

  describe('bỏ qua trường không nằm trong danh sách được sửa', () => {
    it('id/createdAt gửi kèm payload không được lọt xuống Prisma — chỉ PASSTHROUGH_FIELDS mới đi qua', async () => {
      await service.create({ title: 'x', content: '', id: 'gia-mao', createdAt: '2000-01-01' });
      const dataSentToCreate = prisma.news.create.mock.calls[0][0].data;
      expect(dataSentToCreate.id).toBeUndefined();
      expect(dataSentToCreate.createdAt).toBeUndefined();
    });
  });
});
