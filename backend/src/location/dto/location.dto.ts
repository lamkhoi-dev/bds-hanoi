import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { LocationType } from '@prisma/client';

/**
 * Trước đây các endpoint admin cho Location nhận `@Body() data: { ... }` kiểu inline —
 * TypeScript xoá kiểu lúc biên dịch nên ValidationPipe không có gì để kiểm, tức là
 * không hề validate. DTO thật cho phép `whitelist: true` loại bỏ trường lạ và
 * `@IsEnum` chặn giá trị type sai.
 *
 * `slug`, `urlSegment`, `path`, `depth` KHÔNG nhận từ client: chúng được suy ra để
 * khu vực admin tạo tay và khu vực nhập từ file theo cùng một quy tắc URL.
 */
export class CreateLocationDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên khu vực không được để trống' })
  @MaxLength(120)
  name: string;

  @IsEnum(LocationType, { message: 'Loại khu vực phải là CITY, DISTRICT, WARD hoặc OLD_WARD' })
  type: LocationType;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isSeoEnabled?: boolean;
}

export class UpdateLocationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEnum(LocationType)
  type?: LocationType;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isSeoEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
