'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Star, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function UpgradePropertyPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [packages, setPackages] = useState<any[]>([]);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [customDays, setCustomDays] = useState(1);

  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [propRes, settingsRes] = await Promise.all([
          api.get(`/properties/${propertyId}`),
          api.get('/settings/public')
        ]);
        
        setSettings(settingsRes.data);
        setProperty(propRes.data);
      } catch (err) {
        toast.error('Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [propertyId]);

  const handleUpgrade = async (packageId: string) => {
    setProcessing(true);
    try {
      await api.post(`/properties/${propertyId}/promote`, { 
        type: 'VIP', 
        customDays: customDays 
      });
      toast.success('Nâng cấp VIP thành công!');
      router.push(`/user/my-listings`);
    } catch (err: any) {
      if (err.response?.data?.requiresPayment) {
        toast.error(err.response?.data?.message || 'Số dư không đủ. Đang chuyển hướng...');
        setTimeout(() => router.push('/user/nap-tien'), 2000);
      } else {
        toast.error(err.response?.data?.message || 'Lỗi nâng cấp VIP');
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
  if (!property) return <div className="p-8 text-center text-red-500">Không tìm thấy tin đăng</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Nâng cấp VIP cho tin đăng</h1>
        <Link href="/user/my-listings" className="text-primary hover:underline font-medium text-sm">
          Quay lại danh sách
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-col md:flex-row gap-6 items-center">
        {property.images && property.images.length > 0 ? (
          <img src={property.images[0]} alt={property.title} className="w-full md:w-32 h-32 object-cover rounded-lg" />
        ) : (
          <div className="w-full md:w-32 h-32 bg-gray-100 flex items-center justify-center rounded-lg text-gray-400">Không có ảnh</div>
        )}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">{property.title}</h2>
          <p className="text-sm text-gray-500 mb-2">Mã tin: {property.id}</p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
            Trạng thái hiện tại: {property.tier === 'VIP' ? 'Đang là VIP' : (property.tier === 'UP' ? 'Đã UP' : 'Tin thường')}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-md mx-auto">
        <div className="bg-yellow-50 p-6 border-b border-yellow-100 text-center">
          <h4 className="text-xl font-bold text-gray-800 mb-2">Gói VIP Tùy Chọn</h4>
          <p className="text-sm text-yellow-800 mb-4">Ghim tin không giới hạn thời gian</p>
          <div className="flex flex-col items-center gap-2">
            <label className="text-sm font-bold text-gray-700">Nhập số ngày bạn muốn ghim:</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={customDays}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomDays(val === '' ? '' as any : parseInt(val));
                }}
                className="w-24 text-center text-xl font-bold p-2 border-2 border-yellow-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
              />
              <span className="font-bold text-gray-600">ngày</span>
            </div>
          </div>
        </div>
        
        {(() => {
          const defaultPrice = 5000;
          const dailyPricePoints = Math.floor(Number(settings?.vipPrice || defaultPrice) / 1000);
          
          return (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Đơn giá (1 ngày):</span>
                <span className="font-bold text-gray-800">{dailyPricePoints} điểm</span>
              </div>
              
              <div className="flex justify-between items-center mb-8">
                <span className="text-lg font-bold text-gray-800">Tổng thanh toán:</span>
                <span className="text-3xl font-black text-yellow-600">
                  {customDays * dailyPricePoints} điểm
                </span>
              </div>

          <ul className="space-y-3 mb-8">
            <li className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              Hiển thị nổi bật trên trang chủ và danh mục
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              Nền vàng nổi bật, thu hút nhiều lượt xem hơn
            </li>
          </ul>
          
          <button
            onClick={() => handleUpgrade('custom_vip')}
            disabled={processing || customDays < 1}
            className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-white font-bold text-lg rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
          >
            {processing ? 'Đang xử lý...' : 'Xác nhận Nâng cấp VIP'}
          </button>
        </div>
        );
        })()}
      </div>
    </div>
  );
}
