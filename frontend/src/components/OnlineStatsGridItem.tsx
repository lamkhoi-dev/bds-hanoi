"use client";

import React from 'react';
import { useOnlineCount } from '@/contexts/OnlineContext';

export default function OnlineStatsGridItem({ isGloballyEnabled = true }: { isGloballyEnabled?: boolean }) {
  const onlineCount = useOnlineCount();
  
  if (!isGloballyEnabled) return null;
  
  return (
    <div className="text-center py-2 col-span-2 bg-green-50 rounded-lg border border-green-100 mt-2">
      <div className="flex items-center justify-center gap-2 text-green-600 font-extrabold text-xl">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        {onlineCount || 0}+
      </div>
      <p className="text-xs text-green-700 font-medium mt-1">Đang Online</p>
    </div>
  );
}
