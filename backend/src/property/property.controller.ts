import { Controller, Post, Put, Delete, Body, Get, Param, Query, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException, Injectable, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PropertyReviewService } from './property-review.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PropertyService } from './property.service';
import { SearchService } from '../search/search.service';
import { ViewedPropertyService } from '../user/viewed-property.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import { Throttle } from '@nestjs/throttler';
import sharp from 'sharp';
import { UploadService } from '../upload/upload.service';
import { buildMeiliFilters, buildMeiliSort, buildPrismaWhere, normalizeSearchFilters } from './property-utils';
import { CreatePropertyDto } from './dto/create-property.dto';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    return user; // Return undefined instead of throwing error if no token
  }
}

@Controller('properties')
export class PropertyController {
  constructor(
    private readonly propertyService: PropertyService,
    private readonly searchService: SearchService,
    private readonly prisma: PrismaService,
    private readonly viewedPropertyService: ViewedPropertyService,
    private readonly uploadService: UploadService,
    private readonly propertyReviewService: PropertyReviewService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async uploadImage(@UploadedFile(
    new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
      ],
      fileIsRequired: true,
    }),
  ) file: Express.Multer.File) {

    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    let optimizedBuffer;
    
    try {
      optimizedBuffer = await sharp(file.buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } catch (error) {
      throw new BadRequestException('Invalid or corrupted image file');
    }

    const url = await this.uploadService.uploadFile(optimizedBuffer, filename, 'image/webp');

    return { url };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async create(@Request() req, @Body() data: CreatePropertyDto) {
    return this.propertyService.create(req.user.id, data);
  }

  @Get('stats')
  async getStats() {
    return this.propertyService.getStats();
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('homepage')
  async getHomepage(
    @Request() req,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    return this.propertyService.getHomepageProperties(req.user?.id);
  }

  @Get('hot-locations')
  async getHotLocations() {
    return this.propertyService.getHotLocations();
  }

  @Get('map')
  async getMapProperties(@Query() query: any) {
    return this.propertyService.getMapProperties(query);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.propertyService.findAll(query);
  }

  @Get('sitemap')
  async getSitemap() {
    return this.propertyService.getSitemap();
  }

  @Get('seo')
  async getSeoProperties(
    @Query('loaiBds') loaiBds: string,
    @Query('khuVuc') khuVuc: string,
    @Query() allQueries: any
  ) {
    return this.propertyService.getSeoProperties(loaiBds, khuVuc, allQueries);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('search')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async search(
    @Request() req,
    @Query() query: any,
  ) {
    const normalized = normalizeSearchFilters(query);
    const baseFilters = buildMeiliFilters(normalized) || [];
    
    const filters = query.tier ? [...baseFilters, query.tier === 'NORMAL' ? '(tier = "NORMAL" OR status = "SOLD" OR status = "RENTED")' : `tier = "${query.tier}"`, query.tier !== 'NORMAL' ? 'status = "APPROVED"' : null].filter(Boolean) as string[] : baseFilters;
    
    // Always sort by tier descending first (handled in buildMeiliSort), then apply user-specified sort (or pushedAt:desc default)
    const sort = buildMeiliSort(normalized.sort);
    const searchText = normalized.q || normalized.location || '';

    // Log search history asynchronously
    if (searchText) {
      this.prisma.searchHistory.create({
        data: {
          query: searchText,
          userId: req.user?.id || null,
          filters: JSON.stringify(normalized)
        }
      }).catch(err => console.error('Failed to log search history', err));
    }

    try {
      let vipsToReturn: any[] = [];
      if (!query.tier || query.tier === 'VIP') {
        const vipFilters = [...baseFilters, 'tier = "VIP"', 'status = "APPROVED"'].filter(Boolean) as string[];
        const vipRes = await this.searchService.search(searchText, vipFilters, ['pushedAt:desc'], 1, 50);
        const allVips = vipRes.hits || [];
        const newestVips = allVips.slice(0, 2);
        const remainingVips = allVips.slice(2);
        const randomVips = remainingVips.sort(() => 0.5 - Math.random()).slice(0, 3);
        vipsToReturn = [...newestVips, ...randomVips];
      }

      const res = await this.searchService.search(searchText, filters as string[], sort, normalized.page, normalized.limit);
      const hits = res.hits || [];
      const totalFromMeili = res.estimatedTotalHits || res.totalHits || 0;

      return {
        vips: vipsToReturn,
        ups: [],
        normals: hits,
        total: totalFromMeili,
        page: normalized.page,
        limit: normalized.limit,
        appliedFilters: {},
        chips: []
      };
    } catch (error) {
      console.error('[SearchService] MeiliSearch search error:', error);
      return this.propertyService.searchDatabase(normalized);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-drafts')
  async getMyDrafts(@Request() req) {
    return this.propertyService.getMyDrafts(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('draft')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async createDraft(@Request() req, @Body() data: CreatePropertyDto) {
    return this.propertyService.createDraft(req.user.id, data);
  }

  @Get('compare')
  async compare(@Query('ids') ids: string) {
    const idArray = ids ? ids.split(',') : [];
    return this.propertyService.compareProperties(idArray);
  }


  @Get(':id/related')
  async findRelated(@Param('id') id: string) {
    return this.propertyService.findRelated(id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const property = await this.propertyService.findOne(id);
    const canViewPrivate = req.user?.role === 'ADMIN' || req.user?.id === property.userId;
    if (!canViewPrivate && (property.deletedAt || !['APPROVED', 'SOLD'].includes(property.status))) {
      throw new NotFoundException('Không tìm thấy bất động sản');
    }

    if (!property.deletedAt && (property.status === 'APPROVED' || property.status === 'SOLD')) {
      // Note: incrementView will only be called when cache misses, which is acceptable for high-traffic sites
      this.propertyService.incrementView(id).catch(() => {});
      
      if (req.user?.id) {
        this.viewedPropertyService.logView(req.user.id, property.id).catch(() => {});
      }
    }
    
    // Mask phone number for non-owners/non-admins
    if (!canViewPrivate && property.user && property.user.phone) {
      if (property.user.phone !== 'Đã ẩn') {
        property.user.phone = property.user.phone.slice(0, 3) + '***' + property.user.phone.slice(-3);
      }
    }

    return property;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/save')
  async save(@Request() req, @Param('id') id: string) {
    return this.propertyService.saveProperty(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/save')
  async unsave(@Request() req, @Param('id') id: string) {
    return this.propertyService.unsaveProperty(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/report')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async report(@Request() req, @Param('id') id: string, @Body('reason') reason: string) {
    return this.propertyService.reportProperty(req.user.id, id, reason);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post(':id/contact')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async trackContact(@Request() req, @Param('id') id: string, @Body('channel') channel?: 'PHONE_REVEAL' | 'CALL' | 'ZALO') {
    return this.propertyService.trackContact(id, req.user?.id, channel || 'PHONE_REVEAL');
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post(':id/track-phone-reveal')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async trackPhoneReveal(@Request() req, @Param('id') id: string) {
    const property = await this.propertyService.findOne(id);
    await this.propertyService.trackContact(id, req.user?.id, 'PHONE_REVEAL');
    return { success: true, phone: property.user?.phone };
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post(':id/click-contact')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async clickContact(@Request() req, @Param('id') id: string, @Body('type') type: 'PHONE' | 'ZALO' | 'PHONE_REVEAL') {
    let channel: 'CALL' | 'ZALO' | 'PHONE_REVEAL' = 'PHONE_REVEAL';
    if (type === 'PHONE') channel = 'CALL';
    if (type === 'ZALO') channel = 'ZALO';
    return this.propertyService.trackContact(id, req.user?.id, channel);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post(':id/view')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async logView(@Request() req, @Param('id') id: string) {
    if (req.user?.id) {
      await this.viewedPropertyService.logView(req.user.id, id);
    }
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/promote')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async promote(@Request() req, @Param('id') id: string, @Body('type') type: 'VIP' | 'UP', @Body('packageId') packageId?: string, @Body('customDays') customDays?: number) {
    return this.propertyService.promote(req.user.id, id, type, packageId, customDays);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/unpromote')
  async unpromote(@Request() req, @Param('id') id: string) {
    return this.propertyService.unpromote(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/status')
  async updateStatus(@Request() req, @Param('id') id: string, @Body('status') status: 'HIDDEN' | 'SOLD' | 'APPROVED') {
    if (status !== 'HIDDEN' && status !== 'SOLD' && status !== 'APPROVED') {
      throw new BadRequestException('Trạng thái không hợp lệ');
    }
    return this.propertyService.updateStatus(req.user.id, id, status);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/extend')
  async extend(@Request() req, @Param('id') id: string) {
    return this.propertyService.extendProperty(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('draft/:id')
  async updateDraft(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.propertyService.updateDraft(req.user.id, id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Request() req, @Param('id') id: string, @Body() data: CreatePropertyDto) {
    return this.propertyService.update(req.user.id, id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.propertyService.remove(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/restore')
  async restore(@Request() req, @Param('id') id: string) {
    return this.propertyService.restore(req.user.id, id);
  }

  // ===== Quy trình duyệt tin 2 chiều (PHẦN I) =====

  /**
   * Admin kiểm duyệt: sửa (tuỳ chọn) rồi DUYỆT LUÔN hoặc TRẢ VỀ cho người đăng.
   * `changes` rỗng = duyệt luôn không sửa gì.
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/review')
  async review(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { changes?: Record<string, any>; returnToAuthor?: boolean; note?: string },
  ) {
    // Dự án kiểm quyền thủ công trong controller (không có RolesGuard) — giữ đúng
    // cách đang dùng ở AdminController thay vì thêm cơ chế thứ hai.
    if (!['ADMIN', 'MOD'].includes(req.user?.role)) {
      throw new ForbiddenException('Chỉ quản trị viên mới được kiểm duyệt tin');
    }
    return this.propertyReviewService.review(
      req.user.id,
      id,
      body?.changes ?? {},
      Boolean(body?.returnToAuthor),
      body?.note,
    );
  }

  /** Người đăng xem xong phần admin sửa và gửi duyệt lại -> quay về chờ duyệt. */
  @UseGuards(JwtAuthGuard)
  @Post(':id/resubmit')
  async resubmit(@Request() req, @Param('id') id: string) {
    return this.propertyReviewService.resubmit(req.user.id, id);
  }

  /** Lịch sử chỉnh sửa của tin. Chủ tin hoặc admin xem được. */
  @UseGuards(JwtAuthGuard)
  @Get(':id/history')
  async history(@Request() req, @Param('id') id: string) {
    const property = await this.propertyService.findOne(id);
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'MOD';
    if (!isAdmin && property.userId !== req.user?.id) {
      throw new NotFoundException('Không tìm thấy bất động sản');
    }
    return this.propertyReviewService.history(id);
  }
}
