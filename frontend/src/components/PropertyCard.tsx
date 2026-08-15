"use client";

import { useState, useEffect } from 'react';
import { listingDetailPath } from '@/lib/seo/canonical';
import Link from 'next/link';
import Image from 'next/image';
import { generateSlug } from '@/lib/utils';
import { addCompareItem } from '@/lib/compare';
import { toMediaUrl } from '@/lib/media';
import NoImageThumbnail from '@/components/NoImageThumbnail';
import { getPriceLabel, getAreaLabel } from '@/constants/ranges';
import { formatPrice, formatArea } from '@/lib/utils';

/**
 * Card tin đăng, dựng lại theo đặc tả khách gửi trong PHẦN I.
 *
 * Bố cục:
 *   [ảnh full width]
 *     góc trên trái  : nhãn VIP / UP (giữ vị trí cũ)
 *     góc trên phải  : nút so sánh (khách yêu cầu CHUYỂN LÊN đây)
 *     đáy dòng 1     : Giá · Diện tích · Giá/m²
 *     đáy dòng 2     : xã/phường + huyện — KHÔNG kèm tỉnh
 *   [dưới ảnh]
 *     2 dòng tiêu đề, chữ đậm, quá thì cắt bằng dấu ba chấm
 *     1 dòng phụ    : hướng · số phòng ngủ · số WC · ngày đăng, chữ nhạt và nhỏ hơn
 *
 * Điểm khách nêu đích danh: bản cũ hiện GIÁ và GIÁ/M² hai lần — một lần đè trên ảnh,
 * một lần nữa ngay dưới tiêu đề. Bố cục này bỏ hẳn phần lặp đó.
 *
 * Đã gỡ luôn khối popup xem trước khi rê chuột (dựng qua React portal, tự đảo ảnh mỗi
 * 1,5 giây): nó không có trong đặc tả, không dùng được trên điện thoại, và giữ 4 state
 * cùng 2 setInterval cho mỗi card trên trang.
 */
export default function PropertyCard({ item }: { item: any }) {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const imagesList: string[] =
    item.imageObjects?.length > 0
      ? item.imageObjects.map((o: any) => o.url)
      : item.images?.length > 0
        ? item.images
        : [];

  const validImages = imagesList.filter(
    (url) => Boolean(url) && !failedImages.has(toMediaUrl(url)),
  );

  const handleImageError = (url: string) =>
    setFailedImages((prev) => new Set(prev).add(toMediaUrl(url)));

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addCompareItem({ id: item.id, title: item.title, price: item.price, images: imagesList });
  };

  // ----- Giá -----
  const numericPrice = Number(item.price);
  const isZeroPrice =
    item.price === 0 || item.price === '0' || (numericPrice > 0 && numericPrice < 100000);
  const isTooLargePrice = numericPrice > 9999000000000;
  const exactPrice = item.price ? formatPrice(item.price) : '';
  const rangePrice = getPriceLabel(item.priceRangeKey, item.transactionType);
  const priceDisplay =
    isZeroPrice || isTooLargePrice
      ? 'Thỏa thuận'
      : exactPrice || (rangePrice ? (rangePrice.includes('-') ? `≈ ${rangePrice}` : rangePrice) : 'Đang cập nhật');

  // Giá/m² lấy nguyên từ backend — nơi duy nhất tính đại lượng này.
  const perM2 = typeof item.pricePerM2Display === 'string' ? item.pricePerM2Display.trim() : '';
  const showPerM2 = Boolean(perM2) && perM2 !== '-' && !perM2.startsWith('0 ') && !isZeroPrice;

  // ----- Diện tích -----
  const areaDisplay = item.area ? formatArea(item.area) : getAreaLabel(item.areaRangeKey) || '';

  // ----- Địa chỉ: xã/phường + huyện, KHÔNG kèm tỉnh -----
  const wardText = item.ward
    ? item.oldWard
      ? `${String(item.ward).trim()} (${String(item.oldWard).trim()})`
      : String(item.ward).trim()
    : '';
  const placeLine = [wardText, item.district].filter(Boolean).join(', ');

  const isClosed = item.status === 'SOLD' || item.status === 'RENTED';

  // Dòng phụ dưới tiêu đề: hướng · phòng ngủ · WC · ngày đăng.
  const metaParts: string[] = [];
  if (item.direction) metaParts.push(String(item.direction));
  if (item.bedrooms) metaParts.push(`${item.bedrooms} phòng ngủ`);
  if (item.bathrooms && item.transactionType !== 'CHO_THUE') metaParts.push(`${item.bathrooms} WC`);

  return (
    <Link
      href={listingDetailPath(generateSlug(item.title), item.shortCode, item.id)}
      className="flex flex-col card-lift group bg-white rounded-2xl overflow-hidden border border-borderLight shadow-sm animate-fade-in"
    >
      {/* ẢNH — chiếm toàn bộ chiều ngang card */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] bg-gray-100 overflow-hidden">
        {validImages.length > 0 ? (
          <Image
            fill
            src={toMediaUrl(validImages[0])}
            alt={item.title}
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => handleImageError(validImages[0])}
          />
        ) : (
          <NoImageThumbnail
            propertyType={item.propertyType}
            transactionType={item.transactionType}
            place={placeLine || item.district || null}
          />
        )}

        {/* Nhãn VIP / UP — giữ nguyên góc trên bên trái */}
        {!isClosed && item.tier === 'VIP' && (
          <span className="absolute top-2 left-2 z-20 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs px-2 py-1 rounded shadow-md font-bold">
            VIP
          </span>
        )}
        {!isClosed && item.tier === 'UP' && (
          <span className="absolute top-2 left-2 z-20 bg-gradient-to-r from-blue-400 to-blue-500 text-white text-xs px-2 py-1 rounded shadow-md font-bold">
            UP
          </span>
        )}

        {/* Nút so sánh — khách yêu cầu chuyển lên GÓC TRÊN BÊN PHẢI */}
        {mounted && (
          <button
            type="button"
            onClick={handleCompare}
            className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-black/35 hover:bg-white text-white hover:text-primary flex items-center justify-center backdrop-blur-sm transition-colors"
            title="Thêm vào so sánh"
            aria-label="Thêm vào so sánh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
        )}

        {/* ĐÃ BÁN / ĐÃ CHO THUÊ — giữ nguyên kiểu dán chéo giữa ảnh */}
        {isClosed && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <span className="bg-red-600 text-white font-black text-sm px-4 py-1.5 rounded uppercase tracking-wider -rotate-12 border-2 border-white shadow-lg">
              {item.status === 'SOLD' ? 'Đã bán' : 'Đã cho thuê'}
            </span>
          </div>
        )}

        {/* HAI DÒNG ĐÈ ĐÁY ẢNH.
            Nền chuyển tối để chữ luôn đọc được dù ảnh sáng hay tối; hai dòng dùng hai
            màu như khách gợi ý — dòng giá trắng đậm, dòng địa chỉ nhạt hơn. */}
        <div className="absolute bottom-0 inset-x-0 z-10 px-3 py-2 bg-gradient-to-t from-black/85 via-black/55 to-transparent">
          <div className="flex flex-wrap items-baseline gap-x-2 text-white font-bold text-sm sm:text-base leading-tight drop-shadow">
            <span>{priceDisplay}</span>
            {areaDisplay && (
              <>
                <span className="text-white/50 font-normal">·</span>
                <span>{areaDisplay}</span>
              </>
            )}
            {showPerM2 && (
              <>
                <span className="text-white/50 font-normal">·</span>
                <span className="font-semibold">{perM2.replace(/^≈\s*/, '')}</span>
              </>
            )}
          </div>
          {placeLine && (
            <div className="text-[11px] sm:text-xs text-amber-200 font-medium leading-tight mt-0.5 line-clamp-1 drop-shadow">
              {placeLine}
            </div>
          )}
        </div>
      </div>

      {/* DƯỚI ẢNH — 3 hàng, chạy suốt chiều ngang */}
      <div className="px-3 sm:px-4 py-3">
        {/* 2 hàng tiêu đề, chữ đậm, quá thì cắt bằng dấu ba chấm */}
        <h3
          className="font-bold text-sm sm:text-base text-textMain group-hover:text-primary line-clamp-2 leading-snug"
          title={item.title}
        >
          {item.title}
        </h3>

        {/* Hàng thứ 3: chữ không đậm, nhỏ hơn một chút */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-textSecondary">
          {metaParts.map((part, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-gray-300">·</span>}
              {part}
            </span>
          ))}
          <span className="ml-auto text-gray-400" suppressHydrationWarning>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''}
          </span>
        </div>
      </div>
    </Link>
  );
}
