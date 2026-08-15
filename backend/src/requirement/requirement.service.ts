import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { applyRangeKeys } from '../property/property-utils';

@Injectable()
export class RequirementService {
  constructor(private prisma: PrismaService) {}

  async getPublicRequirements(filters: any = {}) {
    const page = filters.page ? parseInt(filters.page, 10) : 1;
    const limit = filters.limit ? parseInt(filters.limit, 10) : 20;
    const skip = (page - 1) * limit;

    const where: any = { status: 'APPROVED' };
    if (filters.transactionType) where.transactionType = filters.transactionType;
    if (filters.propertyType) where.propertyType = filters.propertyType;

    const [data, total] = await Promise.all([
      this.prisma.requirement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          phone: true,
          transactionType: true,
          propertyType: true,
          content: true,
          priceMin: true,
          priceMax: true,
          areaMin: true,
          areaMax: true,
          createdAt: true,
        }
      }),
      this.prisma.requirement.count({ where })
    ]);

    return { data, total, page, limit };
  }

  async createRequirement(data: any) {
    if (data.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
      if (user) {
        if (!data.name) data.name = user.name;
        if (!data.phone) data.phone = user.phone;
        if (!data.email) data.email = user.email;
      }
    }

    if (!data.propertyType || !data.transactionType) {
      throw new BadRequestException('Vui lòng nhập đủ thông tin bắt buộc (Loại BĐS, Hình thức)');
    }

    const phoneStr = String(data.phone || '').trim();
    if (!phoneStr || !/^[0-9+\-\s().]{8,20}$/.test(phoneStr)) {
      throw new BadRequestException('Số điện thoại là bắt buộc và phải hợp lệ');
    }

    // Temporarily map CAN_THUE to CHO_THUE for applyRangeKeys to use Rent ranges
    const originalTransactionType = data.transactionType;
    if (data.transactionType === 'CAN_THUE') {
      data.transactionType = 'CHO_THUE';
    } else if (data.transactionType === 'CAN_MUA') {
      data.transactionType = 'BAN';
    }
    
    // Apply ranges
    applyRangeKeys(data);
    
    // Restore transactionType
    data.transactionType = originalTransactionType;

    const contentLines: string[] = [];
    contentLines.push(`Hình thức: ${data.transactionType === 'CAN_THUE' ? 'Cần thuê' : 'Cần mua'}`);
    if (data.title) contentLines.push(`Tiêu đề: ${String(data.title).trim()}`);
    if (data.direction) contentLines.push(`Hướng: ${String(data.direction).trim()}`);
    if (data.space) contentLines.push(`Không gian: ${String(data.space).trim()}`);
    if (data.amenities) contentLines.push(`Công năng: ${String(data.amenities).trim()}`);
    if (data.city || data.district || data.ward) {
      let wardText = data.ward;
      if (data.oldWard && String(data.oldWard).trim() && wardText) {
        wardText = `${wardText} (${String(data.oldWard).trim()})`;
      }
      const locText = [wardText, data.district, data.city].filter(Boolean).join(', ');
      contentLines.push(`Khu vực: ${locText}`);
    }
    if (data.description) contentLines.push(`Chi tiết: ${String(data.description).trim()}`);
    else contentLines.push(`Chi tiết: Người dùng chưa nhập mô tả chi tiết.`);
    
    // Normalize fields strictly to Requirement schema
    const normalized = {
      name: String(data.name || 'Khách hàng').trim(),
      phone: phoneStr,
      email: data.email ? String(data.email).trim() : null,
      transactionType: data.transactionType,
      propertyType: String(data.propertyType).trim(),
      content: contentLines.join('\n'),
      
      priceMin: data.priceMin ? Number(data.priceMin) : null,
      priceMax: data.priceMax ? Number(data.priceMax) : null,
      areaMin: data.areaMin ? Number(data.areaMin) : null,
      areaMax: data.areaMax ? Number(data.areaMax) : null,
      locationId: data.locationId ? String(data.locationId) : null,
      userId: data.userId ? String(data.userId) : null,
    };

    return this.prisma.requirement.create({
      data: normalized
    });
  }

  async getMyRequirements(userId: string) {
    return this.prisma.requirement.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
  async getRequirementById(userId: string, id: string) {
    const req = await this.prisma.requirement.findFirst({
      where: { id, userId }
    });
    if (!req) throw new BadRequestException('Không tìm thấy yêu cầu');
    return req;
  }

  async updateRequirement(userId: string, id: string, data: any) {
    const req = await this.getRequirementById(userId, id);
    if (!req) throw new BadRequestException('Không tìm thấy yêu cầu');
    
    const updateData: any = {
      name: data.name !== undefined ? data.name : req.name,
      phone: data.phone !== undefined ? data.phone : req.phone,
      email: data.email !== undefined ? data.email : req.email,
      transactionType: data.transactionType || req.transactionType,
      propertyType: data.propertyType !== undefined ? data.propertyType : req.propertyType,
      content: data.content !== undefined ? data.content : req.content,
      priceMin: data.priceMin !== undefined ? (data.priceMin ? Number(data.priceMin) : null) : req.priceMin,
      priceMax: data.priceMax !== undefined ? (data.priceMax ? Number(data.priceMax) : null) : req.priceMax,
      areaMin: data.areaMin !== undefined ? (data.areaMin ? Number(data.areaMin) : null) : req.areaMin,
      areaMax: data.areaMax !== undefined ? (data.areaMax ? Number(data.areaMax) : null) : req.areaMax,
      locationId: data.locationId !== undefined ? data.locationId : req.locationId,
      priceRangeKey: data.priceRangeKey,
      areaRangeKey: data.areaRangeKey
    };

    const originalTransactionType = updateData.transactionType;
    if (updateData.transactionType === 'CAN_THUE') {
      updateData.transactionType = 'CHO_THUE';
    } else if (updateData.transactionType === 'CAN_MUA') {
      updateData.transactionType = 'BAN';
    }

    applyRangeKeys(updateData);
    updateData.transactionType = originalTransactionType;

    return this.prisma.requirement.update({
      where: { id },
      data: updateData
    });
  }

  async deleteRequirement(userId: string, id: string) {
    const req = await this.getRequirementById(userId, id);
    if (!req) throw new BadRequestException('Không tìm thấy yêu cầu');

    return this.prisma.requirement.delete({
      where: { id }
    });
  }
}
