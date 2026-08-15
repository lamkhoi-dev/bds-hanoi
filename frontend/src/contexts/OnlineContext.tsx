"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const OnlineContext = createContext<number>(0);

export function OnlineProvider({ children }: { children: React.ReactNode }) {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    // Determine the socket URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    let socketUrl = '';
    try {
      if (apiUrl.startsWith('http')) {
        socketUrl = new URL(apiUrl).origin;
      }
    } catch {
      // Fallback to same host
    }
    
    const socket: Socket = io(socketUrl, {
      path: '/api/v1/socket.io',
      transports: ['polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });
    
    socket.on('onlineCountUpdate', (data: { count: number }) => {
      setOnlineCount(data.count);
    });
    
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <OnlineContext.Provider value={onlineCount}>
      {children}
    </OnlineContext.Provider>
  );
}

export const useOnlineCount = () => useContext(OnlineContext);
