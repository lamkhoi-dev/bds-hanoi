import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { LocationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface LocationNodeDto {
  id: string;
  name: string;
  shortName: string;
  type: LocationType;
  parentId: string | null;
  urlSegment: string;
  path: string;
  depth: number;
  sortOrder: number;
  /** Nhãn nhóm điều hướng ("Trung tâm"…). null = tỉnh này không phân nhóm. */
  group: string | null;
  groupOrder: number;
  isFeatured: boolean;
  isSeoEnabled: boolean;
}

export interface ResolvedLocation extends LocationNodeDto {
  /** Từ tỉnh xuống tới cấp cha gần nhất, dùng dựng breadcrumb không cần truy vấn đệ quy. */
  ancestors: LocationNodeDto[];
  hasChildren: boolean;
}

interface Snapshot {
  bySegment: Map<string, LocationNodeDto>;
  byId: Map<string, LocationNodeDto>;
  childrenOf: Map<string, LocationNodeDto[]>;
  all: LocationNodeDto[];
  loadedAt: number;
}

/**
 * Tra cứu khu vực + tên hiển thị.
 *
 * Vì sao cần cache trong tiến trình: route bắt-tất cả `[...slug]` của frontend là
 * `force-dynamic` và fetch với `cache: 'no-store'`, nên KHÔNG có cache trang nào che
 * phía sau — mỗi request đều gọi vào đây. Toàn bộ cây Hà Nội chỉ 736 bản ghi (~200KB),
 * giữ trong Map cho tra cứu O(1) và miễn nhiễm khi Redis lạnh.
 */
@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private snapshot: Snapshot | null = null;
  private loading: Promise<Snapshot> | null = null;

  constructor(private prisma: PrismaService) {}

  /**
   * Tỉnh/thành mà site này phục vụ. Dữ liệu ngoài phạm vi bị lọc bỏ ở mọi truy vấn.
   *
   * Nhận DANH SÁCH ngăn cách bằng dấu phẩy: site "Nhà đất xứ Nghệ" phục vụ cả Nghệ An
   * lẫn Hà Tĩnh, nên một giá trị đơn sẽ cắt mất nửa dữ liệu đang chạy.
   * Ví dụ: ACTIVE_PROVINCE_SLUG="nghe-an,ha-tinh"
   */
  private get provinceSlugs(): string[] {
    const raw = process.env.ACTIVE_PROVINCE_SLUG || 'ha-noi';
    const list = raw.split(',').map((s) => s.trim()).filter(Boolean);
    return list.length > 0 ? list : ['ha-noi'];
  }

  /** Gọi sau khi import hoặc khi admin sửa khu vực. */
  invalidate(): void {
    this.snapshot = null;
    this.loading = null;
  }

  private async load(): Promise<Snapshot> {
    const rows = await this.prisma.location.findMany({
      where: {
        isActive: true,
        OR: this.provinceSlugs.flatMap((slug) => [
          { path: slug },
          { path: { startsWith: `${slug}/` } },
        ]),
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        type: true,
        parentId: true,
        urlSegment: true,
        path: true,
        depth: true,
        sortOrder: true,
        group: true,
        groupOrder: true,
        isFeatured: true,
        isSeoEnabled: true,
      },
      orderBy: [{ depth: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });

    const bySegment = new Map<string, LocationNodeDto>();
    const byId = new Map<string, LocationNodeDto>();
    const childrenOf = new Map<string, LocationNodeDto[]>();

    for (const row of rows) {
      bySegment.set(row.urlSegment, row);
      byId.set(row.id, row);
    }
    for (const row of rows) {
      const key = row.parentId ?? '';
      const list = childrenOf.get(key);
      if (list) list.push(row);
      else childrenOf.set(key, [row]);
    }

    this.logger.log(`Đã nạp ${rows.length} khu vực cho: ${this.provinceSlugs.join(", ")}`);
    return { bySegment, byId, childrenOf, all: rows, loadedAt: Date.now() };
  }

  /** Nạp một lần; các request đồng thời cùng chờ một promise. */
  private async getSnapshot(): Promise<Snapshot> {
    if (this.snapshot) return this.snapshot;
    if (!this.loading) {
      this.loading = this.load()
        .then((s) => {
          this.snapshot = s;
          return s;
        })
        .finally(() => {
          this.loading = null;
        });
    }
    return this.loading;
  }

  /**
   * Tra một đoạn URL. Ném 404 khi không có — trước đây backend âm thầm chuyển sang
   * tìm kiếm toàn văn `filters.q = slug.replace(/-/g,' ')`, khiến MỌI URL rác đều ra
   * một trang 200 index được (Search Console đã thu thập cả `/nha-rieng/$`).
   */
  async resolveSegment(segment: string): Promise<ResolvedLocation> {
    const snap = await this.getSnapshot();
    const node = snap.bySegment.get(segment);
    if (!node) throw new NotFoundException(`Không tìm thấy khu vực "${segment}"`);

    const ancestors: LocationNodeDto[] = [];
    let cursor = node.parentId ? snap.byId.get(node.parentId) : undefined;
    while (cursor) {
      ancestors.unshift(cursor);
      cursor = cursor.parentId ? snap.byId.get(cursor.parentId) : undefined;
    }

    return {
      ...node,
      ancestors,
      hasChildren: (snap.childrenOf.get(node.id)?.length ?? 0) > 0,
    };
  }

  /**
   * Từ điển phẳng {urlSegment -> tên} cho frontend.
   *
   * Đây là thứ thay thế `formatSlugToName` — hàm dựng tên từ slug bằng từ điển
   * hard-code, và với khu vực không có trong từ điển thì viết hoa thô, ra
   * "phường Truong Vinh" thay vì "phường Trường Vinh". Tên có dấu chỉ có thể lấy
   * từ DB, không suy ngược từ slug được.
   */
  async getSegmentDictionary() {
    const snap = await this.getSnapshot();
    const dict: Record<string, { name: string; shortName: string; type: LocationType; parent?: string }> = {};
    for (const node of snap.all) {
      const parent = node.parentId ? snap.byId.get(node.parentId) : undefined;
      dict[node.urlSegment] = {
        name: node.name,
        shortName: node.shortName,
        type: node.type,
        ...(parent ? { parent: parent.urlSegment } : {}),
      };
    }
    return dict;
  }

  /** Cây tỉnh -> quận/huyện -> (phường xã mới + cũ), cho bộ lọc và form đăng tin. */
  async getTree() {
    const snap = await this.getSnapshot();
    const province = snap.all.find((n) => n.type === LocationType.CITY) ?? null;
    if (!province) return null;

    const districts = (snap.childrenOf.get(province.id) ?? []).map((district) => {
      const children = snap.childrenOf.get(district.id) ?? [];
      return {
        ...district,
        wards: children.filter((c) => c.type === LocationType.WARD),
        oldWards: children.filter((c) => c.type === LocationType.OLD_WARD),
      };
    });

    return { ...province, districts };
  }

  /** Khu vực nổi bật cho các tab trên trang chủ. */
  async getFeatured(type?: LocationType) {
    const snap = await this.getSnapshot();
    return snap.all.filter((n) => n.isFeatured && (!type || n.type === type));
  }

  /** Khu vực được phép đưa vào sitemap. */
  async getSeoLocations() {
    const snap = await this.getSnapshot();
    return snap.all.filter((n) => n.isSeoEnabled);
  }

  /**
   * Giữ nguyên hình dạng cũ (mảng phẳng DISTRICT kèm children) cho các màn hình chưa
   * chuyển sang /locations/tree.
   *
   * Sửa luôn lỗi: bản cũ chỉ áp bộ lọc theo tỉnh KHI có tham số `city`, nên gọi
   * `/locations` không tham số sẽ trả về mọi quận/huyện TOÀN QUỐC — đó là gốc của
   * việc bộ lọc hiện xã của tỉnh khác và danh sách quận bị lặp.
   */
  async getLocations(city?: string) {
    const snap = await this.getSnapshot();
    const province = snap.all.find((n) => n.type === LocationType.CITY);
    if (!province) return [];
    if (city && city.trim() && city.trim() !== province.name && city.trim() !== province.shortName) {
      return [];
    }

    return (snap.childrenOf.get(province.id) ?? []).map((district) => ({
      id: district.id,
      name: district.name,
      shortName: district.shortName,
      type: district.type,
      slug: district.urlSegment,
      parentId: district.parentId,
      // Nhãn nhóm menu ngang. null với tỉnh không phân nhóm (Nghệ An) -> frontend
      // giữ menu phẳng, nên cùng một build phục vụ được cả hai site.
      group: district.group,
      groupOrder: district.groupOrder,
      parent: { id: province.id, name: province.name },
      children: (snap.childrenOf.get(district.id) ?? []).map((child) => ({
        id: child.id,
        name: child.name,
        shortName: child.shortName,
        type: child.type,
        slug: child.urlSegment,
        isSeoEnabled: child.isSeoEnabled,
      })),
    }));
  }
}
