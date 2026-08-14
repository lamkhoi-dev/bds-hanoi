import Link from "next/link";
import Image from "next/image";
import { Home, Facebook, Twitter, Youtube, ChevronRight, MapPin, Phone, Mail } from 'lucide-react';
import { siteConfig } from '@/lib/site-config';
import { listingPath } from '@/lib/seo/canonical';
import { PROPERTY_TYPES } from '@/lib/seo/taxonomy';
import FooterAuthLink from './FooterAuthLink';

/** Bốn loại BĐS đưa lên footer. Nhãn và slug vẫn lấy từ taxonomy, đây chỉ là bộ lọc. */
const FOOTER_TYPES: readonly string[] = ['DAT_NEN', 'NHA_RIENG', 'CHUNG_CU', 'DU_AN'];

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-primary-dark via-primary to-primary-light text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Col 1: About */}
          <div className="lg:col-span-2 pr-0 lg:pr-8">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 mb-5">
              <img width={223} height={145} src="/logo/ngoi_nha.svg" alt={siteConfig.name} className="h-10 sm:h-12 w-auto flex-shrink-0 object-contain" />
              {/* Wordmark cũ là ảnh SVG vẽ cứng chữ "NHÀ ĐẤT XỨ NGHỆ", không dùng lại
                  được. Render bằng chữ cho tới khi có bộ logo mới (mục C2). */}
              <span className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                {siteConfig.name}
              </span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-5">
              Nền tảng bất động sản hàng đầu {siteConfig.province.name}, kết nối người mua và người bán với công nghệ tìm kiếm thông minh.
            </p>
            {/* Social Icons */}
            <div className="flex gap-3">
              <a href={siteConfig.contact.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/10 hover:bg-accent/80 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/10 hover:bg-accent/80 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/10 hover:bg-accent/80 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Danh mục BĐS */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider mb-5 text-accent">Danh mục BĐS</h4>
            <ul className="space-y-3">
              {/* Trước đây là 4 URL viết cứng dạng cũ (`/dat-nen`…) — P5 đã 301 chúng
                  sang `/ban/{loại}`, nên link footer đang ăn chuyển hướng ở mọi trang.
                  "Cho thuê" thì trỏ vào `/search` vốn noindex thay vì hub `/cho-thue`. */}
              {[
                ...PROPERTY_TYPES.filter((t) => FOOTER_TYPES.includes(t.enum)).map((t) => ({
                  label: t.label,
                  href: listingPath({ transaction: 'ban', propertyTypeSlug: t.slug }),
                })),
                { label: 'Cho thuê', href: listingPath({ transaction: 'cho-thue' }) },
                { label: 'Khu vực BĐS', href: '/khu-vuc' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-white/70 hover:text-white hover:translate-x-1 transition-all duration-200 text-sm flex items-center gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-accent/60" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Quick Links */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider mb-5 text-accent">Liên kết nhanh</h4>
            <ul className="space-y-3">
              {[
                { label: 'Trang chủ', href: '/' },
                { label: 'Đăng tin mới', href: '/post' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-white/70 hover:text-white hover:translate-x-1 transition-all duration-200 text-sm flex items-center gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-accent/60" />
                    {item.label}
                  </Link>
                </li>
              ))}
              <FooterAuthLink />
            </ul>
          </div>

          {/* Col 3: Support */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider mb-5 text-accent">Hỗ trợ</h4>
            <ul className="space-y-3">
              {[
                { label: 'Điều khoản sử dụng', href: '/support/terms' }, 
                { label: 'Chính sách bảo mật', href: '/support/privacy' }, 
                { label: 'Quy chế hoạt động', href: '/support/rules' }, 
                { label: 'Chính sách đăng tin', href: '/support/posting-policy' }, 
                { label: 'Chính sách thanh toán', href: '/support/payment-policy' },
                { label: 'Chính sách hoàn tiền', href: '/support/refund-policy' },
                { label: 'Quy trình giải quyết khiếu nại', href: '/support/complaints' },
                { label: 'Yêu cầu xóa dữ liệu', href: '/support/data-deletion' }
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-white/70 hover:text-white hover:translate-x-1 transition-all duration-200 text-sm flex items-center gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-accent/60" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider mb-5 text-accent">Liên hệ</h4>
            <div className="space-y-4 text-sm">
              {/* Khách yêu cầu: BỎ mã số thuế và BỎ địa chỉ (mục "Sửa mã số thuế,
                  địa chỉ" trong PHẦN I). Tên đơn vị vận hành lấy từ cấu hình. */}
              {process.env.NEXT_PUBLIC_COMPANY_NAME && (
                <div className="text-white/70">
                  <span className="font-semibold text-white/90">Đơn vị vận hành:</span>{' '}
                  {process.env.NEXT_PUBLIC_COMPANY_NAME}
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-accent" />
                </div>
                <span className="text-white/70">{siteConfig.contact.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-accent" />
                </div>
                <span className="text-white/70">{siteConfig.contact.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-white/50">
          <p>© {new Date().getFullYear()} {siteConfig.name}. Tất cả quyền được bảo lưu.</p>
          <div className="flex gap-4">
            <Link href="/support/terms" className="hover:text-white transition">Điều khoản sử dụng</Link>
            <Link href="/support/privacy" className="hover:text-white transition">Chính sách bảo mật</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
