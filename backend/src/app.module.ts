import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PropertyModule } from './property/property.module';
import { SearchModule } from './search/search.module';
import { AdminModule } from './admin/admin.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LocationModule } from './location/location.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SettingsModule } from './settings/settings.module';
import { PaymentModule } from './payment/payment.module';
import { BullModule } from '@nestjs/bull';
import { MailModule } from './mail/mail.module';
import { UploadModule } from './upload/upload.module';
import { NotificationModule } from './notification/notification.module';
import { CommentModule } from './comment/comment.module';
import { RequirementModule } from './requirement/requirement.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { BackupModule } from './backup/backup.module';
import { NewsModule } from './news/news.module';
import { OnlineModule } from './online/online.module';

const redisEnabled = process.env.REDIS_ENABLED === 'true';

async function createCacheOptions() {
  if (!redisEnabled) {
    return { ttl: 60000 };
  }

  try {
    return {
      store: await redisStore({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          // @ts-ignore
          tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
        },
        password: process.env.REDIS_PASSWORD || undefined,
        ttl: 60000,
      }),
    };
  } catch (error) {
    console.warn('Redis cache unavailable; falling back to in-memory cache.', error);
    return { ttl: 60000 };
  }
}

@Module({
  imports: [
    PrismaModule, 
    UserModule, 
    AuthModule, 
    PropertyModule, 
    SearchModule,
    AdminModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // Tối đa 100 req/phút để tránh DDoS
    }]),
    LocationModule,
    ScheduleModule.forRoot(),
    SettingsModule,
    PaymentModule,
    ...(redisEnabled
      ? [
          BullModule.forRoot({
            redis: {
              host: process.env.REDIS_HOST || 'localhost',
              port: parseInt(process.env.REDIS_PORT || '6379'),
              password: process.env.REDIS_PASSWORD || undefined,
              tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
            },
          }),
        ]
      : []),
    MailModule,
    UploadModule,
    NotificationModule,
    CommentModule,
    RequirementModule,
    BackupModule,
    NewsModule,
    OnlineModule,
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: createCacheOptions,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    
  ],
})
export class AppModule {}


