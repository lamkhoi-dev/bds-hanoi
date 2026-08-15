import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  async getReady() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        database: 'ok',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        database: 'unavailable',
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Get('categories')
  async getCategories() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, createdAt: true },
    });
  }

  @Get('users')
  async getUsers() {
    return this.prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, updatedAt: true },
      take: 5000,
      orderBy: { updatedAt: 'desc' },
    });
  }
}
