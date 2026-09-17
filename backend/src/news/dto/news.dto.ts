import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
  ValidateIf,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NewsStatus } from '@prisma/client';

/**
 * `content` không giới hạn MaxLength ở tầng validate — nó đi qua `sanitizeNewsHtml` trước
 * khi lưu, và độ dài HTML thô không nói lên gì về độ dài bài thật. Giới hạn thật nằm ở
 * `main.ts` (thân request JSON, 2MB).
 */
export class NewsSourceDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên nguồn không được để trống' })
  @MaxLength(200)
  title: string;

  // Không bắt buộc — khách báo 16/9 "ghi nguồn không hiển thị": nhiều nguồn thực tế chỉ là
  // tên (vd "Theo Sở Xây dựng"), không có link. Bản cũ bắt buộc URL hợp lệ khiến
  // `NewsForm.tsx` tự lọc bỏ NGAY những dòng chỉ có tên trước khi gửi lên, không báo lỗi gì —
  // admin tưởng đã lưu, mở lại bài thì mất trắng.
  @IsOptional()
  @ValidateIf((o) => o.url)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { message: 'Đường dẫn nguồn tham khảo không hợp lệ' })
  url?: string;
}

/**
 * `slug`, `previousSlugs`, `contentUpdatedAt`, `pricePerM2`-kiểu-suy-ra... không nhận từ
 * client — service tự tính, giống hệt cách `Property`/`Project` đang làm.
 */
export class CreateNewsDto {
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  sapo?: string;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung không được để trống' })
  content: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  thumbnailAlt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbnailCaption?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  thumbnailCredit?: string;

  @IsOptional()
  thumbnailWidth?: number;

  @IsOptional()
  thumbnailHeight?: number;

  @IsOptional()
  @IsEnum(NewsStatus, { message: 'Trạng thái không hợp lệ' })
  status?: NewsStatus;

  // Cho phép hẹn giờ TƯƠNG LAI — đó chính là "hẹn giờ đăng". Không giới hạn cận trên.
  @IsOptional()
  @IsDateString({}, { message: 'Ngày đăng không hợp lệ' })
  publishedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  authorName?: string;

  // Rỗng chuỗi = "bỏ chuyên mục", khác `undefined` = "không đụng tới". DTO chỉ kiểm khi có
  // giá trị thật; service tự quyết định null hoá chuỗi rỗng (xem NewsService).
  @ValidateIf((o) => o.categoryId !== null && o.categoryId !== '')
  @IsOptional()
  @IsUUID('4', { message: 'Chuyên mục không hợp lệ' })
  categoryId?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20, { message: 'Tối đa 20 nguồn tham khảo' })
  @ValidateNested({ each: true })
  @Type(() => NewsSourceDto)
  sources?: NewsSourceDto[];

  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'SEO title tối đa 120 ký tự' })
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320, { message: 'Meta description tối đa 320 ký tự' })
  metaDescription?: string;

  // Chấp nhận đường dẫn tương đối ("/news/bai-viet-khac") HOẶC URL tuyệt đối — canonical
  // trỏ sang site khác là lựa chọn hợp lệ (bài đăng lại từ nguồn ngoài).
  @ValidateIf((o) => o.canonicalUrl)
  @IsString()
  @MaxLength(500)
  canonicalUrl?: string;

  // Luôn là id THẬT (uuid) của Property, đã qua endpoint /news/admin/resolve-properties
  // (news-related.ts parsePropertyRefList) — không nhận shortCode/link thô ở đây, DTO này
  // chỉ lưu, không tự tra cứu.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12, { message: 'Tối đa 12 tin liên quan' })
  @IsUUID('4', { each: true, message: 'Mã tin liên quan không hợp lệ' })
  relatedPropertyIds?: string[];

  // Cờ riêng cho service (KHÔNG lưu xuống DB) — admin sửa lỗi chính tả nhỏ thì tích để
  // không đẩy `contentUpdatedAt`/sitemap <lastmod> lên vì một dấu phẩy.
  @IsOptional()
  @IsBoolean()
  minorEdit?: boolean;
}

export class UpdateNewsDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  sapo?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  thumbnailAlt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbnailCaption?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  thumbnailCredit?: string;

  @IsOptional()
  thumbnailWidth?: number;

  @IsOptional()
  thumbnailHeight?: number;

  @IsOptional()
  @IsEnum(NewsStatus, { message: 'Trạng thái không hợp lệ' })
  status?: NewsStatus;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày đăng không hợp lệ' })
  publishedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  authorName?: string;

  @ValidateIf((o) => o.categoryId !== null && o.categoryId !== '')
  @IsOptional()
  @IsUUID('4', { message: 'Chuyên mục không hợp lệ' })
  categoryId?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20, { message: 'Tối đa 20 nguồn tham khảo' })
  @ValidateNested({ each: true })
  @Type(() => NewsSourceDto)
  sources?: NewsSourceDto[];

  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'SEO title tối đa 120 ký tự' })
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320, { message: 'Meta description tối đa 320 ký tự' })
  metaDescription?: string;

  @ValidateIf((o) => o.canonicalUrl)
  @IsString()
  @MaxLength(500)
  canonicalUrl?: string;

  // Luôn là id THẬT (uuid) của Property, đã qua endpoint /news/admin/resolve-properties
  // (news-related.ts parsePropertyRefList) — không nhận shortCode/link thô ở đây, DTO này
  // chỉ lưu, không tự tra cứu.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12, { message: 'Tối đa 12 tin liên quan' })
  @IsUUID('4', { each: true, message: 'Mã tin liên quan không hợp lệ' })
  relatedPropertyIds?: string[];

  @IsOptional()
  @IsBoolean()
  minorEdit?: boolean;
}
