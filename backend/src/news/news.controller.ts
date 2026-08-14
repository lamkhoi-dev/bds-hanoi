import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, ForbiddenException, NotFoundException } from '@nestjs/common';
import { NewsService } from './news.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req: any, @Body() data: any) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('Chỉ dành cho ADMIN');
    return this.newsService.create(data);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.newsService.findAll(Number(page), Number(limit));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const news = await this.newsService.findOne(id);
    // Trước đây trả null kèm HTTP 200 -> frontend res.json() ném lỗi -> error.tsx
    // dựng trang 500. Bài không tồn tại phải là 404 thật (mục Soft 404 trong fix seo).
    if (!news) throw new NotFoundException('Không tìm thấy bài viết');
    return news;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('Chỉ dành cho ADMIN');
    return this.newsService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Request() req: any, @Param('id') id: string) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('Chỉ dành cho ADMIN');
    return this.newsService.remove(id);
  }
}

