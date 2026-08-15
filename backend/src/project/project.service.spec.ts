import { ProjectService } from './project.service';

/**
 * Model Dự án (PHẦN I, mục 8-23). Ba điểm dễ sai nhất được khoá lại ở đây:
 *
 *  1. Đổi TÊN dự án không được đổi SLUG — slug chỉ sinh một lần lúc tạo, nếu không thì
 *     mỗi lần admin sửa lỗi chính tả trong tên là một lần URL đã index bị đổi.
 *  2. "4 dự án mới nhất" ở trang chủ phải xếp theo TIN MỚI NHẤT trong dự án, không phải
 *     theo ngày TẠO dự án — một dự án cũ vẫn phải nổi lên đầu nếu vừa có tin mới đăng.
 *  3. Dự án không VISIBLE thì không được cấp làm chủ địa điểm cho tin đăng.
 */

function makeService() {
  const projects = new Map<string, any>();
  let seq = 0;

  const prisma: any = {
    project: {
      findUnique: jest.fn(({ where }: any) => Promise.resolve(projects.get(where.id) ?? null)),
      findFirst: jest.fn(({ where }: any) => {
        if (where.shortCode !== undefined) {
          const hit = [...projects.values()].find(
            (p) => p.shortCode === where.shortCode && (!where.status || p.status === where.status),
          );
          return Promise.resolve(hit ?? null);
        }
        if (where.slug !== undefined) {
          return Promise.resolve([...projects.values()].find((p) => p.slug === where.slug) ?? null);
        }
        return Promise.resolve(null);
      }),
      create: jest.fn(({ data }: any) => {
        const row = { id: `p${++seq}`, ...data };
        projects.set(row.id, row);
        return Promise.resolve(row);
      }),
      update: jest.fn(({ where, data }: any) => {
        const row = { ...projects.get(where.id), ...data };
        projects.set(where.id, row);
        return Promise.resolve(row);
      }),
      findMany: jest.fn(({ where }: any) => {
        let rows = [...projects.values()];
        if (where?.id?.in) rows = rows.filter((p) => where.id.in.includes(p.id));
        return Promise.resolve(rows);
      }),
    },
    property: { groupBy: jest.fn().mockResolvedValue([]) },
  };
  const seo: any = { invalidate: jest.fn().mockResolvedValue(undefined) };
  return { service: new ProjectService(prisma, seo), prisma };
}

describe('slug và shortCode', () => {
  it('đổi tên KHÔNG đổi slug đã sinh lúc tạo', async () => {
    const { service } = makeService();
    const created = await service.create({ name: 'Vinhomes Riverside', description: 'x' } as any);
    expect(created.slug).toBe('vinhomes-riverside');

    const updated = await service.update(created.id, { name: 'Vinhomes Riverside (đã sửa lỗi)' } as any);
    expect(updated.slug).toBe('vinhomes-riverside');
  });

  it('hai dự án trùng tên vẫn ra slug khác nhau', async () => {
    const { service } = makeService();
    const a = await service.create({ name: 'Sun Grand City', description: 'x' } as any);
    const b = await service.create({ name: 'Sun Grand City', description: 'y' } as any);
    expect(a.slug).toBe('sun-grand-city');
    expect(b.slug).toBe('sun-grand-city-2');
  });

  it('shortCode duy nhất giữa các dự án', async () => {
    const { service } = makeService();
    const a = await service.create({ name: 'A', description: 'x' } as any);
    const b = await service.create({ name: 'B', description: 'x' } as any);
    expect(a.shortCode).not.toBe(b.shortCode);
  });
});

describe('tra theo shortCode', () => {
  it('chỉ trả về dự án VISIBLE', async () => {
    const { service } = makeService();
    const visible = await service.create({ name: 'Hiện', description: 'x' } as any);
    const hidden = await service.create({ name: 'Ẩn', description: 'x', status: 'HIDDEN' } as any);

    expect(await service.findByShortCode(visible.shortCode)).toMatchObject({ id: visible.id });
    expect(await service.findByShortCode(hidden.shortCode)).toBeNull();
  });
});

describe('4 dự án mới nhất cho trang chủ', () => {
  it('xếp theo TIN MỚI NHẤT trong dự án, không theo ngày tạo dự án', async () => {
    const { service, prisma } = makeService();
    const old = await service.create({ name: 'Dự án cũ', description: 'x' } as any);
    const recent = await service.create({ name: 'Dự án mới', description: 'x' } as any);

    // Dự án "cũ" lại vừa có tin mới nhất -> phải đứng TRƯỚC dự án "mới" (tạo sau nhưng
    // tin cũ hơn).
    prisma.property.groupBy.mockResolvedValue([
      { projectId: recent.id, _max: { publishedAt: new Date('2026-01-01') } },
      { projectId: old.id, _max: { publishedAt: new Date('2026-06-01') } },
    ]);

    const result = await service.findLatestForHomepage(4);
    expect(result.map((p: any) => p.id)).toEqual([old.id, recent.id]);
  });

  it('dự án chưa có tin nào thì không xuất hiện', async () => {
    const { service, prisma } = makeService();
    await service.create({ name: 'Trống', description: 'x' } as any);
    prisma.property.groupBy.mockResolvedValue([]);

    expect(await service.findLatestForHomepage(4)).toEqual([]);
  });
});
