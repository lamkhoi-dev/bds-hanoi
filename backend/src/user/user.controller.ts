import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, ForbiddenException, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { ViewedPropertyService } from './viewed-property.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly viewedPropertyService: ViewedPropertyService
  ) {}

  @Get('public/:slug')
  async getPublicProfile(@Param('slug') slug: string) {
    const uuidMatch = slug.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    const id = uuidMatch ? uuidMatch[0] : slug;
    const profile = await this.userService.getPublicProfile(id);
    
    if (profile.isPhoneVisible === false) {
      profile.phone = 'Đã ẩn';
    } else if (profile.phone) {
      profile.phone = profile.phone.slice(0, 3) + '***' + profile.phone.slice(-3);
    }
    
    return profile;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return this.userService.findById(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  updateProfile(@Request() req, @Body() body: any) {
    return this.userService.updateProfile(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('deposit')
  async deposit(@Request() req, @Body('amount') amount: number) {
    if (process.env.ALLOW_SELF_DEPOSIT !== 'true' && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Nạp tiền thủ công đã bị tắt. Vui lòng dùng QR chuyển khoản hoặc liên hệ Admin.');
    }
    return this.userService.deposit(req.user.id, amount);
  }

  @UseGuards(JwtAuthGuard)
  @Get('properties')
  async getMyProperties(@Request() req) {
    return this.userService.findMyProperties(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('requirements')
  async getMyRequirements(@Request() req) {
    return this.userService.findMyRequirements(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('saved/:propertyId')
  async saveProperty(@Request() req, @Param('propertyId') propertyId: string) {
    return this.userService.saveProperty(req.user.id, propertyId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('saved/:propertyId')
  async unsaveProperty(@Request() req, @Param('propertyId') propertyId: string) {
    return this.userService.unsaveProperty(req.user.id, propertyId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('saved')
  async getSavedProperties(@Request() req) {
    return this.userService.getSavedProperties(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/recently-viewed')
  async getRecentlyViewed(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    return this.viewedPropertyService.getRecentlyViewed(req.user.id, parseInt(page, 10), parseInt(limit, 10));
  }

  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  async getTransactions(@Request() req) {
    return this.userService.getTransactions(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('export-data')
  async exportMyData(@Request() req) {
    return this.userService.exportMyData(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('complaints')
  async createComplaint(@Request() req, @Body() body: any) {
    return this.userService.createComplaint(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('data-deletion-request')
  async requestDataDeletion(@Request() req, @Body('reason') reason?: string) {
    return this.userService.requestDataDeletion(req.user.id, reason);
  }
}
