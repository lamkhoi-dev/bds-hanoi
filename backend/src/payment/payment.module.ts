import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CryptoService } from '../shared/crypto.service';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentController],
  providers: [PaymentService, CryptoService],
  exports: [PaymentService],
})
export class PaymentModule {}
