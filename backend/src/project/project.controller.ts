import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectService } from './project.service';
import { PropertyService } from '../property/property.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

/**
 * Theo đúng khuôn `NewsController`: một controller gộp endpoint công khai (GET) và có
 * gác quyền admin (POST/PUT/DELETE, kiểm role ngay trong handler) — không tách riêng
 * sang `admin.controller.ts` vì đó là 1400+ dòng không liên quan tới Dự án.
 */
@Controller('projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly propertyService: PropertyService,
  ) {}

  private checkAdmin(req: any) {
    if (!['ADMIN', 'MOD'].includes(req.user?.role)) {
      throw new ForbiddenException('Chỉ quản trị viên mới được quản lý dự án');
    }
  }

  // ----- Công khai -----

  /** Danh sách dự án đang hiển thị — cho trang /du-an và dropdown chọn dự án khi đăng tin. */
  @Get()
  async list() {
    return this.projectService.findPublicList();
  }

  @Get('homepage')
  async homepage(@Query('limit') limit?: string) {
    return this.projectService.findLatestForHomepage(limit ? Number(limit) : 4);
  }

  /** Chi tiết dự án + tin đăng thuộc dự án, cho trang /du-an/{slug}-{shortCode}. */
  @Get('by-code/:shortCode')
  async detail(
    @Param('shortCode') shortCode: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const project = await this.projectService.findByShortCode(shortCode);
    if (!project) return null;

    const listing = await this.propertyService.searchDatabase({
      projectId: project.id,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    } as any);

    return { project, ...listing };
  }

  // ----- Quản trị -----

  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  async adminList(@Request() req: any) {
    this.checkAdmin(req);
    return this.projectService.findAllForAdmin();
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/:id')
  async adminDetail(@Request() req: any, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.projectService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req: any, @Body() dto: CreateProjectDto) {
    this.checkAdmin(req);
    return this.projectService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    this.checkAdmin(req);
    return this.projectService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.projectService.remove(id);
  }
}
