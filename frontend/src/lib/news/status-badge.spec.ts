import { newsStatusBadge } from './status-badge';

describe('newsStatusBadge', () => {
  it('DRAFT -> Nháp', () => {
    expect(newsStatusBadge('DRAFT').label).toBe('Nháp');
  });

  it('HIDDEN -> Đã ẩn', () => {
    expect(newsStatusBadge('HIDDEN').label).toBe('Đã ẩn');
  });

  it('PUBLISHED với publishedAt trong quá khứ -> Đã đăng', () => {
    expect(newsStatusBadge('PUBLISHED', new Date(Date.now() - 1000).toISOString()).label).toBe('Đã đăng');
  });

  it('PUBLISHED với publishedAt tương lai -> Hẹn giờ (khác "Đã đăng" dù CSDL cùng là PUBLISHED)', () => {
    const future = new Date(Date.now() + 3600_000).toISOString();
    expect(newsStatusBadge('PUBLISHED', future).label).toBe('Hẹn giờ');
  });

  it('PUBLISHED không kèm publishedAt -> vẫn coi là Đã đăng, không vỡ', () => {
    expect(newsStatusBadge('PUBLISHED', null).label).toBe('Đã đăng');
  });
});
