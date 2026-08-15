import { Module } from '@nestjs/common';
import { PropertyService } from './property.service';
import { PropertyInteractionService } from './property-interaction.service';
import { PropertyController } from './property.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SearchModule } from '../search/search.module';
import { BullModule, getQueueToken } from '@nestjs/bull';
import { PropertyProcessor } from './property.processor';
import { NotificationModule } from '../notification/notification.module';
import { UserModule } from '../user/user.module';
import { AdminActionLogService } from '../admin/admin-action-log.service';

import { CacheModule } from '@nestjs/cache-manager';

const redisEnabled = process.env.REDIS_ENABLED === 'true';
const propertyUpQueueFallback = {
  provide: getQueueToken('property_up'),
  useValue: {
    add: async () => ({ id: 'dev-noop' }),
  },
};

@Module({
  imports: [
    PrismaModule,
    SearchModule,
    NotificationModule,
    UserModule,
    CacheModule.register(),
    ...(redisEnabled
      ? [
          BullModule.registerQueue({
            name: 'property_up',
          }),
        ]
      : []),
  ],
  controllers: [PropertyController],
  providers: [
    PropertyService,
    PropertyInteractionService,
    AdminActionLogService,
    ...(redisEnabled ? [PropertyProcessor] : [propertyUpQueueFallback]),
  ],
})
export class PropertyModule {}

