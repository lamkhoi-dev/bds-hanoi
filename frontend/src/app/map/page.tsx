"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Search, Filter, Home } from 'lucide-react';
import api from '@/lib/axios';
import { toMediaUrl } from '@/lib/media';
import { formatPrice, formatArea } from '@/lib/utils';


export default function MapSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProperty, setActiveProperty] = useState<string | null>(null);
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    api.get('/properties/map?limit=100')
      .then((res) => setProperties(res.data || []))
      .catch(() => setProperties([]));
  }, []);

  const filteredProperties = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter((prop) => {
      const text = [prop.title, prop.street, prop.ward, prop.district, prop.city].filter(Boolean).join(' ').toLowerCase();
      return text.includes(q);
    });
  }, [properties, searchQuery]);

  const latValues = filteredProperties.map((prop) => Number(prop.lat)).filter(Number.isFinite);
  const lngValues = filteredProperties.map((prop) => Number(prop.lng)).filter(Number.isFinite);
  const minLat = latValues.length ? Math.min(...latValues) : 0;
  const maxLat = latValues.length ? Math.max(...latValues) : 1;
  const minLng = lngValues.length ? Math.min(...lngValues) : 0;
  const maxLng = lngValues.length ? Math.max(...lngValues) : 1;

  const getMarkerPosition = (prop: any, idx: number) => {
    const lat = Number(prop.lat);
    const lng = Number(prop.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { display: 'none' };
    }
    if (latValues.length <= 1 || lngValues.length <= 1) {
      return {
        left: `${45 + (idx % 4) * 10}%`,
        top: `${40 + Math.floor(idx / 4) * 12}%`,
      };
    }
    const left = 8 + ((lng - minLng) / Math.max(maxLng - minLng, 0.000001)) * 84;
    const top = 8 + ((maxLat - Number(prop.lat)) / Math.max(maxLat - minLat, 0.000001)) * 84;
    return { left: `${left}%`, top: `${top}%` };
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header Bar */}
      <header className="h-16 bg-white border-b flex items-center justify-between px-4 z-10 shrink-0">
        <div className="flex items-center gap-4 w-1/3">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="font-bold text-lg text-primary hidden sm:block">NHÀ ĐẤT BẢN ĐỒ</div>
        </div>

        <div className="flex-1 max-w-2xl flex items-center gap-2">
          <div className="relative w-full">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Tìm kiếm theo khu vực, đường..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 shrink-0">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        <div className="w-1/3 flex justify-end">
          {/* User profile / Menu could go here */}
          <Link href="/post" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark hidden sm:block">
            Đăng tin
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col-reverse sm:flex-row overflow-hidden">
        
        {/* Sidebar - Property List */}
        <div className="w-full sm:w-[400px] h-1/2 sm:h-auto bg-white border-r flex flex-col z-10 shrink-0 shadow-lg">
          <div className="p-4 border-b">
            <h2 className="font-bold text-gray-800">Tìm thấy {filteredProperties.length} bất động sản</h2>
            <p className="text-sm text-gray-500">Trong khu vực bạn chọn</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredProperties.map(prop => (
              <div 
                key={prop.id} 
                className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${activeProperty === prop.id ? 'border-primary bg-primary/5' : 'border-gray-100'}`}
                onClick={() => setActiveProperty(prop.id)}
                onMouseEnter={() => setActiveProperty(prop.id)}
              >
                <div className="w-24 h-24 bg-gray-200 rounded-lg shrink-0 flex items-center justify-center text-gray-400">
                  {prop.images?.[0] ? (
                    <img width={400} height={300} src={toMediaUrl(prop.images[0])} alt={prop.title} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Home className="w-8 h-8" />
                  )}
                </div>
                <div className="flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-semibold text-sm line-clamp-2 leading-tight text-gray-800">{prop.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{[prop.ward, prop.district, prop.city].filter(Boolean).join(', ')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-red-500">{formatPrice(prop.price)}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs font-medium text-gray-600">{formatArea(prop.area)}</span>
                  </div>
                </div>
              </div>
            ))}
            {filteredProperties.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-10">Chưa có bất động sản có tọa độ trong khu vực này.</div>
            )}
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative bg-blue-50/50 min-h-[40vh] sm:min-h-0">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="w-24 h-24 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Bản Đồ Trực Quan</h2>
            <p className="text-gray-500 max-w-md">
              Các điểm bất động sản được hiển thị theo tọa độ <strong>lat, lng</strong> trong Database.
            </p>
          </div>

          {filteredProperties.map((prop, idx) => (
            <div 
              key={prop.id}
              className={`absolute flex items-center justify-center transition-all duration-300 transform -translate-x-1/2 -translate-y-full cursor-pointer
                ${activeProperty === prop.id ? 'z-20 scale-110' : 'z-10 scale-100'}
              `}
              style={getMarkerPosition(prop, idx)}
              onClick={() => setActiveProperty(prop.id)}
            >
              <div className={`relative px-3 py-1.5 rounded-lg shadow-lg font-bold text-sm text-white whitespace-nowrap
                ${activeProperty === prop.id ? 'bg-primary' : 'bg-red-500'}
              `}>
                {formatPrice(prop.price)}
                <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45
                  ${activeProperty === prop.id ? 'bg-primary' : 'bg-red-500'}
                `}></div>
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}
