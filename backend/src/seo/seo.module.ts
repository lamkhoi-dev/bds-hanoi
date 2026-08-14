import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LocationModule } from '../location/location.module';
import { SeoService } from './seo.service';
import { SeoController } from './seo.controller';

@Module({
  imports: [PrismaModule, LocationModule],
  controllers: [SeoController],
  providers: [SeoService],
  // PropertyModule dùng để xoá cache sitemap khi tin được tạo/duyệt/xoá.
  exports: [SeoService],
})
export class SeoModule {}
