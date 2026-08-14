import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LocationService],
  controllers: [LocationController],
  // AdminModule cần để xoá cache trong tiến trình sau khi sửa khu vực.
  exports: [LocationService],
})
export class LocationModule {}
