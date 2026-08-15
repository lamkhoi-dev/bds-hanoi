import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SeoService } from '../seo/seo.service';
import { slugify } from '../property/property-utils';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

const LOCATION_FIELDS = [
  'city',
  'district',
  'ward',
  'oldWard',
  'provinceId',
  'districtId',
  'wardId',
] as const;

function pickLocationFields(dto: Partial<CreateProjectDto>) {
  const out: Record<string, any> = {};
  for (const f of LOCATION_FIELDS) if (dto[f] !== undefined) out[f] = dto[f];
  return out;
}

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private seoService: SeoService,
  ) {}

  /**
   * Mã ngắn cho URL `/du-an/{slug}-{shortCode}`.
   *
   * Số dự án rất ít (vài chục, có thể vài trăm) nên không cần sequence Postgres như
   * Property — retry-loop kiểu `generateUniquePropertyCode` là đủ và không cần
   * migration riêng.
   */
  private async nextShortCode(): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 7);
      const existing = await this.prisma.project.findUnique({ where: { shortCode: code } });
      if (!existing) return code;
    }
    throw new Error('Không sinh được mã dự án sau 10 lần thử');
  }

  /** Slug sinh MỘT LẦN lúc tạo, giữ nguyên khi đổi tên — URL không đổi theo tên. */
  private async uniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || 'du-an';
    let slug = base;
    for (let i = 2; await this.prisma.project.findFirst({ where: { slug } }); i++) {
      slug = `${base}-${i}`;
    }
    return slug;
  }

  async create(dto: CreateProjectDto) {
    const [shortCode, slug] = await Promise.all([this.nextShortCode(), this.uniqueSlug(dto.name)]);
    const project = await this.prisma.project.create({
      data: {
        name: dto.name.trim(),
        slug,
        shortCode,
        thumbnail: dto.thumbnail,
        description: dto.description,
        status: dto.status ?? 'VISIBLE',
        contentUpdatedAt: new Date(),
        ...pickLocationFields(dto),
      },
    });
    await this.seoService.invalidate().catch(() => undefined);
    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Không tìm thấy dự án');

    // Đổi TÊN không đổi slug — URL đã lỡ index thì giữ nguyên. Muốn đổi URL là quyết
    // định riêng, không phải hệ quả tự động của việc sửa lỗi chính tả trong tên hiển thị.
    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.thumbnail !== undefined ? { thumbnail: dto.thumbnail } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...pickLocationFields(dto),
        contentUpdatedAt: new Date(),
      },
    });
    await this.seoService.invalidate().catch(() => undefined);
    return project;
  }

  /** Ẩn thay vì xoá cứng — tin đã gắn `projectId` không nên mất liên kết đột ngột. */
  async remove(id: string) {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Không tìm thấy dự án');
    await this.prisma.project.update({ where: { id }, data: { status: 'HIDDEN', contentUpdatedAt: new Date() } });
    await this.seoService.invalidate().catch(() => undefined);
    return { success: true };
  }

  /** Danh sách công khai cho trang /du-an và dropdown chọn dự án ở form đăng tin. */
  async findPublicList() {
    return this.prisma.project.findMany({
      where: { status: 'VISIBLE' },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { properties: true } } },
    });
  }

  /** Toàn bộ dự án cho bảng quản trị — gồm cả HIDDEN. */
  async findAllForAdmin() {
    return this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { properties: true } } },
    });
  }

  async findById(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Không tìm thấy dự án');
    return project;
  }

  /**
   * Tra theo `{slug}-{shortCode}` cho trang chi tiết công khai.
   *
   * Chỉ cần `shortCode` là đủ để tra ra đúng dự án (unique toàn cục) — `slug` chỉ dùng
   * để dựng URL đẹp, không tham gia điều kiện WHERE. Cùng nguyên tắc với
   * `parseListingRef`/`shortCode` của Property.
   */
  async findByShortCode(shortCode: string) {
    return this.prisma.project.findFirst({ where: { shortCode, status: 'VISIBLE' } });
  }

  /**
   * 4 dự án có bài đăng MỚI NHẤT cho trang chủ (mục 11) — sắp theo tin mới nhất TRONG
   * dự án, không phải theo ngày tạo dự án. Dự án chưa có tin nào bị loại: hiện một dự
   * án trống trên trang chủ không có giá trị gì cho người dùng.
   */
  async findLatestForHomepage(limit = 4) {
    const groups = await this.prisma.property.groupBy({
      by: ['projectId'],
      where: {
        projectId: { not: null },
        status: { in: ['APPROVED', 'SOLD'] },
        deletedAt: null,
        project: { status: 'VISIBLE' },
      },
      _max: { publishedAt: true },
    });

    const ranked = groups
      .filter((g) => g.projectId)
      .sort((a, b) => {
        const at = a._max.publishedAt?.getTime() ?? 0;
        const bt = b._max.publishedAt?.getTime() ?? 0;
        return bt - at;
      })
      .slice(0, limit);

    if (ranked.length === 0) return [];

    const projects = await this.prisma.project.findMany({
      where: { id: { in: ranked.map((r) => r.projectId as string) } },
    });
    const byId = new Map(projects.map((p) => [p.id, p]));

    // Giữ đúng thứ tự đã xếp theo tin mới nhất, không theo thứ tự trả về của findMany.
    return ranked.map((r) => byId.get(r.projectId as string)).filter(Boolean);
  }
}
