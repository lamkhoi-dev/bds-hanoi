import { PropertyInteractionService } from './property-interaction.service';

/**
 * Bộ đếm lượt xem — khách báo 25/08 "bộ đếm view không hoạt động".
 *
 * Đo được trên site trước khi sửa: gọi `GET /properties/{id}` ba lần, cột `views` trong CSDL
 * lên 3, nhưng API vẫn trả `views: 0`. Tức bộ đếm KHÔNG hỏng (toàn site 39.641 lượt) — cái
 * hỏng là `findOne` cache bản ghi 60 giây còn hàm tăng view ghi thẳng SQL, nên suốt 60 giây
 * màn hình vẫn là con số cũ.
 *
 * Nên test khoá đúng hai điều dễ mất khi ai đó dọn code:
 *   1. Hàm tăng view phải TRẢ VỀ số mới (dùng RETURNING), không chỉ `{success:true}`.
 *   2. Vẫn phải là raw SQL — `prisma.property.update` sẽ đẩy `@updatedAt` và làm hỏng
 *      `<lastmod>` của sitemap.
 */

function makeService(rows: any) {
  const queryRaw = jest.fn().mockResolvedValue(rows);
  const update = jest.fn();
  const prisma: any = { $queryRaw: queryRaw, property: { update }, $executeRaw: jest.fn() };
  const noop: any = {};
  const service = new PropertyInteractionService(prisma, noop);
  return { service, prisma, queryRaw, update };
}

describe('incrementView', () => {
  it('trả về số lượt xem MỚI, không phải chỉ success', async () => {
    const { service } = makeService([{ views: 42 }]);
    await expect(service.incrementView('p1')).resolves.toEqual({ success: true, views: 42 });
  });

  it('dùng raw SQL — không được chuyển sang prisma.update vì sẽ đẩy @updatedAt', async () => {
    const { service, queryRaw, update } = makeService([{ views: 1 }]);
    await service.incrementView('p1');

    expect(queryRaw).toHaveBeenCalled();
    // `update` đẩy @updatedAt ⇒ <lastmod> của mọi tin đổi liên tục ⇒ Google bỏ qua lastmod.
    expect(update).not.toHaveBeenCalled();
  });

  it('SQL phải cộng dồn, không được gán đè', async () => {
    const { service, queryRaw } = makeService([{ views: 5 }]);
    await service.incrementView('p1');

    const sql = String(queryRaw.mock.calls[0][0]).replace(/\s+/g, ' ');
    expect(sql).toContain('"views" = "views" + 1');
    expect(sql).toContain('RETURNING');
  });

  it('tin không tồn tại: views = null chứ không phải 0', async () => {
    // Trả 0 sẽ khiến chỗ gọi vá đè con số thật thành 0.
    const { service } = makeService([]);
    await expect(service.incrementView('khong-co')).resolves.toEqual({ success: true, views: null });
  });

  it('BigInt từ Postgres được ép về number', async () => {
    const { service } = makeService([{ views: BigInt(7) as any }]);
    const r = await service.incrementView('p1');
    expect(r.views).toBe(7);
    expect(typeof r.views).toBe('number');
  });
});
