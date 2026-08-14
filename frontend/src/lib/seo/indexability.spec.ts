import { parseListingPath } from './route';
import { parseListingQuery } from './canonical';
import { decideIndexability, applyMode } from './indexability';
import type { RouteFacts } from './indexability';

function decide(
  segments: string[],
  searchParams: Record<string, string> = {},
  facts: Partial<RouteFacts> = {},
  redirectLegacyShape = false,
) {
  return decideIndexability({
    parse: parseListingPath(segments),
    query: parseListingQuery(searchParams),
    facts: { location: null, total: 100, ...facts },
    redirectLegacyShape,
  });
}

describe('Bảng luật indexability', () => {
  it('luật 1 — cú pháp sai thì 404', () => {
    expect(decide(['nha-rieng', '$'])).toMatchObject({ action: 'notFound' });
  });

  it('luật 2 — alias loại BĐS thì 301', () => {
    expect(decide(['ban', 'nha-mat-pho'])).toMatchObject({ action: 'redirect', to: '/ban/nha-rieng' });
  });

  it('luật 3 — khu vực không tồn tại thì 404', () => {
    expect(decide(['dat-nen', 'khong-co-that'], {}, { location: { exists: false } })).toMatchObject({
      action: 'notFound',
      reason: 'unknown-location',
    });
  });

  it('luật 4 — khu vực đã dời thì 301 sang khu vực kế nhiệm', () => {
    const d = decide(['ban', 'dat-nen', 'ten-cu'], {}, { location: { exists: true, redirectTo: 'ten-moi' } });
    expect(d).toMatchObject({ action: 'redirect', to: '/ban/dat-nen/ten-moi' });
  });

  it('luật 5 — ?page=1 thì 301 về URL không có tham số page', () => {
    expect(decide(['dat-nen'], { page: '1' })).toMatchObject({ action: 'redirect', to: '/dat-nen' });
  });

  it('luật 5 — page sai định dạng thì 301 (hết cảnh "Trang NaN")', () => {
    for (const bad of ['abc', '0', '-3', '1.5', '01']) {
      expect(decide(['dat-nen'], { page: bad })).toMatchObject({ action: 'redirect' });
    }
  });

  it('luật 5 — tham số lạ bị loại khỏi URL chuẩn', () => {
    expect(decide(['dat-nen'], { limit: '50', utm_source: 'fb' })).toMatchObject({
      action: 'redirect',
      to: '/dat-nen',
    });
  });

  it('luật 7 — trang vượt quá số trang thật thì 404', () => {
    expect(decide(['dat-nen'], { page: '99999' }, { total: 40 })).toMatchObject({
      action: 'notFound',
      reason: 'page-out-of-range',
    });
  });

  it('luật 8 — có bộ lọc thì noindex', () => {
    expect(decide(['dat-nen'], { priceRangeKey: '2B_3B' })).toMatchObject({
      action: 'noindex',
      reason: 'filtered',
    });
  });

  it('luật 9 — không có tin thì noindex chứ KHÔNG 404 (để tự lật lại khi có tin)', () => {
    expect(decide(['dat-nen', 'cau-giay'], {}, { location: { exists: true }, total: 0 })).toMatchObject({
      action: 'noindex',
      reason: 'empty',
    });
  });

  it('luật 10 — trang quá sâu thì noindex', () => {
    expect(decide(['dat-nen'], { page: '25' }, { total: 10000 })).toMatchObject({
      action: 'noindex',
      reason: 'deep-page',
    });
  });

  it('luật 11 — còn lại thì index', () => {
    expect(decide(['dat-nen', 'cau-giay'], {}, { location: { exists: true }, total: 42 })).toEqual({
      action: 'index',
    });
  });

  it('có tin trở lại thì URL từng rỗng tự index lại', () => {
    const empty = decide(['dat-nen', 'cau-giay'], {}, { location: { exists: true }, total: 0 });
    const filled = decide(['dat-nen', 'cau-giay'], {}, { location: { exists: true }, total: 1 });
    expect(empty.action).toBe('noindex');
    expect(filled.action).toBe('index');
  });

  it('URL dạng cũ chỉ 301 khi P5 bật cờ', () => {
    expect(decide(['dat-nen', 'cau-giay'], {}, { location: { exists: true } }, false)).toEqual({
      action: 'index',
    });
    expect(decide(['dat-nen', 'cau-giay'], {}, { location: { exists: true } }, true)).toMatchObject({
      action: 'redirect',
      to: '/ban/dat-nen/cau-giay',
    });
  });
});

describe('Chế độ report-only', () => {
  it('hạ 404 và 301 xuống noindex, giữ nguyên index', () => {
    expect(applyMode({ action: 'notFound', reason: 'x' }, 'report')).toMatchObject({ action: 'noindex' });
    expect(applyMode({ action: 'redirect', to: '/a', reason: 'x' }, 'report')).toMatchObject({ action: 'noindex' });
    expect(applyMode({ action: 'index' }, 'report')).toEqual({ action: 'index' });
  });

  it('chế độ enforce giữ nguyên quyết định', () => {
    expect(applyMode({ action: 'notFound', reason: 'x' }, 'enforce')).toMatchObject({ action: 'notFound' });
  });
});
