import { groupLocations, type LocationNode } from './group';

function node(partial: Partial<LocationNode>): LocationNode {
  return { id: partial.id ?? 'x', name: partial.name ?? 'X', ...partial };
}

describe('groupLocations', () => {
  it('không quận nào có group thì trả về mảng rỗng (Nghệ An: 0/738)', () => {
    const locations = [node({ id: '1', name: 'A' }), node({ id: '2', name: 'B' })];
    expect(groupLocations(locations)).toEqual([]);
  });

  it('mảng rỗng đầu vào thì trả về mảng rỗng', () => {
    expect(groupLocations([])).toEqual([]);
  });

  it('gom đúng theo group, giữ đúng thứ tự groupOrder (Hà Nội: 30 quận, 3 nhóm)', () => {
    const locations = [
      node({ id: '1', name: 'Sóc Sơn', group: 'Ngoại thành', groupOrder: 3 }),
      node({ id: '2', name: 'Cầu Giấy', group: 'Trung tâm', groupOrder: 1 }),
      node({ id: '3', name: 'Long Biên', group: 'Cận trung tâm', groupOrder: 2 }),
      node({ id: '4', name: 'Hoàn Kiếm', group: 'Trung tâm', groupOrder: 1 }),
    ];
    const groups = groupLocations(locations);
    expect(groups.map((g) => g.label)).toEqual(['Trung tâm', 'Cận trung tâm', 'Ngoại thành']);
    expect(groups[0].items.map((i) => i.name)).toEqual(['Cầu Giấy', 'Hoàn Kiếm']);
  });

  it('lẫn lộn có group và không group thì chỉ nhóm mục có group', () => {
    const locations = [
      node({ id: '1', name: 'Có nhóm', group: 'Trung tâm', groupOrder: 1 }),
      node({ id: '2', name: 'Không nhóm', group: null }),
      node({ id: '3', name: 'Không khai group' }),
    ];
    const groups = groupLocations(locations);
    expect(groups).toHaveLength(1);
    expect(groups[0].items.map((i) => i.name)).toEqual(['Có nhóm']);
  });
});
