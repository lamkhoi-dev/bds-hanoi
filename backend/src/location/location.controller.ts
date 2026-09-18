import { Controller, Get, Param, Query } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { LocationType } from '@prisma/client';
import { LocationService } from './location.service';

/**
 * Toàn bộ controller chỉ ĐỌC, không có route nào sửa dữ liệu — bỏ giới hạn tần suất ở
 * mức CẢ CONTROLLER. Mọi trang khu vực/form đăng tin đều gọi các route này lúc dựng trang
 * phía server, đi thẳng qua mạng nội bộ Docker (không qua Caddy) nên chung một IP nguồn
 * cho MỌI khách — dễ chạm giới hạn 100 req/phút mặc định dù không ai lạm dụng gì (xem chú
 * thích chi tiết ở `property.controller.ts getSeoProperties`, cùng gốc lỗi khách báo 18/9).
 */
@SkipThrottle()
@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  /** Danh sách quận/huyện kèm phường xã. Giữ hình dạng cũ cho màn hình chưa chuyển. */
  @Get()
  async getLocations(@Query('city') city?: string) {
    return this.locationService.getLocations(city);
  }

  /** Cây đầy đủ: tỉnh -> quận/huyện -> phường xã mới + cũ. */
  @Get('tree')
  async getTree() {
    return this.locationService.getTree();
  }

  /**
   * Từ điển {urlSegment -> tên có dấu} cho frontend dựng title/H1/breadcrumb.
   * Thay cho từ điển hard-code `formatSlugToName` ở [...slug]/page.tsx.
   */
  @Get('segments')
  async getSegments() {
    return this.locationService.getSegmentDictionary();
  }

  @Get('featured')
  async getFeatured(@Query('type') type?: LocationType) {
    return this.locationService.getFeatured(type);
  }

  @Get('sitemap')
  async getSeoLocations() {
    return this.locationService.getSeoLocations();
  }

  /** Trả 404 khi đoạn URL không tồn tại — frontend dựa vào đây để notFound(). */
  @Get('resolve/:segment')
  async resolve(@Param('segment') segment: string) {
    return this.locationService.resolveSegment(segment);
  }
}
