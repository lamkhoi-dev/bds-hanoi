import { groupDistrictsByProvince } from './group-by-province';

/**
 * Khách 25/08: "/khu-vuc sắp xếp lại các huyện, tp, tx Nghệ An, sau đó là của Hà Tĩnh
 * (hiện đang để lẫn nhau)".
 */

const NAMES: Record<string, string> = { 'nghe-an': 'Nghệ An', 'ha-tinh': 'Hà Tĩnh' };
const nameOf = (s: string) => NAMES[s];
const ORDER = ['nghe-an', 'ha-tinh'];

const DISTRICTS = [
  { slug: 'thanh-pho-ha-tinh', name: 'Thành phố Hà Tĩnh', parent: 'ha-tinh' },
  { slug: 'thanh-pho-vinh', name: 'Thành phố Vinh', parent: 'nghe-an' },
  { slug: 'huyen-can-loc', name: 'Huyện Can Lộc', parent: 'ha-tinh' },
  { slug: 'huyen-dien-chau', name: 'Huyện Diễn Châu', parent: 'nghe-an' },
];

describe('groupDistrictsByProvince', () => {
  it('Nghệ An đứng trước Hà Tĩnh, theo thứ tự khai chứ không theo bảng chữ cái', () => {
    const g = groupDistrictsByProvince(DISTRICTS, nameOf, ORDER);
    expect(g.map((x) => x.slug)).toEqual(['nghe-an', 'ha-tinh']);
    // Theo bảng chữ cái thì "Hà Tĩnh" đứng trước "Nghệ An" — đó chính là bản cũ làm sai.
    expect(g[0].name).toBe('Nghệ An');
  });

  it('không còn trộn lẫn: mỗi nhóm chỉ chứa huyện của tỉnh mình', () => {
    const g = groupDistrictsByProvince(DISTRICTS, nameOf, ORDER);
    expect(g[0].districts.map((d) => d.slug)).toEqual(['huyen-dien-chau', 'thanh-pho-vinh']);
    expect(g[1].districts.map((d) => d.slug)).toEqual(['huyen-can-loc', 'thanh-pho-ha-tinh']);
  });

  it('không mất huyện nào', () => {
    const g = groupDistrictsByProvince(DISTRICTS, nameOf, ORDER);
    expect(g.reduce((n, x) => n + x.districts.length, 0)).toBe(DISTRICTS.length);
  });

  it('huyện thiếu tỉnh cha vẫn hiện, xếp cuối — không được im lặng nuốt mất', () => {
    const g = groupDistrictsByProvince(
      [...DISTRICTS, { slug: 'la-lung', name: 'Huyện Lạ Lùng' }],
      nameOf,
      ORDER,
    );
    expect(g).toHaveLength(3);
    expect(g[2].districts.map((d) => d.slug)).toEqual(['la-lung']);
    expect(g.reduce((n, x) => n + x.districts.length, 0)).toBe(5);
  });

  it('site một tỉnh (Hà Nội) ra đúng một nhóm — không đổi hành vi bên đó', () => {
    const g = groupDistrictsByProvince(
      [{ slug: 'gia-lam', name: 'Gia Lâm', parent: 'ha-noi' }],
      () => 'Hà Nội',
      ['ha-noi'],
    );
    expect(g).toHaveLength(1);
    expect(g[0].name).toBe('Hà Nội');
  });

  it('sắp tên trong nhóm theo tiếng Việt', () => {
    const g = groupDistrictsByProvince(
      [
        { slug: 'b', name: 'Huyện Đô Lương', parent: 'nghe-an' },
        { slug: 'a', name: 'Huyện Anh Sơn', parent: 'nghe-an' },
      ],
      nameOf,
      ORDER,
    );
    expect(g[0].districts.map((d) => d.name)).toEqual(['Huyện Anh Sơn', 'Huyện Đô Lương']);
  });
});
