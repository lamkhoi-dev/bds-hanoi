import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';

import { ViewedPropertyService } from './viewed-property.service';
import { UserCronService } from './user.cron';

@Module({
  providers: [UserService, ViewedPropertyService, UserCronService],
  controllers: [UserController],
  exports: [UserService, ViewedPropertyService, UserCronService],
})
export class UserModule {}
