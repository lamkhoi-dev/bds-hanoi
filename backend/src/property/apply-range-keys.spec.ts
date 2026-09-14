import { applyRangeKeys } from './property-utils';

/**
 * Khách rà lỗi 12/9: "Trong mục kiểm duyệt tin, gõ Giá cụ thể 1,4 tỷ nhưng ô Khoảng giá vẫn
 * ghi 2-3 tỷ". Chốt với khách: GIÁ/DIỆN TÍCH CỤ THỂ luôn thắng — nhãn khoảng phải tự tính
 * lại theo con số cụ thể, không được giữ nguyên nhãn người đăng tự chọn nếu nó lệch.
 */
describe('applyRangeKeys — giá/diện tích cụ thể luôn thắng nhãn khoảng lệch', () => {
  it('giá 1,4 tỷ nhưng chọn nhãn 2B_3B -> tự sửa lại nhãn theo giá thật (1B_2B)', () => {
    const data: any = { price: 1_400_000_000, priceRangeKey: '2B_3B', transactionType: 'BAN' };
    applyRangeKeys(data);
    expect(data.priceRangeKey).toBe('1B_2B');
    expect(data.priceMin).toBe(1_000_000_000);
    expect(data.priceMax).toBe(2_000_000_000);
  });

  it('diện tích 95m² nhưng chọn nhãn 50_80 -> tự sửa lại theo diện tích thật (80_100)', () => {
    const data: any = { area: 95, areaRangeKey: '50_80' };
    applyRangeKeys(data);
    expect(data.areaRangeKey).toBe('80_100');
    expect(data.areaMin).toBe(80);
    expect(data.areaMax).toBe(100);
  });

  it('giá đúng mốc 2 tỷ -> quy ước về khoảng ĐẦU TIÊN chứa nó (1B_2B)', () => {
    const data: any = { price: 2_000_000_000, transactionType: 'BAN' };
    applyRangeKeys(data);
    expect(data.priceRangeKey).toBe('1B_2B');
  });

  it('giá cụ thể khớp sẵn với nhãn thì không đổi gì', () => {
    const data: any = { price: 1_500_000_000, priceRangeKey: '1B_2B', transactionType: 'BAN' };
    applyRangeKeys(data);
    expect(data.priceRangeKey).toBe('1B_2B');
  });

  it('tin thoả thuận (isNegotiable) không bị suy nhãn từ giá — vốn không có giá thật', () => {
    const data: any = { price: 1_400_000_000, priceRangeKey: 'THOA_THUAN', isNegotiable: true, transactionType: 'BAN' };
    applyRangeKeys(data);
    expect(data.priceRangeKey).toBe('THOA_THUAN');
    expect(data.price).toBeNull();
  });

  it('tin cho thuê tính theo bảng giá thuê, không lẫn bảng giá bán', () => {
    const data: any = { price: 2_000_000, priceRangeKey: '1B_2B', transactionType: 'CHO_THUE' };
    applyRangeKeys(data);
    expect(data.priceRangeKey).toBe('1M_3M');
  });

  it('không có giá cụ thể (chỉ chọn nhãn) -> giữ nguyên nhãn, tính lại biên như cũ', () => {
    const data: any = { priceRangeKey: '2B_3B', transactionType: 'BAN' };
    applyRangeKeys(data);
    expect(data.priceRangeKey).toBe('2B_3B');
    expect(data.priceMin).toBe(2_000_000_000);
    expect(data.priceMax).toBe(3_000_000_000);
  });
});
