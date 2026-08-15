"use client";

import React from 'react';
import { useOnlineCount } from '@/contexts/OnlineContext';
import { Users } from 'lucide-react';

export default function OnlineStats({ alwaysShow = false, isGloballyEnabled = true }: { alwaysShow?: boolean, isGloballyEnabled?: boolean }) {
  const onlineCount = useOnlineCount();
  
  if (!isGloballyEnabled && !alwaysShow) return null;
  if (!alwaysShow && onlineCount <= 1) return null; // Only show if more than 1 user unless forced
  
  return (
    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-100 shadow-sm animate-pulse-slow">
      <div className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </div>
      <Users className="w-4 h-4" />
      <span>{onlineCount || 0} người đang online</span>
    </div>
  );
}
