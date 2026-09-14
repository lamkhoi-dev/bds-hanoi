import { parsePropertyRef, parsePropertyRefList } from './news-related';

describe('parsePropertyRef', () => {
  it('mã uuid thô -> giữ nguyên (không cắt theo dấu gạch ngang cuối)', () => {
    expect(parsePropertyRef('550e8400-e29b-41d4-a716-446655440000')).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('shortCode ngắn -> giữ nguyên', () => {
    expect(parsePropertyRef('ab12c')).toBe('ab12c');
  });

  it('slug dạng mới "ten-tin-{shortCode}" -> lấy đoạn sau dấu - cuối cùng', () => {
    expect(parsePropertyRef('nha-dep-quan-1-ab12c')).toBe('ab12c');
  });

  it('slug dạng cũ "ten-tin--{uuid}" -> lấy phần sau --', () => {
    expect(parsePropertyRef('nha-dep-quan-1--550e8400-e29b-41d4-a716-446655440000')).toBe(
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });

  it('link đầy đủ -> bóc path rồi lấy mã', () => {
    expect(parsePropertyRef('https://nhadatxunghe.vn/tin/nha-dep-quan-1-ab12c')).toBe('ab12c');
  });

  it('link đầy đủ dạng uuid cũ -> vẫn ra đúng uuid', () => {
    expect(parsePropertyRef('https://nhadatxunghe.vn/tin/nha-dep--550e8400-e29b-41d4-a716-446655440000')).toBe(
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });

  it('chuỗi rỗng -> rỗng', () => {
    expect(parsePropertyRef('')).toBe('');
    expect(parsePropertyRef('   ')).toBe('');
  });
});

describe('parsePropertyRefList', () => {
  it('tách nhiều dòng, bỏ dòng rỗng, loại trùng nhưng giữ thứ tự xuất hiện đầu tiên', () => {
    const input = 'ab12c\n\nxy99z\nab12c\ncd34e';
    expect(parsePropertyRefList(input)).toEqual(['ab12c', 'xy99z', 'cd34e']);
  });

  it('cũng tách theo dấu phẩy', () => {
    expect(parsePropertyRefList('ab12c, xy99z')).toEqual(['ab12c', 'xy99z']);
  });

  it('danh sách uuid thô (resolve lại relatedPropertyIds đã lưu) -> giữ nguyên từng uuid', () => {
    const a = '550e8400-e29b-41d4-a716-446655440000';
    const b = '6f9619ff-8b86-d011-b42d-00cf4fc964ff';
    expect(parsePropertyRefList(`${a}\n${b}`)).toEqual([a, b]);
  });
});
