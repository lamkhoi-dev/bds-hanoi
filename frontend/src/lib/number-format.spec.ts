import { formatThousands, parseThousands } from './number-format';

/**
 * Khách báo 12/9: ô "Giá cụ thể" trong Kiểm duyệt tin hiện số thô `1400000000`, muốn có
 * dấu chấm phân cách hàng nghìn như `1.400.000.000`.
 */
describe('formatThousands', () => {
  it('chèn dấu chấm mỗi 3 chữ số', () => {
    expect(formatThousands(1_400_000_000)).toBe('1.400.000.000');
    expect(formatThousands(100)).toBe('100');
    expect(formatThousands(1000)).toBe('1.000');
  });

  it('nhận cả chuỗi số', () => {
    expect(formatThousands('2900000000')).toBe('2.900.000.000');
  });

  it('số âm giữ dấu trừ ở đầu, không chèn nhầm vào giữa', () => {
    expect(formatThousands(-1500)).toBe('-1.500');
  });

  it('rỗng/không hợp lệ -> chuỗi rỗng, không hiện "NaN" hay "null"', () => {
    expect(formatThousands(null)).toBe('');
    expect(formatThousands(undefined)).toBe('');
    expect(formatThousands('')).toBe('');
    expect(formatThousands('abc')).toBe('');
  });

  it('bỏ phần thập phân — ô giá/diện tích trong kiểm duyệt là số nguyên', () => {
    expect(formatThousands(100.7)).toBe('100');
  });
});

describe('parseThousands', () => {
  it('đọc ngược đúng số khi có dấu chấm', () => {
    expect(parseThousands('1.400.000.000')).toBe(1_400_000_000);
  });

  it('bỏ mọi ký tự không phải chữ số người dùng gõ xen vào (dấu phẩy, khoảng trắng)', () => {
    expect(parseThousands('1,400,000,000')).toBe(1_400_000_000);
    expect(parseThousands('1 400 000 000')).toBe(1_400_000_000);
  });

  it('giữ số âm', () => {
    expect(parseThousands('-1.500')).toBe(-1500);
  });

  it('ô trống -> null, KHÔNG phải 0 — 0 là một giá trị hợp lệ khác', () => {
    expect(parseThousands('')).toBeNull();
    expect(parseThousands('...')).toBeNull();
  });

  it('vòng tròn formatThousands -> parseThousands trả đúng số ban đầu', () => {
    for (const n of [0, 100, 1500, 1_400_000_000, 2_999_000_000]) {
      expect(parseThousands(formatThousands(n))).toBe(n);
    }
  });
});
