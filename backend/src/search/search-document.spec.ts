import { normalizeSearchDocument } from './search-document';

/**
 * Chặn tái phát lỗi khách báo 25/08: lọc khoảng giá trả về 0 tin ở MỌI khoảng.
 *
 * Meilisearch không báo lỗi khi so sánh số với một trường lưu dạng chuỗi — nó chỉ lặng lẽ
 * trả 0 kết quả. Nên lỗi này không thể lộ ra ở tầng gọi API; phải canh ngay tại chỗ dựng
 * tài liệu đẩy vào chỉ mục.
 */
describe('normalizeSearchDocument', () => {
  // Prisma `Decimal` serialize sang JSON thành chuỗi — đây là hình dạng thật của dữ liệu
  // lấy từ chỉ mục production ngày 05/09.
  const fromPrisma = {
    id: 'abc',
    price: '2092578154',
    priceMin: '2000000000',
    priceMax: '2999000000',
    area: 120,
    areaMin: 100,
    areaMax: 150,
    pricePerM2: 17438151.28,
    status: 'APPROVED',
  };

  it('ép mọi trường lọc theo khoảng về SỐ — chuỗi thì Meilisearch không so sánh được', () => {
    const doc = normalizeSearchDocument(fromPrisma);
    for (const field of ['price', 'priceMin', 'priceMax', 'area', 'areaMin', 'areaMax', 'pricePerM2']) {
      expect(typeof doc[field]).toBe('number');
    }
    // Ép kiểu không được làm sai giá trị.
    expect(doc.price).toBe(2092578154);
    expect(doc.priceMin).toBe(2000000000);
    expect(doc.priceMax).toBe(2999000000);
  });

  it('tin thoả thuận (không có giá) ra null, không ra 0 — 0 sẽ lọt vào khoảng "dưới 500tr"', () => {
    const doc = normalizeSearchDocument({ ...fromPrisma, price: null, priceMin: null, priceMax: null });
    expect(doc.price).toBeNull();
    expect(doc.priceMin).toBeNull();
    expect(doc.priceMax).toBeNull();
  });

  it('chuỗi rỗng cũng ra null, không ra 0', () => {
    // `Number('')` là 0 — đúng cái bẫy làm tin không giá rơi vào khoảng rẻ nhất.
    const doc = normalizeSearchDocument({ ...fromPrisma, price: '', areaMin: '' });
    expect(doc.price).toBeNull();
    expect(doc.areaMin).toBeNull();
  });

  it('giá trị rác ra null chứ không ra NaN — NaN vào chỉ mục là hỏng cả tin', () => {
    const doc = normalizeSearchDocument({ ...fromPrisma, price: 'không rõ' });
    expect(doc.price).toBeNull();
  });

  it('ngày vẫn ra mốc thời gian dạng số để sắp xếp được', () => {
    const doc = normalizeSearchDocument({ ...fromPrisma, publishedAt: '2026-08-15T06:44:02.964Z' });
    expect(doc.publishedAt).toBe(new Date('2026-08-15T06:44:02.964Z').getTime());
  });

  it('giữ nguyên các trường không đụng tới', () => {
    const doc = normalizeSearchDocument({ ...fromPrisma, title: 'Bán đất TP Vinh' });
    expect(doc.title).toBe('Bán đất TP Vinh');
    expect(doc.id).toBe('abc');
  });

  it('xếp hạng tier: tin đã bán tụt xuống cuối', () => {
    expect(normalizeSearchDocument({ status: 'SOLD', tier: 'VIP' }).tierRank).toBe(0);
    expect(normalizeSearchDocument({ status: 'APPROVED', tier: 'VIP' }).tierRank).toBe(3);
    expect(normalizeSearchDocument({ status: 'APPROVED', tier: 'UP' }).tierRank).toBe(2);
    expect(normalizeSearchDocument({ status: 'APPROVED' }).tierRank).toBe(1);
  });
});
