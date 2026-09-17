import { NewsRelatedService } from './news-related.service';

/**
 * Khách báo 16/9: bài đang đọc lại xuất hiện trong "bài viết liên quan" của CHÍNH NÓ.
 * Gốc lỗi: `{ ...baseWhere, id: { notIn: [...] } }` — spread rồi ghi đè cùng khoá `id`,
 * làm mất điều kiện `not: excludeId` của `baseWhere`. Test dưới đây khoá đúng hành vi đã sửa.
 */
function makeService() {
  const news: any = { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]) };
  const property: any = { findMany: jest.fn().mockResolvedValue([]) };
  const prisma: any = { news, property };
  return { service: new NewsRelatedService(prisma), prisma, news, property };
}

describe('findRelated — bài viết liên quan', () => {
  it('bài không có chuyên mục (categoryId null) -> truy vấn bù (filler) vẫn phải loại trừ chính bài đang đọc', async () => {
    const { service, news } = makeService();
    news.findUnique.mockResolvedValue({ categoryId: null, relatedPropertyIds: [] });
    news.findMany.mockResolvedValue([{ id: 'other-1' }, { id: 'other-2' }]);

    await service.findRelated('current-article-id');

    const fillerWhere = news.findMany.mock.calls[0][0].where;
    // Đây chính là ca sinh lỗi: categoryId null -> sameCategory=[] -> gọi filler ngay lần
    // findMany ĐẦU TIÊN — id phải vừa loại current-article-id vừa (rỗng) sameCategory ids.
    expect(fillerWhere.id.notIn).toContain('current-article-id');
  });

  it('có chuyên mục nhưng chưa đủ 2 bài -> truy vấn bù cũng phải loại cả chính bài đang đọc LẪN các id đã lấy được', async () => {
    const { service, news } = makeService();
    news.findUnique.mockResolvedValue({ categoryId: 'cat-1', relatedPropertyIds: [] });
    news.findMany.mockResolvedValueOnce([{ id: 'same-cat-1' }]); // chỉ 1, chưa đủ take=2

    await service.findRelated('current-article-id');

    expect(news.findMany).toHaveBeenCalledTimes(2);
    const fillerWhere = news.findMany.mock.calls[1][0].where;
    expect(fillerWhere.id.notIn).toEqual(expect.arrayContaining(['current-article-id', 'same-cat-1']));
  });

  it('lấy đúng 2 bài (không phải 4) — khách chốt 16/9 rút gọn khối liên quan', async () => {
    const { service, news } = makeService();
    news.findUnique.mockResolvedValue({ categoryId: null, relatedPropertyIds: [] });
    news.findMany.mockResolvedValue([]);

    await service.findRelated('current-article-id');

    expect(news.findMany.mock.calls[0][0].take).toBe(2);
  });

  it('có chuyên mục và đủ 2 bài cùng chuyên mục -> KHÔNG gọi truy vấn bù nữa', async () => {
    const { service, news } = makeService();
    news.findUnique.mockResolvedValue({ categoryId: 'cat-1', relatedPropertyIds: [] });
    news.findMany.mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }]);

    await service.findRelated('current-article-id');

    expect(news.findMany).toHaveBeenCalledTimes(1);
  });
});

describe('findRelated — BĐS liên quan', () => {
  it('chỉ bù bằng tier VIP — khách chốt 16/9 bỏ UP khỏi nguồn tự động', async () => {
    const { service, news, property } = makeService();
    news.findUnique.mockResolvedValue({ categoryId: null, relatedPropertyIds: [] });

    await service.findRelated('current-article-id');

    const vipCall = property.findMany.mock.calls[0][0];
    expect(vipCall.where.tier).toBe('VIP');
  });
});
