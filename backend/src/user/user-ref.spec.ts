import { parseUserRef } from './user-ref';

/**
 * Link người đăng quá dài — khách báo 12/9: "Sửa link user bị dài thành link slug ngắn
 * (đoạn id cuối cùng của link)". Cùng quy ước tách với tin đăng (`parseListingRef`).
 */
describe('parseUserRef', () => {
  it('URL mới {tên}-{shortCode} — lấy đoạn sau dấu gạch CUỐI CÙNG', () => {
    expect(parseUserRef('nguyen-van-a-1a2b3')).toBe('1a2b3');
  });

  it('tên nhiều dấu gạch vẫn lấy đúng shortCode ở cuối', () => {
    expect(parseUserRef('tran-thi-b-moi-gioi-bds-9z8y7')).toBe('9z8y7');
  });

  it('URL cũ {tên}-{uuid} — nhận ra UUID dù đứng sau bao nhiêu dấu gạch', () => {
    expect(parseUserRef('nguyen-van-a-550e8400-e29b-41d4-a716-446655440000')).toBe(
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });

  it('URL cũ dạng {tên}--{uuid} (hai gạch) vẫn nhận ra UUID', () => {
    expect(parseUserRef('nguyen-van-a--550e8400-e29b-41d4-a716-446655440000')).toBe(
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });

  it('không có tên, chỉ có mã trần — trả nguyên chuỗi', () => {
    expect(parseUserRef('1a2b3')).toBe('1a2b3');
  });

  it('chuỗi rỗng -> rỗng, không ném lỗi', () => {
    expect(parseUserRef('')).toBe('');
  });
});
