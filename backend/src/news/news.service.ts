import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../property/property-utils';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Sinh slug không dấu và duy nhất.
   *
   * Trước đây chỗ này dùng `title.toLowerCase().replace(/[^a-z0-9]+/g, '-')` — không
   * chuẩn hoá NFD nên mọi ký tự có dấu đều rơi ra ngoài [a-z0-9] và bị xoá:
   *   "Thông qua hồ sơ điều chỉnh" -> "th-ng-qua-h-s-i-u-ch-nh"
   * Dùng chung `slugify` với Property để hai bên không lệch nhau.
   */
  private async generateUniqueSlug(source: string, excludeId?: string): Promise<string> {
    const base = slugify(source) || 'tin-tuc';
    const taken = await this.prisma.news.findUnique({ where: { slug: base } });
    if (!taken || taken.id === excludeId) return base;
    // Gắn hậu tố ngẫu nhiên thay vì vòng lặp đếm, tránh N+1 query khi trùng nhiều.
    return `${base}-${Math.random().toString(36).substring(2, 8)}`;
  }

  async create(data: any) {
    const { slug: rawSlug, ...rest } = data;
    const slug = await this.generateUniqueSlug(rawSlug || rest.title);
    return this.prisma.news.create({ data: { ...rest, slug } });
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

  /**
   * Tra theo id, slug hiện tại, hoặc slug cũ. Khi khớp slug cũ vẫn trả về bài viết
   * kèm slug hiện tại — frontend so sánh rồi `permanentRedirect`, đúng cơ chế đang
   * dùng ở /tin/[slug_id].
   */
  async findOne(idOrSlug: string) {
    const found = await this.prisma.news.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (found) return found;

    return this.prisma.news.findFirst({
      where: { previousSlugs: { has: idOrSlug } },
    });
  }

  async update(id: string, data: any) {
    const current = await this.prisma.news.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Không tìm thấy bài viết');

    const { slug: rawSlug, ...rest } = data;
    const patch: any = { ...rest };

    // Đổi tiêu đề (hoặc truyền slug mới) thì sinh lại slug và giữ slug cũ để 301.
    const source = rawSlug || rest.title;
    if (source && slugify(source) !== current.slug) {
      const next = await this.generateUniqueSlug(source, id);
      if (next !== current.slug) {
        patch.slug = next;
        patch.previousSlugs = Array.from(
          new Set([...(current.previousSlugs ?? []), current.slug]),
        );
      }
    }

    return this.prisma.news.update({ where: { id }, data: patch });
  }

  async remove(id: string) {
    const current = await this.prisma.news.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Không tìm thấy bài viết');
    return this.prisma.news.delete({ where: { id } });
  }
}
