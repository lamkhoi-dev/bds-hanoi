import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { NewsRelatedService } from './news-related.service';
import { NewsCategoryService } from './news-category.service';
import { NewsCategoryController } from './news-category.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SeoModule } from '../seo/seo.module';

@Module({
  imports: [PrismaModule, SeoModule],
  controllers: [NewsController, NewsCategoryController],
  providers: [NewsService, NewsRelatedService, NewsCategoryService],
})
export class NewsModule {}
