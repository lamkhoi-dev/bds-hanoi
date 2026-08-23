import {
  depositPrefix,
  buildDepositContent,
  parseDepositToken,
  matchesPrefix,
} from './deposit-prefix';

/**
 * Tiền tố nội dung chuyển khoản cho việc 2 site dùng CHUNG một tài khoản ngân hàng.
 *
 * Đây là code đụng tiền thật nên test bám vào hai điều: (1) khi chưa bật, mọi hành vi phải
 * y hệt trước — bật nhầm/quên tắt không được làm rơi giao dịch nào của Nghệ An; (2) khi bật,
 * giao dịch của site kia bị bỏ qua chứ không bị hiểu nhầm thành user id.
 */

const UID = 'a1b2c3d4e5f6';

describe('depositPrefix — đọc cấu hình', () => {
  it('mặc định rỗng: chưa cấu hình thì không đổi gì', () => {
    expect(depositPrefix(undefined)).toBe('');
    expect(depositPrefix('')).toBe('');
    expect(depositPrefix('   ')).toBe('');
  });

  it('chuẩn hoá về chữ hoa', () => {
    expect(depositPrefix('hn')).toBe('HN');
    expect(depositPrefix(' Hn ')).toBe('HN');
  });

  it('giá trị bậy bị bỏ qua thay vì làm hỏng nội dung chuyển khoản', () => {
    expect(depositPrefix('HN-01')).toBe('');
    expect(depositPrefix('quá-dài-quá-dài')).toBe('');
    expect(depositPrefix('HN 1')).toBe('');
  });
});

describe('buildDepositContent', () => {
  it('không tiền tố -> y hệt định dạng cũ `NAP {id}`', () => {
    expect(buildDepositContent(UID, '')).toBe(`NAP ${UID}`);
  });

  it('có tiền tố -> `NAP HN{id}`', () => {
    expect(buildDepositContent(UID, 'HN')).toBe(`NAP HN${UID}`);
  });

  it('bỏ gạch nối của uuid như trước, và cắt 50 ký tự', () => {
    const uuid = '11111111-2222-3333-4444-555555555555';
    expect(buildDepositContent(uuid, '')).toBe('NAP 11111111222233334444555555555555');
    expect(buildDepositContent(uuid, 'HN').length).toBeLessThanOrEqual(50);
  });
});

describe('parseDepositToken — chỗ dễ làm rơi tiền nhất', () => {
  it('site không tiền tố nhận mọi nội dung đúng cú pháp (hành vi Nghệ An hiện tại)', () => {
    expect(parseDepositToken(`NAP ${UID}`, '')).toEqual({ token: UID });
    expect(parseDepositToken(`nap${UID}`, '')).toEqual({ token: UID });
    // Kể cả nội dung của site kia — vì site này không bật phân biệt thì không được tự loại.
    expect(parseDepositToken(`NAP HN${UID}`, '')).toEqual({ token: `HN${UID}` });
  });

  it('site có tiền tố: bóc đúng tiền tố, KHÔNG nuốt nó vào user id', () => {
    // Đây chính là lỗi nếu chỉ thêm "HN" mà quên sửa regex: token thành "HN" + id -> tra
    // không thấy user -> mất giao dịch.
    expect(parseDepositToken(`NAP HN${UID}`, 'HN')).toEqual({ token: UID });
    expect(parseDepositToken(`nap hn${UID}`, 'HN')).toEqual({ token: UID });
  });

  it('site có tiền tố: nội dung KHÔNG mang tiền tố đó thì trả null (của site khác)', () => {
    expect(parseDepositToken(`NAP ${UID}`, 'HN')).toBeNull();
  });

  it('sai cú pháp thì null', () => {
    expect(parseDepositToken('chuyen tien', 'HN')).toBeNull();
    expect(parseDepositToken('', '')).toBeNull();
    expect(parseDepositToken(undefined as any, '')).toBeNull();
  });

  it('chỉ có mỗi tiền tố, không có id -> null chứ không trả chuỗi rỗng', () => {
    expect(parseDepositToken('NAP HN', 'HN')).toBeNull();
  });
});

describe('matchesPrefix — quyết định bỏ qua im lặng hay ghi FAILED', () => {
  it('không bật tiền tố thì nhận tất, không bỏ qua gì', () => {
    expect(matchesPrefix(`NAP ${UID}`, '')).toBe(true);
    expect(matchesPrefix('rác', '')).toBe(true);
  });

  it('bật rồi: của mình true, của site khác false', () => {
    expect(matchesPrefix(`NAP HN${UID}`, 'HN')).toBe(true);
    expect(matchesPrefix(`NAP ${UID}`, 'HN')).toBe(false);
  });

  it('sai cú pháp thì false để còn ghi FAILED', () => {
    expect(matchesPrefix('chuyen tien', 'HN')).toBe(false);
  });
});
