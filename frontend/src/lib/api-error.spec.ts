import { getApiErrorMessage } from './api-error';

/**
 * Khách báo 12/9: "không đăng được tin tức trên PC" — nguyên nhân là lỗi 413, nhưng người
 * dùng chỉ thấy toast chung chung "Lỗi khi đăng bài viết" nên không biết phải làm gì.
 */
describe('getApiErrorMessage', () => {
  it('413 -> chỉ đúng hướng khắc phục (dùng nút Chèn ảnh), không phải câu chung chung', () => {
    const msg = getApiErrorMessage({ response: { status: 413 } }, 'Lỗi khi đăng bài viết');
    expect(msg).toContain('Chèn ảnh');
    expect(msg).not.toBe('Lỗi khi đăng bài viết');
  });

  it('có message thật từ máy chủ (chuỗi) -> dùng message đó', () => {
    const msg = getApiErrorMessage({ response: { status: 400, data: { message: 'Tiêu đề không được để trống' } } }, 'fallback');
    expect(msg).toBe('Tiêu đề không được để trống');
  });

  it('message là mảng (ValidationPipe) -> nối lại thành một câu', () => {
    const msg = getApiErrorMessage({ response: { status: 400, data: { message: ['Lỗi A', 'Lỗi B'] } } }, 'fallback');
    expect(msg).toBe('Lỗi A, Lỗi B');
  });

  it('lỗi mạng (không có response) -> báo mất kết nối, không phải câu fallback chung', () => {
    const msg = getApiErrorMessage({ message: 'Network Error' }, 'fallback');
    expect(msg).toContain('kết nối');
  });

  it('không nhận diện được gì -> trả về đúng câu fallback được truyền vào', () => {
    expect(getApiErrorMessage({}, 'Lỗi không xác định')).toBe('Lỗi không xác định');
    expect(getApiErrorMessage(new Error('vỡ đâu đó'), 'Lỗi không xác định')).toBe('Lỗi không xác định');
  });
});
