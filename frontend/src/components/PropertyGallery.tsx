import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

interface PropertyGalleryProps {
  imageUrls: string[];
  status: string;
}

export default function PropertyGallery({ imageUrls, status }: PropertyGalleryProps) {
  const [showLightbox, setShowLightbox] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Filter out images that have failed to load and empty urls
  const validImages = imageUrls.filter(img => Boolean(img) && !failedImages.has(img));
  
  // Ensure activeImage is within bounds if images are removed
  useEffect(() => {
    if (activeImage >= validImages.length && validImages.length > 0) {
      setActiveImage(Math.max(0, validImages.length - 1));
    }
  }, [validImages.length, activeImage]);

  const handleImageError = (imgUrl: string) => {
    setFailedImages(prev => {
      const newSet = new Set(prev);
      newSet.add(imgUrl);
      return newSet;
    });
  };

  return (
    <>
      <div className="bg-white rounded-2xl p-4 shadow-card">
        <div className="h-80 md:h-96 bg-gray-100 rounded-xl mb-4 relative overflow-hidden flex items-center justify-center">
          {validImages.length > 0 ? (
            <Image 
              fill
              src={validImages[activeImage] || validImages[0]} 
              onClick={() => setShowLightbox(true)} 
              className="object-cover cursor-pointer hover:scale-105 transition-transform" 
              alt="Bất động sản" 
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => handleImageError(validImages[activeImage] || validImages[0])}
            />
          ) : (
            <div className="flex flex-col items-center opacity-50">
              <Image src="/logo/logo-icon.svg" width={64} height={64} alt="No image" className="mb-2 grayscale" style={{ width: 'auto', height: 'auto' }} />
              <span className="text-gray-500 font-medium">Hình ảnh không khả dụng</span>
            </div>
          )}
          {status === 'SOLD' && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
              <span className="bg-red-600 text-white font-black text-2xl md:text-4xl px-8 py-3 rounded uppercase tracking-widest transform -rotate-12 border-4 border-white shadow-2xl">
                ĐÃ BÁN
              </span>
            </div>
          )}
        </div>
        {validImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto relative">
            {validImages.map((img: string, idx: number) => (
              <div key={img} className="relative w-20 h-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                <Image 
                  fill
                  src={img} 
                  onClick={() => setActiveImage(idx)}
                  className={`object-cover cursor-pointer border-2 transition-all ${idx === activeImage ? 'border-primary opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`} 
                  alt={`Thumbnail ${idx + 1}`}
                  sizes="80px"
                  onError={() => handleImageError(img)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {showLightbox && validImages.length > 0 && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center p-4">
          <button type="button" aria-label="Đóng thư viện ảnh" onClick={() => setShowLightbox(false)} className="absolute top-6 right-6 text-white p-2 hover:bg-white/20 rounded-full transition-colors z-[1010]">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          <div className="relative w-full h-full max-w-5xl max-h-[80vh]">
            <Image fill src={validImages[activeImage] || validImages[0]} className="object-contain animate-fade-in" alt="Bất động sản zoom" sizes="100vw" />
          </div>
          
          {validImages.length > 1 && (
            <>
              <button type="button" aria-label="Hình trước"
                onClick={(e) => { e.stopPropagation(); setActiveImage(prev => prev > 0 ? prev - 1 : validImages.length - 1); }} 
                className="absolute left-6 top-1/2 -translate-y-1/2 text-white p-3 bg-black/50 hover:bg-black/80 rounded-full transition-colors z-[1010]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button type="button" aria-label="Hình tiếp theo"
                onClick={(e) => { e.stopPropagation(); setActiveImage(prev => prev < validImages.length - 1 ? prev + 1 : 0); }} 
                className="absolute right-6 top-1/2 -translate-y-1/2 text-white p-3 bg-black/50 hover:bg-black/80 rounded-full transition-colors z-[1010]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full text-sm z-[1010]">
            {activeImage + 1} / {validImages.length}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
