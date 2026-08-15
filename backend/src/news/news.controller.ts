import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
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
  findOne(@Param('id') id: string) {
    return this.newsService.findOne(id);
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

