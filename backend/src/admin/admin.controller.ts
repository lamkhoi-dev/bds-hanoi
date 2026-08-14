import { Controller, Get, Put, Post, Patch, Delete, Param, Body, UseGuards, Request, ForbiddenException, BadRequestException, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateLocationDto, UpdateLocationDto } from '../location/dto/location.dto';

type PropertyStatus = string;

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private checkModerator(req: any) {
    if (!['ADMIN', 'MOD'].includes(req.user.role)) {
      throw new ForbiddenException('Ban khong co quyen truy cap khu vuc kiem duyet.');
    }
  }

  private checkAdmin(req: any) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Bạn không có quyền truy cập. Chỉ dành cho ADMIN.');
    }
  }

  @Get('stats')
  async getStats(@Request() req) {
    this.checkModerator(req);
    return this.adminService.getStats();
  }

  @Get('users')
  async getAllUsers(@Request() req, @Query() query: any) {
    this.checkAdmin(req);
    return this.adminService.getAllUsers(query);
  }

  @Get('users/:id')
  async getUserDetail(@Request() req, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.adminService.getUserDetail(id);
  }

  @Get('properties')
  async getAllProperties(@Request() req, @Query() query: any) {
    this.checkModerator(req);
    return this.adminService.getAllProperties(query);
  }

  @Post('properties/:id/reject')
  async rejectProperty(@Request() req, @Param('id') id: string, @Body('reason') reason: string) {
    this.checkModerator(req);
    return this.adminService.rejectProperty(req.user.id, id, reason);
  }

  @Put('users/:id')
  async updateUser(
    @Request() req,
    @Param('id') userId: string,
    @Body('role') role?: string,
    @Body('fullName') fullName?: string,
    @Body('phone') phone?: string,
    @Body('bio') bio?: string,
  ) {
    this.checkAdmin(req);
    return this.adminService.updateUser(req.user.id, userId, { role, fullName, phone, bio });
  }

  @Put('users/:id/status')
  async changeUserStatus(@Request() req, @Param('id') userId: string, @Body('status') status: string) {
    this.checkAdmin(req);
    return this.adminService.changeUserStatus(req.user.id, userId, status);
  }

  @Post('users/:id/wallet')
  async updateWallet(@Request() req, @Param('id') userId: string, @Body('amount') amount: number, @Body('description') desc: string) {
    this.checkAdmin(req);
    return this.adminService.updateWallet(req.user.id, userId, amount, desc);
  }

  @Post('users/:id/reset-password')
  async resetUserPassword(@Request() req, @Param('id') userId: string) {
    this.checkAdmin(req);
    return this.adminService.resetUserPassword(req.user.id, userId);
  }

  @Get('reports')
  async getReports(@Request() req) {
    this.checkModerator(req);
    return this.adminService.getReports();
  }

  @Put('reports/:id/status')
  async updateReportStatus(@Request() req, @Param('id') id: string, @Body('status') status: string, @Body('adminNote') adminNote?: string) {
    this.checkModerator(req);
    return this.adminService.updateReportStatus(req.user.id, id, status, adminNote);
  }

  @Get('transactions')
  async getTransactions(@Request() req, @Query() query: any) {
    this.checkAdmin(req);
    return this.adminService.getTransactions(query);
  }

  @Get('payment-webhook-logs')
  async getPaymentWebhookLogs(@Request() req, @Query() query: any) {
    this.checkAdmin(req);
    return this.adminService.getPaymentWebhookLogs(query);
  }

  @Post('payment-webhook-logs/:id/retry')
  async retryPaymentWebhookLog(@Request() req, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.adminService.retryPaymentWebhookLog(req.user.id, id);
  }

  @Get('complaints')
  async getComplaints(@Request() req, @Query() query: any) {
    this.checkModerator(req);
    return this.adminService.getComplaints(query);
  }

  @Put('complaints/:id/status')
  async updateComplaintStatus(
    @Request() req,
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('resolution') resolution?: string,
  ) {
    this.checkModerator(req);
    return this.adminService.updateComplaintStatus(req.user.id, id, status, resolution);
  }

  @Get('audit-logs')
  async getAuditLogs(@Request() req, @Query() query: any) {
    this.checkAdmin(req);
    return this.adminService.getAuditLogs(query);
  }

  @Get('data-deletion-requests')
  async getDataDeletionRequests(@Request() req, @Query() query: any) {
    this.checkAdmin(req);
    return this.adminService.getDataDeletionRequests(query);
  }

  @Put('data-deletion-requests/:id/status')
  async updateDataDeletionRequest(@Request() req, @Param('id') id: string, @Body('status') status: string) {
    this.checkAdmin(req);
    return this.adminService.updateDataDeletionRequest(req.user.id, id, status);
  }

  @Get('requirements')
  async getRequirements(@Request() req, @Query() query: any) {
    this.checkModerator(req);
    return this.adminService.getRequirements(query);
  }

  @Patch('requirements/:id/status')
  async updateRequirementStatus(@Request() req, @Param('id') id: string, @Body('status') status: string, @Body('adminNote') adminNote?: string) {
    this.checkModerator(req);
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'MATCHED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Trạng thái không hợp lệ');
    }
    return this.adminService.updateRequirementStatus(req.user.id, id, status, adminNote);
  }

  @Delete('requirements/:id')
  async deleteRequirement(@Request() req, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.adminService.deleteRequirement(req.user.id, id);
  }

  @Get('export/properties')
  async exportProperties(@Request() req, @Query() query: any, @Res() res: Response) {
    this.checkAdmin(req);
    const csvData = await this.adminService.exportPropertiesCSV(query);
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment('properties.csv');
    // Add UTF-8 BOM for Excel
    return res.send('\uFEFF' + csvData);
  }

  @Get('export/requirements')
  async exportRequirements(@Request() req, @Query() query: any, @Res() res: Response) {
    this.checkAdmin(req);
    const csvData = await this.adminService.exportRequirementsCSV(query);
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment('requirements.csv');
    // Add UTF-8 BOM for Excel
    return res.send('\uFEFF' + csvData);
  }

  @Get('export/users')
  async exportUsers(@Request() req, @Query() query: any, @Res() res: Response) {
    this.checkAdmin(req);
    const csvData = await this.adminService.exportUsersCSV(query);
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment('users.csv');
    return res.send('\uFEFF' + csvData);
  }

  @Get('export/transactions')
  async exportTransactions(@Request() req, @Query() query: any, @Res() res: Response) {
    this.checkAdmin(req);
    const csvData = await this.adminService.exportTransactionsCSV(query);
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment('transactions.csv');
    return res.send('\uFEFF' + csvData);
  }

  @Put('properties/:id/status')
  async updatePropertyStatus(@Request() req, @Param('id') id: string, @Body('status') status: PropertyStatus) {
    this.checkModerator(req);
    if (req.user.role === 'MOD' && !['APPROVED', 'REJECTED', 'HIDDEN'].includes(status)) {
      throw new ForbiddenException('MOD chi duoc duyet, tu choi hoac an tin dang.');
    }
    return this.adminService.updatePropertyStatus(req.user.id, id, status);
  }

  @Post('sync-meilisearch')
  async syncMeilisearch(@Request() req) {
    this.checkAdmin(req);
    return this.adminService.syncMeilisearch();
  }

  // Settings Endpoints
  @Get('settings')
  async getSettings(@Request() req) {
    this.checkAdmin(req);
    return this.adminService.getSettings();
  }

  @Put('settings')
  async updateSettings(@Request() req, @Body() data: any) {
    this.checkAdmin(req);
    return this.adminService.updateSettings(data);
  }

  // Category Endpoints
  @Get('categories')
  async getCategories(@Request() req) {
    this.checkAdmin(req);
    return this.adminService.getCategories();
  }

  @Post('categories')
  async createCategory(@Request() req, @Body() data: { name: string, slug: string, isActive?: boolean, parentId?: string | null }) {
    this.checkAdmin(req);
    return this.adminService.createCategory(data);
  }

  @Put('categories/:id')
  async updateCategory(@Request() req, @Param('id') id: string, @Body() data: { name?: string, slug?: string, isActive?: boolean, parentId?: string | null }) {
    this.checkAdmin(req);
    return this.adminService.updateCategory(id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('categories/:id')
  async deleteCategory(@Request() req, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.adminService.deleteCategory(id);
  }

  // Location Endpoints
  @UseGuards(JwtAuthGuard)
  @Get('locations')
  async getLocations(@Request() req) {
    this.checkAdmin(req);
    return this.adminService.getLocations();
  }

  @UseGuards(JwtAuthGuard)
  @Post('locations')
  async createLocation(@Request() req, @Body() data: CreateLocationDto) {
    this.checkAdmin(req);
    return this.adminService.createLocation(data);
  }

  @UseGuards(JwtAuthGuard)
  @Put('locations/:id')
  async updateLocation(@Request() req, @Param('id') id: string, @Body() data: UpdateLocationDto) {
    this.checkAdmin(req);
    return this.adminService.updateLocation(id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('locations/:id')
  async deleteLocation(@Request() req, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.adminService.deleteLocation(id);
  }
}
