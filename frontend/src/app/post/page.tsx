"use client";
import { useState, useEffect, Suspense } from 'react';
import { PROPERTY_TYPES, propertyTypeByEnum } from '@/lib/seo/taxonomy';
import api from '@/lib/axios';
import { getAuthToken } from '@/lib/auth';
import { toMediaUrl } from '@/lib/media';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const MapPin = dynamic(() => import('@/components/MapPin'), { ssr: false, loading: () => <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-xl"></div> });
import toast from 'react-hot-toast';
import { PRICE_RANGES_SELL, PRICE_RANGES_RENT, AREA_RANGES, getPriceLabel, getAreaLabel } from '@/constants/ranges';
import { siteConfig } from '@/lib/site-config';
import LocationPicker, { resolveLocationIds } from '@/components/LocationPicker';

import { useAuth } from '@/contexts/AuthContext';

const PROVINCE_NAME = siteConfig.province.name;

const INITIAL_FORM_DATA = {
  transactionType: 'BAN',
  propertyType: '',
  city: PROVINCE_NAME,
  district: '',
  ward: '',
  oldWard: '',
  projectId: '',
  areaRangeKey: '',
  area: '' as number | string,
  priceRangeKey: '',
  price: '' as number | string,
  title: '',
  description: '',
  direction: '',
  amenities: '',
  surroundings: '',
  space: '',
  phone: '',
  furniture: '',
  bedrooms: '',
  bathrooms: '',
  floors: '',
  frontage: '',
  roadWidth: '',
  legal: '',
  ownership: '',
  lat: undefined as number | undefined,
  lng: undefined as number | undefined,
  mapAccuracy: 'approximate' as 'approximate' | 'exact'
};

function PostPropertyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    // Do not redirect automatically. Let them see the form.
    // if (!isAuthLoading && !user && typeof window !== 'undefined') {
    //   const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
    //   router.push(`/login?returnUrl=${currentUrl}`);
    // }
    // Backend đã giới hạn /locations theo tỉnh đang cấu hình, không cần truyền city.
    api.get('/locations').then(res => {
      setLocations(res.data);
    }).catch(console.error);
    api.get('/projects').then(res => {
      setProjects(res.data || []);
    }).catch(console.error);
  }, [user, isAuthLoading, router]);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const handleProjectChange = (projectId: string) => {
    const project = projects.find((p: any) => p.id === projectId);
    setFormData(prev => ({
      ...prev,
      projectId,
      // Chọn dự án -> khoá 4 field địa điểm bằng đúng địa điểm của dự án. Bỏ chọn thì
      // giữ nguyên giá trị đang có (giờ có thể sửa tay lại), không xoá về rỗng.
      ...(project ? {
        city: project.city || prev.city,
        district: project.district || '',
        ward: project.ward || '',
        oldWard: project.oldWard || '',
      } : {}),
    }));
  };

  const searchType = searchParams.get('type');
  const searchTitle = searchParams.get('title');
  const searchEditId = searchParams.get('editId');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const type = searchType;
      const title = searchTitle;
      
      const editId = searchEditId;
      if (editId) {
        setLoading(true);
        const endpoint = (type === 'CAN_MUA' || type === 'CAN_THUE') ? `/requirements/${editId}` : `/properties/${editId}`;
        api.get(endpoint).then(res => {
          const prop = res.data;
          
          let city = PROVINCE_NAME;
          let district = '';
          let ward = '';
          let oldWard = '';
          
          if (prop.location) {
             const parts = prop.location.split(', ');
             city = parts[parts.length - 1] || city;
             if (parts.length > 1) district = parts[parts.length - 2];
             if (parts.length > 2) {
                const wardPart = parts.slice(0, parts.length - 2).join(', ');
                const match = wardPart.match(/(.*)\s*\((.*)\s*cũ\)/i);
                if (match) {
                   ward = match[1].trim();
                   oldWard = match[2].trim();
                } else {
                   const fallbackMatch = wardPart.match(/(.*)\s*\((.*)\)/i);
                   if (fallbackMatch && fallbackMatch[2].toLowerCase().includes('cũ')) {
                     ward = fallbackMatch[1].trim();
                     oldWard = fallbackMatch[2].replace(/cũ/i, '').trim();
                   } else {
                      ward = wardPart;
                   }
                }
             }
          } else {
             if (prop.city) city = prop.city;
             if (prop.district) district = prop.district;
             if (prop.ward) {
                if (prop.oldWard) {
                   ward = prop.ward;
                   oldWard = prop.oldWard;
                } else {
                   const match = prop.ward.match(/(.*)\s*\((.*)\s*cũ\)/i);
                   if (match) {
                      ward = match[1].trim();
                      oldWard = match[2].trim();
                   } else {
                      const fallbackMatch = prop.ward.match(/(.*)\s*\((.*)\)/i);
                      if (fallbackMatch && fallbackMatch[2].toLowerCase().includes('cũ')) {
                         ward = fallbackMatch[1].trim();
                         oldWard = fallbackMatch[2].replace(/cũ/i, '').trim();
                      } else {
                         ward = prop.ward;
                      }
                   }
                }
             }
          }
          
          
          setImages(prop.images || []);
          setFormData(prev => {
            const nextState = { ...prev };
            
            // Map location correctly
            nextState.city = city || prev.city;
            nextState.district = district || prev.district;
            nextState.ward = ward || prev.ward;
            nextState.oldWard = oldWard || prev.oldWard;

            // Map all basic string/numeric fields explicitly
            if (prop.transactionType) nextState.transactionType = prop.transactionType;
            if (prop.propertyType) nextState.propertyType = prop.propertyType;
            if (prop.projectId) nextState.projectId = prop.projectId;
            if (prop.title !== undefined && prop.title !== null) nextState.title = prop.title;
            
            const desc = prop.description || prop.content;
            if (desc !== undefined && desc !== null) nextState.description = desc;

            if (prop.direction) nextState.direction = prop.direction;
            if (prop.amenities) nextState.amenities = prop.amenities;
            if (prop.surroundings) nextState.surroundings = prop.surroundings;
            if (prop.space) nextState.space = prop.space;
            
            const phone = prop.phone || prop.user?.phone;
            if (phone) nextState.phone = phone;
            
            if (prop.furniture) nextState.furniture = prop.furniture;
            if (prop.legal) nextState.legal = prop.legal;
            if (prop.ownership) nextState.ownership = prop.ownership;

            // Map numeric fields (allow 0 or null)
            if (prop.area !== undefined && prop.area !== null) nextState.area = prop.area;
            if (prop.bedrooms !== undefined && prop.bedrooms !== null) nextState.bedrooms = prop.bedrooms;
            if (prop.bathrooms !== undefined && prop.bathrooms !== null) nextState.bathrooms = prop.bathrooms;
            if (prop.floors !== undefined && prop.floors !== null) nextState.floors = prop.floors;
            if (prop.frontage !== undefined && prop.frontage !== null) nextState.frontage = prop.frontage;
            if (prop.roadWidth !== undefined && prop.roadWidth !== null) nextState.roadWidth = prop.roadWidth;

            // Map price safely
            if (prop.price !== undefined && prop.price !== null) {
              nextState.price = (Number(prop.price) / 1000000).toString();
            }

            // Map Range Keys
            if (prop.areaRangeKey) {
              nextState.areaRangeKey = prop.areaRangeKey;
            } else if (type === 'CAN_MUA' || type === 'CAN_THUE') {
              nextState.areaRangeKey = (prop.areaMin && prop.areaMax) ? `${prop.areaMin}-${prop.areaMax}` : '';
            }

            if (prop.priceRangeKey) {
              nextState.priceRangeKey = prop.priceRangeKey;
            } else if (type === 'CAN_MUA' || type === 'CAN_THUE') {
              nextState.priceRangeKey = (prop.priceMin && prop.priceMax) ? `${prop.priceMin / 1000000}-${prop.priceMax / 1000000}` : '';
            }

            // Map coordinates
            if (prop.lat !== undefined && prop.lat !== null) nextState.lat = prop.lat;
            if (prop.lng !== undefined && prop.lng !== null) nextState.lng = prop.lng;
            nextState.mapAccuracy = prop.isExactLocation ? 'exact' : 'approximate';

            return nextState;
          });
        }).catch(err => {
          console.error(err);
        }).finally(() => {
          setLoading(false);
        });
      } else {
        // Reset form if no editId
        setFormData(prev => {
           const nextState = { ...INITIAL_FORM_DATA };
           if (type === 'CAN_MUA' || type === 'CAN_THUE') {
              nextState.transactionType = type;
              if (title) nextState.title = title;
           }
           return nextState;
        });
        setImages([]);
      }
    }
  }, [searchEditId, searchType, searchTitle]);

  const isRequirement = formData.transactionType === 'CAN_MUA' || formData.transactionType === 'CAN_THUE';
  const labelText = isRequirement ? 'Gửi nhu cầu mua hoặc thuê Bất động sản' : 'Đăng tin công khai';

  useEffect(() => {
    const fetchCoordinates = async () => {
      const queryParts = [];
      if (formData.ward) {
        // Remove "(oldWard)" from ward name for better geocoding
        const cleanWard = formData.ward.replace(/\(.*\)/i, '').trim();
        queryParts.push(cleanWard);
      }
      if (formData.district) queryParts.push(formData.district);
      if (formData.city) queryParts.push(formData.city);
      queryParts.push('Việt Nam');

      if (queryParts.length < 3) return; // Wait until at least district + city is selected

      const searchQuery = queryParts.join(', ');
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          // Only update if it significantly changed, to avoid weird re-renders
          if (formData.lat !== lat || formData.lng !== lng) {
            setFormData(prev => ({ ...prev, lat, lng }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch coordinates', err);
      }
    };

    const timeoutId = setTimeout(fetchCoordinates, 800);
    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.ward, formData.district, formData.city]);

  const isDatNen = formData.propertyType === 'DAT_NEN';
  const isChungCu = formData.propertyType === 'CHUNG_CU';
  const isChoThue = formData.transactionType === 'CHO_THUE';
  const isReq = formData.transactionType === 'CAN_MUA' || formData.transactionType === 'CAN_THUE';

  const showBedrooms = !isDatNen && !isReq;
  const showBathrooms = !isDatNen && !isReq;
  const showFurniture = !isDatNen;
  const showFloors = !isDatNen && !isChungCu && !isReq;
  const showFrontage = !isChungCu && !isChoThue;
  const showRoadWidth = !isChungCu;
  const showDirection = !isChoThue;
  
  const handleTransactionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setFormData((prev) => {
      const isNewTypeRequirement = newType === 'CAN_MUA' || newType === 'CAN_THUE';
      return {
        ...prev,
        transactionType: newType,
        propertyType: '', // Reset
        mapAccuracy: isNewTypeRequirement ? 'approximate' : prev.mapAccuracy,
      };
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(prev => ({...prev, phone: val}));
    if (val && !/^(0|\+84)[3-9]\d{8}$/.test(val.replace(/\s/g, ''))) {
      setPhoneError("Số điện thoại không hợp lệ (VD: 0987654321)");
    } else {
      setPhoneError('');
    }
  };

  const getSanitizedPayload = () => {
    const { provinceId, districtId, wardId, oldWardId } = resolveLocationIds(locations, formData);

    const sanitizedData = { ...formData } as any;
    const numericFields = ['bedrooms', 'bathrooms', 'floors', 'frontage', 'roadWidth', 'price', 'area'];
    numericFields.forEach(field => {
      if (sanitizedData[field] === '') {
        sanitizedData[field] = null; // Send null to indicate clearing the field
      } else if (sanitizedData[field] !== undefined && sanitizedData[field] !== null) {
        if (field === 'price') {
          sanitizedData[field] = Number(sanitizedData[field]) * 1000000;
        } else {
          const numValue = parseFloat(String(sanitizedData[field]).replace(/[^\d.-]/g, ''));
          sanitizedData[field] = isNaN(numValue) ? null : numValue;
        }
      }
    });

    // Handle isNegotiable based on priceRangeKey
    sanitizedData.isNegotiable = formData.priceRangeKey === 'THOA_THUAN';
    
    // Clear map coordinates if approximate
    const isEditMode = new URLSearchParams(window.location.search).get('editId') !== null;
    if (formData.mapAccuracy === 'approximate' && sanitizedData.lat && sanitizedData.lng && !isEditMode) {
      sanitizedData.lat = sanitizedData.lat + (Math.random() - 0.5) * 0.0054;
      sanitizedData.lng = sanitizedData.lng + (Math.random() - 0.5) * 0.0054;
    }
    
    sanitizedData.isExactLocation = formData.mapAccuracy === 'exact';

    if (isDatNen) {
      delete sanitizedData.bedrooms;
      delete sanitizedData.bathrooms;
      delete sanitizedData.floors;
      delete sanitizedData.furniture;
    }
    delete sanitizedData.mapAccuracy;
    // We intentionally keep sanitizedData.oldWard and pass it

    return { ...sanitizedData, ward: formData.ward, oldWard: formData.oldWard, provinceId, districtId, wardId, oldWardId, locationId: wardId || districtId || provinceId };
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Bạn cần đăng nhập để đăng tin chứ!');
      const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
      setTimeout(() => router.push(`/login?returnUrl=${currentUrl}`), 1500);
      return;
    }
    if (!formData.district || (!isRequirement && !formData.ward)) {
      toast.error("Vui lòng chọn Quận/Huyện và Phường/Xã");
      return;
    }
    const hasValidPrice = formData.priceRangeKey;
    if (!isRequirement && (!formData.propertyType || !formData.title || !formData.description || !formData.areaRangeKey || !hasValidPrice)) {
      toast.error("Vui lòng điền đầy đủ thông tin hợp lệ (Loại BĐS, Tiêu đề, Mô tả, Diện tích, Mức giá)");
      return;
    }
    if (isRequirement && (!formData.propertyType || !formData.transactionType)) {
      toast.error("Vui lòng điền đầy đủ thông tin hợp lệ (Loại BĐS, Hình thức giao dịch)");
      return;
    }
    if (isRequirement && !formData.phone) {
      toast.error("Vui lòng nhập Số điện thoại liên hệ");
      return;
    }
    if (phoneError) {
      toast.error("Số điện thoại không hợp lệ. Vui lòng sửa lại.");
      return;
    }
    // Validate phone format (Vietnamese phone numbers) if provided
    if (formData.phone && !/^(0|\+84)[3-9]\d{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      toast.error("Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng (VD: 0987654321)");
      return;
    }

    setLoading(true);
    try {
      const basePayload = getSanitizedPayload();
      const payload = isRequirement ? basePayload : { ...basePayload, images };
      
      const urlParams = new URLSearchParams(window.location.search);
      const editId = urlParams.get('editId');

      if (editId) {
        if (isRequirement) {
          await api.put(`/requirements/${editId}`, payload);
          toast.success('Cập nhật nhu cầu thành công! Admin sẽ liên hệ bạn sớm.');
          router.push('/user/requirements');
        } else {
          await api.put(`/properties/${editId}`, payload);
          toast.success('Cập nhật tin thành công! Tin của bạn đang chờ Admin duyệt.');
          router.push('/user/my-listings');
        }
        return;
      }

      if (isRequirement) {
        await api.post('/requirements', payload);
        toast.success('Gửi nhu cầu thành công! Admin sẽ liên hệ bạn sớm.');
        router.push('/user/requirements');
      } else {
        await api.post('/properties', payload);
        toast.success('Đăng tin thành công! Tin của bạn đang chờ Admin duyệt.');
        router.push('/user/my-listings');
      }
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.requiresPayment) {
        toast.error(data.message || 'Bạn đã hết lượt đăng tin miễn phí.');
        router.push('/user/nap-tien');
      } else {
        toast.error('Lỗi: ' + (data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!user) {
      toast.error('Bạn cần đăng nhập để lưu bản nháp chứ!');
      const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
      setTimeout(() => router.push(`/login?returnUrl=${currentUrl}`), 1500);
      return;
    }
    setLoading(true);
    try {
      const basePayload = getSanitizedPayload();
      const payload = { ...basePayload, images };

      const urlParams = new URLSearchParams(window.location.search);
      const editId = urlParams.get('editId');

      if (editId) {
        await api.put(`/properties/draft/${editId}`, payload);
        toast.success('Cập nhật bản nháp thành công!');
      } else {
        await api.post('/properties/draft', payload);
        toast.success('Lưu bản nháp thành công!');
      }
      router.push('/user/my-listings');
    } catch (err: any) {
      toast.error('Lỗi khi lưu nháp: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">Đang tải...</div>;
  }

  if (user && !user.emailVerified) {
    return (
      <div className="min-h-screen bg-background py-20 px-4 flex items-center justify-center animate-fade-in">
        <div className="bg-white p-8 rounded-2xl shadow-card max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Yêu cầu xác thực Email</h2>
          <p className="text-gray-600 mb-6">Bạn cần xác thực địa chỉ email để có thể đăng tin. Vui lòng kiểm tra hộp thư của bạn hoặc cập nhật trong trang cá nhân.</p>
          <button onClick={() => router.push('/user/my-listings')} className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-dark transition-colors">Về trang cá nhân</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-extrabold gradient-text mb-3">{labelText}</h1>
          <p className="text-textSecondary">Điền thông tin chi tiết để {isRequirement ? 'nhu cầu' : 'tin đăng'} của bạn thu hút nhiều người xem nhất</p>
        </div>

        {!user && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-medium text-sm sm:text-base">Bạn cần đăng nhập để có thể đăng tin. Giao diện bên dưới chỉ cho phép xem trước, hãy đăng nhập để tiếp tục!</p>
            </div>
            <button onClick={() => router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`)} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">Đăng nhập ngay</button>
          </div>
        )}

        {/* Progress Stepper */}
        <div className="flex items-center justify-center gap-0 mb-10 animate-slide-up">
          {[
            { step: 1, label: 'Thông tin cơ bản', active: true },
            { step: 2, label: 'Vị trí & chi tiết', active: true },
            { step: 3, label: 'Xác nhận & đăng', active: true },
          ].map((s, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-md ${s.active ? 'bg-gradient-to-br from-accent to-accent-light text-white' : 'bg-background-alt text-textSecondary'}`}>
                  {s.step}
                </div>
                <span className="text-xs font-medium text-textSecondary mt-2 hidden md:block">{s.label}</span>
              </div>
              {i < 2 && <div className={`w-16 md:w-24 h-0.5 mx-2 rounded-full ${s.active ? 'bg-gradient-to-r from-accent to-accent-light' : 'bg-borderLight'}`} />}
            </div>
          ))}
        </div>
        
        <div className="bg-white rounded-2xl shadow-card border border-borderLight/50 overflow-hidden animate-slide-up stagger-2">
          {/* Section 1 */}
          <div className="p-6 md:p-8 border-b border-borderLight/50">
            <h2 className="text-lg font-bold text-textMain mb-5 flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              Thông tin cơ bản
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-2 text-textMain">Loại giao dịch <span className="text-danger">*</span></label>
                <select 
                  value={formData.transactionType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    const isNewReq = newType === 'CAN_MUA' || newType === 'CAN_THUE';
                    setFormData(prev => ({
                      ...prev, 
                      transactionType: newType, 
                      priceRangeKey: '', 
                      price: '',
                      mapAccuracy: isNewReq ? 'approximate' : prev.mapAccuracy
                    }));
                  }}
                  className="font-sans w-full border border-borderLight rounded-xl p-3.5 outline-none input-glow bg-white cursor-pointer text-sm"
                >
                  {!isRequirement && <option className="font-sans" value="BAN">Bán</option>}
                  {!isRequirement && <option className="font-sans" value="CHO_THUE">Cho thuê</option>}
                  {isRequirement && <option className="font-sans" value="CAN_MUA">Cần mua</option>}
                  {isRequirement && <option className="font-sans" value="CAN_THUE">Cần thuê</option>}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-textMain">Loại BĐS <span className="text-danger">*</span></label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setFormData(prev => ({...prev, propertyType: newType, projectId: newType === 'DU_AN' ? prev.projectId : ''}));
                  }}
                  className="font-sans w-full border border-borderLight rounded-xl p-3.5 outline-none input-glow bg-white cursor-pointer text-sm"
                >
                  {/* Danh sách này thiếu hẳn BIET_THU dù backend nhận, và nhãn
                      MAT_BANG lệch với 4 nơi khác. Lấy từ taxonomy là hết cả hai. */}
                  <option className="font-sans" value="">Chọn Loại BĐS</option>
                  {PROPERTY_TYPES.map((t) => (
                    <option className="font-sans" key={t.enum} value={t.enum}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="p-6 md:p-8 border-b border-borderLight/50">
            <h2 className="text-lg font-bold text-textMain mb-5 flex items-center gap-3">
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              Vị trí & Diện tích
            </h2>
            {formData.propertyType === 'DU_AN' && (
              <div className="mb-5">
                <label className="block text-sm font-medium mb-2 text-textMain">Thuộc dự án (tuỳ chọn)</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="font-sans w-full border border-borderLight rounded-xl p-3.5 outline-none input-glow bg-white cursor-pointer text-sm"
                >
                  <option className="font-sans" value="">Không thuộc dự án nào — tự nhập địa điểm</option>
                  {projects.map((p: any) => (
                    <option className="font-sans" key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {formData.projectId && (
                  <p className="text-xs text-textSecondary mt-2">Địa điểm bên dưới được khoá theo dự án đã chọn.</p>
                )}
              </div>
            )}
            <div className="mb-5">
              <LocationPicker
                locations={locations}
                value={{ city: formData.city, district: formData.district, ward: formData.ward, oldWard: formData.oldWard }}
                onChange={(loc) => setFormData(prev => ({ ...prev, ...loc }))}
                requireWard={!isRequirement}
                disabled={Boolean(formData.projectId)}
              />
            </div>

            {/* Map Pin */}
            {!isRequirement && (
            <div className="mt-5 mb-5 bg-gray-50/50 p-4 rounded-xl border border-borderLight">
              <label className="flex items-center text-sm font-medium mb-3 text-textMain group relative cursor-help">
                Vị trí trên bản đồ <span className="text-danger ml-1">*</span>
                <span className="ml-2 text-gray-400 border border-gray-300 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">(?)</span>
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-xl z-10 before:content-[''] before:absolute before:top-full before:left-4 before:border-4 before:border-transparent before:border-t-gray-800">
                  <p className="font-bold mb-1">Gần đúng (Khuyến nghị):</p>
                  <p className="mb-2 text-gray-300">Bảo vệ quyền riêng tư, an toàn cho bạn. Chỉ hiển thị khoảng khu vực trên bản đồ.</p>
                  <p className="font-bold mb-1">Chính xác:</p>
                  <p className="text-gray-300">Hiển thị chính xác vị trí nhà đất trên bản đồ.</p>
                </div>
              </label>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="mapAccuracy" 
                    value="approximate" 
                    checked={formData.mapAccuracy === 'approximate'}
                    onChange={(e) => setFormData(prev => ({...prev, mapAccuracy: 'approximate'}))}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Gần đúng (Khuyến nghị)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="mapAccuracy" 
                    value="exact" 
                    checked={formData.mapAccuracy === 'exact'}
                    onChange={(e) => setFormData(prev => ({...prev, mapAccuracy: 'exact'}))}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Vị trí chính xác</span>
                </label>
              </div>
              
              <>
                <MapPin 
                  lat={formData.lat || undefined} 
                  lng={formData.lng || undefined} 
                  isApproximate={formData.mapAccuracy === 'approximate'}
                  onChange={(lat, lng) => setFormData(prev => ({...prev, lat, lng}))} 
                />
                {formData.mapAccuracy === 'exact' ? (
                  <p className="text-xs text-gray-500 mt-2">Kéo thả bản đồ và click để chọn vị trí chính xác của bất động sản. (Lưu ý: Hiển thị vị trí chính xác có thể ảnh hưởng đến sự riêng tư)</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">Kéo thả bản đồ để chọn khu vực. Vị trí lưu sẽ được làm lệch 300m để bảo mật riêng tư.</p>
                )}
              </>
            </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-2 text-textMain">Khoảng diện tích (m²) {!isRequirement && <span className="text-danger">*</span>}</label>
                <select 
                  value={formData.areaRangeKey}
                  onChange={(e) => setFormData(prev => ({...prev, areaRangeKey: e.target.value}))}
                  className="font-sans w-full border border-borderLight rounded-xl p-3.5 outline-none input-glow bg-white cursor-pointer text-sm mb-3"
                >
                  <option className="font-sans" value="">Chọn khoảng diện tích</option>
                  {AREA_RANGES.map(r => <option className="font-sans" key={r.key} value={r.key}>{r.label}</option>)}
                </select>
                <input 
                  type="number" 
                  value={formData.area}
                  onChange={(e) => setFormData(prev => ({...prev, area: e.target.value}))}
                  className="w-full border border-borderLight rounded-xl p-3.5 outline-none input-glow text-sm" 
                  placeholder="Diện tích cụ thể (m²) - bỏ qua nếu bạn chưa muốn công khai" 
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-textMain">Khoảng giá {(formData.transactionType === 'CHO_THUE' || formData.transactionType === 'CAN_THUE') ? '(triệu/tháng)' : '(triệu đồng)'} {!isRequirement && <span className="text-danger">*</span>}</label>
                </div>
                <select 
                  value={formData.priceRangeKey}
                  onChange={(e) => {
                     const val = e.target.value;
                     setFormData(prev => ({...prev, priceRangeKey: val, price: val === 'THOA_THUAN' ? '' : prev.price}));
                  }}
                  className="font-sans w-full border border-borderLight rounded-xl p-3.5 outline-none input-glow bg-white cursor-pointer text-sm mb-3"
                >
                  <option className="font-sans" value="">Chọn khoảng mức giá</option>
                  {(formData.transactionType === 'CHO_THUE' || formData.transactionType === 'CAN_THUE' ? PRICE_RANGES_RENT : PRICE_RANGES_SELL).map(r => (
                    <option className="font-sans" key={r.key} value={r.key}>{r.label}</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))}
                  disabled={formData.priceRangeKey === 'THOA_THUAN'}
                  className="w-full border border-borderLight rounded-xl p-3.5 outline-none input-glow text-sm disabled:bg-gray-100 disabled:text-gray-400" 
                  placeholder={formData.transactionType === 'CHO_THUE' || formData.transactionType === 'CAN_THUE' ? "Giá cụ thể (triệu/tháng) - bỏ qua nếu bạn chưa muốn công khai giá" : "Giá cụ thể (triệu đồng) - bỏ qua nếu bạn chưa muốn công khai giá"} 
                />
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="p-6 md:p-8 border-b border-borderLight/50">
            <h2 className="text-lg font-bold text-textMain mb-5 flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              Thông tin bài viết
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {showDirection && (
              <div>
                <label className="block text-sm font-medium mb-2 text-textMain">Hướng nhà</label>
                <select 
                  value={formData.direction}
                  onChange={(e) => setFormData(prev => ({...prev, direction: e.target.value}))}
                  className="font-sans w-full border border-borderLight rounded-xl p-3.5 outline-none input-glow bg-white text-sm cursor-pointer"
                >
                  <option className="font-sans" value="">Không xác định</option>
                  <option className="font-sans" value="Đông">Đông</option>
                  <option className="font-sans" value="Tây">Tây</option>
                  <option className="font-sans" value="Nam">Nam</option>
                  <option className="font-sans" value="Bắc">Bắc</option>
                  <option className="font-sans" value="Đông Nam">Đông Nam</option>
                  <option className="font-sans" value="Tây Nam">Tây Nam</option>
                  <option className="font-sans" value="Đông Bắc">Đông Bắc</option>
                  <option className="font-sans" value="Tây Bắc">Tây Bắc</option>
                </select>
              </div>
              )}
              {showBedrooms && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-textMain">Số phòng ngủ</label>
                  <select 
                    value={formData.bedrooms}
                    onChange={(e) => setFormData(prev => ({...prev, bedrooms: e.target.value}))}
                    className="font-sans w-full border border-borderLight rounded-xl p-3.5 outline-none input-glow bg-white cursor-pointer text-sm"
                  >
                    <option className="font-sans" value="">Chưa xác định</option>
                    <option className="font-sans" value="1">1</option>
                    <option className="font-sans" value="2">2</option>
                    <option className="font-sans" value="3">3</option>
                    <option className="font-sans" value="4">4</option>
                    <option className="font-sans" value=">=5">&gt;=5</option>
                  </select>
                </div>
              )}
              {showBathrooms && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-textMain">Số phòng vệ sinh</label>
                  <select 
                    value={formData.bathrooms}
                    onChange={(e) => setFormData(prev => ({...prev, bathrooms: e.target.value}))}
                    className="font-sans w-full border border-borderLight rounded-xl p-3.5 outline-none input-glow bg-white cursor-pointer text-sm"
                  >
                    <option className="font-sans" value="">Chưa xác định</option>
                    <option className="font-sans" value="1">1</option>
                    <option className="font-sans" value="2">2</option>
                    <option className="font-sans" value="3">3</option>
                    <option className="font-sans" value="4">4</option>
                    <option className="font-sans" value=">=5">&gt;=5</option>
                  </select>
                </div>
              )}
              {(showFloors || isChungCu) && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-textMain">{isChungCu ? 'Tầng số' : 'Số tầng'}</label>
                  <select 
                    value={formData.floors}
                    onChange={(e) => setFormData(prev => ({...prev, floors: e.target.value}))}
                    className="font-sans w-full border border-borderLight rounded-xl p-3.5 outline-none input-glow bg-white cursor-pointer text-sm"
                  >
                    <option className="font-sans" value="">Chưa xác định</option>
                    <option className="font-sans" value="1">1</option>
                    <option className="font-sans" value="2">2</option>
                    <option className="font-sans" value="3">3</option>
                    <option className="font-sans" value="4">4</option>
                    <option className="font-sans" value=">=5">&gt;=5</option>
                  </select>
                </div>
              )}
              {showFurniture && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-textMain">Nội thất</label>
                  <select 
                    value={formData.furniture}
                    onChange={(e) => setFormData(prev => ({...prev, furniture: e.target.value}))}
                    className="font-sans w-full border border-borderLight rounded-xl p-3.5 outline-none input-glow bg-white cursor-pointer text-sm"
                  >
                    <option className="font-sans" value="">Chưa xác định</option>
                    <option className="font-sans" value="Không có">Không có</option>
                    <option className="font-sans" value="Cơ bản">Cơ bản</option>
                    <option className="font-sans" value="Đầy đủ">Đầy đủ</option>
                  </select>
                </div>
              )}
              {showFrontage && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-textMain">Mặt tiền</label>
                  <select 
                    value={formData.frontage}
                    onChange={(e) => setFormData(prev => ({...prev, frontage: e.target.value}))}
                    className="font-sans w-full border border-borderLight rounded-xl p-3.5 outline-none input-glow bg-white cursor-pointer text-sm"
                  >
                    <option className="font-sans" value="">Chưa xác định</option>
                    <option className="font-sans" value="3m">3m</option>
                    <option className="font-sans" value="4m">4m</option>
                    <option className="font-sans" value="5m">5m</option>
                    <option className="font-sans" value="6m">6m</option>
                    <option className="font-sans" value="7m">7m</option>
                    <option className="font-sans" value=">=8m">&gt;=8m</option>
                  </select>
                </div>
              )}
              {showRoadWidth && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-textMain">Đường trước nhà/đất</label>
                  <select 
                    value={formData.roadWidth}
                    onChange={(e) => setFormData(prev => ({...prev, roadWidth: e.target.value}))}
                    className="font-sans w-full border border-borderLight rounded-xl p-3.5 outline-none input-glow bg-white cursor-pointer text-sm"
                  >
                    <option className="font-sans" value="">Chưa xác định</option>
                    <option className="font-sans" value="3m">3m</option>
                    <option className="font-sans" value="4m">4m</option>
                    <option className="font-sans" value="5m">5m</option>
                    <option className="font-sans" value="6m">6m</option>
                    <option className="font-sans" value="7m">7m</option>
                    <option className="font-sans" value=">=8m">&gt;=8m</option>
                  </select>
                </div>
              )}
              {formData.transactionType !== 'CHO_THUE' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-textMain">Pháp lý</label>
                    <select 
                      value={formData.legal}
                      onChange={(e) => setFormData(prev => ({...prev, legal: e.target.value}))}
                      className="font-sans w-full border border-borderLight rounded-xl p-3.5 outline-none input-glow bg-white cursor-pointer text-sm"
                    >
                      <option className="font-sans" value="">Chưa xác định</option>
                      <option className="font-sans" value="Chưa có">Chưa có</option>
                      <option className="font-sans" value="Có hợp đồng">Có hợp đồng</option>
                      <option className="font-sans" value="Có sổ đỏ">Có sổ đỏ</option>
                      <option className="font-sans" value="Đầy đủ">Đầy đủ</option>
                    </select>
                  </div>
                  {(!isRequirement && !isChoThue) && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-textMain">Sở hữu/nguồn tin</label>
                    <select 
                      value={formData.ownership}
                      onChange={(e) => setFormData(prev => ({...prev, ownership: e.target.value}))}
                      className="font-sans w-full border border-borderLight rounded-xl p-3.5 outline-none input-glow bg-white cursor-pointer text-sm"
                    >
                      <option className="font-sans" value="">Chưa xác định</option>
                      <option className="font-sans" value="Chính chủ">Chính chủ</option>
                      <option className="font-sans" value="Bán hộ">Bán hộ</option>
                      <option className="font-sans" value="Môi giới">Môi giới</option>
                    </select>
                  </div>
                  )}
                </>
              )}
              <div>
                <label className="block text-sm font-medium mb-2 text-textMain">SĐT Liên hệ {isRequirement && <span className="text-red-500">*</span>}</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className={`w-full border rounded-xl p-3.5 outline-none input-glow text-sm ${phoneError ? 'border-red-500 bg-red-50' : 'border-borderLight'}`} 
                  placeholder="VD: 0987654321" 
                />
                {phoneError && <p className="text-red-500 text-xs mt-2">{phoneError}</p>}
              </div>
            </div>
            {(!isRequirement && !isChoThue) && (
              <div className="grid grid-cols-1 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-medium mb-2 text-textMain">Không gian/tiện ích xung quanh</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['Gần bệnh viện', 'Gần trường học', 'Gần chợ', 'Gần UBND', 'Gần đường lớn'].map((item) => (
                      <label key={item} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.surroundings.includes(item)}
                          onChange={(e) => {
                            const newArr = formData.surroundings ? formData.surroundings.split(', ') : [];
                            if (e.target.checked) {
                              if (!newArr.includes(item)) newArr.push(item);
                            } else {
                              const idx = newArr.indexOf(item);
                              if (idx > -1) newArr.splice(idx, 1);
                            }
                            setFormData(prev => ({...prev, surroundings: newArr.filter(Boolean).join(', ')}));
                          }}
                          className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                        />
                        <span className="font-medium text-gray-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mb-5">
              <label className="block text-sm font-medium mb-2 text-textMain">Tiêu đề {!isRequirement && <span className="text-danger">*</span>}</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                className="w-full border border-borderLight rounded-xl p-3.5 outline-none input-glow text-sm" 
                placeholder={isRequirement ? `VD: Cần mua nhà mặt phố ${PROVINCE_NAME}` : `VD: Bán nhà mặt tiền, ${PROVINCE_NAME}`} 
              />
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium mb-2 text-textMain">Mô tả chi tiết {!isRequirement && <span className="text-danger">*</span>}</label>
              <textarea 
                rows={5} 
                value={formData.description}
                onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                className="w-full border border-borderLight rounded-xl p-3.5 outline-none input-glow text-sm resize-none" 
                placeholder={isRequirement ? "Nhập chi tiết nhu cầu mua/thuê của bạn (không bắt buộc)..." : "Nhập mô tả chi tiết về bất động sản..."}
              />
            </div>

            {/* Image Upload Area */}
            {!isRequirement && (
            <div>
              <label className="block text-sm font-medium mb-2 text-textMain">
                Hình ảnh
              </label>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {images.map((url, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square border border-borderLight shadow-sm">
                      <img width={400} height={300} loading="lazy" src={toMediaUrl(url)} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="relative border-2 border-dashed border-borderLight rounded-2xl p-10 text-center hover:border-primary/30 hover:bg-primary/[0.02] transition-all duration-300 cursor-pointer">
                  <input 
                    type="file" 
                    multiple 
                    accept="image/png, image/jpeg, image/jpg"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      if (images.length + files.length > 8) {
                        toast.error('Bạn chỉ có thể tải lên tối đa 8 ảnh.');
                        return;
                      }
                      // Validate file size (max 5MB per file)
                      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
                      for (let i = 0; i < files.length; i++) {
                        if (files[i].size > MAX_FILE_SIZE) {
                          toast.error(`Ảnh "${files[i].name}" vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.`);
                          return;
                        }
                      }
                      setUploading(true);
                      try {
                        for (let i = 0; i < files.length; i++) {
                          const formData = new FormData();
                          formData.append('file', files[i]);
                          const res = await api.post('/properties/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          });
                          setImages(prev => [...prev, res.data.url]);
                        }
                      } catch (err) {
                        toast.error('Lỗi upload ảnh');
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                  <div className="flex flex-col items-center pointer-events-none">
                    {uploading ? (
                      <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-3"></div>
                    ) : (
                      <svg className="w-10 h-10 text-primary/60 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    )}
                    <p className="text-sm font-bold text-textMain">{uploading ? 'Đang tải...' : 'Tải lên 1-8 ảnh (Nhấn hoặc kéo thả)'}</p>
                    <p className="text-xs text-textLight mt-1">Tối đa 8 ảnh. Hỗ trợ JPG, PNG.</p>
                    <p className="text-xs text-accent mt-1">Nếu không có ảnh, hệ thống sẽ tạo thumbnail tự động.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="p-6 md:p-8 bg-gradient-to-r from-background to-white flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-textSecondary">
              <svg className="w-4 h-4 inline mr-1 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Tin đăng sẽ được Admin duyệt trước khi hiển thị
            </p>
            <div className="flex gap-3 w-full sm:w-auto flex-wrap">
              <button 
                type="button"
                onClick={() => setPreviewMode(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold transition-colors"
              >
                Xem trước
              </button>
              {!isRequirement && (
                <button 
                  disabled={loading}
                  onClick={handleSaveDraft} 
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  Lưu bản nháp
                </button>
              )}
              <button 
                disabled={loading}
                onClick={handleSubmit} 
                className="flex-1 sm:flex-none btn-shimmer flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-accent to-accent-light text-white rounded-xl font-bold shadow-md hover:shadow-glow-accent transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Đang xử lý...
                  </>
                ) : !user ? (
                  <>
                    {isRequirement ? 'ĐĂNG NHẬP ĐỂ GỬI YÊU CẦU' : 'ĐĂNG NHẬP ĐỂ ĐĂNG TIN'}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    {isRequirement ? 'GỬI YÊU CẦU' : 'ĐĂNG TIN NGAY'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* PREVIEW MODAL */}
        {previewMode && (
          <div className="fixed inset-0 z-[100] bg-black/60 flex justify-center p-4 md:p-10 overflow-y-auto backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col relative h-max">
              <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur z-10">
                <h3 className="text-lg font-bold">Chế độ xem trước</h3>
                <button onClick={() => setPreviewMode(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full">
                  ✕
                </button>
              </div>
              <div className="p-6">
                {/* Images Preview */}
                <div className="mb-6 rounded-xl overflow-hidden bg-gray-50">
                  {images.length > 0 ? (
                    <div className={`grid gap-1 ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
                      {images.map((img, i) => (
                        <img width={400} height={300} key={i} src={toMediaUrl(img)} className={`w-full object-cover ${images.length === 1 ? 'h-[300px] md:h-[400px]' : 'h-[200px] md:h-[250px]'}`} alt="Preview" />
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-[250px] md:h-[350px] flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-dashed border-gray-200">
                      <img width={223} height={145} src="/logo/logo-icon.svg" alt="No image" className="opacity-20 grayscale w-24 h-24 object-contain" />
                      <span className="text-gray-400 mt-4 font-medium text-sm">Chưa có hình ảnh</span>
                    </div>
                  )}
                </div>

                <div className="text-sm text-primary font-bold mb-2 uppercase">
                  {propertyTypeByEnum(formData.propertyType)?.label || formData.propertyType || 'BẤT ĐỘNG SẢN'}
                </div>
                {/* Đây là bản XEM TRƯỚC nằm trong `{previewMode && …}`, hiển thị đồng
                    thời với <h1> tiêu đề trang ở trên -> phải là h2, nếu không trang
                    có 2 thẻ h1 (yêu cầu II.8: mỗi trang chỉ một H1). */}
                <h2 className="text-2xl font-bold mb-4 text-gray-900">{formData.title || 'Chưa nhập tiêu đề'}</h2>
                
                <div className="flex gap-4 mb-6">
                  <div className="text-primary font-bold text-xl">{getPriceLabel(formData.priceRangeKey, formData.transactionType) || 'Chưa chọn mức giá'}</div>
                  <div className="text-gray-500 text-xl flex items-center before:content-['•'] before:mr-4 before:text-gray-300">{getAreaLabel(formData.areaRangeKey) || 'Chưa chọn diện tích'}</div>
                </div>

                <div className="text-gray-600 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="leading-relaxed">{[formData.ward, formData.district, formData.city].filter(Boolean).join(', ') || 'Chưa chọn vị trí'}</span>
                </div>

                <div className="mb-6 whitespace-pre-wrap text-gray-700 leading-relaxed bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <h4 className="font-bold mb-2 text-gray-900">Mô tả chi tiết</h4>
                  {formData.description || 'Chưa có mô tả chi tiết'}
                </div>
              </div>
              <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t">
                <button onClick={() => setPreviewMode(false)} className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 font-bold">Quay lại sửa</button>
                <button onClick={() => { setPreviewMode(false); handleSubmit(); }} className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark font-bold">{isRequirement ? 'Gửi yêu cầu' : 'Đăng tin ngay'}</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function PostProperty() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">Đang tải...</div>}>
      <PostPropertyContent />
    </Suspense>
  );
}
