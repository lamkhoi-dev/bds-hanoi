'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icon in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapPinProps {
  lat?: number;
  lng?: number;
  isApproximate?: boolean;
  onChange: (lat: number, lng: number) => void;
}

export default function MapPin({ lat, lng, isApproximate, onChange }: MapPinProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | L.Circle | null>(null);

  const drawPin = (map: L.Map, position: [number, number], approx?: boolean) => {
    if (markerRef.current) {
      markerRef.current.remove();
    }
    if (approx) {
      markerRef.current = L.circle(position, {
        color: '#ff5a5f',
        fillColor: '#ff5a5f',
        fillOpacity: 0.3,
        radius: 300
      }).addTo(map);
    } else {
      markerRef.current = L.marker(position).addTo(map);
    }
  };

  const isApproxRef = useRef(isApproximate);

  useEffect(() => {
    isApproxRef.current = isApproximate;
    if (mapInstanceRef.current) {
      const currentPos = lat && lng ? [lat, lng] as [number, number] : [18.679585, 105.681223] as [number, number];
      drawPin(mapInstanceRef.current, currentPos, isApproximate);
    }
  }, [isApproximate, lat, lng]);

  useEffect(() => {
    if (typeof window !== 'undefined' && mapRef.current && !mapInstanceRef.current) {
      const defaultPosition: [number, number] = [18.679585, 105.681223];
      const initialPos = lat && lng ? [lat, lng] as [number, number] : defaultPosition;
      
      const map = L.map(mapRef.current).setView(initialPos, 13);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Draw initial pin so user sees the difference immediately
      drawPin(map, initialPos, isApproxRef.current);
      if (!lat || !lng) {
        // If not selected, trigger onChange with default position so it's not undefined
        onChange(initialPos[0], initialPos[1]);
      }

      setTimeout(() => {
        map.invalidateSize();
      }, 250);

      map.on('click', (e) => {
        let finalLat = e.latlng.lat;
        let finalLng = e.latlng.lng;
        
        if (isApproxRef.current) {
          const angle = Math.random() * Math.PI * 2;
          const latOffset = (300 / 111320) * Math.cos(angle);
          const lngOffset = (300 / (111320 * Math.cos(e.latlng.lat * Math.PI / 180))) * Math.sin(angle);
          finalLat += latOffset;
          finalLng += lngOffset;
        }

        drawPin(map, [finalLat, finalLng], isApproxRef.current);
        map.flyTo([finalLat, finalLng], map.getZoom());
        onChange(finalLat, finalLng);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off('click');
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <div 
      ref={mapRef} 
      className="h-[300px] w-full rounded-xl overflow-hidden border border-borderLight relative z-0"
    />
  );
}
