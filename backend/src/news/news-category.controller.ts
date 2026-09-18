import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { NewsCategoryService } from './news-category.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * Controller RIÊNG (không phải `/news/categories`): một route `GET /news/categories` sẽ bị
 * `GET /news/:id` (đã đăng ký trước, khớp mọi chuỗi) nuốt mất — NestJS không tự biết
 * "categories" không phải một id. Tách hẳn sang `/news-categories` để không phụ thuộc thứ
 * tự khai báo route.
 */
function checkAdmin(req: any) {
  if (req.user.role !== 'ADMIN') throw new ForbiddenException('Chỉ Quản trị viên được thao tác với chuyên mục tin tức');
}

@Controller('news-categories')
export class NewsCategoryController {
  constructor(private readonly service: NewsCategoryService) {}

  // Cùng lý do "429 chung IP nội bộ" khi Next.js gọi lúc dựng trang phía server — xem chú
  // thích ở `property.controller.ts getSeoProperties` (khách báo 18/9).
  @SkipThrottle()
  @Get()
  findAllPublic() {
    return this.service.findAllPublic();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  findAllAdmin(@Request() req: any) {
    checkAdmin(req);
    return this.service.findAllAdmin();
  }

  // Đặt SAU 'admin/all' — route tĩnh phải khớp trước route động ':slug', cùng lý do đã
  // tách hẳn controller này ra khỏi '/news/:id' (xem chú thích đầu file).
  @SkipThrottle()
  @Get(':slug')
  async findOneBySlug(@Param('slug') slug: string) {
    const category = await this.service.findBySlug(slug);
    if (!category) throw new NotFoundException('Không tìm thấy chuyên mục');
    return category;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req: any, @Body() data: any) {
    checkAdmin(req);
    return this.service.create(data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    checkAdmin(req);
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Request() req: any, @Param('id') id: string) {
    checkAdmin(req);
    return this.service.remove(id);
  }
}
