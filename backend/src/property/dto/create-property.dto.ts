import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, Min } from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  transactionType: string;

  @IsString()
  propertyType: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  // `applyProjectLocation` (property-utils.ts) đọc field này để khoá 4 field địa điểm
  // theo đúng dự án — nhưng DTO chưa từng khai báo nó, nên ValidationPipe({whitelist:
  // true}) âm thầm xoá khỏi MỌI request tạo/sửa tin. Hậu quả: tính năng "gắn tin vào Dự
  // án" không hoạt động qua API dù đã viết đủ logic — kiểm chứng trên Nghệ An chỉ có
  // 2/178 tin có projectId (chắc chắn set tay, không qua form đăng tin).
  @IsOptional()
  @IsString()
  projectId?: string;

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
  street?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  area?: number;

  @IsOptional()
  @IsString()
  priceRangeKey?: string;

  @IsOptional()
  @IsString()
  areaRangeKey?: string;

  @IsOptional()
  @IsNumber()
  priceMin?: number;

  @IsOptional()
  @IsNumber()
  priceMax?: number;

  @IsOptional()
  @IsNumber()
  areaMin?: number;

  @IsOptional()
  @IsNumber()
  areaMax?: number;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsBoolean()
  isExactLocation?: boolean;

  @IsOptional()
  @IsString()
  direction?: string;

  @IsOptional()
  @IsString()
  amenities?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

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
  @IsBoolean()
  isNegotiable?: boolean;

  // New fields
  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  floors?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  frontage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  roadWidth?: number;

  @IsOptional()
  @IsString()
  legal?: string;

  @IsOptional()
  @IsString()
  furniture?: string;

  @IsOptional()
  @IsString()
  surroundings?: string;

  @IsOptional()
  @IsString()
  source?: string;
}
