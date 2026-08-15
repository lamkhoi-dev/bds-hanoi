import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    if (!data.slug) {
        data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    return this.prisma.news.create({ data });
  }

  async findAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.news.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.news.count(),
    ]);
    return { data, total, page, limit };
  }

  findOne(idOrSlug: string) {
    return this.prisma.news.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug }
        ]
      }
    });
  }

  update(id: string, data: any) {
    return this.prisma.news.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.news.delete({ where: { id } });
  }
}
