import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ProjectStatus } from '@prisma/client';

/**
 * `slug` và `shortCode` KHÔNG nhận từ client — sinh ở service lúc tạo, giữ nguyên khi
 * đổi tên (URL không đổi theo tên, giống `Property.slug`/`shortCode`).
 *
 * 7 trường địa điểm (4 chuỗi hiển thị + 3 id quan hệ) nhận trực tiếp từ client, ĐÚNG
 * hình dạng và cách làm mà `post/page.tsx` đã dùng cho Property từ trước: frontend tự
 * suy `provinceId/districtId/wardId` bằng cách so tên với cây khu vực đã tải
 * (`useLocations()`), backend chỉ lưu lại. Không dựng thêm một API "resolve theo
 * locationId" thứ hai cho cùng một việc.
 */
export class CreateProjectDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên dự án không được để trống' })
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsString()
  @IsNotEmpty({ message: 'Mô tả dự án không được để trống' })
  description: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsString()
  oldWard?: string;

  @IsOptional()
  @IsString()
  provinceId?: string;

  @IsOptional()
  @IsString()
  districtId?: string;

  @IsOptional()
  @IsString()
  wardId?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsString()
  oldWard?: string;

  @IsOptional()
  @IsString()
  provinceId?: string;

  @IsOptional()
  @IsString()
  districtId?: string;

  @IsOptional()
  @IsString()
  wardId?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}
