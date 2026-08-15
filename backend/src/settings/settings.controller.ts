import { BadRequestException, Controller, Get, Put, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../shared/crypto.service';
import { OnlineGateway } from '../online/online.gateway';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly onlineGateway: OnlineGateway
  ) {}

  private parseBoolean(value: any) {
    if (value === undefined) return undefined;
    return value === true || value === 'true' || value === 1 || value === '1';
  }

  private parseNonNegativeNumber(value: any, field: string) {
    if (value === undefined || value === null || value === '') return undefined;
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue) || numberValue < 0) {
      throw new BadRequestException(`${field} không hợp lệ`);
    }
    return numberValue;
  }

  private parsePositiveInteger(value: any, field: string) {
    const numberValue = this.parseNonNegativeNumber(value, field);
    if (numberValue === undefined) return undefined;
    if (!Number.isInteger(numberValue) || numberValue <= 0) {
      throw new BadRequestException(`${field} phải là số nguyên dương`);
    }
    return numberValue;
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getSettings(@Request() req: any) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Chỉ dành cho ADMIN');
    }

    let settings = await this.prisma.systemSettings.findUnique({
      where: { id: 'default_settings' }
    });
    
    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: { id: 'default_settings' }
      });
    }

    // Hide real token from frontend, just let them know if it exists
    const parsedVipPackages = settings.vipPackages && typeof settings.vipPackages === 'string'
      ? JSON.parse(settings.vipPackages)
      : (settings.vipPackages || []);

    const parsedPropertyAds = settings.propertyAds && typeof settings.propertyAds === 'string'
      ? JSON.parse(settings.propertyAds)
      : (settings.propertyAds || []);

    return {
      ...settings,
      sepayWebhookToken: settings.sepayWebhookToken ? this.crypto.decrypt(settings.sepayWebhookToken) : '',
      propertyAds: parsedPropertyAds,
      vipPackages: parsedVipPackages
    };
  }

  @Get('packages')
  async getPackages() {
    const settings = await this.prisma.systemSettings.findUnique({
      where: { id: 'default_settings' },
      select: { vipPackages: true }
    });
    return settings?.vipPackages || [];
  }

  @Get('public')
  async getPublicSettings() {
    const settings = await this.prisma.systemSettings.findUnique({
      where: { id: 'default_settings' },
    });
    if (!settings) {
      const created = await this.prisma.systemSettings.create({
        data: { id: 'default_settings' },
      });
      return created;
    }
    const { sepayWebhookToken, ...publicSettings } = settings;
    return {
      ...publicSettings,
      propertyAds: publicSettings.propertyAds && typeof publicSettings.propertyAds === 'string' 
        ? JSON.parse(publicSettings.propertyAds) 
        : (publicSettings.propertyAds || []),
      vipPackages: publicSettings.vipPackages && typeof publicSettings.vipPackages === 'string'
        ? JSON.parse(publicSettings.vipPackages)
        : (publicSettings.vipPackages || [])
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  async updateSettings(@Request() req: any, @Body() data: any) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Chỉ dành cho ADMIN');
    }

    const existing = await this.prisma.systemSettings.findUnique({
      where: { id: 'default_settings' },
    });

    let sepayWebhookToken = data.sepayWebhookToken;
    if (sepayWebhookToken && !sepayWebhookToken.includes('****')) {
      sepayWebhookToken = this.crypto.encrypt(sepayWebhookToken);
    } else {
      sepayWebhookToken = existing?.sepayWebhookToken;
    }

    const vipPrice = this.parseNonNegativeNumber(data.vipPrice, 'Giá VIP');
    const upPrice = this.parseNonNegativeNumber(data.upPrice, 'Giá UP');
    const vipDurationDays = this.parsePositiveInteger(data.vipDurationDays, 'Thời hạn VIP');
    const upDurationDays = this.parsePositiveInteger(data.upDurationDays, 'Thời hạn UP');
    const freePostsPerUser = this.parsePositiveInteger(data.freePostsPerUser, 'Số tin miễn phí');
    const isPreModerationEnabled = this.parseBoolean(data.isPreModerationEnabled);

    const freePostsPerDay = this.parseNonNegativeNumber(data.freePostsPerDay, 'Số tin miễn phí / ngày');
    const freeUpsPerDay = this.parseNonNegativeNumber(data.freeUpsPerDay, 'Số lượt UP miễn phí / ngày');
    const maxPostsPerDay = this.parseNonNegativeNumber(data.maxPostsPerDay, 'Tối đa đăng tin / ngày');
    const maxUpsPerDay = this.parseNonNegativeNumber(data.maxUpsPerDay, 'Tối đa UP tin / ngày');
    const maxUpPerPostPerDay = this.parseNonNegativeNumber(data.maxUpPerPostPerDay, 'Tối đa UP / Ngày cho MỖI TIN');
    const upCooldownMinutes = this.parsePositiveInteger(data.upCooldownMinutes, 'Thời gian chờ UP tin');

    const updated = await this.prisma.systemSettings.upsert({
      where: { id: 'default_settings' },
      update: {
        bankBin: data.bankBin,
        bankAccount: data.bankAccount,
        accountName: data.accountName,
        sepayWebhookToken,
        vipPrice,
        upPrice,
        vipDurationDays,
        upDurationDays,
        freePostsPerUser,
        isPreModerationEnabled,
        freePostsPerDay: freePostsPerDay !== undefined ? freePostsPerDay : undefined,
        freeUpsPerUserPerDay: freeUpsPerDay !== undefined ? freeUpsPerDay : undefined,
        maxPostsPerDay: maxPostsPerDay !== undefined ? maxPostsPerDay : undefined,
        maxTotalPostsPerUser: data.maxTotalPostsPerUser !== undefined ? Number(data.maxTotalPostsPerUser) : undefined,
        maxUpsPerDay: maxUpsPerDay !== undefined ? maxUpsPerDay : undefined,
        maxUpPerPostPerDay: maxUpPerPostPerDay !== undefined ? maxUpPerPostPerDay : undefined,
        upCooldownMinutes: upCooldownMinutes !== undefined ? upCooldownMinutes : undefined,
        forbiddenWords: data.forbiddenWords !== undefined ? String(data.forbiddenWords) : undefined,
        vipPackages: data.vipPackages !== undefined ? data.vipPackages : undefined,
        homeBannerUrl: data.homeBannerUrl !== undefined ? data.homeBannerUrl : undefined,
        homeBannerLink: data.homeBannerLink !== undefined ? data.homeBannerLink : undefined,
        isHomeBannerActive: data.isHomeBannerActive !== undefined ? this.parseBoolean(data.isHomeBannerActive) : undefined,
        propertyAdUrl: data.propertyAdUrl !== undefined ? data.propertyAdUrl : undefined,
        propertyAdLink: data.propertyAdLink !== undefined ? data.propertyAdLink : undefined,
        propertyAds: data.propertyAds !== undefined ? data.propertyAds : undefined,
        isPropertyAdActive: data.isPropertyAdActive !== undefined ? this.parseBoolean(data.isPropertyAdActive) : undefined,
        googleSearchConsoleId: data.googleSearchConsoleId !== undefined ? data.googleSearchConsoleId : undefined,
        googleMapsApiKey: data.googleMapsApiKey !== undefined ? data.googleMapsApiKey : undefined,
        googleAdsenseClientId: data.googleAdsenseClientId !== undefined ? data.googleAdsenseClientId : undefined,
        googleAdsenseSlotId: data.googleAdsenseSlotId !== undefined ? data.googleAdsenseSlotId : undefined,
        googleAnalyticsId: data.googleAnalyticsId !== undefined ? data.googleAnalyticsId : undefined,
        facebookPixelId: data.facebookPixelId !== undefined ? data.facebookPixelId : undefined,
        showOnlineUsers: data.showOnlineUsers !== undefined ? this.parseBoolean(data.showOnlineUsers) : undefined,
      },
      create: {
        id: 'default_settings',
        bankBin: data.bankBin,
        bankAccount: data.bankAccount,
        accountName: data.accountName,
        sepayWebhookToken,
        vipPrice: vipPrice ?? 10000,
        upPrice: upPrice ?? 10000,
        vipDurationDays: vipDurationDays ?? 4,
        upDurationDays: upDurationDays ?? 3,
        freePostsPerUser: freePostsPerUser ?? 3,
        isPreModerationEnabled: isPreModerationEnabled ?? true,
        freePostsPerDay: freePostsPerDay ?? 3,
        maxPostsPerDay: maxPostsPerDay ?? 50,
        maxTotalPostsPerUser: data.maxTotalPostsPerUser !== undefined ? Number(data.maxTotalPostsPerUser) : 20,
        maxUpsPerDay: maxUpsPerDay ?? 10,
        maxUpPerPostPerDay: maxUpPerPostPerDay ?? 10,
        freeUpsPerUserPerDay: freeUpsPerDay ?? 1,
        upCooldownMinutes: upCooldownMinutes ?? 10,
        forbiddenWords: data.forbiddenWords !== undefined ? String(data.forbiddenWords) : undefined,
        vipPackages: data.vipPackages !== undefined ? data.vipPackages : undefined,
        homeBannerUrl: data.homeBannerUrl !== undefined ? data.homeBannerUrl : undefined,
        homeBannerLink: data.homeBannerLink !== undefined ? data.homeBannerLink : undefined,
        isHomeBannerActive: data.isHomeBannerActive !== undefined ? this.parseBoolean(data.isHomeBannerActive) : true,
        propertyAdUrl: data.propertyAdUrl !== undefined ? data.propertyAdUrl : undefined,
        propertyAdLink: data.propertyAdLink !== undefined ? data.propertyAdLink : undefined,
        propertyAds: data.propertyAds !== undefined ? data.propertyAds : undefined,
        isPropertyAdActive: data.isPropertyAdActive !== undefined ? this.parseBoolean(data.isPropertyAdActive) : true,
        googleSearchConsoleId: data.googleSearchConsoleId !== undefined ? data.googleSearchConsoleId : undefined,
        googleMapsApiKey: data.googleMapsApiKey !== undefined ? data.googleMapsApiKey : undefined,
        googleAdsenseClientId: data.googleAdsenseClientId !== undefined ? data.googleAdsenseClientId : undefined,
        googleAdsenseSlotId: data.googleAdsenseSlotId !== undefined ? data.googleAdsenseSlotId : undefined,
        googleAnalyticsId: data.googleAnalyticsId !== undefined ? data.googleAnalyticsId : undefined,
        facebookPixelId: data.facebookPixelId !== undefined ? data.facebookPixelId : undefined,
        showOnlineUsers: data.showOnlineUsers !== undefined ? this.parseBoolean(data.showOnlineUsers) : true,
      },
    });
    // Broadcast updated state
    if (data.showOnlineUsers !== undefined) {
      await this.onlineGateway.broadcastOnlineCount();
    }

    const parsedVipPackages = updated.vipPackages && typeof updated.vipPackages === 'string'
      ? JSON.parse(updated.vipPackages)
      : (updated.vipPackages || []);

    const parsedPropertyAds = updated.propertyAds && typeof updated.propertyAds === 'string'
      ? JSON.parse(updated.propertyAds)
      : (updated.propertyAds || []);
      
    return { 
      ...updated, 
      vipPackages: parsedVipPackages, 
      propertyAds: parsedPropertyAds,
      sepayWebhookToken: updated.sepayWebhookToken ? this.crypto.decrypt(updated.sepayWebhookToken) : '' 
    };
  }
}
