"use client";
import { formatNumberString } from '@/lib/utils';
import { siteConfig } from '@/lib/site-config';
import { listingPath } from '@/lib/seo/canonical';
import { propertyTypeByEnum, transactionByEnum } from '@/lib/seo/taxonomy';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ShareButtons from '@/components/ShareButtons';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { getAuthToken } from '@/lib/auth';
import { addCompareItem } from '@/lib/compare';
import { toMediaUrl } from '@/lib/media';
import { confirmAction } from '@/lib/toast-helpers';
import { ArrowRightLeft, Phone, MessageCircle, Trash2, MoreVertical, Edit, EyeOff, CheckCircle, TrendingUp, Star, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';
import PropertyCard from '@/components/PropertyCard';
import PropertyGallery from '@/components/PropertyGallery';
import PropertyContactBox from '@/components/PropertyContactBox';
import GoogleAdPlaceholder from '@/components/GoogleAdPlaceholder';
import { getPriceLabel, getAreaLabel, PRICE_RANGES_SELL, PRICE_RANGES_RENT, AREA_RANGES } from '@/constants/ranges';
import { formatPrice, generateSlug, formatArea } from '@/lib/utils';
import SearchForm from '@/components/SearchForm';

const PropertyComments = dynamic(() => import('@/components/PropertyComments'), { ssr: false });
const Adsense = dynamic(() => import('@/components/Adsense'), { ssr: false });


function looksLikePropertyId(value: string) {
  return value.length >= 16;
}

export default function PropertyDetailClient({ initialProperty }: { initialProperty?: any }) {
  const params = useParams();
  const router = useRouter();
  const slug_id = params?.slug_id as string;
  const actualId: string = slug_id ? (slug_id.split('--').pop() || '') : '';

  const [property, setProperty] = useState<any>(initialProperty ?? null);
  const [loading, setLoading] = useState(!initialProperty);
  const [showPhone, setShowPhone] = useState(false);
  const [realPhone, setRealPhone] = useState<string | null>(null);

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintReason, setComplaintReason] = useState('Thông tin không chính xác');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);

  const submitComplaint = async () => {
    const token = getAuthToken();
    if (!token) return toast.error('Vui lòng đăng nhập để khiếu nại.');
    if (!complaintDesc.trim()) return toast.error('Vui lòng nhập chi tiết khiếu nại.');
    setComplaintSubmitting(true);
    try {
      await api.post('/users/complaints', { 
        propertyId: property.id,
        type: 'PROPERTY',
        subject: complaintReason,
        content: complaintDesc
      });
      setShowComplaintModal(false);
      setComplaintReason('Thông tin không chính xác');
      setComplaintDesc('');
      toast.success('Gửi khiếu nại thành công. Bất động sản này sẽ được xem xét.');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra khi gửi khiếu nại.');
    } finally {
      setComplaintSubmitting(false);
    }
  };

  const [related, setRelated] = useState<any[]>([]);
  const { user } = useAuth();
  const isOwner = user?.id === property?.userId;
  const isAdmin = user?.role === 'ADMIN';
  const [showOwnerMenu, setShowOwnerMenu] = useState(false);

  useEffect(() => {
    if (!actualId || !looksLikePropertyId(actualId)) {
      setLoading(false);
      return;
    }
    
    if (initialProperty) {
      // Save to recently viewed
      const recent = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      const updated = [initialProperty, ...recent.filter((p: any) => p.id !== initialProperty.id)].slice(0, 10);
      localStorage.setItem('recentlyViewed', JSON.stringify(updated));
      
      // Delay non-critical requests to avoid "Bão request"
      setTimeout(() => {
        api.get(`/properties/${actualId}/related`)
          .then(res => setRelated(Array.isArray(res.data) ? res.data : []))
          .catch(() => {});

        if (getAuthToken()) {
          api.get('/users/saved').then(res => {
            if (res.data.find((p: any) => p.id === actualId)) setIsSaved(true);
          }).catch(() => {});
          
          api.post(`/properties/${actualId}/view`).catch(() => {});
        }
      }, 1000); // 1s delay
      return;
    }

    api.get(`/properties/${actualId}`)
      .then(res => {
        setProperty(res.data);
        const recent = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        const updated = [res.data, ...recent.filter((p: any) => p.id !== res.data.id)].slice(0, 10);
        localStorage.setItem('recentlyViewed', JSON.stringify(updated));
        if (getAuthToken()) {
          api.post(`/properties/${actualId}/view`).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    setTimeout(() => {
      api.get(`/properties/${actualId}/related`)
        .then(res => setRelated(Array.isArray(res.data) ? res.data : []))
        .catch(() => {});

      if (getAuthToken()) {
        api.get('/users/saved').then(res => {
          if (res.data.find((p: any) => p.id === actualId)) setIsSaved(true);
        }).catch(() => {});
      }
    }, 1000);

  }, [actualId, initialProperty]);

  const requireLogin = () => {
    if (!getAuthToken()) {
      const returnUrl = window.location.pathname + window.location.search;
      router.push('/login?returnUrl=' + encodeURIComponent(returnUrl));
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    if (!requireLogin()) return;
    try {
      if (isSaved) {
        await api.delete(`/properties/${actualId}/save`);
        setIsSaved(false);
        toast.success('Đã bỏ lưu tin');
      } else {
        await api.post(`/properties/${actualId}/save`);
        setIsSaved(true);
        toast.success('Đã lưu tin thành công');
      }
      
    } catch {
      setIsSaving(false);
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
      
    }
  };

  const handleRevealPhone = () => {
    setShowPhone(true);
    api.post(`/properties/${actualId}/track-phone-reveal`).then(res => {
      if (res.data.phone) {
        setRealPhone(res.data.phone);
      }
    }).catch(() => {});
  };

  const handleCall = () => {
    api.post(`/properties/${actualId}/click-contact`, { type: 'PHONE' }).catch(() => {});
  };

  const handleZalo = () => {
    api.post(`/properties/${actualId}/click-contact`, { type: 'ZALO' }).catch(() => {});
  };

  const handleUpTin = async () => {
    if (isPromoting) return;
    setIsPromoting(true);
    try {
      await api.post(`/properties/${actualId}/promote`, { type: 'UP' });
      toast.success('Up tin thành công');
      
    } catch (err: any) {
      if (err.response?.data?.requiresPayment) {
        toast.error(err.response?.data?.message || 'Số dư không đủ. Đang chuyển hướng...');
        setTimeout(() => router.push('/user/nap-tien'), 2000);
      } else {
        toast.error(err.response?.data?.message || 'Lỗi khi up tin');
      }
      
    }
  };

  const toggleStatus = async (newStatus: string) => {
    try {
      await api.put(`/properties/${actualId}/status`, { status: newStatus });
      setProperty({ ...property, status: newStatus });
      toast.success('Cập nhật trạng thái thành công');
      
      setShowOwnerMenu(false);
    } catch {
      setIsSaving(false);
      toast.error('Lỗi cập nhật trạng thái');
      
    }
  };

  const handleDeleteProperty = async () => {
    const confirmed = await confirmAction('Bạn có chắc muốn xóa tin này không? Hành động này không thể hoàn tác.');
    if (!confirmed) return;
    try {
      await api.delete(`/properties/${actualId}`);
      toast.success('Đã xóa tin đăng');
      setTimeout(() => {
        router.push('/user/my-listings');
      }, 1500);
    } catch {
      setIsSaving(false);
      toast.error('Lỗi khi xóa tin');
      
    }
  };

  const handleExtend = async () => {
    try {
      await api.post(`/properties/${actualId}/extend`);
      toast.success('Gia hạn tin thành công');
      
    } catch {
      setIsSaving(false);
      toast.error('Lỗi khi gia hạn tin');
      
    }
  };

  const submitReport = async () => {
    if (!reportReason.trim()) {
      toast.error('Vui lòng chọn lý do');
      
      return;
    }
    if (!requireLogin()) return;
    try {
      await api.post(`/properties/${actualId}/report`, { reason: reportReason });
      toast.success('Đã gửi báo cáo vi phạm');
      setShowReportModal(false);
      setReportReason('');
      
    } catch {
      setIsSaving(false);
      setToastMessage('Lỗi khi gửi báo cáo (Bạn đã báo cáo rồi?)');
      
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  if (!property) return <div className="min-h-screen flex items-center justify-center">Không tìm thấy bất động sản</div>;

  const txDef = transactionByEnum(property.transactionType);
  const typeDef = propertyTypeByEnum(property.propertyType);

  const rangePriceLabel = getPriceLabel(property.priceRangeKey, property.transactionType);
  const exactPrice = (property.price && property.price > 0) ? formatPrice(property.price) : '';
  
  let finalPrice = 'Đang cập nhật';
  if (rangePriceLabel && exactPrice) {
    finalPrice = `${rangePriceLabel} (${exactPrice})`;
  } else if (rangePriceLabel && !exactPrice) {
    finalPrice = rangePriceLabel;
  } else if (!rangePriceLabel && exactPrice) {
    finalPrice = exactPrice;
  }

  if (property.isNegotiable || property.priceRangeKey === 'THOA_THUAN') {
    if (finalPrice !== 'Đang cập nhật' && !finalPrice.toLowerCase().includes('thỏa thuận') && !finalPrice.toLowerCase().includes('thương lượng')) {
      finalPrice = `${finalPrice} (Thương lượng)`;
    } else if (finalPrice === 'Đang cập nhật' || finalPrice.toLowerCase() === 'thỏa thuận') {
      finalPrice = 'Giá thương lượng';
    }
  }

  const rangeAreaLabel = getAreaLabel(property.areaRangeKey);
  const exactArea = property.area ? formatArea(property.area) : '';
  let finalArea = 'Đang cập nhật';
  if (rangeAreaLabel && exactArea) {
    finalArea = `${rangeAreaLabel} (${exactArea})`;
  } else if (rangeAreaLabel && !exactArea) {
    finalArea = rangeAreaLabel;
  } else if (!rangeAreaLabel && exactArea) {
    finalArea = exactArea;
  }

  // Calculate Price per m2
  let pricePerM2 = null;
  if (property.price && property.area && property.price > 0) {
    pricePerM2 = property.price / property.area;
  } else {
    const priceRanges = property.transactionType === 'CHO_THUE' ? PRICE_RANGES_RENT : PRICE_RANGES_SELL;
    const pMatch = priceRanges.find(r => r.key === property.priceRangeKey);
    const aMatch = AREA_RANGES.find(r => r.key === property.areaRangeKey);
    
    let avgPrice = (property.price && property.price > 0) ? property.price : null;
    if (!avgPrice && pMatch && pMatch.canCalculate && pMatch.min && pMatch.max) {
      avgPrice = (pMatch.min + pMatch.max) / 2;
    }
    
    let avgArea = (property.area && property.area > 0) ? property.area : null;
    if (!avgArea && aMatch && aMatch.canCalculate && aMatch.min && aMatch.max) {
      avgArea = (aMatch.min + aMatch.max) / 2;
    }

    if (avgPrice && avgArea) {
      pricePerM2 = avgPrice / avgArea;
    }
  }

  let formattedPricePerM2 = 'Đang cập nhật';
  if (pricePerM2) {
    if (pricePerM2 < 500000 || pricePerM2 > 9999000000) {
      formattedPricePerM2 = '-';
    } else if (pricePerM2 < 1000000) {
      formattedPricePerM2 = `≈ ${formatNumberString(Math.round(pricePerM2 / 1000))} nghìn/m²`;
    } else {
      formattedPricePerM2 = `≈ ${(pricePerM2 / 1000000).toFixed(1).replace(/\.0$/, '').replace('.', ',')} triệu/m²`;
    }
  } else if (property.isNegotiable || property.priceRangeKey === 'THOA_THUAN') {
    formattedPricePerM2 = 'Giá thương lượng';
  }

  // Bảng alias phường cứng cho một phường ở Vinh đã bỏ — dữ liệu Hà Nội có cột
  // oldWard thật cho mọi tin.
  
  let wardDisplay = '';
  if (property.ward) {
    let baseWard = property.ward.trim();
    if (property.oldWard) {
      wardDisplay = `${baseWard} (${property.oldWard.trim()})`;
    } else {
      wardDisplay = baseWard;
    }
  }

  const locationParts = [];
  if (property.street) locationParts.push(property.street);
  if (wardDisplay) locationParts.push(wardDisplay);
  if (property.district) locationParts.push(property.district);
  if (property.city) locationParts.push(property.city);
  
  const formattedLocation = locationParts.join(', ');

  const blurredPhone = property.user?.phone || 'Chưa cập nhật';
  const userPhone = realPhone || blurredPhone;

  const imageUrls = property.imageObjects && property.imageObjects.length > 0
    ? property.imageObjects.map((img: any) => toMediaUrl(img.url))
    : (property.images && property.images.length > 0 ? property.images.map((u: string) => toMediaUrl(u)) : []);

  // Mảng breadcrumb cũ ở đây chưa từng được render (component Breadcrumb không hề
  // được gọi ở file này). Breadcrumb giờ dựng ở page.tsx bằng listingBreadcrumb(),
  // nơi có sẵn quan hệ wardLocation/districtLocation để ra đủ 6 cấp.

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-[1200px] mx-auto mb-6">
        <SearchForm />
      </div>
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        
          {/* Main Content */}
        <div className="w-full space-y-6 animate-fade-in lg:col-span-2">
          {/* Owner Toolbar */}
          {isOwner && (
            <div className="bg-white rounded-2xl p-4 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex gap-4 text-sm text-gray-600 font-medium w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <div className="flex items-center gap-1.5 whitespace-nowrap"><Phone className="w-4 h-4 text-primary" /> {property.callClicks || 0} Click Gọi</div>
                <div className="flex items-center gap-1.5 whitespace-nowrap"><MessageCircle className="w-4 h-4 text-blue-500" /> {property.zaloClicks || 0} Click Zalo</div>
                <div className="flex items-center gap-1.5 whitespace-nowrap"><Eye className="w-4 h-4 text-gray-500" /> {property.views || 0} Lượt xem</div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto justify-end relative">
                <button onClick={handleUpTin} disabled={isPromoting} className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent-light transition-colors whitespace-nowrap disabled:opacity-50">
                  <TrendingUp className="w-4 h-4" /> Up tin
                </button>
                <Link href={`/user/properties/${actualId}/upgrade`} className="flex items-center gap-1.5 px-4 py-2 bg-yellow-500 text-white rounded-xl text-sm font-bold hover:bg-yellow-400 transition-colors whitespace-nowrap">
                  <Star className="w-4 h-4" /> Ghim VIP
                </Link>
                <button onClick={() => setShowOwnerMenu(!showOwnerMenu)} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>

                {showOwnerMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in">
                    {property.status === 'EXPIRED' && (
                      <button onClick={handleExtend} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary text-left">
                        <CheckCircle className="w-4 h-4" /> Gia hạn tin
                      </button>
                    )}
                    {property.status === 'HIDDEN' ? (
                      <button onClick={() => toggleStatus('APPROVED')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary text-left">
                        <CheckCircle className="w-4 h-4" /> Hiện tin
                      </button>
                    ) : (
                      <button onClick={() => toggleStatus('HIDDEN')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-orange-500 text-left">
                        <EyeOff className="w-4 h-4" /> Ẩn tin
                      </button>
                    )}
                    {property.status !== 'SOLD' && (
                      <button onClick={() => toggleStatus('SOLD')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600 text-left">
                        <CheckCircle className="w-4 h-4" /> Đã bán/cho thuê
                      </button>
                    )}
                    <div className="h-px bg-gray-100 my-1"></div>
                    <button onClick={handleDeleteProperty} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left font-medium">
                      <Trash2 className="w-4 h-4" /> Xóa tin
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Gallery */}
          <PropertyGallery imageUrls={imageUrls} status={property.status} />

          {/* Details */}
          <div className="bg-white rounded-2xl p-6 shadow-card">
            {/* Category Tags */}
            {/* Hai thẻ này trước đây là 5 nhánh ternary viết cứng URL dạng cũ (`/tat-ca`,
                `/dat-nen`…) và link cho thuê thì trỏ vào `/search` vốn noindex. Nay lấy
                nhãn từ taxonomy và đường dẫn từ listingPath — cùng nguồn với canonical
                và sitemap, nên link nội bộ trỏ thẳng vào 200 chứ không ăn 301. */}
            <div className="flex items-center gap-2 mb-3">
              <Link href={listingPath({ transaction: txDef?.slug === 'cho-thue' ? 'cho-thue' : 'ban' })} className="px-3 py-1 bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors rounded-full text-xs font-bold uppercase cursor-pointer">
                {txDef?.label ?? 'Bán'}
              </Link>
              {typeDef && (
                <Link
                  href={listingPath({
                    transaction: txDef?.slug === 'cho-thue' ? 'cho-thue' : 'ban',
                    propertyTypeSlug: typeDef.slug,
                  })}
                  className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors rounded-full text-xs font-bold uppercase cursor-pointer"
                >
                  {typeDef.label}
                </Link>
              )}
              {property.tier === 'VIP' && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded-full text-xs font-bold uppercase">
                  VIP
                </span>
              )}
              {property.tier === 'UP' && (
                <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold uppercase">
                  UP
                </span>
              )}
            </div>
            
            {/* Title */}
            <h1 className="text-2xl font-bold text-textMain mb-4 leading-snug">{property.title}</h1>
            


            {/* Main Info Grid */}
            <h3 className="font-bold text-lg mb-4 text-textMain border-b border-gray-100 pb-2">Thông tin chính</h3>
            <div className="flex flex-col bg-gray-50/50 px-4 py-2 rounded-xl border border-gray-100 mb-8">
              <div className="flex items-center gap-3 py-2.5 border-b border-gray-200/60 last:border-0">
  <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-accent shrink-0">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  </div>
  <div className="flex items-center justify-between flex-1 min-w-0">
    <span className="text-sm text-gray-500 font-medium">Vị trí</span>
    <span className="text-sm text-right text-sm  font-semibold text-textMain">{formattedLocation}</span>
  </div>
</div>
              <div className="flex items-center gap-3 py-2.5 border-b border-gray-200/60 last:border-0">
  <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-primary shrink-0">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  </div>
  <div className="flex items-center justify-between flex-1 min-w-0">
    <span className="text-sm text-gray-500 font-medium">Mức giá</span>
    <span className="text-sm text-right text-sm  font-bold text-primary">{finalPrice}</span>
  </div>
</div>
              <div className="flex items-center gap-3 py-2.5 border-b border-gray-200/60 last:border-0">
  <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-textMain shrink-0">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
  </div>
  <div className="flex items-center justify-between flex-1 min-w-0">
    <span className="text-sm text-gray-500 font-medium">Diện tích</span>
    <span className="text-sm text-right text-sm  font-semibold text-textMain">{finalArea}</span>
  </div>
</div>
              {formattedPricePerM2 !== '-' && (
                <div className="flex items-center gap-3 py-2.5 border-b border-gray-200/60 last:border-0">
  <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-orange-500 shrink-0">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
  </div>
  <div className="flex items-center justify-between flex-1 min-w-0">
    <span className="text-sm text-gray-500 font-medium">Giá / m²</span>
    <span className="text-sm text-right text-sm  font-semibold text-textMain">{formattedPricePerM2}</span>
  </div>
</div>
              )}
              <div className="flex items-center gap-3 py-2.5 border-b border-gray-200/60 last:border-0">
  <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-gray-500 shrink-0">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
  </div>
  <div className="flex items-center justify-between flex-1 min-w-0">
    <span className="text-sm text-gray-500 font-medium">Mã tin</span>
    <span className="text-sm text-right text-sm  font-semibold text-textMain">{property.propertyCode || '#' + property.id.substring(0, 8)}</span>
  </div>
</div>
              <div className="flex items-center gap-3 py-2.5 border-b border-gray-200/60 last:border-0">
  <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-gray-500 shrink-0">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  </div>
  <div className="flex items-center justify-between flex-1 min-w-0">
    <span className="text-sm text-gray-500 font-medium">Ngày đăng</span>
    <span className="text-sm text-right text-sm  font-semibold text-textMain">{new Date(property.createdAt).toLocaleDateString('vi-VN')}</span>
  </div>
</div>
              <div className="flex items-center gap-3 py-2.5 border-b border-gray-200/60 last:border-0">
  <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-gray-500 shrink-0">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
  </div>
  <div className="flex items-center justify-between flex-1 min-w-0">
    <span className="text-sm text-gray-500 font-medium">Lượt xem</span>
    <span className="text-sm text-right text-sm  font-semibold text-textMain">{property.views || 0}</span>
  </div>
</div>
              </div>
              
            {/* Mobile Author Info */}
            <div className="flex items-center gap-4 mb-6 lg:hidden bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <Link href={`/user/${generateSlug(property.user?.name || 'user')}-${property.user?.id || ''}`} className="flex items-center gap-3 w-full">
                <div className="w-14 h-14 bg-gray-200 rounded-full overflow-hidden relative shrink-0">
                  {property.user?.avatar ? (
                    <Image fill src={toMediaUrl(property.user.avatar)} className="object-cover" alt="Avatar" />
                  ) : (
                    <svg className="w-full h-full text-gray-400 p-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-textMain truncate">{property.user?.name || 'Người đăng ẩn danh'}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Đã tham gia {new Date(property.user?.createdAt || Date.now()).toLocaleDateString('vi-VN')}</p>
                </div>
              </Link>
            </div>

            {/* Action Buttons (Call / Zalo / Save) - Only on Mobile */}
            <div className="flex flex-wrap items-center gap-3 mb-8 lg:hidden">
              {!showPhone ? (
                <button onClick={handleRevealPhone} disabled={blurredPhone === 'Đã ẩn'} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent to-accent-light text-white rounded-xl font-bold hover:shadow-glow-accent transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center">
                  <Phone className="w-5 h-5" /> {blurredPhone === 'Đã ẩn' ? 'Đã ẩn số' : `${blurredPhone} (Bấm để hiện số)`}
                </button>
              ) : (
                <>
                  <a href={userPhone === 'Đã ẩn' ? '#' : `tel:${userPhone}`} onClick={userPhone === 'Đã ẩn' ? (e) => e.preventDefault() : handleCall} className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm w-full ${userPhone === 'Đã ẩn' ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}>
                    <Phone className="w-5 h-5" /> {userPhone === 'Đã ẩn' ? 'Đã ẩn số' : 'Gọi ngay'}
                  </a>
                  <a href={userPhone === 'Đã ẩn' ? '#' : `https://zalo.me/${userPhone}`} onClick={userPhone === 'Đã ẩn' ? (e) => e.preventDefault() : handleZalo} target={userPhone === 'Đã ẩn' ? "_self" : "_blank"} rel="noopener noreferrer" className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm w-full ${userPhone === 'Đã ẩn' ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>
                    <MessageCircle className="w-5 h-5" /> Zalo
                  </a>
                </>
              )}
              <div className="flex gap-3 w-full">
                <button onClick={handleSave} className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 border-2 rounded-xl font-bold transition-colors shadow-sm ${isSaved ? 'border-red-500 text-red-500 hover:bg-red-50' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}>
                  <svg className={`w-5 h-5 ${isSaved ? 'fill-current' : 'fill-none stroke-currentColor'}`} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  {isSaved ? 'Đã lưu' : 'Lưu tin'}
                </button>
                <button 
                  onClick={() => addCompareItem({
                    id: property.id,
                    title: property.title,
                    price: property.price,
                    images: property.imageObjects?.length > 0 
                      ? property.imageObjects.map((img: any) => toMediaUrl(img.url)) 
                      : property.images?.map((url: string) => toMediaUrl(url)) || []
                  })} 
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 border-2 border-blue-200 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors shadow-sm"
                >
                  <ArrowRightLeft className="w-5 h-5" />
                  So sánh
                </button>
              </div>
            </div>

            <h3 className="font-bold text-lg mb-4 text-textMain border-b border-gray-100 pb-2">Đặc điểm</h3>
            <div className="flex flex-col bg-gray-50/50 px-4 py-2 rounded-xl border border-gray-100 mb-8">
              {/* Additional Specs */}
              {property.bedrooms && (
                <div className="flex items-center gap-3 py-2.5 border-b border-gray-200/60 last:border-0">
  <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-gray-500 shrink-0">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
  </div>
  <div className="flex items-center justify-between flex-1 min-w-0">
    <span className="text-sm text-gray-500 font-medium">Phòng ngủ</span>
    <span className="text-sm text-right text-sm  font-semibold text-textMain">{property.bedrooms} phòng</span>
  </div>
</div>
              )}
              {property.bathrooms && (
                <div className="flex items-center gap-3 py-2.5 border-b border-gray-200/60 last:border-0">
  <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-gray-500 shrink-0">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
  </div>
  <div className="flex items-center justify-between flex-1 min-w-0">
    <span className="text-sm text-gray-500 font-medium">Phòng tắm</span>
    <span className="text-sm text-right text-sm  font-semibold text-textMain">{property.bathrooms} phòng</span>
  </div>
</div>
              )}
              {property.floors && (
                <div className="flex items-center gap-3 py-2.5 border-b border-gray-200/60 last:border-0">
  <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-gray-500 shrink-0">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
  </div>
  <div className="flex items-center justify-between flex-1 min-w-0">
    <span className="text-sm text-gray-500 font-medium">Số tầng</span>
    <span className="text-sm text-right text-sm  font-semibold text-textMain">{property.floors} tầng</span>
  </div>
</div>
              )}
              {(property.direction && property.transactionType !== 'CHO_THUE') && (
                <div className="flex items-center gap-3 py-2.5 border-b border-gray-200/60 last:border-0">
  <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-gray-500 shrink-0">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
  </div>
  <div className="flex items-center justify-between flex-1 min-w-0">
    <span className="text-sm text-gray-500 font-medium">Hướng nhà</span>
    <span className="text-sm text-right text-sm  font-semibold text-textMain">{property.direction}</span>
  </div>
</div>
              )}
              {property.legal && (
                <div className="flex items-center gap-3 py-2.5 border-b border-gray-200/60 last:border-0">
  <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-gray-500 shrink-0">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  </div>
  <div className="flex items-center justify-between flex-1 min-w-0">
    <span className="text-sm text-gray-500 font-medium">Pháp lý</span>
    <span className="text-sm text-right text-sm  font-semibold text-textMain">{property.legal}</span>
  </div>
</div>
              )}
              {(property.frontage && property.transactionType !== 'CHO_THUE') && (
                <div className="flex items-center gap-3 py-2.5 border-b border-gray-200/60 last:border-0">
  <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-gray-500 shrink-0">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
  </div>
  <div className="flex items-center justify-between flex-1 min-w-0">
    <span className="text-sm text-gray-500 font-medium">Mặt tiền</span>
    <span className="text-sm text-right text-sm  font-semibold text-textMain">{property.frontage} m</span>
  </div>
</div>
              )}
              {property.roadWidth && (
                <div className="flex items-center gap-3 py-2.5 border-b border-gray-200/60 last:border-0">
  <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-gray-500 shrink-0">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
  </div>
  <div className="flex items-center justify-between flex-1 min-w-0">
    <span className="text-sm text-gray-500 font-medium">Đường vào</span>
    <span className="text-sm text-right text-sm  font-semibold text-textMain">{property.roadWidth} m</span>
  </div>
</div>
              )}
              {property.furniture && (
                <div className="flex items-center gap-3 py-2.5 border-b border-gray-200/60 last:border-0">
  <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-gray-500 shrink-0">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
  </div>
  <div className="flex items-center justify-between flex-1 min-w-0">
    <span className="text-sm text-gray-500 font-medium">Nội thất</span>
    <span className="text-sm text-right text-sm  font-semibold text-textMain">{property.furniture}</span>
  </div>
</div>
              )}
              {property.surroundings && (
                <div className="flex items-center gap-3 py-2.5 border-b border-gray-200/60 last:border-0">
  <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-gray-500 shrink-0">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  </div>
  <div className="flex items-center justify-between flex-1 min-w-0">
    <span className="text-sm text-gray-500 font-medium">Tiện ích xung quanh</span>
    <span className="text-sm text-right text-sm  font-semibold text-textMain">{property.surroundings}</span>
  </div>
</div>
              )}
              {property.ownership && property.transactionType !== 'CHO_THUE' && (
                <div className="flex items-center gap-3 py-2.5 border-b border-gray-200/60 last:border-0">
  <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-gray-500 shrink-0">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
  </div>
  <div className="flex items-center justify-between flex-1 min-w-0">
    <span className="text-sm text-gray-500 font-medium">Nguồn tin</span>
    <span className="text-sm text-right text-sm  font-semibold text-textMain">{property.ownership}</span>
  </div>
</div>
              )}
            </div>

            {/* Description */}
            <h3 className="font-bold text-lg mb-2">Thông tin mô tả</h3>
            <div className="text-gray-600 whitespace-pre-line leading-relaxed mb-8">
              {property.description}
            </div>

            <GoogleAdPlaceholder />

            <div className="flex items-center justify-between mb-2 mt-6">
              <h3 className="font-bold text-lg">Bản đồ</h3>
              {property.isExactLocation === false && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Vị trí tương đối (bán kính 500m)
                </span>
              )}
            </div>
            <div className="mb-6 rounded-xl overflow-hidden bg-gray-100 h-64 border border-gray-200 relative">
              {(() => {
                const lat = property.lat || property.latitude;
                const lng = property.lng || property.longitude;
                const hasCoords = lat && lng;
                const addressQuery = !hasCoords 
                  ? encodeURIComponent([property.street, property.ward, property.district, property.city].filter(Boolean).join(', '))
                  : '';
                const mapQuery = hasCoords ? `${lat},${lng}` : addressQuery;
                
                if (mapQuery) {
                  return (
                    <iframe
                      className="w-full h-full"
                      frameBorder="0"
                      style={{ border: 0, opacity: (!hasCoords || property.isExactLocation === false) ? 0.7 : 1 }}
                      src={`https://maps.google.com/maps?q=${mapQuery}&hl=vi&z=${(!hasCoords || property.isExactLocation === false) ? 13 : 15}&output=embed`}
                      allowFullScreen
                    ></iframe>
                  );
                } else {
                  return (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                      <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                      <span>Chưa có thông tin vị trí</span>
                    </div>
                  );
                }
              })()}
            </div>

            {/* Actions: Compare & Share */}
            <div className="mb-8 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => addCompareItem({
                  id: property.id,
                  title: property.title,
                  price: property.price,
                  images: imageUrls
                })}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:text-primary hover:border-primary hover:bg-white transition-all"
              >
                <ArrowRightLeft size={16} /> Thêm vào so sánh
              </button>
              <ShareButtons title={property.title} />
            </div>



            <div className="flex justify-end gap-4">
              <button onClick={() => setShowComplaintModal(true)} className="text-orange-500 hover:text-orange-600 font-medium text-sm flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Khiếu nại
              </button>
              <button onClick={() => setShowReportModal(true)} className="text-red-500 hover:text-red-600 font-medium text-sm flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Báo cáo vi phạm
              </button>
            </div>
          </div>



          {/* Comments Section */}
          <PropertyComments propertyId={actualId} isOwner={isOwner} isAdmin={isAdmin} />
          
          <div className="mt-8">
            <Adsense />
          </div>

        </div>

        {/* Sidebar: Author info (Contact Box) - Only visible on desktop/tablet */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-36">
            <h3 className="font-bold text-lg mb-4 text-textMain border-b border-gray-100 pb-2">Người đăng</h3>
            <PropertyContactBox
              property={property}
              userPhone={userPhone}
              blurredPhone={blurredPhone}
              showPhone={showPhone}
              isSaved={isSaved}
              handleRevealPhone={handleRevealPhone}
              handleCall={handleCall}
              handleZalo={handleZalo}
              handleSave={handleSave}
              addCompareItem={addCompareItem}
            />
            
            <div className="mt-6">
              <Adsense className="min-h-[250px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Bài viết liên quan */}
      {related.length > 0 && (
        <div className="max-w-[1600px] mx-auto mt-12 mb-8 animate-slide-up pb-8 md:pb-8">
          <h2 className="text-xl font-extrabold text-textMain mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-accent rounded-full inline-block"></span>
            Bài viết liên quan
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
            {related.slice(0, 8).map((item: any) => (
              <PropertyCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* SEO Internal Link Locality Block */}
      <div className="max-w-[1600px] mx-auto mt-8 mb-8 animate-slide-up pb-24 md:pb-8">
        <h2 className="text-xl font-extrabold text-textMain mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-accent rounded-full inline-block"></span>
          Bất động sản liên quan
        </h2>
        <div className="flex flex-wrap gap-2">
          {(() => {
            if (!property) return null;
            const isRent = property.transactionType === 'CHO_THUE';
            const actionText = isRent ? 'Cho thuê' : 'Bán';
            // Lấy urlSegment THẬT từ quan hệ khu vực của tin. generateSlug(tên) cho
            // ra 'phuong-yen-hoa' trong khi urlSegment là 'yen-hoa', nên 4 link SEO
            // bên dưới sẽ trỏ vào trang không tồn tại.
            const locNode = property.wardLocation || property.districtLocation || property.province || null;
            const locSlug: string | null = locNode?.urlSegment ?? locNode?.slug ?? null;
            const locName = locNode?.name || property.ward || property.district || property.city || siteConfig.province.name;

            // Hai bảng ánh xạ viết tay trước đây khai khoá 'MAT_BANG_KHO_XUONG' trong
            // khi enum thật là 'MAT_BANG', nên MỌI tin mặt bằng rơi vào fallback và 4
            // link dưới đây trỏ sang danh mục đất nền. Lấy từ taxonomy thì hết lệch.
            const mappedTypeSlug = typeDef?.slug ?? 'dat-nen';
            const mappedTypeName = (typeDef?.label ?? 'Đất nền').toLowerCase();
            const isNhaRieng = mappedTypeSlug === 'nha-rieng';

            return (
              <>
                {/* 1. Category + Location: Bán đất nền phường Trường Vinh -> /dat-nen/phuong-truong-vinh */}
                <Link href={listingPath({ transaction: isRent ? 'cho-thue' : 'ban', propertyTypeSlug: mappedTypeSlug, locationSlug: locSlug })} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-full text-sm hover:bg-primary hover:text-white hover:border-primary transition-colors shadow-sm">
                  {actionText} {mappedTypeName} {locName}
                </Link>

                {/* 2. Danh mục toàn tỉnh */}
                <Link href={listingPath({ transaction: isRent ? 'cho-thue' : 'ban', propertyTypeSlug: mappedTypeSlug })} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-full text-sm hover:bg-primary hover:text-white hover:border-primary transition-colors shadow-sm">
                  {actionText} {mappedTypeName} {siteConfig.province.name}
                </Link>

                {/* 3. Global Location: Nhà đất bán phường Trường Vinh -> /phuong-truong-vinh */}
                <Link href={listingPath({ transaction: isRent ? 'cho-thue' : 'ban', locationSlug: locSlug })} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-full text-sm hover:bg-primary hover:text-white hover:border-primary transition-colors shadow-sm">
                  Nhà đất {isRent ? 'cho thuê' : 'bán'} {locName}
                </Link>

                {/* 4. Alternative Category + Location: Bán nhà riêng phường Trường Vinh -> /nha-rieng/phuong-truong-vinh */}
                <Link href={listingPath({ transaction: isRent ? 'cho-thue' : 'ban', propertyTypeSlug: isNhaRieng ? 'dat-nen' : 'nha-rieng', locationSlug: locSlug })} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-full text-sm hover:bg-primary hover:text-white hover:border-primary transition-colors shadow-sm">
                  {actionText} {isNhaRieng ? 'đất nền' : 'nhà riêng'} {locName}
                </Link>
              </>
            );
          })()}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 md:bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-[10001] text-sm animate-fade-in font-medium">
          {toastMessage}
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100000] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up relative">
            <button onClick={() => setShowReportModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-xl font-bold mb-4 text-red-600">Báo cáo tin đăng vi phạm</h3>
            <p className="text-sm text-gray-600 mb-4">Vui lòng chọn lý do báo cáo để chúng tôi xử lý:</p>
            
            <div className="space-y-2 mb-6">
              {['Thông tin sai sự thật', 'Tin giả mạo / Lừa đảo', 'Đã bán / Cho thuê rồi', 'Hình ảnh không hợp lệ', 'Lý do khác'].map(reason => (
                <label key={reason} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input 
                    type="radio" 
                    name="reportReason" 
                    value={reason}
                    checked={reportReason === reason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">{reason}</span>
                </label>
              ))}
            </div>
            
            <button 
              onClick={submitReport}
              disabled={!reportReason}
              className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
            >
              Gửi báo cáo
            </button>
          </div>
        </div>
      )}

      {showComplaintModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowComplaintModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-xl font-bold mb-4">Gửi khiếu nại</h3>
            <p className="text-sm text-gray-500 mb-4">Vui lòng cung cấp lý do khiếu nại về bất động sản này. Quản trị viên sẽ kiểm tra và phản hồi.</p>
            <select 
              value={complaintReason}
              onChange={(e) => setComplaintReason(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-4 outline-none focus:border-orange-500"
            >
              <option value="Thông tin không chính xác">Thông tin không chính xác</option>
              <option value="Lừa đảo">Lừa đảo</option>
              <option value="Đã giao dịch xong">Đã giao dịch xong</option>
              <option value="Không liên lạc được">Không liên lạc được</option>
              <option value="Khác">Lý do khác</option>
            </select>
            <textarea 
              placeholder="Nhập chi tiết khiếu nại..." 
              value={complaintDesc}
              onChange={(e) => setComplaintDesc(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-6 outline-none focus:border-orange-500 resize-none"
              rows={4}
            />
            <button 
              onClick={submitComplaint} 
              disabled={complaintSubmitting || !complaintDesc.trim()}
              className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {complaintSubmitting ? 'Đang gửi...' : 'Gửi khiếu nại'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
