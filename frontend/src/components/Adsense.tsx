"use client";

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/axios';

let isScriptInjected = false;

interface AdsenseProps {
  className?: string;
}

export default function Adsense({ className = '' }: AdsenseProps) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings/public');
        if (res.data && res.data.googleAdsenseClientId) {
          setClientId(res.data.googleAdsenseClientId);
          setSlotId(res.data.googleAdsenseSlotId);
        }
      } catch (err) {
        console.error('Failed to fetch adsense settings', err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (clientId && slotId) {
      if (!isScriptInjected) {
        const script = document.createElement('script');
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
        script.async = true;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
        isScriptInjected = true;
      }

      // Nhỏ hơn để xử lý nhanh
      const timeoutId = setTimeout(() => {
        try {
          if (insRef.current && !insRef.current.hasAttribute('data-adsbygoogle-status')) {
            (window as any).adsbygoogle = (window as any).adsbygoogle || [];
            (window as any).adsbygoogle.push({});
          }
        } catch (err: any) {
          if (!err.message || !err.message.includes('already have ads')) {
            console.error('Adsense push error', err);
          }
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [clientId, slotId]);

  if (!clientId || !slotId) {
    return (
      <div className={`w-full overflow-hidden flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded-xl my-4 min-h-[120px] relative ${className}`}>
        <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Google Adsense</span>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-hidden my-4 ${className}`}>
      <ins ref={insRef}
           className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client={clientId}
           data-ad-slot={slotId}
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
}
