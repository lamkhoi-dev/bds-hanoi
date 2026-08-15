import { Controller, Get, Header, Param, ParseIntPipe } from '@nestjs/common';
import { SeoService } from './seo.service';

/**
 * Sitemap sinh ở backend thay vì route `sitemap.ts` của Next.
 *
 * Lý do: hai yêu cầu — `lastmod` đúng sự thật và "chỉ URL có tin" — đều quy về MỘT
 * truy vấn groupBy trên bảng Property. Frontend không diễn đạt được nếu không tự dựng
 * một endpoint tổng hợp; mà đã có endpoint đó rồi thì việc frontend serialize lại là
 * thừa. Thêm nữa route cũ là `force-dynamic`, dựng lại toàn bộ ~6.000 dòng qua 3
 * round-trip MỖI LẦN Googlebot gọi.
 *
 * Caddy map /sitemap.xml và /sitemaps/* sang đây nên URL công khai không đổi —
 * không phải đăng ký lại trong Search Console.
 */
@Controller('seo')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get('sitemap-index.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  async index() {
    return this.seoService.renderIndex();
  }

  @Get('sitemaps/static.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  async static() {
    return this.seoService.renderStatic();
  }

  @Get('sitemaps/landing-:index.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  async landing(@Param('index', ParseIntPipe) index: number) {
    return this.seoService.renderLanding(index);
  }

  @Get('sitemaps/listings-:index.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  async listings(@Param('index', ParseIntPipe) index: number) {
    return this.seoService.renderListings(index);
  }

  @Get('sitemaps/news.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  async news() {
    return this.seoService.renderNews();
  }

  @Get('sitemaps/projects.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  async projects() {
    return this.seoService.renderProjects();
  }

  /**
   * Số liệu tóm tắt để đối chiếu TRƯỚC/SAU khi đổi sitemap — đây là căn cứ go/no-go
   * mà plan yêu cầu chạy trên production trước khi merge.
   */
  @Get('facets')
  async facets() {
    return this.seoService.getFacetSummary();
  }
}
