import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  async getLocations(city?: string) {
    const where: any = { type: 'DISTRICT' };

    if (city) {
      where.parent = { name: city };
    }

    return this.prisma.location.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true } },
        children: {
          select: { id: true, name: true, type: true, slug: true, isSeoEnabled: true },
        },
      },
    });
  }

  async seedHaTinh() {
    let haTinh = await this.prisma.location.findFirst({
      where: { name: 'Hà Tĩnh', type: 'CITY' },
    });
    if (!haTinh) {
      haTinh = await this.prisma.location.create({
        data: { name: 'Hà Tĩnh', type: 'CITY' },
      });
    }

    const districts = [
      'Thành phố Hà Tĩnh',
      'Thị xã Hồng Lĩnh',
      'Thị xã Kỳ Anh',
      'Huyện Cẩm Xuyên',
      'Huyện Can Lộc',
      'Huyện Đức Thọ',
      'Huyện Hương Khê',
      'Huyện Hương Sơn',
      'Huyện Kỳ Anh',
      'Huyện Lộc Hà',
      'Huyện Nghi Xuân',
      'Huyện Thạch Hà',
      'Huyện Vũ Quang',
    ];

    for (const d of districts) {
      const existing = await this.prisma.location.findFirst({
        where: { name: d, parentId: haTinh.id, type: 'DISTRICT' },
      });
      if (!existing) {
        await this.prisma.location.create({
          data: { name: d, type: 'DISTRICT', parentId: haTinh.id },
        });
      }
    }

    return { message: 'Seeded Hà Tĩnh successfully' };
  }
}
