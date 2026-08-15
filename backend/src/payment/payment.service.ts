import { Injectable, HttpException, HttpStatus, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../shared/crypto.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService
  ) {}

  async refundTransaction(id: string, adminNote: string) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!transaction) {
        throw new HttpException('Giao dịch không tồn tại', HttpStatus.NOT_FOUND);
      }

      if (transaction.status === 'REFUNDED') {
        throw new HttpException('Giao dịch đã được hoàn tiền', HttpStatus.BAD_REQUEST);
      }

      if (transaction.userId) {
        await tx.user.update({
          where: { id: transaction.userId },
          data: {
            balance: {
              increment: transaction.type === 'DEDUCT' ? transaction.amount : -transaction.amount
            }
          }
        });
      }

      const updatedTransaction = await tx.transaction.update({
        where: { id },
        data: {
          status: 'REFUNDED',
          adminNote
        }
      });

      return updatedTransaction;
    });
  }

  restoreUuidFromBankToken(value: string) {
    const normalized = String(value || '').trim().toLowerCase();
    if (/^[0-9a-f]{32}$/.test(normalized)) {
      return `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12, 16)}-${normalized.slice(16, 20)}-${normalized.slice(20)}`;
    }
    return normalized;
  }

  async saveWebhookLog(data: {
    referenceId: string;
    payload: any;
    status: string;
    reason?: string;
    userId?: string | null;
    transactionId?: string | null;
    retryCount?: number;
    nextRetryAt?: Date | null;
  }) {
    const transferAmount = Number(data.payload?.transferAmount);
    const payloadText = JSON.stringify(data.payload || {});

    return this.prisma.paymentWebhookLog.upsert({
      where: { referenceId: data.referenceId },
      update: {
        payload: payloadText,
        transferAmount: Number.isFinite(transferAmount) ? transferAmount : null,
        transferType: data.payload?.transferType ? String(data.payload.transferType) : null,
        content: data.payload?.content ? String(data.payload.content) : null,
        status: data.status,
        reason: data.reason || null,
        userId: data.userId || null,
        transactionId: data.transactionId || null,
        retryCount: data.retryCount,
        nextRetryAt: data.nextRetryAt,
      },
      create: {
        referenceId: data.referenceId,
        payload: payloadText,
        transferAmount: Number.isFinite(transferAmount) ? transferAmount : null,
        transferType: data.payload?.transferType ? String(data.payload.transferType) : null,
        content: data.payload?.content ? String(data.payload.content) : null,
        status: data.status,
        reason: data.reason || null,
        userId: data.userId || null,
        transactionId: data.transactionId || null,
        retryCount: data.retryCount || 0,
        nextRetryAt: data.nextRetryAt || null,
      },
    });
  }

  async processSePayWebhook(authHeader: string, payload: any) {
    this.logger.log(`Received SePay webhook reference=${payload?.id || payload?.referenceCode || payload?.code || 'unknown'} amount=${payload?.transferAmount || 'unknown'}`);

    // 1. Check Authentication
    const settings = await this.prisma.systemSettings.findUnique({
      where: { id: 'default_settings' }
    });

    if (!settings || !settings.sepayWebhookToken) {
      throw new HttpException('Chưa cấu hình SePay Token', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const decryptedToken = this.crypto.decrypt(settings.sepayWebhookToken);
    if (!authHeader || !authHeader.toLowerCase().startsWith('apikey ') || authHeader.substring(7).trim() !== decryptedToken) {
      this.logger.warn(`SePay webhook invalid token reference=${payload?.id}`);
      return { success: false, message: 'Token không hợp lệ' };
    }

    // 2. Parse payload
    const { id, transferAmount, content, transferType } = payload;
    const contentText = String(content || '');
    const referenceId = String(id || payload.referenceCode || payload.code || `${Date.now()}`);
    const numericAmount = Number(transferAmount);
    
    if (transferType !== 'in') {
      await this.saveWebhookLog({
        referenceId,
        payload,
        status: 'IGNORED',
        reason: 'Không phải giao dịch tiền vào',
      });
      return { success: true, message: 'Bỏ qua giao dịch rút tiền' };
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      await this.saveWebhookLog({
        referenceId,
        payload,
        status: 'FAILED',
        reason: 'Số tiền webhook không hợp lệ',
      });
      return { success: true, message: 'Số tiền không hợp lệ, bỏ qua' };
    }

    // 3. Idempotency Check
    const existingTx = await this.prisma.transaction.findUnique({
      where: { referenceId }
    });

    if (existingTx) {
      this.logger.warn(`Duplicate SePay webhook skipped reference=${referenceId}`);
      await this.saveWebhookLog({
        referenceId,
        payload,
        status: 'DUPLICATE',
        reason: 'Giao dịch đã được xử lý trước đó',
        userId: existingTx.userId,
        transactionId: existingTx.id,
      });
      return { success: true, message: 'Đã xử lý trước đó' };
    }

    await this.saveWebhookLog({
      referenceId,
      payload,
      status: 'PENDING',
      reason: 'Đã nhận webhook, đang xử lý',
    });

    // 4. Parse content to find User ID
    const match = contentText.match(/NAP\s*([a-zA-Z0-9]+)/i);
    if (!match) {
      this.logger.warn(`SePay webhook missing NAP syntax reference=${referenceId}`);
      await this.saveWebhookLog({
        referenceId,
        payload,
        status: 'FAILED',
        reason: 'Sai cú pháp nội dung chuyển khoản',
      });
      return { success: true, message: 'Sai cú pháp, bỏ qua' };
    }

    const parsedUserId = match[1];
    const restoredUserId = this.restoreUuidFromBankToken(parsedUserId);

    const targetUser = await this.prisma.user.findFirst({
      where: { OR: [{ id: restoredUserId }, { id: parsedUserId }] },
      select: { id: true },
    });

    if (!targetUser) {
      this.logger.warn(`SePay webhook user not found reference=${referenceId} userToken=${parsedUserId}`);
      await this.saveWebhookLog({
        referenceId,
        payload,
        status: 'FAILED',
        reason: `Không tìm thấy user cho mã ${parsedUserId}`,
      });
      return { success: true, message: 'Không tìm thấy user, bỏ qua' };
    }

    // 5. Prisma Transaction để cộng tiền
    try {
      const createdTransaction = await this.prisma.$transaction(async (tx) => {
        const points = Math.floor(numericAmount / 1000);
        
        const updatedUser = await tx.user.update({
          where: { id: targetUser.id },
          data: { balance: { increment: points } }
        });

        const transaction = await tx.transaction.create({
          data: {
            userId: targetUser.id,
            type: 'DEPOSIT',
            amount: points,
            balanceBefore: Number(updatedUser.balance) - points,
            balanceAfter: Number(updatedUser.balance),
            description: `Nạp tiền tự động qua SePay (Mã GD: ${referenceId}, Nạp: ${numericAmount}đ)`,
            status: 'SUCCESS',
            referenceId
          }
        });

        await tx.paymentWebhookLog.update({
          where: { referenceId },
          data: {
            status: 'SUCCESS',
            reason: 'Đã cộng tiền vào ví',
            userId: targetUser.id,
            transactionId: transaction.id,
          },
        });

        return transaction;
      });

      await this.prisma.auditLog.create({
        data: {
          actorId: targetUser.id,
          action: 'PAYMENT_DEPOSIT_SUCCESS',
          entityType: 'Transaction',
          entityId: createdTransaction.id,
          metadata: JSON.stringify({ referenceId, transferAmount: numericAmount }),
        },
      });

      this.logger.log(`SePay deposit success reference=${referenceId} amount=${numericAmount} userId=${targetUser.id}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`SePay webhook database error reference=${referenceId}`, error instanceof Error ? error.stack : String(error));
      await this.saveWebhookLog({
        referenceId,
        payload,
        status: 'FAILED',
        reason: 'Lỗi database khi xử lý giao dịch',
        userId: targetUser.id,
        retryCount: 1,
        nextRetryAt: new Date(Date.now() + 5 * 60 * 1000),
      });
      throw new HttpException('Lỗi hệ thống khi nạp tiền', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async notifyAdminDeposit(userId: string, amount: number, content: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' } });
    const title = 'Yêu cầu kiểm tra nạp tiền';
    const message = `Người dùng ${user.name || user.username || user.email || user.id} vừa báo đã chuyển khoản ${amount} VND. Nội dung: "${content}". Vui lòng kiểm tra tài khoản.`;
    for (const admin of admins) {
      await this.prisma.notification.create({
        data: { userId: admin.id, title, content: message }
      });
    }
  }
}
