import { Module } from '@nestjs/common';
import { OnlineGateway } from './online.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [OnlineGateway],
  exports: [OnlineGateway],
})
export class OnlineModule {}
