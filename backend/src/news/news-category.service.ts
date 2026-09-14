import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../property/property-utils';

@Injectable()
export class NewsCategoryService {
  constructor(private prisma: PrismaService) {}

  /** Công khai — chỉ chuyên mục đang bật, cho ô lọc trên `/news` và trang `/news/chuyen-muc/{slug}`. */
  findAllPublic() {
    return this.prisma.newsCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findAllAdmin() {
    return this.prisma.newsCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { news: true } } },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.newsCategory.findFirst({ where: { slug, isActive: true } });
  }

  /**
   * Slug sinh MỘT LẦN lúc tạo và giữ cố định — cùng nguyên tắc với `Project`/`Property`:
   * đổi tên chuyên mục không được làm gãy URL `/news/chuyen-muc/{slug}` đã lỡ chia sẻ/index.
   */
  async create(data: { name: string; description?: string; sortOrder?: number; isActive?: boolean }) {
    const name = (data.name || '').trim();
    if (!name) throw new BadRequestException('Tên chuyên mục không được để trống');

    const base = slugify(name) || 'chuyen-muc';
    let slug = base;
    let n = 2;
    while (await this.prisma.newsCategory.findUnique({ where: { slug } })) {
      slug = `${base}-${n++}`;
    }

    return this.prisma.newsCategory.create({
      data: {
        name,
        slug,
        description: data.description,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: { name?: string; description?: string; sortOrder?: number; isActive?: boolean }) {
    const current = await this.prisma.newsCategory.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Không tìm thấy chuyên mục');

    const patch: Record<string, any> = {};
    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) throw new BadRequestException('Tên chuyên mục không được để trống');
      patch.name = name;
    }
    if (data.description !== undefined) patch.description = data.description;
    if (data.sortOrder !== undefined) patch.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) patch.isActive = data.isActive;

    return this.prisma.newsCategory.update({ where: { id }, data: patch });
  }

  /** Chặn xoá chuyên mục còn bài — xoá thì bài mồ côi rơi về "không chuyên mục" âm thầm, dễ gây nhầm hơn là bắt admin tự dọn trước. */
  async remove(id: string) {
    const current = await this.prisma.newsCategory.findUnique({
      where: { id },
      include: { _count: { select: { news: true } } },
    });
    if (!current) throw new NotFoundException('Không tìm thấy chuyên mục');
    if (current._count.news > 0) {
      throw new BadRequestException(
        `Chuyên mục còn ${current._count.news} bài viết — chuyển hết bài sang chuyên mục khác trước khi xoá.`,
      );
    }
    return this.prisma.newsCategory.delete({ where: { id } });
  }
}
