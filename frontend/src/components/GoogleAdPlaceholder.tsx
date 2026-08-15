"use client";

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';

const GoogleAdPlaceholder = () => {
  const [ads, setAds] = useState<Array<{url: string; link: string}>>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings/public', { params: { _t: new Date().getTime() } });
        const settings = res.data;
        if (settings) {
          setIsActive(settings.isPropertyAdActive ?? true);
          
          let parsedAds = settings.propertyAds || [];
          if (parsedAds.length === 0 && settings.propertyAdUrl) {
            // Fallback for old data
            parsedAds = [{ url: settings.propertyAdUrl, link: settings.propertyAdLink || '' }];
          }
          setAds(parsedAds);
          
          if (parsedAds.length > 0) {
            // Pick a random starting index
            setCurrentAdIndex(Math.floor(Math.random() * parsedAds.length));
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải cài đặt quảng cáo:", error);
      }
    };
    fetchSettings();
  }, []);

  // Set up interval for ad rotation every 30 seconds
  useEffect(() => {
    if (ads.length <= 1) return; // No need to rotate if 0 or 1 ad
    
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length);
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [ads.length]);

  if (!isActive) return null;

  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const isVideo = (url: string) => {
    return /\.(mp4|webm|ogg)$/i.test(url.split('?')[0]);
  };

  const currentAd = ads.length > 0 ? ads[currentAdIndex] : null;

  if (currentAd?.url) {
    const { url: adUrl, link: adLink } = currentAd;
    const youtubeId = getYoutubeVideoId(adUrl);
    const isVid = isVideo(adUrl);

    let content;
    if (youtubeId) {
      content = (
        <iframe 
          width="100%" 
          height="100%" 
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0`}
          title="Advertisement" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          className="w-full aspect-video md:max-h-[400px] object-cover rounded-lg shadow-sm"
        ></iframe>
      );
    } else if (isVid) {
      content = (
        <video 
          src={adUrl} 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-auto md:max-h-[400px] object-cover rounded-lg shadow-sm"
        />
      );
    } else {
      content = (
        <img 
          src={adUrl} 
          alt="Advertisement" 
          className="w-full h-auto md:max-h-[400px] object-cover rounded-lg shadow-sm"
        />
      );
    }
    
    return (
      <div className="w-full my-6 relative rounded-lg overflow-hidden border border-gray-100 shadow-sm">
        <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-sm z-30 backdrop-blur-sm pointer-events-none">
          Quảng cáo
        </div>
        {adLink ? (
          <a href={adLink} target="_blank" rel="noopener noreferrer" className="block relative hover:opacity-95 transition-opacity">
            {content}
            {/* Lớp phủ chặn click vào iframe/video để click chuyển hướng sang adLink */}
            {(youtubeId || isVid) && <div className="absolute inset-0 z-20 cursor-pointer"></div>}
          </a>
        ) : (
          <div className="relative">
            {content}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="w-full bg-gray-100/50 text-gray-400 text-xs font-medium flex flex-col items-center justify-center p-6 my-6 rounded-lg border border-dashed border-gray-200" 
      style={{ minHeight: '120px' }}
    >
      <div className="w-8 h-8 rounded-full bg-gray-200/50 flex items-center justify-center mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
      </div>
      <span>Không gian Quảng cáo</span>
    </div>
  );
};

export default GoogleAdPlaceholder;
