import { newsBreadcrumb } from './breadcrumb';

describe('newsBreadcrumb', () => {
  it('có chuyên mục -> Tin tức › Chuyên mục › Bài viết', () => {
    expect(newsBreadcrumb({ title: 'Bài viết A', category: { name: 'Thị trường', slug: 'thi-truong' } })).toEqual([
      { name: 'Tin tức', url: '/news' },
      { name: 'Thị trường', url: '/news/chuyen-muc/thi-truong' },
      { name: 'Bài viết A' },
    ]);
  });

  it('không có chuyên mục -> bỏ qua cấp đó, không hiện mục trống', () => {
    expect(newsBreadcrumb({ title: 'Bài viết B' })).toEqual([
      { name: 'Tin tức', url: '/news' },
      { name: 'Bài viết B' },
    ]);
  });

  it('category null (rõ ràng không có, khác undefined) -> vẫn bỏ qua', () => {
    expect(newsBreadcrumb({ title: 'Bài viết C', category: null })).toEqual([
      { name: 'Tin tức', url: '/news' },
      { name: 'Bài viết C' },
    ]);
  });
});
