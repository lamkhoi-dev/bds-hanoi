import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { NewsService } from './news.service';
import { NewsRelatedService } from './news-related.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateNewsDto, UpdateNewsDto } from './dto/news.dto';

/**
 * Chỉ ADMIN được đăng/sửa/xoá tin tức — khách chốt khi rà soát 12/9 (khác Dự án, nơi MOD
 * cũng được sửa). Kiểm ngay ở đây thay vì để lọt xuống service, để lỗi 403 trả về sớm và
 * rõ ràng, và menu Tin tức đã ẩn với MOD ở `admin/layout.tsx` — hai lớp chặn độc lập.
 */
function checkAdmin(req: any) {
  if (req.user.role !== 'ADMIN') throw new ForbiddenException('Chỉ Quản trị viên được thao tác với tin tức');
}

@Controller('news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private readonly newsRelatedService: NewsRelatedService,
  ) {}

  // ---------------- Quản trị (đặt TRƯỚC ':id' để không bị nuốt bởi route động) ----------------

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  findAdminAll(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
    @Query('q') q?: string,
  ) {
    checkAdmin(req);
    return this.newsService.findAdminList(Number(page), Number(limit), status, q);
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard)
  async findAdminOne(@Request() req: any, @Param('id') id: string) {
    checkAdmin(req);
    const news = await this.newsService.findAdminOne(id);
    if (!news) throw new NotFoundException('Không tìm thấy bài viết');
    return news;
  }

  @Post('admin/resolve-properties')
  @UseGuards(JwtAuthGuard)
  resolveProperties(@Request() req: any, @Body('refs') refs: string[]) {
    checkAdmin(req);
    return this.newsRelatedService.resolveProperties(refs || []);
  }

  // ---------------- Công khai ----------------

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req: any, @Body() data: CreateNewsDto) {
    checkAdmin(req);
    return this.newsService.create(data);
  }

  // 3 route công khai dưới đây đều được trang tin tức gọi lúc dựng trang PHÍA SERVER — cùng
  // gốc lỗi "429 chung IP nội bộ" đã sửa ở `property.controller.ts getSeoProperties` (khách
  // báo 18/9). Route quản trị phía trên KHÔNG cần (gọi từ trình duyệt admin qua HTTPS công
  // khai, mỗi admin một IP thật, không đi qua đường nội bộ này).
  @SkipThrottle()
  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('category') category?: string,
  ) {
    return this.newsService.findPublicList(Number(page), Number(limit), category);
  }

  @SkipThrottle()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const news = await this.newsService.findPublicOne(id);
    // Trước đây trả null kèm HTTP 200 -> frontend res.json() ném lỗi -> error.tsx
    // dựng trang 500. Bài không tồn tại (hoặc chưa công khai) phải là 404 thật.
    if (!news) throw new NotFoundException('Không tìm thấy bài viết');
    return news;
  }

  @SkipThrottle()
  @Get(':id/related')
  getRelated(@Param('id') id: string) {
    return this.newsRelatedService.findRelated(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Request() req: any, @Param('id') id: string, @Body() data: UpdateNewsDto) {
    checkAdmin(req);
    return this.newsService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Request() req: any, @Param('id') id: string) {
    checkAdmin(req);
    return this.newsService.remove(id);
  }
}
