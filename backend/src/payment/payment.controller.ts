import { Controller, Get, Post, Body, Req, Headers, UnauthorizedException, HttpException, HttpStatus, UseGuards, Request, Logger, HttpCode } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../shared/crypto.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly paymentService: PaymentService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('qr-code')
  async getQrCode(@Request() req, @Req() rawReq: any) {
    const amount = Number(rawReq.query.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new HttpException('Số tiền nạp không hợp lệ', HttpStatus.BAD_REQUEST);
    }
    const settings = await this.prisma.systemSettings.findUnique({
      where: { id: 'default_settings' }
    });

    if (!settings || !settings.bankBin || !settings.bankAccount) {
      throw new HttpException('Hệ thống thanh toán chưa được cấu hình', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const content = `NAP ${req.user.id}`.replace(/-/g, '').substring(0, 50); // SePay usually supports alphanumeric without dashes nicely

    // VietQR Format: https://img.vietqr.io/image/{bank_bin}-{bank_account}-compact.jpg?amount={amount}&addInfo={content}&accountName={account_name}
    const qrUrl = `https://img.vietqr.io/image/${settings.bankBin}-${settings.bankAccount}-compact.jpg?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(settings.accountName || '')}`;

    return {
      qrUrl,
      bankBin: settings.bankBin,
      bankAccount: settings.bankAccount,
      accountName: settings.accountName,
      content,
      amount
    };
  }

  @Get('webhook/sepay')
  async verifySepayWebhook() {
    return { success: true, message: 'Webhook is active' };
  }

  @Post('webhook/sepay')
  @HttpCode(HttpStatus.OK)
  async sepayWebhook(
    @Headers('authorization') authHeader: string,
    @Body() payload: any
  ) {
    return this.paymentService.processSePayWebhook(authHeader, payload);
  }

  @Post('webhook/sepay/mock')
  @HttpCode(HttpStatus.OK)
  async sepayWebhookMock(@Body() payload: any) {
    if (process.env.ENABLE_MOCK_PAYMENT !== 'true') {
      throw new HttpException('Mock payment is disabled', HttpStatus.FORBIDDEN);
    }
    this.logger.log(`Received Mock SePay webhook amount=${payload?.transferAmount}`);
    const contentText = String(payload.content || '');
    const referenceId = String(payload.id || Date.now());
    const numericAmount = Number(payload.transferAmount);
    
    const match = contentText.match(/NAP\s*([a-zA-Z0-9]+)/i);
    if (!match) return { success: false, message: 'Sai cú pháp' };

    const parsedUserId = match[1];
    const restoredUserId = this.paymentService.restoreUuidFromBankToken(parsedUserId);

    const targetUser = await this.prisma.user.findFirst({
      where: { OR: [{ id: restoredUserId }, { id: parsedUserId }] },
      select: { id: true },
    });

    if (!targetUser) return { success: false, message: 'Không tìm thấy user' };

    await this.prisma.$transaction(async (tx) => {
      const points = Math.floor(numericAmount / 1000);
      const updatedUser = await tx.user.update({
        where: { id: targetUser.id },
        data: { balance: { increment: points } }
      });

      await tx.transaction.create({
        data: {
          userId: targetUser.id,
          type: 'DEPOSIT',
          amount: points,
          balanceBefore: Number(updatedUser.balance) - points,
          balanceAfter: Number(updatedUser.balance),
          description: `[MOCK] Nạp tiền tự động (Mã GD: ${referenceId}, Nạp: ${numericAmount}đ)`,
          status: 'SUCCESS',
          referenceId
        }
      });
    });

    return { success: true, message: 'Mock thanh toán thành công' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/refund/:id')
  async refundTransaction(@Req() req: any, @Body() body: any) {
    if (req.user.role !== 'ADMIN') {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    const id = req.params.id;
    return this.paymentService.refundTransaction(id, body.adminNote);
  }

  @UseGuards(JwtAuthGuard)
  @Post('notify-admin')
  async notifyAdmin(@Req() req: any, @Body() body: any) {
    const { amount, content } = body;
    await this.paymentService.notifyAdminDeposit(req.user.id, amount, content);
    return { success: true };
  }
}
