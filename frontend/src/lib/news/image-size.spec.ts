import { checkFeaturedImageSize } from './image-size';

describe('checkFeaturedImageSize', () => {
  it('1200×675 (đúng khuyến nghị) -> ok', () => {
    expect(checkFeaturedImageSize(1200, 675)).toEqual({ ok: true, message: null });
  });

  it('lớn hơn khuyến nghị, đúng tỷ lệ 16:9 -> ok', () => {
    expect(checkFeaturedImageSize(1920, 1080)).toEqual({ ok: true, message: null });
  });

  it('800×450 (khuyến nghị CŨ trước 12/9) -> cảnh báo nhỏ hơn mức mới', () => {
    const r = checkFeaturedImageSize(800, 450);
    expect(r.ok).toBe(false);
    expect(r.message).toContain('800×450');
  });

  it('đủ lớn nhưng sai tỷ lệ (vuông) -> cảnh báo tỷ lệ', () => {
    const r = checkFeaturedImageSize(1200, 1200);
    expect(r.ok).toBe(false);
    expect(r.message).toContain('tỷ lệ');
  });

  it('thiếu width/height (chưa tải xong hoặc API cũ không trả) -> không chặn, coi như ok', () => {
    expect(checkFeaturedImageSize(undefined, undefined)).toEqual({ ok: true, message: null });
    expect(checkFeaturedImageSize(1200, null)).toEqual({ ok: true, message: null });
  });
});
