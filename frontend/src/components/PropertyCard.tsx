"use client";

import { useState, useEffect } from 'react';
import { listingDetailPath } from '@/lib/seo/canonical';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { generateSlug } from '@/lib/utils';
import { addCompareItem } from '@/lib/compare';
import { toMediaUrl } from '@/lib/media';
import AutoThumbnail from '@/components/AutoThumbnail';
import { getPriceLabel, getAreaLabel } from '@/constants/ranges';
import { formatPrice, formatArea } from '@/lib/utils';


export default function PropertyCard({ item }: { item: any }) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const imagesList = item.imageObjects && item.imageObjects.length > 0 
    ? item.imageObjects.map((obj: any) => obj.url) 
    : item.images && item.images.length > 0 
      ? item.images 
      : [];
      
  const validImages = imagesList.filter((url: string) => Boolean(url) && !failedImages.has(toMediaUrl(url)));
  const previewImages = validImages.slice(0, 5); // Show max 5 images in preview

  const handleImageError = (url: string) => {
    setFailedImages(prev => {
      const newSet = new Set(prev);
      newSet.add(toMediaUrl(url));
      return newSet;
    });
  };

  useEffect(() => {
    if (currentImageIndex >= previewImages.length && previewImages.length > 0) {
      setCurrentImageIndex(Math.max(0, previewImages.length - 1));
    }
  }, [previewImages.length, currentImageIndex]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHovered && previewImages.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % previewImages.length);
      }, 1500);
    } else {
      setCurrentImageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, previewImages.length]);

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addCompareItem({
      id: item.id,
      title: item.title,
      price: item.price,
      images: imagesList,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };
  
  const numericPrice = Number(item.price);
  const isZeroPrice = item.price === 0 || item.price === '0' || (numericPrice > 0 && numericPrice < 100000); // Treat very small numbers as Thỏa thuận
  const isTooLargePrice = numericPrice > 9999000000000; // > 9,999 tỷ
  const exactPrice = item.price ? formatPrice(item.price) : '';
  const rangePrice = getPriceLabel(item.priceRangeKey, item.transactionType);
  const finalPriceDisplay = (isZeroPrice || isTooLargePrice) ? 'Thỏa thuận' : (exactPrice ? exactPrice : (rangePrice ? (rangePrice.includes('-') ? `≈ ${rangePrice}` : rangePrice) : 'Đang cập nhật'));
  
  const isValidPricePerM2 = item.pricePerM2Display && 
                            item.pricePerM2Display !== '-' && 
                            String(item.pricePerM2Display).trim() !== '0' && 
                            !String(item.pricePerM2Display).startsWith('0 ') && 
                            !String(item.pricePerM2Display).includes('0 tr/m²') && 
                            !String(item.pricePerM2Display).includes('0 triệu/m²') && 
                            !isZeroPrice;

  const exactArea = item.area ? formatArea(item.area) : '';
  const rangeArea = getAreaLabel(item.areaRangeKey);
  const areaDisplay = exactArea ? exactArea : (rangeArea || '---');
  const wardDisplayStr = item.ward ? (item.oldWard ? `${item.ward.trim()} (${item.oldWard.trim()})` : item.ward.trim()) : '';

  const renderPopup = () => {
    if (!mounted || !isHovered) return null;

    const popupWidth = 400;
    const popupHeight = 300;
    const margin = 20;
    
    let left = mousePos.x + margin;
    let top = mousePos.y + margin;
    
    if (typeof window !== 'undefined') {
      if (left + popupWidth > window.innerWidth) {
        left = mousePos.x - popupWidth - margin; 
      }
      if (top + popupHeight > window.innerHeight) {
        top = window.innerHeight - popupHeight - margin; 
      }
    }

    return createPortal(
      <div 
        className="fixed z-[9999] pointer-events-none rounded-2xl overflow-hidden shadow-2xl border-2 border-white animate-fade-in hidden md:block bg-gray-100"
        style={{ left, top, width: popupWidth, height: popupHeight }}
      >
        {previewImages.length > 0 ? (
          <Image 
            fill 
            src={toMediaUrl(previewImages[currentImageIndex])} 
            alt="Preview Popup" 
            sizes="400px"
            className="object-cover transition-opacity duration-300"
            onError={() => handleImageError(previewImages[currentImageIndex])}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <Image src="/logo/logo-icon.svg" width={120} height={120} alt="No image" className="opacity-20 grayscale" style={{ width: 'auto', height: 'auto' }} />
          </div>
        )}
        
        {/* Info Overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-12 flex flex-col justify-end z-20">
          <h3 className="text-white font-bold text-base line-clamp-1 mb-1">{item.title}</h3>
          <p className="text-white/80 text-xs mb-2 line-clamp-1">
            <svg className="w-3 h-3 inline-block mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {wardDisplayStr ? `${wardDisplayStr}, ${item.city || item.district || ''}` : item.district ? `${item.district}, ${item.city || ''}` : item.city || 'Chưa cập nhật'}
          </p>
          
          <div className="flex justify-between items-end gap-2">
            <div className="flex-1 min-w-0 flex flex-col">
              <span className="text-primary font-bold text-xl leading-tight break-words">
                {finalPriceDisplay}
              </span>
              {isValidPricePerM2 && (
                <span className="text-xs sm:text-sm text-white/80 font-normal mt-0.5">
                  <span className="sm:hidden">{typeof item.pricePerM2Display === 'string' ? item.pricePerM2Display.replace(/\s*tr\/m²/g, ' tr/m²').replace(/≈\s*/g, '≈ ').trim() : String(item.pricePerM2Display)}</span>
                  <span className="hidden sm:inline">{typeof item.pricePerM2Display === 'string' ? item.pricePerM2Display.replace(/\s*tr\/m²/g, ' triệu/m²').replace(/≈\s*/g, '≈ ').trim() : String(item.pricePerM2Display)}</span>
                </span>
              )}
            </div>
            <div className="flex-shrink-0 flex gap-2 text-xs text-white/90 font-medium bg-black/40 px-2 py-1 rounded border border-white/10">
              <span>{areaDisplay}</span>
              {item.bedrooms ? <span className="border-l border-white/20 pl-2">{item.bedrooms} PN</span> : null}
            </div>
          </div>
        </div>

        {previewImages.length > 1 && (
          <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 z-30">
            {previewImages.map((_: string, idx: number) => (
              <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${idx === currentImageIndex ? 'w-6 bg-white' : 'w-2 bg-white/60'}`} />
            ))}
          </div>
        )}
      </div>,
      document.body
    );
  };

  return (
    <>
    <Link 
      href={listingDetailPath(generateSlug(item.title), item.shortCode, item.id)}
      className="flex flex-col h-full card-lift group bg-white rounded-2xl overflow-hidden border border-borderLight shadow-sm animate-fade-in"
    >
      <div 
        className="flex-shrink-0 h-32 sm:h-40 md:h-48 bg-gray-100 relative overflow-hidden flex items-center justify-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
      >
        {validImages.length > 0 ? (
          <Image 
            fill 
            src={toMediaUrl(validImages[0])} 
            alt={item.title} 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110" 
            onError={() => handleImageError(validImages[0])}
          />
        ) : (
          <div className="w-full h-full group-hover:scale-110 transition-transform duration-500">
            <AutoThumbnail 
              title={item.title} 
              area={areaDisplay} 
              price={finalPriceDisplay}
              isSold={item.status === 'SOLD' || item.status === 'RENTED'}
            />
          </div>
        )}
        {item.tier === 'VIP' && (item.status !== 'SOLD' && item.status !== 'RENTED') && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs px-2 py-1 rounded shadow-md font-bold z-10">
            VIP
          </div>
        )}
        {item.tier === 'UP' && (item.status !== 'SOLD' && item.status !== 'RENTED') && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white text-xs px-2 py-1 rounded shadow-md font-bold z-10">
            UP
          </div>
        )}
        {item.status === 'SOLD' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <span className="bg-red-600 text-white font-black text-sm px-4 py-1.5 rounded uppercase tracking-wider transform -rotate-12 border-2 border-white shadow-lg">
              Đã bán
            </span>
          </div>
        )}
        {item.status === 'RENTED' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <span className="bg-orange-500 text-white font-black text-sm px-4 py-1.5 rounded uppercase tracking-wider transform -rotate-12 border-2 border-white shadow-lg">
              Đã cho thuê
            </span>
          </div>
        )}
        {/* Base Gradient - Fades out on hover */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2 z-10 flex justify-between items-end group-hover:opacity-0 transition-opacity duration-300">
          <div className="flex flex-col max-w-[80%]">
            <span className="text-white font-bold text-base sm:text-lg leading-tight truncate">
              {finalPriceDisplay}
            </span>
            {isValidPricePerM2 && (
              <span className="text-xs sm:text-sm text-white/90 font-normal mt-0.5 truncate">
                {typeof item.pricePerM2Display === 'string' ? item.pricePerM2Display.replace(/\s*tr\/m²/g, ' tr/m²').replace(/≈\s*/g, '≈ ').trim() : String(item.pricePerM2Display)}
              </span>
            )}
          </div>
          <div 
            onClick={handleCompare}
            role="button"
            tabIndex={0}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white text-white hover:text-primary flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
            title="Thêm vào so sánh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          </div>
        </div>

        {/* Hover Details Overlay - Slides up on hover */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/80 to-black/40 p-3 pt-8 translate-y-[101%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-20 flex flex-col justify-end">
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col max-w-[80%]">
              <span className="text-white font-bold text-base sm:text-lg leading-tight truncate">
                {finalPriceDisplay}
              </span>
              {isValidPricePerM2 && (
                <span className="text-xs sm:text-sm text-white/90 font-normal mt-0.5 truncate">
                  {typeof item.pricePerM2Display === 'string' ? item.pricePerM2Display.replace(/\s*tr\/m²/g, ' triệu/m²').replace(/≈\s*/g, '≈ ').trim() : String(item.pricePerM2Display)}
                </span>
              )}
            </div>
            <div 
              onClick={handleCompare}
              role="button"
              tabIndex={0}
              className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg cursor-pointer"
              title="Thêm vào so sánh"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 text-xs text-white/90 mb-2 font-medium">
            {item.bedrooms ? <span className="flex items-center gap-1" title="Phòng ngủ"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> {item.bedrooms} PN</span> : null}
            {(item.bathrooms && item.transactionType !== 'CHO_THUE') ? <span className="flex items-center gap-1" title="Phòng tắm"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg> {item.bathrooms} WC</span> : null}
            {item.direction ? <span className="flex items-center gap-1" title="Hướng"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg> {item.direction}</span> : null}
          </div>
          {item.description && (
            <p className="text-white/70 text-[11px] line-clamp-2 leading-tight border-t border-white/20 pt-2">{item.description}</p>
          )}
        </div>
      </div>
      <div className="p-3 sm:p-4 relative bg-white z-30 flex flex-col flex-1">
        <h3 className="font-bold text-sm sm:text-base mb-1.5 sm:mb-2 text-textMain group-hover:text-primary line-clamp-2" title={item.title}>{item.title}</h3>
        
        {/* Dòng 1: Giá & Diện tích */}
        <div className="flex items-center gap-2 mb-1.5 sm:mb-2 flex-wrap">
          <span className="text-primary font-bold text-base sm:text-lg leading-tight">
            {finalPriceDisplay}
          </span>
          <span className="text-gray-300">•</span>
          <span className="font-bold text-sm sm:text-base text-textMain">{areaDisplay}</span>
        </div>
        
        {/* Dòng 2: Giá/m2, Số PN/PT */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-textSecondary mb-3">
          {isValidPricePerM2 && (
            <span className="font-medium text-textMain">
              {typeof item.pricePerM2Display === 'string' ? item.pricePerM2Display.replace(/\s*tr\/m²/g, ' triệu/m²').replace(/≈\s*/g, '').trim() : String(item.pricePerM2Display)}
            </span>
          )}
          {item.bedrooms && (
            <>
              {isValidPricePerM2 && <span className="text-gray-300">•</span>}
              <span>{item.bedrooms} PN</span>
            </>
          )}
          {(item.bathrooms && item.transactionType !== 'CHO_THUE') && (
            <>
              {(isValidPricePerM2 || item.bedrooms) && <span className="text-gray-300">•</span>}
              <span>{item.bathrooms} WC</span>
            </>
          )}
        </div>

        {/* Dòng dưới cùng: Vị trí & Ngày đăng */}
        <div className="mt-auto border-t border-gray-100 pt-2 flex flex-col gap-1.5">
          <p className="text-xs text-textSecondary flex items-start gap-1 w-full" title={[wardDisplayStr, item.district, item.city].filter(Boolean).join(', ')}>
            <svg className="w-3.5 h-3.5 text-accent mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="line-clamp-1 flex-1">{[wardDisplayStr, item.district, item.city].filter(Boolean).join(', ') || 'Chưa cập nhật'}</span>
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400 text-right w-full" suppressHydrationWarning>
            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
          </p>
        </div>
      </div>
    </Link>
    {renderPopup()}
    </>
  );
}
