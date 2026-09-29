import { AuthService } from './auth.service';
import { BadRequestException, ConflictException } from '@nestjs/common';

/**
 * `updatePhoneDirect` — cập nhật SĐT trong Cài đặt tài khoản KHÔNG bắt xác thực OTP (khách
 * yêu cầu 29/9, sau khi ẩn nút đổi SĐT bằng Firebase OTP vì hết quota SMS).
 */
function makeService() {
  const prisma: any = { user: { findFirst: jest.fn(), update: jest.fn() } };
  const noop: any = {};
  const service = new AuthService(noop, noop, noop, prisma, noop);
  return { service, prisma };
}

describe('updatePhoneDirect', () => {
  it('số hợp lệ, chưa ai dùng thì lưu ĐÚNG chuỗi người dùng nhập (không ép về E.164)', async () => {
    const { service, prisma } = makeService();
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.update.mockResolvedValue({ phone: '0912345678' });

    const result = await service.updatePhoneDirect('u1', '0912345678');

    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { phone: '0912345678' } });
    expect(result).toEqual({ message: 'Cập nhật số điện thoại thành công.', phone: '0912345678' });
  });

  it('số sai định dạng thì báo lỗi, không đụng CSDL', async () => {
    const { service, prisma } = makeService();

    await expect(service.updatePhoneDirect('u1', '123')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('số đã có người khác dùng (kể cả khác dạng biểu diễn 0 vs +84) thì từ chối', async () => {
    const { service, prisma } = makeService();
    prisma.user.findFirst.mockResolvedValue({ id: 'u2' });

    await expect(service.updatePhoneDirect('u1', '+84912345678')).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.user.findFirst.mock.calls[0][0]).toEqual({
      where: { phone: { in: ['0912345678', '+84912345678'] }, id: { not: 'u1' } },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('trùng với chính tài khoản mình (id loại trừ chính nó) thì vẫn cho cập nhật', async () => {
    const { service, prisma } = makeService();
    prisma.user.findFirst.mockResolvedValue(null); // findFirst đã loại `id: { not: userId }`
    prisma.user.update.mockResolvedValue({ phone: '0912345678' });

    await expect(service.updatePhoneDirect('u1', '0912345678')).resolves.toMatchObject({ phone: '0912345678' });
  });
});
