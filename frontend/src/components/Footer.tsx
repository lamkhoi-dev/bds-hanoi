import Link from "next/link";
import Image from "next/image";
import { Home, Facebook, Twitter, Youtube, ChevronRight, MapPin, Phone, Mail } from 'lucide-react';
import FooterAuthLink from './FooterAuthLink';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-primary-dark via-primary to-primary-light text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Col 1: About */}
          <div className="lg:col-span-2 pr-0 lg:pr-8">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 mb-5">
              <img src="/logo/ngoi_nha.svg" alt="Nhà Đất Xứ Nghệ" className="h-10 sm:h-12 w-auto flex-shrink-0 object-contain" />
              <img src="/logo/nha_dat_xu_nghe.svg" alt="Nhà Đất Xứ Nghệ" className="h-7 sm:h-9 w-auto flex-shrink-0 object-contain mt-1" />
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-5">
              Nền tảng bất động sản hàng đầu Nghệ An, kết nối hàng triệu người mua và người bán với công nghệ tìm kiếm thông minh.
            </p>
            {/* Social Icons */}
            <div className="flex gap-3">
              <a href={process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://www.facebook.com/nhadatxunghe2026"} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/10 hover:bg-accent/80 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110">
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
              {[
                { label: 'Đất nền', href: '/dat-nen' },
                { label: 'Nhà riêng', href: '/nha-rieng' },
                { label: 'Chung cư', href: '/chung-cu' },
                { label: 'Dự án', href: '/du-an' },
                { label: 'Cho thuê', href: '/search?transactionType=CHO_THUE' },
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
              <div className="text-white/70">
                <span className="font-semibold text-white/90">Đơn vị vận hành:</span> Công ty TNHH Bất Động Sản Xứ Nghệ
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-accent" />
                </div>
                <span className="text-white/70">Số 123 Đường Quang Trung, Phường Quang Trung, TP Vinh, Nghệ An</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-accent" />
                </div>
                <span className="text-white/70">{process.env.NEXT_PUBLIC_SUPPORT_PHONE || '0868126826'}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-accent" />
                </div>
                <span className="text-white/70">{process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'contact@nhadatxunghe.vn'}</span>
              </div>
              <div className="text-white/70">
                <span className="font-semibold text-white/90">Mã số thuế:</span> 2901234567
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Nhà Đất Xứ Nghệ. Tất cả quyền được bảo lưu.</p>
          <div className="flex gap-4">
            <Link href="/support/terms" className="hover:text-white transition">Điều khoản sử dụng</Link>
            <Link href="/support/privacy" className="hover:text-white transition">Chính sách bảo mật</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
