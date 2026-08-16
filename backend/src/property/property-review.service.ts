import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { SeoService } from '../seo/seo.service';
import { normalizePropertyPayload } from './property-utils';

/**
 * Quy trình duyệt tin HAI CHIỀU (PHẦN I).
 *
 * Trước đây admin chỉ có duyệt hoặc từ chối. Khách muốn thêm một nhánh nữa vì phần lớn
 * tin bị lỗi nhỏ — sai chính tả, sai chuyên mục, nhập nhầm đơn vị giá — mà từ chối thì
 * nặng tay còn tự sửa rồi duyệt luôn thì người đăng không biết tin của mình đã bị đổi gì.
 *
 *   Người đăng gửi tin            -> PENDING
 *   Admin duyệt luôn              -> APPROVED
 *   Admin sửa rồi duyệt luôn      -> APPROVED  (kèm thông báo nêu rõ đã sửa gì)
 *   Admin sửa rồi trả về          -> AWAITING_AUTHOR
 *   Người đăng gửi lại            -> PENDING
 *   Admin duyệt lần cuối          -> APPROVED
 *
 * Mọi lần sửa đều ghi vào `PropertyHistory`, và người đăng luôn nhận thông báo liệt kê
 * đúng những trường đã đổi kèm giá trị trước/sau.
 */

/** Tên hiển thị tiếng Việt của các trường, để thông báo đọc được chứ không phải tên cột. */
const FIELD_LABEL: Record<string, string> = {
  title: 'Tiêu đề',
  description: 'Mô tả',
  price: 'Giá',
  area: 'Diện tích',
  propertyType: 'Loại bất động sản',
  transactionType: 'Hình thức giao dịch',
  priceRangeKey: 'Khoảng giá',
  areaRangeKey: 'Khoảng diện tích',
  city: 'Tỉnh/Thành phố',
  district: 'Quận/Huyện',
  ward: 'Phường/Xã',
  oldWard: 'Phường/Xã cũ',
  street: 'Đường/Phố',
  bedrooms: 'Số phòng ngủ',
  bathrooms: 'Số phòng tắm',
  direction: 'Hướng',
  legalStatus: 'Pháp lý',
};

/** Trường được phép sửa khi kiểm duyệt. Không cho đụng chủ tin, gói tin hay trạng thái. */
const EDITABLE_FIELDS = Object.keys(FIELD_LABEL);

/**
 * 3 FK địa điểm — ghi ĐỒNG THỜI với city/district/ward/oldWard ở trên khi admin sửa
 * địa điểm, để breadcrumb và bộ lọc theo wardId không lệch với địa chỉ hiển thị. Cố
 * tình KHÔNG đưa vào FIELD_LABEL/EDITABLE_FIELDS: đây là cột kỹ thuật (uuid), hiện
 * "provinceId: uuid-xxx → uuid-yyy" trong lịch sử/thông báo cho người đăng là vô nghĩa.
 */
const LOCATION_ID_FIELDS = ['provinceId', 'districtId', 'wardId'];

export interface FieldChange {
  field: string;
  label: string;
  before: string;
  after: string;
}

@Injectable()
export class PropertyReviewService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private seoService: SeoService,
  ) {}

  private format(value: unknown): string {
    if (value === null || value === undefined || value === '') return '(trống)';
    if (typeof value === 'number') return value.toLocaleString('vi-VN');
    const s = String(value);
    return s.length > 120 ? `${s.slice(0, 120)}…` : s;
  }

  /** So sánh tin hiện tại với payload admin gửi lên, chỉ giữ trường THỰC SỰ đổi. */
  private diff(current: any, patch: Record<string, any>): FieldChange[] {
    const out: FieldChange[] = [];
    for (const field of EDITABLE_FIELDS) {
      if (!(field in patch)) continue;
      const before = current[field];
      const after = patch[field];
      // So sánh qua chuỗi để 2 và "2", Decimal(2) và 2 không bị coi là khác nhau.
      const b = before === null || before === undefined ? '' : String(before);
      const a = after === null || after === undefined ? '' : String(after);
      if (b === a) continue;
      out.push({
        field,
        label: FIELD_LABEL[field] ?? field,
        before: this.format(before),
        after: this.format(after),
      });
    }
    return out;
  }

  /**
   * Admin kiểm duyệt tin.
   *
   * @param patch      Các trường admin sửa. Rỗng = duyệt luôn không sửa gì.
   * @param returnToAuthor  true = trả về cho người đăng kiểm tra lại (AWAITING_AUTHOR),
   *                        false = duyệt đăng luôn (APPROVED).
   */
  async review(
    adminId: string,
    propertyId: string,
    patch: Record<string, any>,
    returnToAuthor: boolean,
    note?: string,
  ) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Không tìm thấy bất động sản');

    const normalized = Object.keys(patch ?? {}).length
      ? normalizePropertyPayload({ ...patch })
      : {};
    // Chỉ nhận đúng các trường cho phép — payload thừa bị bỏ, không ghi đè bừa.
    const safePatch: Record<string, any> = {};
    for (const f of EDITABLE_FIELDS) {
      if (f in normalized) safePatch[f] = (normalized as any)[f];
    }
    // Đồng bộ FK địa điểm cùng lúc — xem giải thích ở LOCATION_ID_FIELDS.
    for (const f of LOCATION_ID_FIELDS) {
      if (f in normalized) safePatch[f] = (normalized as any)[f];
    }

    const changes = this.diff(property, safePatch);
    const nextStatus = returnToAuthor ? 'AWAITING_AUTHOR' : 'APPROVED';

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.property.update({
        where: { id: propertyId },
        data: {
          ...safePatch,
          status: nextStatus as any,
          contentUpdatedAt: new Date(),
          ...(nextStatus === 'APPROVED'
            ? { publishedAt: property.publishedAt ?? new Date(), pushedAt: new Date(), deletedAt: null }
            : {}),
        },
      });

      if (changes.length > 0) {
        await tx.propertyHistory.create({
          data: {
            propertyId,
            changedById: adminId,
            changedBy: 'ADMIN',
            changes: JSON.stringify({ note: note ?? null, returnToAuthor, changes }),
          },
        });
      }
      return p;
    });

    await this.seoService.invalidate().catch(() => undefined);
    await this.notifyAuthor(property.userId, property.title, changes, returnToAuthor, note);
    return { property: updated, changes };
  }

  /** Thông báo cho người đăng, NÊU RÕ admin đã sửa gì chứ không chỉ báo "tin đã được sửa". */
  private async notifyAuthor(
    userId: string,
    title: string,
    changes: FieldChange[],
    returnToAuthor: boolean,
    note?: string,
  ) {
    if (!userId) return;

    const lines: string[] = [];
    if (changes.length > 0) {
      lines.push('Quản trị viên đã chỉnh sửa:');
      for (const c of changes) lines.push(`• ${c.label}: "${c.before}" → "${c.after}"`);
    }
    if (note) lines.push(`Ghi chú: ${note}`);
    lines.push(
      returnToAuthor
        ? 'Vui lòng kiểm tra lại và bấm "Gửi duyệt lại" nếu bạn đồng ý.'
        : 'Tin của bạn đã được duyệt đăng.',
    );

    await this.notificationService
      .createNotification(
        userId,
        returnToAuthor ? `Cần bạn kiểm tra lại: ${title}` : `Tin đã được duyệt: ${title}`,
        lines.join('\n'),
      )
      .catch(() => undefined);
  }

  /** Người đăng xem xong phần admin sửa và gửi duyệt lại. */
  async resubmit(userId: string, propertyId: string) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Không tìm thấy bất động sản');
    if (property.userId !== userId) {
      throw new ForbiddenException('Bạn không phải người đăng tin này');
    }
    if (property.status !== ('AWAITING_AUTHOR' as any)) {
      throw new ForbiddenException('Tin này không ở trạng thái chờ bạn kiểm tra lại');
    }

    return this.prisma.property.update({
      where: { id: propertyId },
      data: { status: 'PENDING' as any, contentUpdatedAt: new Date() },
    });
  }

  /** Lịch sử chỉnh sửa của một tin, mới nhất trước. */
  async history(propertyId: string) {
    const rows = await this.prisma.propertyHistory.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
      include: { changedByUser: { select: { id: true, name: true } } },
    });

    return rows.map((r) => {
      let parsed: any = null;
      try {
        parsed = JSON.parse(r.changes);
      } catch {
        parsed = null;
      }
      return {
        id: r.id,
        createdAt: r.createdAt,
        by: r.changedByUser?.name ?? r.changedBy ?? 'Hệ thống',
        note: parsed?.note ?? null,
        returnedToAuthor: Boolean(parsed?.returnToAuthor),
        changes: (parsed?.changes ?? []) as FieldChange[],
      };
    });
  }
}
