import { Home, Building2, LandPlot, Store, Warehouse, Landmark } from 'lucide-react';
import { siteConfig } from '@/lib/site-config';
import { propertyTypeByEnum } from '@/lib/seo/taxonomy';

/**
 * Ảnh đại diện thay thế cho tin CHƯA CÓ ẢNH, dựng theo đặc tả của khách:
 *
 *   40% bên trái : logo, dưới là tên site
 *   60% bên phải : nhãn giao dịch · LOẠI BĐS (nổi bật nhất) · "Tại {khu vực}"
 *                  · dòng nhỏ nhạt "Chưa cập nhật hình ảnh"
 *
 * Bản cũ (`AutoThumbnail`) vẽ chữ lên `<canvas>`. Ngoài việc không khớp bố cục khách
 * yêu cầu, chữ trong canvas là điểm ảnh — Google không đọc được, trình đọc màn hình
 * cũng không. Bản này là HTML thật nên vừa đúng bố cục vừa có nội dung máy đọc được.
 */

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  DAT_NEN: LandPlot,
  NHA_RIENG: Home,
  CHUNG_CU: Building2,
  DU_AN: Landmark,
  MAT_BANG: Store,
  BIET_THU: Home,
  BDS_KHAC: Warehouse,
};

export default function NoImageThumbnail({
  propertyType,
  transactionType,
  place,
}: {
  propertyType?: string | null;
  transactionType?: string | null;
  /** Tên khu vực đã rút gọn (xã/huyện), không kèm tỉnh. */
  place?: string | null;
}) {
  const typeDef = propertyTypeByEnum(propertyType);
  const Icon = TYPE_ICON[propertyType ?? ''] ?? Warehouse;
  const isRent = transactionType === 'CHO_THUE';

  return (
    // Nền xám xanh rất nhạt theo gợi ý màu của khách.
    <div className="w-full h-full flex bg-[#EEF3F1]">
      {/* 40% trái: logo + tên site */}
      <div className="w-[40%] flex flex-col items-center justify-center gap-2 border-r border-black/5 px-2">
        <img
          src="/logo/ngoi_nha.svg"
          alt=""
          width={223}
          height={145}
          className="h-10 sm:h-14 w-auto object-contain opacity-80"
        />
        <span className="text-[10px] sm:text-xs font-bold text-[#176B45] text-center leading-tight uppercase tracking-wide">
          {siteConfig.name}
        </span>
      </div>

      {/* 60% phải: 4 dòng */}
      <div className="w-[60%] flex flex-col items-start justify-center gap-1.5 px-3 sm:px-4">
        {/* Nhãn ngắn, không viết "Giao dịch: Bán" */}
        <span
          className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wide ${
            isRent ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
          }`}
        >
          {isRent ? 'Cho thuê' : 'Bán'}
        </span>

        {/* Loại BĐS nổi bật nhất */}
        <span className="flex items-center gap-1.5 text-[#176B45] font-extrabold uppercase text-sm sm:text-lg leading-tight">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="line-clamp-2">{typeDef?.label ?? 'Bất động sản'}</span>
        </span>

        {place && (
          <span className="text-xs sm:text-sm text-gray-600 line-clamp-1">Tại {place}</span>
        )}

        <span className="text-[10px] sm:text-[11px] text-gray-400">Chưa cập nhật hình ảnh</span>
      </div>
    </div>
  );
}
