"use client";
import { useEffect, useState } from 'react';
import EditHistoryModal from '@/components/EditHistoryModal';
import { listingDetailPath } from '@/lib/seo/canonical';
import { siteConfig } from '@/lib/site-config';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { getAuthToken, isUnauthorizedError, loginUrl } from '@/lib/auth';
import toast from 'react-hot-toast';
import { confirmAction } from '@/lib/toast-helpers';
import { generateSlug, formatNumberString, formatPrice, formatArea } from '@/lib/utils';
import { Crown, ArrowUpCircle, EyeOff, CheckCircle, Trash2, Edit, MapPin } from 'lucide-react';
import { toMediaUrl } from '@/lib/media';

export default function MyListingsClient() {
  const [viewingHistory, setViewingHistory] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'published' | 'draft'>('published');
  const [loading, setLoading] = useState(true);
  const [cooldowns, setCooldowns] = useState<{[key: string]: number}>({});
  const [vipPackages, setVipPackages] = useState<any[]>([]);
  const [promoteModal, setPromoteModal] = useState<{isOpen: boolean, propertyId: string | null, type: 'VIP' | 'UP'}>({ isOpen: false, propertyId: null, type: 'VIP' });
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [customDays, setCustomDays] = useState<number>(1);
  const [isPromoting, setIsPromoting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldowns(prev => {
        const next = { ...prev };
        let updated = false;
        for (const id in next) {
          if (next[id] > 0) {
            next[id] -= 1;
            updated = true;
          }
        }
        return updated ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    if (!getAuthToken()) {
      router.replace(loginUrl('/user/my-listings'));
      return;
    }

    setLoading(true);
    try {
      const [resProps, resDrafts, resSettings] = await Promise.all([
        api.get('/users/properties'),
        api.get('/properties/my-drafts'),
        api.get('/settings/public')
      ]);
      setProperties(resProps.data || []);
      setDrafts(resDrafts.data || []);
      setVipPackages(resSettings.data?.vipPackages || []);
      setSettings(resSettings.data || {});
    } catch (err) {
      if (isUnauthorizedError(err)) {
        router.replace(loginUrl('/user/my-listings'));
      } else {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmAction('Bạn có chắc chắn muốn xoá bài đăng này?');
    if (!confirmed) return;
    try {
      await api.delete(`/properties/${id}`);
      toast.success('Đã xoá thành công');
      fetchData();
    } catch (err: any) {
      toast.error('Xoá thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/properties/${id}/status`, { status });
      toast.success('Cập nhật trạng thái thành công!');
      fetchData();
    } catch (err: any) {
      toast.error('Cập nhật thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const handlePromoteClick = async (id: string, type: 'VIP' | 'UP') => {
    if (type === 'UP') {
      const confirmed = await confirmAction('Xác nhận Đẩy tin (Sẽ trừ điểm theo bảng giá)?');
      if (!confirmed) return;
      executePromote(id, type);
    } else {
      setPromoteModal({ isOpen: true, propertyId: id, type: 'VIP' });
      setSelectedPackageId(null);
    }
  };

  const executePromote = async (id: string, type: 'VIP' | 'UP') => {
    try {
      setIsPromoting(true);
      if (type === 'VIP') {
        if (!customDays || customDays < 1) {
          toast.error('Vui lòng nhập số ngày hợp lệ!');
          return;
        }
        await api.post(`/properties/${id}/promote`, { type: 'VIP', customDays });
        toast.success('Nâng VIP thành công!');
        setPromoteModal({ isOpen: false, propertyId: null, type: 'VIP' });
      } else {
        await api.post(`/properties/${id}/promote`, { type: 'UP' });
        toast.success('Đẩy tin thành công!');
        setCooldowns(prev => ({ ...prev, [id]: 10 })); 
      }
      fetchData();
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      const errorMsg = typeof serverMsg === 'object' ? serverMsg.message : serverMsg;
      toast.error('Thất bại: ' + (errorMsg || err.message));
    } finally {
      setIsPromoting(false);
    }
  };

  const handleUnpromote = async (id: string, type: 'VIP' | 'UP') => {
    const confirmed = await confirmAction(`Bạn có chắc muốn gỡ ${type}? Không hoàn lại tiền!`);
    if (!confirmed) return;
    try {
      await api.post(`/properties/${id}/unpromote`, { type });
      toast.success(`Đã gỡ ${type} thành công`);
      fetchData();
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      const errorMsg = typeof serverMsg === 'object' ? serverMsg.message : serverMsg;
      toast.error('Thất bại: ' + (errorMsg || err.message));
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const handleResubmit = async (id: string) => {
    try {
      await api.post(`/properties/${id}/resubmit`);
      toast.success('Đã gửi duyệt lại. Tin quay về trạng thái chờ duyệt.');
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không gửi được, vui lòng thử lại');
    }
  };

  return (
    <>
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-textMain">Quản lý tin đăng</h1>
            <p className="mt-2 text-textSecondary">Quản lý các bất động sản của bạn trên {siteConfig.name}</p>
          </div>
          <Link
            href="/post"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 font-bold text-white hover:bg-primary-dark shadow-sm"
          >
            + Đăng tin mới
          </Link>
        </div>

        <div className="mb-6 flex bg-white rounded-xl shadow-sm border border-borderLight p-1 w-fit">
          <button 
            onClick={() => setActiveTab('published')}
            className={`px-6 py-2 rounded-lg font-bold transition-colors ${activeTab === 'published' ? 'bg-primary text-white shadow-md' : 'text-textSecondary hover:bg-gray-50'}`}
          >
            Tin đã đăng ({properties.length})
          </button>
          <button 
            onClick={() => setActiveTab('draft')}
            className={`px-6 py-2 rounded-lg font-bold transition-colors ${activeTab === 'draft' ? 'bg-primary text-white shadow-md' : 'text-textSecondary hover:bg-gray-50'}`}
          >
            Tin nháp ({drafts.length})
          </button>
        </div>

        {(activeTab === 'published' ? properties : drafts).length === 0 ? (
          <div className="rounded-2xl border border-borderLight bg-white p-10 text-center shadow-card">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <p className="text-textSecondary text-lg font-medium mb-4">
              {activeTab === 'published' ? 'Bạn chưa đăng bất kỳ tin nào.' : 'Bạn không có tin nháp nào.'}
            </p>
            <Link href="/post" className="inline-block px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow hover:bg-primary-dark transition-colors">
              Bắt đầu đăng tin ngay
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {(activeTab === 'published' ? properties : drafts).filter(p => p.status !== 'DELETED').map((property) => {
              const imagesList = property.imageObjects && property.imageObjects.length > 0 
                ? property.imageObjects.map((obj: any) => obj.url) 
                : property.images && property.images.length > 0 
                  ? property.images 
                  : [];
              const thumbnail = imagesList.length > 0 ? toMediaUrl(imagesList[0]) : null;

              return (
              <div key={property.id} className="bg-white rounded-2xl shadow-sm border border-borderLight flex flex-col md:flex-row overflow-hidden hover:shadow-card hover:-translate-y-1 transition-all duration-300">
                <Link href={listingDetailPath(generateSlug(property.title), property.shortCode, property.id)} className="w-full md:w-72 h-56 md:h-auto bg-gray-100 relative shrink-0 block group overflow-hidden">
                  {thumbnail ? (
                    <img width={400} height={300} src={thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" alt={property.title} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 font-medium bg-gray-50">
                      <svg className="w-12 h-12 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Chưa có ảnh
                    </div>
                  )}
                  {property.tier === 'VIP' && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg font-bold flex items-center gap-1.5 z-10 border border-yellow-300/30 backdrop-blur-sm">
                      <Crown size={14} className="animate-pulse" /> Đang VIP
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                
                <div className="flex-1 p-6 flex flex-col justify-between relative">
                  <div>
                    <div className="flex justify-between items-start mb-3 gap-4">
                      <Link href={listingDetailPath(generateSlug(property.title), property.shortCode, property.id)} className="flex-1">
                        <h3 className="font-bold text-xl text-textMain line-clamp-2 hover:text-primary transition-colors leading-snug">{property.title}</h3>
                      </Link>
                      <div className="shrink-0">
                        <span className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap border ${
                          property.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          property.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          property.status === 'AWAITING_AUTHOR' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                          property.status === 'HIDDEN' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {property.status === 'APPROVED' ? 'Đã duyệt' :
                           property.status === 'PENDING' ? 'Chờ duyệt' :
                           property.status === 'AWAITING_AUTHOR' ? 'Cần bạn kiểm tra lại' : 
                           property.status === 'HIDDEN' ? 'Đang ẩn' :
                           property.status === 'SOLD' ? 'Đã bán' :
                           property.status === 'REJECTED' ? 'Từ chối' : property.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-2 items-center mb-4">
                      <span className="text-primary font-black text-xl">{formatPrice(property.price)}</span>
                      {property.area && (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                          <span className="text-gray-700 font-semibold">{formatArea(property.area)}</span>
                        </>
                      )}
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                      <span className="text-sm text-gray-500 font-medium">Mã: {property.propertyCode || property.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    
                    <div className="text-sm text-textSecondary line-clamp-1 flex items-center gap-2 bg-gray-50 w-fit px-3 py-1.5 rounded-lg border border-gray-100">
                      <MapPin size={16} className="text-primary shrink-0" />
                      <span className="font-medium">{[property.ward ? (property.oldWard ? `${property.ward} (${property.oldWard})` : property.ward) : '', property.district, property.city].filter(Boolean).join(', ')}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 items-center justify-start md:justify-end mt-6 pt-4 border-t border-gray-100">
                    {property.status === 'APPROVED' && property.tier !== 'VIP' && (
                      <button onClick={() => handlePromoteClick(property.id, 'VIP')} className="flex flex-1 md:flex-none items-center justify-center gap-2 text-sm font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-5 py-2.5 rounded-xl hover:from-amber-500 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg shadow-amber-500/20 transform hover:-translate-y-0.5">
                        <Crown size={16} /> Nâng VIP
                      </button>
                    )}
                    {property.status === 'APPROVED' && (
                      <>
                        {cooldowns[property.id] && cooldowns[property.id] > 0 ? (
                          <span className="flex flex-1 md:flex-none items-center justify-center gap-2 text-sm font-bold text-gray-500 px-5 py-2.5 bg-gray-100 rounded-xl border border-gray-200">
                            Up lại sau: {formatTime(cooldowns[property.id])}
                          </span>
                        ) : (
                          <button onClick={() => handlePromoteClick(property.id, 'UP')} className="flex flex-1 md:flex-none items-center justify-center gap-2 text-sm font-bold bg-blue-50 text-blue-700 px-5 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-200 hover:border-transparent transform hover:-translate-y-0.5 group">
                            <ArrowUpCircle size={16} className="text-blue-500 group-hover:text-white transition-colors" /> Đẩy tin
                          </button>
                        )}
                      </>
                    )}
                    
                    <div className="flex gap-2 w-full md:w-auto">
                      {property.tier === 'VIP' && (
                        <button onClick={() => handleUnpromote(property.id, 'VIP')} className="flex-1 md:flex-none flex items-center justify-center gap-2 text-sm font-bold bg-white text-gray-600 px-4 py-2.5 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors border border-gray-200 hover:border-red-200">
                          <Crown size={16} className="opacity-70" /> Gỡ VIP
                        </button>
                      )}
                      {property.tier === 'UP' && (
                        <button onClick={() => handleUnpromote(property.id, 'UP')} className="flex-1 md:flex-none flex items-center justify-center gap-2 text-sm font-bold bg-white text-gray-600 px-4 py-2.5 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors border border-gray-200 hover:border-red-200">
                          <ArrowUpCircle size={16} className="opacity-70" /> Gỡ UP
                        </button>
                      )}
                      
                      {/* Quy trình duyệt 2 chiều: admin đã sửa và trả về, người đăng
                          xem lịch sử sửa rồi gửi duyệt lại. */}
                      {property.status === 'AWAITING_AUTHOR' && (
                        <>
                          <button
                            onClick={() => setViewingHistory(property)}
                            className="flex items-center justify-center gap-2 text-sm font-bold bg-white text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                          >
                            Xem admin đã sửa gì
                          </button>
                          {/* Khách yêu cầu "mở lại bài viết, sửa lại toàn bộ rồi nhấn
                              đăng" — trước đây chỉ có nút gửi duyệt lại suông, không
                              sửa được gì. Tái dùng nguyên form đăng tin qua editId. */}
                          <Link href={`/post?editId=${property.id}`} className="flex-1 md:flex-none flex items-center justify-center gap-2 text-sm font-bold bg-primary/10 text-primary px-4 py-2.5 rounded-xl hover:bg-primary hover:text-white transition-colors border border-primary/20 hover:border-transparent">
                            <Edit size={16} /> Sửa
                          </Link>
                          <button
                            onClick={() => handleResubmit(property.id)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 text-sm font-bold bg-amber-500 text-white px-4 py-2.5 rounded-xl hover:bg-amber-600 transition-colors"
                          >
                            Gửi duyệt lại
                          </button>
                        </>
                      )}
                      {activeTab === 'draft' && (
                        <Link href={`/post?editId=${property.id}`} className="flex-1 md:flex-none flex items-center justify-center gap-2 text-sm font-bold bg-primary/10 text-primary px-4 py-2.5 rounded-xl hover:bg-primary hover:text-white transition-colors border border-primary/20 hover:border-transparent">
                          <Edit size={16} /> Sửa
                        </Link>
                      )}
                      {activeTab === 'published' && property.status === 'APPROVED' && (
                        <button onClick={() => handleUpdateStatus(property.id, 'HIDDEN')} className="flex items-center justify-center gap-2 text-sm font-bold bg-white text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200" title="Ẩn tin">
                          <EyeOff size={16} />
                        </button>
                      )}
                      {activeTab === 'published' && property.status === 'HIDDEN' && (
                        <button onClick={() => handleUpdateStatus(property.id, 'APPROVED')} className="flex items-center justify-center gap-2 text-sm font-bold bg-white text-emerald-600 px-4 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors border border-gray-200 hover:border-emerald-200" title="Hiện tin">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      )}
                      {activeTab === 'published' && property.status === 'APPROVED' && (
                        <button onClick={() => handleUpdateStatus(property.id, 'SOLD')} className="flex items-center justify-center gap-2 text-sm font-bold bg-white text-emerald-600 px-4 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors border border-gray-200 hover:border-emerald-200" title="Đã bán/Cho thuê">
                          <CheckCircle size={16} />
                        </button>
                      )}
                      
                      <button onClick={() => handleDelete(property.id)} className="flex items-center justify-center gap-2 text-sm font-bold bg-white text-red-500 px-4 py-2.5 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors border border-gray-200 hover:border-red-200" title="Xóa tin">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {promoteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Chọn Gói Nâng Cấp VIP</h3>
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2">Số ngày VIP</label>
              <input 
                type="number" 
                min="1" 
                value={customDays} 
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomDays(val === '' ? '' as any : parseInt(val));
                }}
                className="w-full p-3 border border-gray-300 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              />
              <div className="mt-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex justify-between text-gray-700 mb-1">
                  <span>Đơn giá (1 ngày):</span>
                  <span className="font-bold">{settings?.vipPrice ? formatNumberString(Math.floor(settings.vipPrice / 1000)) : 5} điểm</span>
                </div>
                <div className="flex justify-between text-gray-900 text-lg font-bold border-t border-amber-200 pt-2 mt-2">
                  <span>Tổng thanh toán:</span>
                  <span className="text-amber-600">{settings?.vipPrice ? formatNumberString(Math.floor(settings.vipPrice / 1000) * (Number(customDays) || 0)) : 5 * (Number(customDays) || 0)} điểm</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setPromoteModal({isOpen: false, propertyId: null, type: 'VIP'})}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                disabled={isPromoting}
              >
                Hủy
              </button>
              <button 
                onClick={() => executePromote(promoteModal.propertyId!, 'VIP')}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-all shadow-md disabled:opacity-50"
                disabled={!customDays || customDays < 1 || isPromoting}
              >
                {isPromoting ? 'Đang xử lý...' : 'Xác nhận Nâng VIP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {viewingHistory && (
      <EditHistoryModal
        propertyId={viewingHistory.id}
        title={viewingHistory.title}
        onClose={() => setViewingHistory(null)}
      />
    )}
    </>
  );
}
