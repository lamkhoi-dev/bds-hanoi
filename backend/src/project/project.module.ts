import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SeoModule } from '../seo/seo.module';
import { PropertyModule } from '../property/property.module';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';

@Module({
  // PropertyModule: tái dùng PropertyService.searchDatabase() cho danh sách tin trong
  // một dự án, thay vì viết lại truy vấn phân trang + VIP đã có sẵn.
  imports: [PrismaModule, SeoModule, PropertyModule],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
