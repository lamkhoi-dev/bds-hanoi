"use client";

import { useEffect, useState, Suspense } from 'react';
import { listingDetailPath } from '@/lib/seo/canonical';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { getCompareItems, removeCompareItem } from '@/lib/compare';
import api from '@/lib/axios';

import { useSearchParams } from 'next/navigation';
import { generateSlug, formatPrice, formatArea } from '@/lib/utils';


function CompareContent() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  const fetchFullItems = async () => {
    let idsStr = searchParams.get('ids');
    let localItems = getCompareItems();
    
    // If no ids in URL but we have local items, we use local items
    // If ids in URL, we prefer them
    if (!idsStr && localItems.length > 0) {
      idsStr = localItems.map((item: any) => item.id).join(',');
    }

    if (!idsStr) {
      setItems([]);
      setLoading(false);
      return;
    }
    
    try {
      const res = await api.get(`/properties/compare?ids=${idsStr}`);
      // Sort by the order in idsStr
      const idArray = idsStr.split(',');
      const fullData = res.data;
      const sortedData = idArray.map((id: string) => fullData.find((fd: any) => fd.id === id)).filter(Boolean);
      setItems(sortedData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullItems();
    window.addEventListener('compareUpdated', fetchFullItems);
    return () => window.removeEventListener('compareUpdated', fetchFullItems);
  }, [searchParams]);

  if (loading) {
    return <div className="container mx-auto px-4 py-20 text-center"><p>Đang tải dữ liệu so sánh...</p></div>;
  }

  if (items.length < 2) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
          <ArrowLeft size={32} />
        </div>
        <h1 className="text-2xl font-bold mb-4">Chưa đủ dữ liệu so sánh</h1>
        <p className="text-gray-500 mb-8">Vui lòng chọn ít nhất 2 bất động sản để sử dụng tính năng này.</p>
        <Link href="/" className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">So sánh Bất động sản</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="p-4 border-b border-r border-gray-100 w-48 bg-gray-50 font-bold text-gray-600">Tiêu chí</th>
              {items.map(item => (
                <th key={`header-${item.id}`} className="p-4 border-b border-gray-100 bg-gray-50 align-top">
                  <div className="relative group">
                    <button 
                      onClick={() => removeCompareItem(item.id)}
                      className="absolute -top-2 -right-2 bg-white text-gray-400 hover:text-red-500 rounded-full shadow-md p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="aspect-[4/3] bg-gray-200 rounded-lg overflow-hidden mb-3">
                      {item.images && item.images.length > 0 ? (
                        <img width={400} height={300} src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">No Img</div>
                      )}
                    </div>
                    <Link href={listingDetailPath(generateSlug(item.title), item.shortCode, item.id)} className="font-bold text-gray-900 hover:text-primary line-clamp-2 leading-tight">
                      {item.title}
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-4 border-b border-r border-gray-100 font-semibold bg-gray-50/50">Mức giá</td>
              {items.map(item => (
                <td key={`price-${item.id}`} className="p-4 border-b border-gray-100 font-bold text-primary text-lg">
                  {formatPrice(item.price)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r border-gray-100 font-semibold bg-gray-50/50">Diện tích</td>
              {items.map(item => (
                <td key={`area-${item.id}`} className="p-4 border-b border-gray-100 font-medium">
                  {formatArea(item.area)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r border-gray-100 font-semibold bg-gray-50/50">Giá / m²</td>
              {items.map(item => (
                <td key={`pricem2-${item.id}`} className="p-4 border-b border-gray-100 font-medium text-orange-600">
                  {item.price && item.area && item.transactionType !== 'CHO_THUE' ? `${formatPrice(item.price / item.area)} / m²` : '-'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r border-gray-100 font-semibold bg-gray-50/50">Khu vực</td>
              {items.map(item => (
                <td key={`loc-${item.id}`} className="p-4 border-b border-gray-100 font-medium text-gray-600">
                  {item.district}, {item.city}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r border-gray-100 font-semibold bg-gray-50/50">Phường - Xã</td>
              {items.map(item => (
                <td key={`ward-${item.id}`} className="p-4 border-b border-gray-100 font-medium text-gray-600">
                  {item.ward || '-'}
                </td>
              ))}
            </tr>

            <tr>
              <td className="p-4 border-b border-r border-gray-100 font-semibold bg-gray-50/50">Hướng</td>
              {items.map(item => (
                <td key={`dir-${item.id}`} className="p-4 border-b border-gray-100 font-medium text-gray-600">
                  {item.direction || '-'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r border-gray-100 font-semibold bg-gray-50/50">Đường trước đất</td>
              {items.map(item => (
                <td key={`road-${item.id}`} className="p-4 border-b border-gray-100 font-medium text-gray-600">
                  {item.roadWidth ? `${item.roadWidth} m` : '-'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r border-gray-100 font-semibold bg-gray-50/50">Mặt tiền</td>
              {items.map(item => (
                <td key={`front-${item.id}`} className="p-4 border-b border-gray-100 font-medium text-gray-600">
                  {item.frontage ? `${item.frontage} m` : '-'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-r border-gray-100 font-semibold bg-gray-50/50">Người đăng</td>
              {items.map(item => (
                <td key={`user-${item.id}`} className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                      {item.user?.avatar && <img width={40} height={40} src={item.user.avatar} className="w-full h-full object-cover" />}
                    </div>
                    <span className="font-medium text-sm text-gray-700">{item.user?.name || 'Ẩn danh'}</span>
                  </div>
                </td>
              ))}
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-20 text-center"><p>Đang tải dữ liệu so sánh...</p></div>}>
      <CompareContent />
    </Suspense>
  );
}
