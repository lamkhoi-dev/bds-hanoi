"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface AutoThumbnailProps {
  title: string;
  area: string;
  price: string;
  isSold?: boolean;
}

export default function AutoThumbnail({ title, area, price, isSold }: AutoThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgUrl, setImgUrl] = useState<string>('');

  useEffect(() => {
    if (imgUrl) return; // Cached in state

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas size
    canvas.width = 600;
    canvas.height = 400;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, '#1E3A8A'); // primary-dark
    gradient.addColorStop(1, '#3B82F6'); // primary-light
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);

    // Overlay (40% dark)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, 600, 400);

    // Text settings
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';

    // Area & Price
    ctx.font = 'bold 48px Arial';
    if (area && price) {
      ctx.fillText(area, 300, 160);
      ctx.fillText(price, 300, 240);
    } else {
      const areaText = area ? `${area}` : '';
      ctx.fillText(`${areaText}${price}`, 300, 200);
    }

    if (isSold) {
      ctx.save();
      ctx.translate(300, 200);
      ctx.rotate(-Math.PI / 6);
      ctx.fillStyle = 'rgba(220, 38, 38, 0.8)'; // Red
      ctx.fillRect(-150, -40, 300, 80);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px Arial';
      ctx.fillText('ĐÃ BÁN', 0, 15);
      ctx.restore();
    }

    // Cache as Data URL
    setImgUrl(canvas.toDataURL('image/jpeg', 0.8));
  }, [area, price, isSold, imgUrl]);

  if (imgUrl) {
    return <Image unoptimized fill src={imgUrl} alt={title} className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />;
  }

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full object-cover" 
      style={{ display: 'block' }}
    />
  );
}
