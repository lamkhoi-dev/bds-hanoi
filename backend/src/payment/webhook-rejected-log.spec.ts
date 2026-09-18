import { PaymentService } from './payment.service';
import { CryptoService } from '../shared/crypto.service';

/**
 * Khách báo 15-18/9: "quét QR chuyển khoản được nhưng không cộng tiền" và `PaymentWebhookLog`
 * trống từ 10/7. Webhook bị TỪ CHỐI xác thực trước đây chỉ `logger.warn` ra stdout (mất khi
 * deploy) nên không thể phân biệt "SePay không gọi tới" với "SePay gọi nhưng token lệch".
 * Các test dưới đây khoá việc nay phải để lại dấu vết bền vững — và không lộ token.
 */
const TOKEN = 'AbCdEf0123456789AbCdEf0123456789AbCdEf';

function makeService() {
  const crypto = new CryptoService();
  const upsert = jest.fn().mockResolvedValue({});
  const prisma: any = {
    systemSettings: {
      findUnique: jest.fn().mockResolvedValue({ sepayWebhookToken: crypto.encrypt(TOKEN) }),
    },
    paymentWebhookLog: { upsert },
  };
  return { service: new PaymentService(prisma, crypto), upsert };
}

const payload = { id: 777, transferAmount: 50000, content: 'NAP abc', transferType: 'in' };

describe('processSePayWebhook — webhook bị từ chối xác thực để lại dấu vết', () => {
  it('sai token -> trả success:false VÀ ghi 1 dòng UNAUTHORIZED', async () => {
    const { service, upsert } = makeService();
    const res = await service.processSePayWebhook('Apikey SAI-TOKEN', payload, { ip: '1.2.3.4', userAgent: 'SePay' });

    expect(res).toEqual({ success: false, message: 'Token không hợp lệ' });
    expect(upsert).toHaveBeenCalledTimes(1);
    const arg = upsert.mock.calls[0][0];
    expect(arg.create.status).toBe('UNAUTHORIZED');
    expect(arg.create.referenceId).toMatch(/^UNAUTH-\d+$/);
    expect(arg.create.reason).toContain('ip=1.2.3.4');
  });

  it('KHÔNG có header Authorization -> ghi rõ "KHÔNG CÓ" (SePay cấu hình kiểu không chứng thực?)', async () => {
    const { service, upsert } = makeService();
    await service.processSePayWebhook(undefined as any, payload);

    expect(upsert.mock.calls[0][0].create.reason).toContain('header=KHÔNG CÓ');
  });

  it('ghi kiểu chứng thực SePay gửi (vd Bearer thay vì Apikey) để biết cấu hình lệch ở đâu', async () => {
    const { service, upsert } = makeService();
    await service.processSePayWebhook('Bearer abcdef', payload);

    expect(upsert.mock.calls[0][0].create.reason).toContain('kiểu=bearer');
  });

  it('nhận đúng độ dài nhưng sai nội dung -> ghi "khớp độ dài = true" (gợi ý token cũ/lệch một ký tự)', async () => {
    const { service, upsert } = makeService();
    await service.processSePayWebhook(`Apikey ${'x'.repeat(TOKEN.length)}`, payload);

    expect(upsert.mock.calls[0][0].create.reason).toContain('khớp độ dài token cấu hình=true');
  });

  it('TUYỆT ĐỐI không ghi giá trị token — cả token nhận được lẫn token cấu hình', async () => {
    const { service, upsert } = makeService();
    await service.processSePayWebhook('Apikey BI-MAT-KHONG-DUOC-GHI', payload);

    const serialized = JSON.stringify(upsert.mock.calls[0][0]);
    expect(serialized).not.toContain('BI-MAT-KHONG-DUOC-GHI');
    expect(serialized).not.toContain(TOKEN);
  });

  it('gọi lại trong cùng cửa sổ 5 phút -> CÙNG một referenceId (upsert, không nhồi thêm dòng)', async () => {
    const { service, upsert } = makeService();
    await service.processSePayWebhook('Apikey a', payload);
    await service.processSePayWebhook('Apikey b', payload);

    expect(upsert.mock.calls[0][0].where.referenceId).toBe(upsert.mock.calls[1][0].where.referenceId);
    expect(upsert.mock.calls[1][0].update.retryCount).toEqual({ increment: 1 });
  });

  it('payload khổng lồ bị cắt còn 4KB — route công khai không cho nhồi đầy bảng', async () => {
    const { service, upsert } = makeService();
    await service.processSePayWebhook('Apikey a', { ...payload, junk: 'x'.repeat(100_000) });

    expect(upsert.mock.calls[0][0].create.payload.length).toBeLessThanOrEqual(4096);
  });

  it('ghi log lỗi (DB hỏng) KHÔNG làm hỏng phản hồi webhook', async () => {
    const { service, upsert } = makeService();
    upsert.mockRejectedValue(new Error('db down'));

    await expect(service.processSePayWebhook('Apikey a', payload)).resolves.toEqual({
      success: false,
      message: 'Token không hợp lệ',
    });
  });

  it('token ĐÚNG -> không ghi dòng UNAUTHORIZED nào', async () => {
    const { service, upsert } = makeService();
    // transferType 'out' -> thoát sớm sau xác thực, không cần dựng thêm mock giao dịch.
    await service.processSePayWebhook(`Apikey ${TOKEN}`, { ...payload, transferType: 'out' });

    const unauthorized = upsert.mock.calls.filter((c) => String(c[0]?.where?.referenceId).startsWith('UNAUTH-'));
    expect(unauthorized).toHaveLength(0);
  });
});
