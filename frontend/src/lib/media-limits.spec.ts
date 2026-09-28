import { MAX_MEDIA_BYTES, mediaBudgetError, formatMegabytes, videoUploadErrorMessage } from './media-limits';

const MB = 1024 * 1024;

describe('mediaBudgetError', () => {
  it('vừa đủ 100MB thì cho qua', () => {
    expect(mediaBudgetError(40 * MB, 60 * MB)).toBeNull();
  });

  it('vượt 100MB thì báo còn bao nhiêu và file này bao nhiêu', () => {
    const msg = mediaBudgetError(40 * MB, 61 * MB);
    expect(msg).toContain('100MB');
    expect(msg).toContain('còn 60MB');
    expect(msg).toContain('61MB');
  });

  it('đã đầy thì báo còn 0MB, không âm', () => {
    expect(mediaBudgetError(MAX_MEDIA_BYTES + 5 * MB, MB)).toContain('còn 0.0MB');
  });
});

describe('formatMegabytes', () => {
  it('dưới 10MB giữ 1 số lẻ, từ 10MB làm tròn', () => {
    expect(formatMegabytes(2.5 * MB)).toBe('2.5MB');
    expect(formatMegabytes(37.4 * MB)).toBe('37MB');
  });
});

describe('videoUploadErrorMessage', () => {
  it('413 = vượt dung lượng', () => {
    expect(videoUploadErrorMessage({ response: { status: 413 } })).toContain('100MB');
  });

  it('ưu tiên câu lỗi máy chủ trả về (kể cả dạng mảng của ValidationPipe)', () => {
    expect(videoUploadErrorMessage({ response: { status: 400, data: { message: 'Chỉ hỗ trợ video MP4, MOV hoặc WebM.' } } }))
      .toBe('Chỉ hỗ trợ video MP4, MOV hoặc WebM.');
    expect(videoUploadErrorMessage({ response: { status: 400, data: { message: ['lỗi 1', 'lỗi 2'] } } })).toBe('lỗi 1');
  });

  it('hết giờ (ECONNABORTED) và lỗi lạ đều có câu tiếng Việt', () => {
    expect(videoUploadErrorMessage({ code: 'ECONNABORTED' })).toContain('quá lâu');
    expect(videoUploadErrorMessage(new Error('boom'))).toBe('Không tải được video. Vui lòng thử lại.');
  });
});
