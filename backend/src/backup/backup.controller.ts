import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BackupService } from './backup.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin/backup')
@UseGuards(JwtAuthGuard)
export class BackupController {
  constructor(
    private readonly backupService: BackupService,
    private readonly prisma: PrismaService,
  ) {}

  private checkAdmin(req: any) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Chỉ ADMIN được phép thao tác backup/restore.');
    }
  }

  // ─── Tạo backup JSON ───
  @Post('create-json')
  async createJsonBackup(@Request() req) {
    this.checkAdmin(req);
    const result = await this.backupService.createJsonBackup();
    return {
      message: 'Sao lưu JSON thành công',
      fileName: result.fileName,
      size: result.size,
    };
  }

  // ─── Liệt kê file backup ───
  @Get('files')
  async listFiles(@Request() req) {
    this.checkAdmin(req);
    return this.backupService.listBackupFiles();
  }

  // ─── Download file backup ───
  @Get('files/:name')
  async downloadFile(@Request() req, @Param('name') name: string, @Res() res: Response) {
    this.checkAdmin(req);
    const filePath = this.backupService.getBackupFilePath(name);
    if (!filePath) {
      throw new BadRequestException('File không tồn tại');
    }
    res.download(filePath, name);
  }

  // ─── Upload file backup từ máy local ───
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 500 * 1024 * 1024 } }))
  async uploadFile(@Request() req, @UploadedFile() file: Express.Multer.File) {
    this.checkAdmin(req);
    if (!file) {
      throw new BadRequestException('Chưa chọn file');
    }
    return this.backupService.saveUploadedFile(file);
  }

  // ─── Restore từ file có sẵn ───
  @Post('restore/:name')
  async restoreFromFile(
    @Request() req,
    @Param('name') name: string,
    @Body('password') password?: string,
  ) {
    this.checkAdmin(req);
    
    if (!password) {
      throw new BadRequestException('Vui lòng nhập mật khẩu tài khoản Admin để xác nhận khôi phục.');
    }

    const admin = await this.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!admin || !admin.password) {
      throw new ForbiddenException('Không thể xác thực tài khoản Admin.');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Mật khẩu không chính xác!');
    }

    return this.backupService.restoreFromJson(name);
  }

  // ─── Xóa file backup ───
  @Delete('files/:name')
  async deleteFile(@Request() req, @Param('name') name: string) {
    this.checkAdmin(req);
    const deleted = this.backupService.deleteBackupFile(name);
    if (!deleted) {
      throw new BadRequestException('File không tồn tại');
    }
    return { message: `Đã xóa ${name}` };
  }

  // ─── Chạy retention thủ công ───
  @Post('clean')
  async cleanOldBackups(@Request() req) {
    this.checkAdmin(req);
    return this.backupService.cleanOldBackups(10, 3);
  }

  // ─── Lịch sử backup/restore ───
  @Get('logs')
  async getBackupLogs(@Request() req, @Query() query: any) {
    this.checkAdmin(req);
    return this.backupService.getBackupLogs(query);
  }
}
