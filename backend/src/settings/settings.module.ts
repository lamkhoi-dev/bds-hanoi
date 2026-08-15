import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CryptoService } from '../shared/crypto.service';
import { OnlineModule } from '../online/online.module';

@Module({
  imports: [PrismaModule, OnlineModule],
  controllers: [SettingsController],
  providers: [CryptoService],
})
export class SettingsModule {}
